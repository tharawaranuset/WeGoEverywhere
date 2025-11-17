import { test, expect } from '@playwright/test';

test.describe('Logout Flow Tests', () => {
	
	test('should logout successfully', async ({ page }) => {
		// Login first
		await page.goto('http://localhost:3000/login');
		await page.fill('input[name="email"]', 'usertest@example.com');
		await page.fill('input[name="password"]', 'Password_Test55');
		await page.click('button[type="submit"]');
		await page.waitForURL('http://localhost:3000/');

		// Go to profile page
		await page.goto('http://localhost:3000/profile');
		await page.waitForSelector('button:has-text("Sign Out")', { 
			state: 'visible',
			timeout: 5000 
		});

		// Click Sign Out button
		await page.click('button:has-text("Sign Out")');

		// Wait for confirmation dialog
		await page.waitForSelector('text=Are you sure to sign out your account?', { 
			state: 'visible',
			timeout: 5000 
		});

		// Find the dialog and click Sign out button
		const dialog = page.locator('div.fixed.inset-0.z-\\[9999\\]');
		await dialog.waitFor({ state: 'visible' });
		
		// Click the "Sign out" button in the dialog (not the danger variant)
		const signOutButton = dialog.locator('button.bg-\\[\\#FFDCD5\\]:has-text("Sign out")');
		await signOutButton.click();

		// Wait for redirect to login page (main indicator of success)
		await Promise.race([
			page.waitForSelector('text=Successfully Sign out', { timeout: 3000 }).catch(() => null),
			page.waitForURL('http://localhost:3000/login', { timeout: 5000 })
		]);

		// Verify redirect to login page
		await page.waitForURL('http://localhost:3000/login', { timeout: 5000 });
		expect(page.url()).toBe('http://localhost:3000/login');
		
		console.log('✅ Logout successful - redirected to login page');
	});

});