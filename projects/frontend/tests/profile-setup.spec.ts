import { test, expect } from '@playwright/test';

const profileSetupUrl = 'http://localhost:3000/profile-setup';

// Helper function to navigate to profile setup page
async function goToProfileSetup(page: any) {
  // Set registration data in sessionStorage (required to access profile-setup)
  await page.goto('http://localhost:3000/register');
  await page.evaluate(() => {
    sessionStorage.setItem('registrationData', JSON.stringify({
      email: 'usertest@example.com',
      password: 'Password_Test55'
    }));
  });
  await page.goto(profileSetupUrl);
}

// Helper to calculate a date that makes user exactly 20 years old
function getDate20YearsAgo(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 20);
  return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
}

// Helper to calculate a date that makes user 19 years old (invalid)
function getDate19YearsAgo(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 19);
  return date.toISOString().split('T')[0];
}

// Helper to calculate a date that makes user 21 years old (valid)
function getDate21YearsAgo(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 21);
  return date.toISOString().split('T')[0];
}

test.describe('Profile Setup - First Name Validation', () => {
  test.beforeEach(async ({ page }) => {
    await goToProfileSetup(page);
  });

  test('EC19: Valid first name (Thai/English letters, ≤50 chars)', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Should attempt to submit (may need API mocking for full success)
    await page.waitForTimeout(1000);
  });

  test('EC19: Valid first name with Thai characters', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'สมชาย');
    await page.fill('input[name="lastName"]', 'ใจดี');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('EC19: Valid first name with 50 characters', async ({ page }) => {
    const fiftyChars = 'a'.repeat(50);
    await page.fill('input[name="firstName"]', fiftyChars);
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('EC20: Empty first name - should show error', async ({ page }) => {
    // Don't fill first name
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    
    // Check HTML5 validation
    const firstNameInput = page.locator('input[name="firstName"]');
    const validationMessage = await firstNameInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    
    expect(validationMessage).toBeTruthy();
    await expect(page).toHaveURL(profileSetupUrl);
  });

  test('EC21: First name with numbers - should show error', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John123');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    
    // Should stay on page or show error
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(profileSetupUrl);
  });

  test('EC21: First name with symbols - should show error', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John@#$');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(profileSetupUrl);
  });

  test('EC22: First name exceeds 50 characters - should show error', async ({ page }) => {
    const fiftyOneChars = 'a'.repeat(51);
    await page.fill('input[name="firstName"]', fiftyOneChars);
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(profileSetupUrl);
  });
});

test.describe('Profile Setup - Last Name Validation', () => {
  test.beforeEach(async ({ page }) => {
    await goToProfileSetup(page);
  });

  test('EC23: Valid last name (Thai/English letters, ≤50 chars)', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('EC23: Valid last name with Thai characters', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'สมชาย');
    await page.fill('input[name="lastName"]', 'รักประเทศ');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('EC23: Valid last name with 50 characters', async ({ page }) => {
    const fiftyChars = 'D'.repeat(50);
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', fiftyChars);
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('EC24: Empty last name - should show error', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    // Don't fill last name
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    
    const lastNameInput = page.locator('input[name="lastName"]');
    const validationMessage = await lastNameInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    
    expect(validationMessage).toBeTruthy();
    await expect(page).toHaveURL(profileSetupUrl);
  });

  test('EC25: Last name with numbers - should show error', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe123');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(profileSetupUrl);
  });

  test('EC25: Last name with symbols - should show error', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe@#$');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(profileSetupUrl);
  });

  test('EC26: Last name exceeds 50 characters - should show error', async ({ page }) => {
    const fiftyOneChars = 'D'.repeat(51);
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', fiftyOneChars);
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(profileSetupUrl);
  });
});

test.describe('Profile Setup - Birth Date Validation', () => {
  test.beforeEach(async ({ page }) => {
    await goToProfileSetup(page);
  });

  test('EC27: Birth date makes user exactly 20 years old - should be valid', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate20YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('EC27: Birth date makes user 21 years old - should be valid', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('EC27: Birth date makes user 30 years old - should be valid', async ({ page }) => {
    const date30YearsAgo = new Date();
    date30YearsAgo.setFullYear(date30YearsAgo.getFullYear() - 30);
    const dateString = date30YearsAgo.toISOString().split('T')[0];
    
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', dateString);
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('EC28: Birth date makes user 19 years old - should show error', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate19YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    
    // Should show error toast or stay on page
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(profileSetupUrl);
  });

  test('EC28: Birth date makes user 18 years old - should show error', async ({ page }) => {
    const date18YearsAgo = new Date();
    date18YearsAgo.setFullYear(date18YearsAgo.getFullYear() - 18);
    const dateString = date18YearsAgo.toISOString().split('T')[0];
    
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', dateString);
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(profileSetupUrl);
  });

  test('EC29: Empty birth date - should not proceed', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    // Don't fill birth date (leave it empty)
    await page.selectOption('select[name="sex"]', 'male');
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Wait for any validation to trigger
    await page.waitForTimeout(1000);
    
    // Method 1: Check if still on profile setup page
    const currentUrl = page.url();
    expect(currentUrl).toContain('profile-setup');
    
    // Method 2: Verify birthdate field exists and is empty
    const birthdateValue = await page.locator('input[name="birthdate"]').inputValue();
    expect(birthdateValue).toBe('');
    
    // Method 3: Check if required attribute exists
    const isRequired = await page.locator('input[name="birthdate"]').evaluate(
      (el: HTMLInputElement) => el.hasAttribute('required')
    );
    
    // If field is required, form should not submit with empty birthdate
    if (isRequired) {
      expect(currentUrl).toContain('profile-setup');
    }
  });
});

test.describe('Profile Setup - Gender Validation', () => {
  test.beforeEach(async ({ page }) => {
    await goToProfileSetup(page);
  });

  test('EC30: Gender "Female" selected - should be valid', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'female');
    
    // Verify selection
    const selectedValue = await page.locator('select[name="sex"]').inputValue();
    expect(selectedValue).toBe('female');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('EC30: Gender "Male" selected - should be valid', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    const selectedValue = await page.locator('select[name="sex"]').inputValue();
    expect(selectedValue).toBe('male');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('EC30: Gender "Other" selected - should be valid', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'Alex');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'other');
    
    const selectedValue = await page.locator('select[name="sex"]').inputValue();
    expect(selectedValue).toBe('other');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('EC30: Gender "Prefer not to say" selected - should be valid', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'Jordan');
    await page.fill('input[name="lastName"]', 'Taylor');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'prefer_not');
    
    const selectedValue = await page.locator('select[name="sex"]').inputValue();
    expect(selectedValue).toBe('prefer_not');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('No gender selected (default) - should show error', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    // Don't select gender (leave default empty option)
    
    await page.click('button[type="submit"]');
    
    // Should stay on page
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(profileSetupUrl);
  });
});

test.describe('Profile Setup - Optional Fields', () => {
  test.beforeEach(async ({ page }) => {
    await goToProfileSetup(page);
  });

  test('Valid telephone number (10 digits starting with 06/08/09)', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    await page.fill('input[name="telephoneNumber"]', '0812345678');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('Valid telephone starting with 06', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    await page.fill('input[name="telephoneNumber"]', '0612345678');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('Valid telephone starting with 09', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    await page.fill('input[name="telephoneNumber"]', '0912345678');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('Valid bio text', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    await page.fill('input[name="bio"]', 'I am a software developer who loves coding.');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('Empty optional fields should be allowed', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    // Don't fill telephone and bio (optional)
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });
});

test.describe('Profile Setup - Complete Valid Flow', () => {
  test('Complete profile setup with all valid data', async ({ page }) => {
    // Mock necessary APIs
    await page.route('**/auth/register', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { userId: 123 }
        })
      });
    });

    await goToProfileSetup(page);
    
    // Fill all required fields
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', '2000-01-01');
    await page.selectOption('select[name="sex"]', 'male');
    
    // Fill optional fields
    await page.fill('input[name="telephoneNumber"]', '0812345678');
    await page.fill('input[name="bio"]', 'Software developer');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to home (with proper API mocking)
    await page.waitForTimeout(2000);
  });

  test('Visual test - Take screenshot of profile setup form', async ({ page }) => {
    await goToProfileSetup(page);
    
    // Fill form to show different states
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    
    await page.screenshot({ 
      path: 'test-results/profile-setup-filled.png',
      fullPage: true 
    });
  });
});

test.describe('Profile Setup - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await goToProfileSetup(page);
  });

  test('First name with spaces should be trimmed', async ({ page }) => {
    await page.fill('input[name="firstName"]', '  John  ');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('Mixed Thai and English in name', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'Johnสมชาย');
    await page.fill('input[name="lastName"]', 'Doeใจดี');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('Invalid phone number format', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    await page.fill('input[name="telephoneNumber"]', '1234567890'); // Doesn't start with 06/08/09
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(profileSetupUrl);
  });

  test('Phone number too short', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    await page.fill('input[name="telephoneNumber"]', '081234'); // Too short
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(profileSetupUrl);
  });

  test('Phone number too long', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthdate"]', getDate21YearsAgo());
    await page.selectOption('select[name="sex"]', 'male');
    await page.fill('input[name="telephoneNumber"]', '08123456789'); // 11 digits
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(profileSetupUrl);
  });
});