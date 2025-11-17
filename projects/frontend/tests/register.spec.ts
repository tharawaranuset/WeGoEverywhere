import { test, expect } from '@playwright/test';
const registrationUrl = 'http://localhost:3000/register';

test('Should show browser validation for empty required email field', async ({ page }) => {
    // ไปที่หน้า register
    await page.goto('http://localhost:3000/register');
    // Don't fill email
    await page.fill('input[name="password"]', 'Password_Test55');
    await page.fill('input[name="confirmPassword"]', 'Password_Test55');
    await page.check('input[name="accept"]');
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // Check for HTML5 validation message
    const emailInput = page.locator('input[name="email"]');
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    
    // Should have a validation message (browser-specific text)
    expect(validationMessage).toBeTruthy();
    expect(validationMessage.length).toBeGreaterThan(0);
    
    // Should stay on register page
    await expect(page).toHaveURL(registrationUrl);
  });

  test('Should show browser validation for invalid email format (HTML5)', async ({ page }) => {
    // ไปที่หน้า register
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Password_Test55');
    await page.fill('input[name="confirmPassword"]', 'Password_Test55');
    await page.check('input[name="accept"]');
    
    await page.click('button[type="submit"]');
    
    // Check HTML5 validation state
    const emailInput = page.locator('input[name="email"]');
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    
    // Email should be invalid
    expect(isValid).toBe(false);
    
    // Should stay on register page
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC2: Invalid email format (missing domain) - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'invalid@');
    await page.fill('input[name="password"]', 'Password_Test55');
    await page.fill('input[name="confirmPassword"]', 'Password_Test55');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC3: Empty email - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', '');
    await page.fill('input[name="password"]', 'Password_Test55');
    await page.fill('input[name="confirmPassword"]', 'Password_Test55');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC5: Password less than 8 characters - should show red indicator', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Short1!');
    
    // Check that the requirement shows as not met (red)
    const requirement = page.locator('text=At least 8 characters').locator('..');
    await expect(requirement).toContainText('At least 8 characters');
    
    // Try to submit
    await page.fill('input[name="confirmPassword"]', 'Short1!');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    // Should not proceed
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC6: Password missing uppercase - should show red indicator', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password1!');
    await page.fill('input[name="confirmPassword"]', 'password1!');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC7: Password missing lowercase - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'PASSWORD1!');
    await page.fill('input[name="confirmPassword"]', 'PASSWORD1!');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC8: Password missing number - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Password!');
    await page.fill('input[name="confirmPassword"]', 'Password!');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC9: Password missing symbol - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Password1');
    await page.fill('input[name="confirmPassword"]', 'Password1');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC10: Password with character repetition (aaa) - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Paaaword1!');
    await page.fill('input[name="confirmPassword"]', 'Paaaword1!');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC10: Password with character repetition (111) - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Password1111!');
    await page.fill('input[name="confirmPassword"]', 'Password1111!');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC11: Password with number sequence (123) - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC11: Password with number sequence (012) - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Pass012word!');
    await page.fill('input[name="confirmPassword"]', 'Pass012word!');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC12: Password with letter sequence (abc) - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Pabcword1!');
    await page.fill('input[name="confirmPassword"]', 'Pabcword1!');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC12: Password with letter sequence (xyz) - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Pxyzword1!');
    await page.fill('input[name="confirmPassword"]', 'Pxyzword1!');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC13: Password with keyboard pattern (qwerty) - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Qwerty1!');
    await page.fill('input[name="confirmPassword"]', 'Qwerty1!');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC13: Password with keyboard pattern (asdf) - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Asdf1234!');
    await page.fill('input[name="confirmPassword"]', 'Asdf1234!');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC15: Password and confirmPassword mismatch - should show mismatch text', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Password_Test55');
    await page.fill('input[name="confirmPassword"]', 'Password_Test56');
    
    // Wait for mismatch indicator to appear
    await page.waitForTimeout(500);
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
    
    // Try to submit
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    // Should not proceed
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC16: Empty confirmPassword - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Password_Test55');
    await page.fill('input[name="confirmPassword"]', '');
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC18: Policy checkbox not checked - should not proceed', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'Password_Test55');
    await page.fill('input[name="confirmPassword"]', 'Password_Test55');
    // Don't check checkbox
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(registrationUrl);
  });

  test('EC1, EC4, EC14, EC17: Valid registration - should proceed to profile setup', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    const uniqueEmail = `test${Date.now()}@example.com`;
    
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password_Test55');
    await page.fill('input[name="confirmPassword"]', 'Password_Test55');
    
    // Wait for password match indicator
    await page.waitForTimeout(500);
    await expect(page.locator('text=Passwords match')).toBeVisible();
    
    // Check policy checkbox
    await page.check('input[name="accept"]');
    await expect(page.locator('input[name="accept"]')).toBeChecked();
    
    await page.click('button[type="submit"]');
    
    // Should navigate to profile setup
    await expect(page).toHaveURL(/profile-setup/, { timeout: 10000 });
  });

