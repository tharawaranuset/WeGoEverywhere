import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import LoginDto from './login.dto';

describe('LoginDto', () => {
  describe('Validation', () => {
    it('should pass validation with valid email and password', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
        password: '123456',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid email format', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'invalid-email',
        password: '123456',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints?.isEmail).toBe('Please provide a valid email address');
    });

    it('should fail validation with missing email', async () => {
      const dto = plainToInstance(LoginDto, {
        password: '123456',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const emailError = errors.find(e => e.property === 'email');
      expect(emailError).toBeDefined();
    });

    it('should fail validation with password shorter than 6 characters', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
        password: '12345',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const passwordError = errors.find(e => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints?.minLength).toBeDefined();
    });

    it('should fail validation with non-string password', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
        password: 123456, // number instead of string
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const passwordError = errors.find(e => e.property === 'password');
      expect(passwordError).toBeDefined();
    });

    it('should fail validation with missing password', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const passwordError = errors.find(e => e.property === 'password');
      expect(passwordError).toBeDefined();
    });

    it('should accept password with exactly 6 characters', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
        password: '123456',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept password with more than 6 characters', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
        password: 'verylongpassword123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('DTO Instance', () => {
    it('should create an instance with properties', () => {
      const dto = new LoginDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';

      expect(dto.email).toBe('test@example.com');
      expect(dto.password).toBe('password123');
    });

    it('should be transformable from plain object', () => {
      const plain = {
        email: 'user@example.com',
        password: '123456',
      };

      const dto = plainToInstance(LoginDto, plain);

      expect(dto).toBeInstanceOf(LoginDto);
      expect(dto.email).toBe('user@example.com');
      expect(dto.password).toBe('123456');
    });
  });
});