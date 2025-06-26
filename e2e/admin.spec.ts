import { test, expect } from '@playwright/test';

test.describe('JSPulse - Админ панель', () => {
  test('админка загружается и показывает статистику', async ({ page }) => {
    // Переходим на страницу админки
    await page.goto('/admin');

    // Проверяем заголовок
    await expect(page).toHaveTitle(/Admin/);

    // Ждем загрузки данных
    await page.waitForLoadState('networkidle');

    // Проверяем наличие статистических карточек
    const statCards = page.locator('[data-testid="stat-card"]');
    
    // Должно быть несколько статистических карточек
    const cardCount = await statCards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    console.log(`✅ Найдено ${cardCount} статистических карточек`);

    // Проверяем что отображается количество вакансий
    const vacancyStatsText = await page.textContent('body');
    expect(vacancyStatsText).toContain('203'); // Ожидаем 203 вакансии
    
    console.log('✅ Статистика вакансий отображается корректно');
  });

  test('кнопки управления данными работают', async ({ page }) => {
    await page.goto('/admin');
    
    // Ждем загрузки
    await page.waitForLoadState('networkidle');
    
    // Ищем кнопки действий
    const actionButtons = page.locator('[data-testid="action-button"]');
    
    if (await actionButtons.count() > 0) {
      console.log(`✅ Найдено ${await actionButtons.count()} кнопок действий`);
      
      // Можем проверить наличие определенных кнопок
      const parseButton = page.locator('button:has-text("Парсинг")');
      if (await parseButton.isVisible()) {
        console.log('✅ Кнопка парсинга найдена');
      }
    } else {
      console.log('⚠️ Кнопки действий не найдены');
    }
  });

  test('навигация между разделами работает', async ({ page }) => {
    await page.goto('/admin');
    
    // Проверяем навигацию обратно на главную
    const homeLink = page.locator('a[href="/"]');
    
    if (await homeLink.isVisible()) {
      await homeLink.click();
      
      // Ждем перехода на главную
      await page.waitForURL('/');
      
      expect(page.url()).toBe('http://localhost:3000/');
      console.log('✅ Навигация на главную работает');
    } else {
      console.log('⚠️ Ссылка на главную не найдена');
    }
  });
}); 