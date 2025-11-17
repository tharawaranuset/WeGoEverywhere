// Equivalence Class Table Coverage
test.describe('Reset Password - Equivalence Classes', () => {
  const mockToken = 'valid-mock-token-123';
  const baseUrl = 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    await page.route('**/auth/reset-password', async (route) => {
      const postData = route.request().postDataJSON();
      if (postData.token === mockToken) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ success: false })
        });
      }
    });
  });

  // EC4 & EC14: Valid password, confirm matches
  test('Valid password and confirm (EC4, EC14)', async ({ page }) => {
    await page.goto(`${baseUrl}/reset-password?token=${mockToken}`);
    const validPassword = 'ValidPass12!';
    await page.fill('input#new-password', validPassword);
    await page.fill('input#confirm-password', validPassword);
    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('h2:has-text("Password changed")')).toBeVisible();
  });

  // EC5: Password less than 8 chars
  test('Password less than 8 chars (EC5)', async ({ page }) => {
    await page.goto(`${baseUrl}/reset-password?token=${mockToken}`);
    await page.fill('input#new-password', 'Short1!');
    await page.fill('input#confirm-password', 'Short1!');
    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('text=/Password does not meet all requirements/i')).toBeVisible();
  });

  // EC6: Missing uppercase
  test('Password missing uppercase (EC6)', async ({ page }) => {
    await page.goto(`${baseUrl}/reset-password?token=${mockToken}`);
    await page.fill('input#new-password', 'password12!');
    await page.fill('input#confirm-password', 'password12!');
    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('text=/Password does not meet all requirements/i')).toBeVisible();
  });

  // EC7: Missing lowercase
  test('Password missing lowercase (EC7)', async ({ page }) => {
    await page.goto(`${baseUrl}/reset-password?token=${mockToken}`);
    await page.fill('input#new-password', 'PASSWORD12!');
    await page.fill('input#confirm-password', 'PASSWORD12!');
    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('text=/Password does not meet all requirements/i')).toBeVisible();
  });

  // EC8: Missing numbers
  test('Password missing numbers (EC8)', async ({ page }) => {
    await page.goto(`${baseUrl}/reset-password?token=${mockToken}`);
    await page.fill('input#new-password', 'Password!!');
    await page.fill('input#confirm-password', 'Password!!');
    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('text=/Password does not meet all requirements/i')).toBeVisible();
  });

  // EC9: Missing symbols
  test('Password missing symbols (EC9)', async ({ page }) => {
    await page.goto(`${baseUrl}/reset-password?token=${mockToken}`);
    await page.fill('input#new-password', 'Password123');
    await page.fill('input#confirm-password', 'Password123');
    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('text=/Password does not meet all requirements/i')).toBeVisible();
  });

  // EC10: Character repetition
  test('Password with character repetition (EC10)', async ({ page }) => {
    await page.goto(`${baseUrl}/reset-password?token=${mockToken}`);
    await page.fill('input#new-password', 'Paaaword12!');
    await page.fill('input#confirm-password', 'Paaaword12!');
    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('text=/Password does not meet all requirements/i')).toBeVisible();
  });

  // EC11: Number sequence
  test('Password with number sequence (EC11)', async ({ page }) => {
    await page.goto(`${baseUrl}/reset-password?token=${mockToken}`);
    await page.fill('input#new-password', 'Password123!');
    await page.fill('input#confirm-password', 'Password123!');
    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('text=/Password does not meet all requirements/i')).toBeVisible();
  });

  // EC12: Letter sequence
  test('Password with letter sequence (EC12)', async ({ page }) => {
    await page.goto(`${baseUrl}/reset-password?token=${mockToken}`);
    await page.fill('input#new-password', 'Pabcword12!');
    await page.fill('input#confirm-password', 'Pabcword12!');
    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('text=/Password does not meet all requirements/i')).toBeVisible();
  });

  // EC13: Keyboard pattern
  test('Password with keyboard pattern (EC13)', async ({ page }) => {
    await page.goto(`${baseUrl}/reset-password?token=${mockToken}`);
    await page.fill('input#new-password', 'Qwerty123!');
    await page.fill('input#confirm-password', 'Qwerty123!');
    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('text=/Password does not meet all requirements/i')).toBeVisible();
  });

  // EC15: Confirm password does not match
  test('Confirm password does not match (EC15)', async ({ page }) => {
    await page.goto(`${baseUrl}/reset-password?token=${mockToken}`);
    const validPassword = 'ValidPass12!';
    await page.fill('input#new-password', validPassword);
    await page.fill('input#confirm-password', 'DifferentPass12!');
    await page.click('button[type="submit"]:has-text("Save")');
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });
});
import { test, expect } from '@playwright/test';

test('Full reset password flow: login → forgot → email → reset', async ({ page }) => {
  const mockToken = 'valid-mock-token-123';
  const newPassword = 'StrongPass12!';

  // Mock forgot-password API
  await page.route('**/auth/forgot-password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Reset link sent' })
    });
  });

  // Mock reset-password API
  await page.route('**/auth/reset-password', async (route) => {
    const postData = route.request().postDataJSON();
    if (postData.token === mockToken) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false })
      });
    }
  });

  // Step 1: Go to login page
  await page.goto('http://localhost:3000/login');
  await expect(page.locator('h2:has-text("Log In")')).toBeVisible();

  // Step 2: Click "Forgot password?" link
  await page.click('a:has-text("Forgot password?")');
  await expect(page).toHaveURL(/forgot-password/);

  // Step 3: Fill email and submit
  await page.fill('input[name="email"]', 'user@example.com');
  await page.click('button:has-text("Send reset link")');
  await page.waitForTimeout(500);

  // Step 4: Simulate clicking link from email
  await page.goto(`http://localhost:3000/reset-password?token=${mockToken}`);
  await expect(page.locator('h1:has-text("Reset Password")')).toBeVisible();

  // Step 5: Fill new password and confirm
  await page.fill('input#new-password', newPassword);
  await page.fill('input#confirm-password', newPassword);
  await page.click('button[type="submit"]:has-text("Save")');

  // Step 6: Verify success
  await expect(page.locator('h2:has-text("Password changed")')).toBeVisible();
});

