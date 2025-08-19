<script lang="ts">
  import type { VacancyDTO, VacancyWithHtml } from "@jspulse/shared";
  import type { PageData } from "./$types";
  import Filters from "$lib/components/Filters.svelte";
  import VacancyList from "$lib/components/VacancyList.svelte";
  import SimplePagination from "$lib/components/SimplePagination.svelte";
  import LoadingIndicator from "$lib/components/LoadingIndicator.svelte";
  import ErrorMessage from "$lib/components/ErrorMessage.svelte";
  import TagBubblesCanvas from "$lib/components/TagBubblesCanvas.svelte";
  import ToastNotifications from "$lib/components/admin/ToastNotifications.svelte";
  import { vacancyService } from "$lib/services/vacancy.service";
  import { vacancyStore } from "$lib/stores/vacancyStore";
  import { restoreScrollPosition } from "$lib/stores/scrollStore";
  import { showNotification } from "$lib/stores/notificationStore";
  import { onMount, beforeUpdate } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { PAGINATION } from '$lib/config/pagination.constants';

  // Константы для анимаций
  const ANIMATION = {
    FADE_IN_DURATION_MS: 1200,
    TIMING: {
      DOM_RENDER_DELAY: 50,
      SCROLL_DELAY: 100
    }
  };

  export let data: PageData;

  function convertVacancy(v: any): VacancyWithHtml {
    return {
      ...v,
      htmlDescription: v.htmlDescription === null ? undefined : v.htmlDescription
    };
  }

  // НЕ восстанавливаем состояние из localStorage чтобы избежать проблем с кешем после удаления
  let stateRestored = false;
  // if (browser) {
  //   stateRestored = vacancyStore.restoreState();
  //   if (stateRestored) {
  //     console.log("[CLIENT] Состояние восстановлено из localStorage");
  //   } else {
  //     console.log("[CLIENT] Состояние не найдено, будем загружать с сервера");
  //   }
  // }
  
  // Проверяем есть ли СВЕЖИЕ данные с сервера, используем их для предотвращения мерцания
  if (data.initialVacancies && data.initialVacancies.length > 0) {
    vacancyStore.setVacancies(
      data.initialVacancies.map(convertVacancy),
      data.totalCount || 0,
      data.totalPages || 0,
      data.page || 0
    );
  } else {
  }

  let availableSkills: string[] = data.availableSkills || [];
  let skillsStats: Array<{ name: string; count: number }> = (data.skillsStats || []).map(stat => ({
    name: (stat as any).name || stat.skill || 'unknown',
    count: stat.count || 0
  })).filter(stat => stat.name && stat.name !== 'unknown');
  
  // Если нет статистики с сервера, создаём fallback данные
  if (skillsStats.length === 0 && availableSkills.length > 0) {
    skillsStats = availableSkills.map(skill => ({
      name: skill,
      count: Math.floor(Math.random() * 100) + 20
    }));
  }

  // Данные для TagBubblesCanvas из реальной статистики
  $: tagsForBubbles = skillsStats.map(stat => ({
    name: stat.name,
    count: stat.count || 0
  })).filter(tag => tag.name && tag.name !== 'unknown');



  // Подписка на store
  $: store = $vacancyStore;

  // Reactive переменные для UI
  $: isMobile = browser && window.innerWidth < 768;
  
  // Восстанавливаем позицию скролла после навигации
  afterNavigate(() => {
    if (browser) {
      // Небольшая задержка для того, чтобы DOM успел обновиться
      setTimeout(() => {
        restoreScrollPosition();
      }, 0);
    }
  });
  
  // Загружаем данные при монтировании
  onMount(async () => {
    if (browser) {
      
      // Синхронизируем с URL параметрами (базовые настройки)
      const searchParams = new URLSearchParams($page.url.search);
      const skills = searchParams.get('skills')?.split(',').filter(Boolean) || [];
      if (skills.length > 0) {
        vacancyStore.setSkills(skills);
      }
      
      // Загружаем данные только если их нет или при необходимости обновления
      if (store.vacancies.length === 0) {
        vacancyStore.setLoading(true);
        
        try {
          // Используем сервисы вместо прямых fetch
          const vacancyResponse = await vacancyService.fetchVacanciesClient({
            page: 0,
            limit: PAGINATION.DEFAULT_PAGE_SIZE,
            skills: []
          });
          
          if (vacancyResponse.error) {
            vacancyStore.setError(vacancyResponse.error);
          } else {
            vacancyStore.setVacancies(
              vacancyResponse.vacancies.map(convertVacancy),
              vacancyResponse.total,
              vacancyResponse.totalPages,
              vacancyResponse.page
            );
          }
          
          // Загружаем навыки
          const skills = await vacancyService.fetchSkillsClient();
          availableSkills = skills;

          // Загружаем статистику навыков для пузырьков
          try {
            const stats = await vacancyService.fetchSkillsStatsClient();
            if (stats && stats.length > 0) {
              // Преобразуем данные в правильный формат
              const normalizedStats = stats.map(stat => ({
                name: stat.skill || (stat as any).name || (stat as any).skillName || 'unknown',
                count: stat.count || 0
              }));
              skillsStats = normalizedStats;
            } else {
              throw new Error("Пустой ответ от API статистики");
            }
          } catch (error) {

            // Используем fallback данные на основе availableSkills
            skillsStats = availableSkills.map(skill => ({
              name: skill,
              count: Math.floor(Math.random() * 100) + 20
            }));
          }
          
        } catch (error) {
          vacancyStore.setError('Ошибка загрузки данных');
        } finally {
          vacancyStore.setLoading(false);
        }
      } else {
        // данные уже загружены с сервера, но статистику навыков загружаем всегда
        try {
          const stats = await vacancyService.fetchSkillsStatsClient();
          if (stats && stats.length > 0) {
            // Преобразуем данные в правильный формат
            const normalizedStats = stats.map(stat => ({
              name: stat.skill || (stat as any).name || (stat as any).skillName || 'unknown',
              count: stat.count || 0
            }));
            skillsStats = normalizedStats;
            
            // Принудительно обновляем реактивные переменные
            setTimeout(() => {
              skillsStats = [...skillsStats];
            }, 100);
          }
        } catch (error) {
          // Ошибка загрузки статистики навыков
        }
      }

    }
  });

  // Фильтрация с сбросом виртуализации
  async function handleSkillsChange(skills: string[]) {
    vacancyStore.setSkills(skills);
    vacancyStore.setPageSize(PAGINATION.DEFAULT_PAGE_SIZE); // Сброс к начальному лимиту
    vacancyStore.setLoading(true);
    
    const response = await vacancyService.fetchVacanciesClient({
      page: 0,
      limit: PAGINATION.DEFAULT_PAGE_SIZE,
      skills
    });
    
    if (response.error) {
      vacancyStore.setVacancies([], 0, 0, 0);
      vacancyStore.setError(response.error);
    } else {
      vacancyStore.setVacancies(
        response.vacancies.map(convertVacancy),
        response.total,
        response.totalPages,
        response.page
      );
      vacancyStore.setError(null);
    }
    vacancyStore.setLoading(false);
  }

  // Сброс фильтра
  async function handleReset() {
    vacancyStore.setSkills([]);
    vacancyStore.reset(); // Это очистит localStorage и сбросит состояние
    vacancyStore.setLoading(true);
    
    const response = await vacancyService.fetchVacanciesClient({
      page: 0,
      limit: PAGINATION.DEFAULT_PAGE_SIZE,
      skills: []
    });
    
    if (response.error) {
      vacancyStore.setVacancies([], 0, 0, 0);
      vacancyStore.setError(response.error);
    } else {
      vacancyStore.setVacancies(
        response.vacancies.map(convertVacancy),
        response.total,
        response.totalPages,
        response.page
      );
      vacancyStore.setError(null);
    }
    vacancyStore.setLoading(false);
  }

  // Клик по тегу-навыку
  function handleSkillClick(event: CustomEvent<string>) {
    handleSkillsChange([event.detail]);
  }

  // Обработчик удаления вакансии
  async function handleVacancyDeleted(event: CustomEvent<{ vacancyId: string; title: string }>) {
    const { vacancyId, title } = event.detail;
    
    try {
      // Вызываем API удаления
      const result = await vacancyService.deleteVacancy(vacancyId);
      
      if (result.success) {
        // Toast уведомление об успешном удалении
        showNotification('success', `Вакансия удалена`, `"${title}" успешно удалена из базы данных`);
        
        // 1. АГРЕССИВНАЯ ОЧИСТКА ВСЕГО КЕША И ФИЛЬТРОВ
        vacancyStore.clearStoredState(); // Это теперь очищает и selectedSkills
        
        // Дополнительная очистка - убиваем ВСЕ связанное с jspulse в localStorage
        if (browser) {
          try {
            Object.keys(localStorage).forEach(key => {
              if (key.includes('jspulse') || key.includes('vacancy')) {
                localStorage.removeItem(key);
              }
            });
          } catch (e) {
          }
        }
        
        // 2. Сбрасываем текущее состояние и показываем loader
        vacancyStore.setLoading(true);
        vacancyStore.setError(null);
        
        // 3. Принудительно загружаем АКТУАЛЬНЫЕ данные с сервера
        const response = await vacancyService.fetchVacanciesClient({
          page: 0, // Сбрасываем на первую страницу
          limit: store.limit,
          skills: store.selectedSkills
        });
        
        if (!response.error) {
          // 4. Устанавливаем новые данные (это автоматически сохранит их в localStorage)
          vacancyStore.setVacancies(
            response.vacancies.map(convertVacancy),
            response.total,
            response.totalPages,
            response.page
          );

          // 5. ОБНОВЛЯЕМ СТАТИСТИКУ НАВЫКОВ для фильтров и баблов!
          try {
            const newSkills = await vacancyService.fetchSkillsClient();
            availableSkills = newSkills;

            const newStats = await vacancyService.fetchSkillsStatsClient();
            if (newStats && newStats.length > 0) {
              // Преобразуем данные в правильный формат
              const normalizedStats = newStats.map(stat => ({
                name: stat.skill || (stat as any).name || (stat as any).skillName || 'unknown',
                count: stat.count || 0
              }));
              skillsStats = normalizedStats;
            }
          } catch (error) {
          }
        } else {
          vacancyStore.setError(response.error);
        }
        
        vacancyStore.setLoading(false);
        
        // 6. Форсируем обновление реактивных данных
        setTimeout(() => {
          availableSkills = [...availableSkills];
          skillsStats = [...skillsStats];
        }, 100);
        
      } else {
        showNotification('error', 'Ошибка удаления', result.error || 'Не удалось удалить вакансию');
      }
    } catch (error) {
      vacancyStore.setLoading(false);
      showNotification('error', 'Ошибка удаления', 'Произошла ошибка при удалении вакансии');
    }
  }

  // Обработка клика по пузырю - сброс фильтров и применение одного навыка
  async function handleTagClick(event: CustomEvent<{ name: string; count: number }>) {
    const skillName = event.detail.name;
    
    // Проверяем, является ли этот навык единственным выбранным
    const currentSkills = store.selectedSkills;
    
    if (currentSkills.length === 1 && currentSkills[0] === skillName) {
      // Если уже выбран только этот навык, сбрасываем фильтры
      await handleSkillsChange([]);
    } else {
      // Иначе сбрасываем все фильтры и применяем только этот навык
      await handleSkillsChange([skillName]);
    }
    
    // Сразу скроллим без задержки
    scrollToResults();
    
    // Добавляем анимацию появления для обновленного списка
    setTimeout(() => {
      triggerFadeInAnimation(0); // Анимируем все элементы с начала
    }, ANIMATION.TIMING.DOM_RENDER_DELAY);
  }
  
  // Функция для скролла к результатам
  function scrollToResults() {
    // Сначала пробуем найти первую вакансию
    let targetElement = document.querySelector('.vacancy-card');
    
    // Если вакансий нет, скроллим к фильтрам
    if (!targetElement) {
      targetElement = document.querySelector('.filters');
    }
    
    // Если и фильтров нет, скроллим к основному контейнеру
    if (!targetElement) {
      targetElement = document.querySelector('main');
    }
    
    if (targetElement) {
      targetElement.scrollIntoView({ 
        behavior: 'instant', 
        block: 'start'
      });
    }
  }

  // Загрузка дополнительных элементов (показать еще)
  async function handleLoadMore() {
    if (store.loading) return;
    
    const currentCount = store.vacancies.length;
    const currentLimit = store.limit;
    const isOffsetMode = currentLimit >= 100 && store.total > 100;
    
    vacancyStore.setLoading(true);
    
    try {
      if (isOffsetMode) {
        // Offset-режим: простая пагинация
        const nextPage = Math.floor(store.vacancies.length / 50);
        
        const response = await vacancyService.fetchVacanciesClient({
          page: nextPage,
          limit: 50, // Загружаем следующие 50 элементов
          skills: store.selectedSkills
        });

        if (response.error) {
          vacancyStore.setError(response.error);
        } else {
          const newVacancies = response.vacancies.map(convertVacancy);
          
          // Добавляем новые вакансии к существующим (append режим)
          vacancyStore.appendVacancies(newVacancies, response.total, response.totalPages, nextPage);
          vacancyStore.setError(null);
          
          // Плавный скролл к новому контенту
          setTimeout(() => {
            const currentVacanciesCount = document.querySelectorAll('.vacancy-card').length;
            const firstNewElementIndex = currentVacanciesCount - newVacancies.length + 1;
            const firstNewElement = document.querySelector('.vacancy-card:nth-child(' + firstNewElementIndex + ')');
            if (firstNewElement) {
              firstNewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, ANIMATION.TIMING.DOM_RENDER_DELAY);
        }
      } else {
        // Прогрессивный режим: увеличиваем лимит (накопительно)
        let additionalItems: number = PAGINATION.INCREMENTS.SMALL;
        
        if (currentLimit === PAGINATION.PROGRESSIVE_STEPS.STEP_1) {
          additionalItems = PAGINATION.INCREMENTS.SMALL; // 10 -> 20
        } else if (currentLimit === PAGINATION.PROGRESSIVE_STEPS.STEP_2) {
          additionalItems = PAGINATION.INCREMENTS.SMALL; // 20 -> 30  
        } else if (currentLimit === PAGINATION.PROGRESSIVE_STEPS.STEP_3) {
          additionalItems = PAGINATION.INCREMENTS.MEDIUM; // 30 -> 50
        } else if (currentLimit === PAGINATION.PROGRESSIVE_STEPS.STEP_4) {
          additionalItems = PAGINATION.INCREMENTS.LARGE; // 50 -> 100
        }
        
        const newLimit = currentLimit + additionalItems;
        
        // Загружаем все элементы с новым лимитом
        const response = await vacancyService.fetchVacanciesClient({
          page: 0,
          limit: newLimit,
          skills: store.selectedSkills
        });

        if (response.error) {
          vacancyStore.setError(response.error);
        } else {
          const allVacancies = response.vacancies.map(convertVacancy);
          
          // Обновляем лимит в store
          vacancyStore.setPageSize(newLimit);
          
          // В прогрессивном режиме заменяем все данные
          vacancyStore.setVacancies(allVacancies, response.total, response.totalPages, 0);
          vacancyStore.setError(null);
          
          // Анимация для новых элементов
          setTimeout(() => {
            triggerFadeInAnimation(currentCount);
            
            // Скроллим к первому новому элементу
            setTimeout(() => {
              scrollToFirstNewElement(currentCount);
            }, ANIMATION.TIMING.SCROLL_DELAY);
          }, ANIMATION.TIMING.DOM_RENDER_DELAY);
        }
      }
    } catch (error) {
      vacancyStore.setError('Ошибка при загрузке дополнительных вакансий');
    } finally {
      vacancyStore.setLoading(false);
    }
  }

  // Загрузка всех оставшихся элементов (показать все)
  async function handleLoadAll() {
    if (store.loading) return;
    
    const currentCount = store.vacancies.length;
    
    vacancyStore.setLoading(true);
    
    try {
      // Загружаем все элементы
      const response = await vacancyService.fetchVacanciesClient({
        page: 0,
        limit: store.total, // Загружаем все элементы
        skills: store.selectedSkills
      });

      if (response.error) {
        vacancyStore.setError(response.error);
      } else {
        const allVacancies = response.vacancies.map(convertVacancy);
        
        // Обновляем лимит в store
        vacancyStore.setPageSize(store.total);
        
        // В режиме "показать все" заменяем все данные полным набором
        vacancyStore.setVacancies(allVacancies, response.total, response.totalPages, 0);
        vacancyStore.setError(null);
        
        // Анимация для новых элементов
        setTimeout(() => {
          triggerFadeInAnimation(currentCount);
          
          // Скроллим к первому новому элементу
          setTimeout(() => {
            scrollToFirstNewElement(currentCount);
          }, ANIMATION.TIMING.SCROLL_DELAY);
        }, ANIMATION.TIMING.DOM_RENDER_DELAY);
      }
    } catch (error) {
      vacancyStore.setError('Ошибка при загрузке всех вакансий');
    } finally {
      vacancyStore.setLoading(false);
    }
  }

  // Функция для анимации появления новых элементов
  function triggerFadeInAnimation(startIndex: number) {
    const vacancyElements = document.querySelectorAll('.vacancy-card');
    
    vacancyElements.forEach((element, index) => {
      if (index >= startIndex) {
        element.classList.add('fade-in-new');
        // Удаляем класс после завершения анимации
        setTimeout(() => {
          element.classList.remove('fade-in-new');
        }, ANIMATION.FADE_IN_DURATION_MS);
      }
    });
  }

  // Функция для скролла к первому новому элементу в середину экрана
  function scrollToFirstNewElement(startIndex: number) {
    const vacancyElements = document.querySelectorAll('.vacancy-card');
    const firstNewElement = vacancyElements[startIndex];
    
    if (firstNewElement) {
      const elementTop = firstNewElement.getBoundingClientRect().top + window.scrollY;
      const screenHeight = window.innerHeight;
      const targetScrollPosition = elementTop - (screenHeight / 2);
      
      window.scrollTo({
        top: Math.max(0, targetScrollPosition),
        behavior: 'smooth'
      });
    }
  }
</script>

<svelte:head>
  <title>JS Пульс - вакансии по фронтенду</title>
</svelte:head>


<!-- Визуализация тегов во всю ширину -->
{#if browser && skillsStats.length > 0}
  <TagBubblesCanvas
    tags={tagsForBubbles}
    on:tagClick={(e) => handleTagClick(e)}
  />

{/if}

<Filters {availableSkills} selectedSkills={store.selectedSkills} totalVacancies={store.total} on:change={e => handleSkillsChange(e.detail)} on:reset={handleReset} />

{#if store.loading && store.vacancies.length === 0}
  <LoadingIndicator text="Применение фильтров..." />
{/if}

<ErrorMessage message={store.error} />

<VacancyList 
  vacancies={store.vacancies} 
  loadingFilter={store.loading && store.vacancies.length === 0} 
  loadingMore={store.loading && store.vacancies.length > 0}
  clientError={store.error} 
  on:skillClick={handleSkillClick} 
  on:vacancyDeleted={handleVacancyDeleted}
/>

<!-- Пагинация только снизу -->
<SimplePagination
  currentPageSize={store.limit}
  totalItems={store.total}
  showingItems={store.vacancies.length}
  loading={store.loading}
  on:loadMore={handleLoadMore}
  on:loadAll={handleLoadAll}
/>

<!-- Toast уведомления -->
<ToastNotifications />

<style>
  :root {
    --animation-duration: 1.2s;
    --animation-easing: ease-out;
  }

  /* Анимация появления новых элементов с оранжевым фоном */
  :global(.fade-in-new) {
    animation: fadeInOrangeSlide var(--animation-duration, 1.2s) var(--animation-easing, ease-out);
  }

  @keyframes fadeInOrangeSlide {
    0% {
      opacity: 0;
      background-color: theme('colors.warning.500');
      transform: translateY(30px) scale(0.95);
      border-color: theme('colors.warning.500');
    }
    30% {
      opacity: 0.8;
      background-color: theme('colors.warning.300');
      transform: translateY(15px) scale(0.98);
      border-color: theme('colors.warning.300');
    }
    70% {
      opacity: 1;
      background-color: theme('colors.warning.50');
      transform: translateY(5px) scale(1);
      border-color: theme('colors.warning.200');
    }
    100% {
      opacity: 1;
      background-color: white;
      transform: translateY(0) scale(1);
      border-color: theme('colors.neutral.200');
    }
  }

  /* Предотвращение layout shift при загрузке */
  :global(.vacancy-card) {
    @apply transition-all duration-300;
  }
</style>
