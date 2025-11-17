import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards, UnauthorizedException, BadRequestException,
  ValidationPipe,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtGuard} from './jwt/access-jwt/jwt.guard';
import { Public } from '@backend/src/shared/decorators/public.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RefreshJwtGuard } from './jwt/refresh-jwt/refresh-jwt.guard';
import { GitHubAuthGuard } from './github/github-auth.guard';

import { UsersRepository } from '@backend/src/modules/users/users.repository';
import { OAuthUsersRepository } from '@backend/src/modules/oauthUsersRepository';
import { RegisterDto } from '@backend/src/modules/dto/register.dto';
import { RefreshTokensRepository } from '@backend/src/modules/refreshTokens.repository';

import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';

// ...existing code...;
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfigService } from '@nestjs/config';
import { AuthUsersRepository } from '@backend/src/modules/auth-users.repository';
import { ONE_MINUTE, ONE_WEEK } from '@backend/src/consts/jwt-age';
import LoginDto from './dto/login.dto';
import { compareSync } from 'bcrypt';
import { Oauth_RegisterDto } from '@backend/src/modules/dto/Oauth_RegisterDto';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { OptionalAuth } from './jwt/decorator/optional-auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
    private readonly authUsersRepository: AuthUsersRepository,
    private readonly oauthUsersRepository: OAuthUsersRepository,
    private readonly refreshTokensRepo: RefreshTokensRepository,
  ) {}

  // this Route sus
  @Public()
  @Post('bearer')
  @ApiOperation({ summary: 'For developing only!' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string' },
      },
    },
  })
  apiBearerAuth(@Body('username') username: string) {
    const accessToken = this.authService.signJwt(username);
    return { accessToken: accessToken };
  }

  @Public()
  @UseGuards(GitHubAuthGuard)
  @Get('github')
  @ApiOperation({ summary: 'Redirect to Github OAuth' })
  async githubAuth() {
    // Redirect to Github
  }
  
  @Public()
  @UseGuards(GitHubAuthGuard)
  @Get('callback')
  @ApiOperation({ summary: 'Github OAuth callback' })
  async githubCallback(@Req() req, @Res({ passthrough: true }) res: Response) {
    const existingUser = await this.oauthUsersRepository.findByGithubId(req.user.id);
    console.log(req.user);
    
    const frontendUrl = this.configService.get('app.frontendUrl') || 'http://localhost:3000';
    
    if(!existingUser){
      const accessToken = this.authService.signJwt(req.user.id, req.user.email, 'github');
      const refreshToken = this.authService.signRefreshJwt(req.user.id);
      
      // Redirect with tokens in URL (no cookies)
      return res.redirect(`${frontendUrl}/consent?token=${accessToken}&refresh=${refreshToken}`);
    } else {
      const accessToken = this.authService.signJwt(existingUser.userId);
      const refreshToken = this.authService.signRefreshJwt(existingUser.userId);
      
      // Redirect to home with tokens in URL (no cookies)
      return res.redirect(`${frontendUrl}?token=${accessToken}&refresh=${refreshToken}`);
    }
  }
  
  @Public()
  @UseGuards(RefreshJwtGuard)
  @Post('refresh-jwt-token')
  @ApiOperation({ summary: 'Use refresh token to refresh access token' })
  async refreshJwtToken(@Req() req, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.sub;
    const userEmail = req.user.email;
    const accessToken = await this.authService.refreshAccessToken(userId, userEmail);
    res.cookie('jwt', accessToken, { 
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 15 * ONE_MINUTE,
    });
    return { accessToken };
  }

  // ----------------------------------------------------------------
  // Refresh: verify refresh JWT -> find matching row by user -> verify hash
  // -> revoke that row -> create & store new refresh -> set cookies -> new access.
  // ----------------------------------------------------------------
  @Public()
  @UseGuards(RefreshJwtGuard)
  @ApiOperation({ summary: '[OBSULETE] soon' })
  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefresh =
      (req.cookies?.['refresh_jwt'] as string) ||
      (req.body as any)?.refreshToken ||
      (req.headers['x-refresh-token'] as string);

    if (!rawRefresh) throw new UnauthorizedException('Missing refresh token');

    // decode & cryptographically verify with REFRESH_JWT_SECRET
    const { sub: userId } = this.authService.verifyRefresh(rawRefresh);

    // fetch all non-revoked tokens for this user and find the matching one
    const rows = await this.refreshTokensRepo.findValidByUser(Number(userId));
    let matchedId: number | null = null;

    for (const row of rows) {
      if (row.revoked || row.expiresAt < new Date()) continue;
      const same = row.tokenHash ? await argon2Verify(row.tokenHash, rawRefresh) : false;
      if (same) {
        matchedId = row.id;
        break;
      }
    }

    if (matchedId == null) {
      throw new UnauthorizedException('Refresh token invalid or revoked');
    }

    // revoke old row
    await this.refreshTokensRepo.revokeById(matchedId);

    // rotate: mint and store new refresh
    const { refreshToken: newRefresh } = this.authService.signRefreshJwt(userId);
    await this.refreshTokensRepo.create(
      Number(userId),
      newRefresh,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      req.ip,
      (req.headers['user-agent'] as string) ?? undefined,
    );

    // set new refresh cookie
    res.cookie('refresh_jwt', newRefresh, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    // issue new access token
    const accessToken = this.authService.signJwt(userId);
    res.cookie('jwt', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 15,
    });

    return { accessToken };
  }

  // ----------------------------------------------------------------
  // Register - FIXED: Complete registration with both tables and proper error handling
  // ----------------------------------------------------------------
  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    try {
      // 1) Check if email already exists
      const existingUser = await this.authUsersRepository.findByEmail(body.email);
      if (existingUser) {
        return {
          success: false,
          error: 'Email already registered'
        };
      }

      // 2) Hash the password
      const passwordHash = await this.authService.hashPassword(body.password);

      // 3) Create user in users table
      const user = await this.usersRepository.createUser(body);

      // 4) Create auth record in auth_users table
      await this.authUsersRepository.createAuthUser(user.userId, body.email, passwordHash);

      // 5) Generate JWT token
      const accessToken = this.authService.signJwt(user.userId.toString(), body.email);
      const { refreshToken, tokenId } = this.authService.signRefreshJwt(
        user.userId,
        body.email,
      );

      // 6) Set cookie
      res.cookie('jwt', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 15,
      });
      res.cookie('refresh_jwt', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: ONE_WEEK,
      });

      await this.refreshTokensRepo.createOrUpdateRefreshToken(
        user.userId,
        refreshToken,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      );

      // 7) Return success response
      return { 
        success: true,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: body.email,
        },
        accessToken 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed',
        details: error.message
      };
    }
  }

  
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User log in by password' })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      // 1) หา user จาก email
      const authUser = await this.authUsersRepository.findByEmail(body.email);
      if (!authUser) {
        throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);
      }

      // 2) ตรวจสอบ password

      const isValid = await this.authService.comparePassword(
        body.password,
        authUser.passwordHash,
      );
      if (!isValid) {
        throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);
      }
      // 3) ดึงข้อมูล user หลัก
      const user = await this.usersRepository.findById(authUser.userId);
      // 4) สร้าง JWT token
      const accessToken = this.authService.signJwt(
        user.userId,
        authUser.email,
      );
      const { refreshToken, tokenId } = this.authService.signRefreshJwt(
        user.userId,
        authUser.email,
      );

      // 5) set cookie
      res.cookie('jwt', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 15 * ONE_MINUTE, // 15 นาที
      });
      res.cookie('refresh_jwt', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: ONE_WEEK,
      });

      await this.refreshTokensRepo.createOrUpdateRefreshToken(
        user.userId,
        refreshToken,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      );

      // 6) ส่ง response
      return {
        success: true,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: authUser.email,
        },
        accessToken,
      };
    } catch (err) {
      // จะตกมาที่นี่ถ้า throw HttpException หรือ error อื่น
      throw err instanceof HttpException
        ? err
        : new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if account exists',
  })
  @ApiResponse({ status: 429, description: 'Too many password reset attempts' })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  // ----------------------------------------------------------------
  // Logout: verify refresh token -> revoke it -> clear cookies.
  // (Access token remains short-lived; that's fine.)
  // ----------------------------------------------------------------
  @UseGuards(JwtGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefresh =
      (req.cookies?.['refresh_jwt'] as string) ||
      (req.body as any)?.refreshToken ||
      (req.headers['x-refresh-token'] as string);

    if (rawRefresh) {
      try {
        const { sub: userId } = this.authService.verifyRefresh(rawRefresh);

        // find the matching row for this user and revoke it
        const rows = await this.refreshTokensRepo.findValidByUser(Number(userId));
        for (const row of rows) {
          if (row.revoked || row.expiresAt < new Date()) continue;
          const same = row.tokenHash ? await argon2Verify(row.tokenHash, rawRefresh) : false;
          if (same) {
            await this.refreshTokensRepo.revokeById(row.id);
            break;
          }
        }
      } catch {
        // ignore invalid refresh; still clear cookies
      }
    }

    res.clearCookie('jwt', { path: '/' });
    res.clearCookie('refresh_jwt', { path: '/' });
    return { message: 'Logged out' };
  }

  // ----------------------------------------------------------------
  // Logout everywhere: revoke all refresh tokens for current user
  // ----------------------------------------------------------------
  @UseGuards(JwtGuard)
  @Post('logout-all')
  async logoutAll(@Req() req: any) {
    await this.refreshTokensRepo.revokeAllByUser(Number(req.user.sub));
    return { message: 'Logged out on all devices' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('registerOauth')
  async registerOauth(@Req() req: any, @Body() body: Oauth_RegisterDto, @Res({ passthrough: true }) res: Response) {
    try {
      const existingUser = await this.oauthUsersRepository.findByGithubId(req.user.githubId);
      if (existingUser) {
        return {
          success: false,
          error: 'Email already registered'
        };
      } 
      // 3) Create user in users table
      const user = await this.usersRepository.createUserOauth(body);

      // 4) Create auth record in auth_users table
      console.log('req.user', req.user);
      await this.oauthUsersRepository.createOAuthUser(user.userId, 'github' , req.user.sub , req.user.email);

      // 5) Generate JWT token
      const accessToken = this.authService.signJwt(user.userId.toString(), req.user.email);
      const { refreshToken, tokenId } = this.authService.signRefreshJwt(
        user.userId,
        req.user.email,
      );

      // 6) Set cookie
      res.cookie('jwt', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 15,
      });
      res.cookie('refresh_jwt', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: ONE_WEEK,
      });

      await this.refreshTokensRepo.createOrUpdateRefreshToken(
        user.userId,
        refreshToken,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      );

      // 7) Return success response
      return { 
        success: true,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: req.user.email,
        },
        accessToken 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed',
        details: error.message
      };
    }
  }
  
  @OptionalAuth()
  @Get('method') // ตรวจ JWT จาก cookie
  getMethod(@Req() req) {
    // req.user มาจาก JwtStrategy
    console.log(req.user);
    const method = req.user?.method || 'normal';
    return {
      method: method, // 'github' หรือ 'normal'
    };
  }
}