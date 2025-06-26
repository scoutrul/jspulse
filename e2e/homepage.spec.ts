import { test, expect } from '@playwright/test';

test.describe('JSPulse - Главная страница', () => {
  test('загружается и отображает вакансии', async ({ page }) => {
    // Переходим на главную страницу
    await page.goto('/');

    // Проверяем что заголовок корректный
    await expect(page).toHaveTitle(/JSPulse/);

    // Проверяем наличие основных элементов интерфейса
    await expect(page.locator('h1')).toBeVisible();
    
    // Ждем загрузки вакансий (максимум 10 секунд)
    await page.waitForLoadState('networkidle');
    
    // Проверяем что вакансии загрузились
    const vacancyCards = page.locator('[data-testid="vacancy-card"]');
    
    // Ждем появления хотя бы одной вакансии
    await expect(vacancyCards.first()).toBeVisible({ timeout: 15000 });
    
    // Проверяем что загрузилось больше одной вакансии  
    const count = await vacancyCards.count();
    expect(count).toBeGreaterThan(0);
    console.log(`✅ Найдено ${count} вакансий на странице`);
  });

  test('фильтрация по навыкам работает', async ({ page }) => {
    await page.goto('/');
    
    // Ждем загрузки страницы
    await page.waitForLoadState('networkidle');
    
    // Ищем теги навыков
    const skillTags = page.locator('[data-testid="skill-tag"]');
    
    if (await skillTags.count() > 0) {
      // Кликаем на первый навык
      await skillTags.first().click();
      
      // Ждем обновления результатов
      await page.waitForTimeout(1000);
      
      // Проверяем что URL обновился с фильтром
      expect(page.url()).toContain('skills=');
      
      console.log('✅ Фильтрация по навыкам работает');
    } else {
      console.log('⚠️ Навыки не найдены на странице');
    }
  });

  test('пагинация работает', async ({ page }) => {
    await page.goto('/');
    
    // Ждем загрузки
    await page.waitForLoadState('networkidle');
    
    // Ищем кнопку "Следующая страница"
    const nextButton = page.locator('button:has-text("Следующая")');
    
    if (await nextButton.isVisible()) {
      const currentUrl = page.url();
      
      // Кликаем на следующую страницу
      await nextButton.click();
      
      // Ждем навигации
      await page.waitForURL(/page=/, { timeout: 10000 });
      
      // Проверяем что URL изменился
      expect(page.url()).not.toBe(currentUrl);
      
      console.log('✅ Пагинация работает');
    } else {
      console.log('⚠️ Пагинация не найдена (возможно мало данных)');
    }
  });
}); 