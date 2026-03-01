import { test, expect } from '@playwright/test';

test('language select + nickname skip + first question render', async ({ page }) => {
  await page.route('**/api/sessions', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: '11111111-1111-1111-1111-111111111111',
        totalQuestions: 1,
        startedAt: new Date().toISOString(),
        resumed: false
      })
    });
  });

  await page.route('**/api/sessions/**/question', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        questionId: 'q-001',
        type: 'single',
        prompt: 'Question FR de test',
        choices: [
          { key: 'A', label: 'Choix A' },
          { key: 'B', label: 'Choix B' }
        ],
        imageKey: null,
        progress: { current: 1, total: 1 }
      })
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Francais' }).click();
  await page.getByRole('button', { name: /Commencer|Starten|Start/i }).click();
  await page.getByRole('button', { name: /Passer|Ueberspringen|Skip/i }).click();

  await expect(page.getByText('Question FR de test')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Choix A' })).toBeVisible();
});
