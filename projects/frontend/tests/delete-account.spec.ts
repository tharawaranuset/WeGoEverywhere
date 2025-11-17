import { test, expect } from '@playwright/test';

test('delete account flow', async ({ page }) => {
	// Login first (assume user exists)
	await page.goto('http://localhost:3000/login');
	await page.fill('input[name="email"]', 'usertest@example.com');
	await page.fill('input[name="password"]', 'Password_Test55');
	await page.click('button[type="submit"]');
	await page.waitForURL('http://localhost:3000/');

	// Go to profile page
	await page.goto('http://localhost:3000/profile');
	await page.waitForSelector('button:has-text("Delete Account")');

	// Click Delete Account button
	await page.click('button:has-text("Delete Account")');

	// Wait for confirm dialog to appear
	await page.waitForSelector('text=Are you sure to delete your account?', { 
		state: 'visible',
		timeout: 5000 
	});

	// ✅ FIX หลายวิธี - เลือกวิธีที่เหมาะสม:

	// วิธีที่ 1: ใช้ structure จาก ConfirmProvider (แนะนำ)
	const dialog = page.locator('div.fixed.inset-0.z-\\[9999\\]');
	await dialog.waitFor({ state: 'visible' });
	
	// หาปุ่ม Delete ที่มี bg-[#B71402] (สีแดง danger)
	const deleteButton = dialog.locator('button.bg-\\[\\#B71402\\]');
	await deleteButton.click();

	// วิธีที่ 2: ใช้ nth selector
	// const deleteButton = page.locator('button:has-text("Delete")').nth(0); // ปุ่มแรกใน dialog

	// วิธีที่ 3: ใช้ role และ exact text
	// const deleteButton = page.getByRole('button', { name: 'Delete', exact: true });
	// await deleteButton.click();

	// ✅ FIX: เช็ค redirect เป็นหลัก เพราะ toast อาจหายเร็ว
	// ลอง race ระหว่าง toast กับ redirect
	await Promise.race([
		// อาจเจอ toast (ถ้าช้าพอ)
		page.waitForSelector('text=Successfully Delete', { timeout: 3000 }).catch(() => null),
		// หรือ redirect ไปหน้า login ก่อน (เป็นไปได้มากกว่า)
		page.waitForURL('http://localhost:3000/login', { timeout: 5000 })
	]);

	// เช็คว่า redirect ไปหน้า login สำเร็จ (นี่คือตัวบอกว่าลบสำเร็จจริงๆ)
	await page.waitForURL('http://localhost:3000/login', { timeout: 5000 });
	expect(page.url()).toBe('http://localhost:3000/login');
	
	console.log('✅ Delete account successful - redirected to login page');
});