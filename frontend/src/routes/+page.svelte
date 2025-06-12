<script lang="ts">
  import type { VacancyDTO, VacancyWithHtml } from "@jspulse/shared";
  import type { PageData } from "./$types";
  import Filters from "$lib/components/Filters.svelte";
  import VacancyList from "$lib/components/VacancyList.svelte";
  import SimplePagination from "$lib/components/SimplePagination.svelte";
  import LoadingIndicator from "$lib/components/LoadingIndicator.svelte";
  import ErrorMessage from "$lib/components/ErrorMessage.svelte";
  import { vacancyService } from "$lib/services/vacancy.service";
  import { vacancyStore } from "$lib/stores/vacancyStore";
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';

  export let data: PageData;

  function convertVacancy(v: any): VacancyWithHtml {
    return {
      ...v,
      htmlDescription: v.htmlDescription === null ? undefined : v.htmlDescription
    };
  }

  // Проверяем есть ли данные с сервера, иначе инициализируем пустыми
  if (data.initialVacancies && data.initialVacancies.length > 0) {
    vacancyStore.setVacancies(
      data.initialVacancies.map(convertVacancy),
      data.totalCount || 0,
      data.totalPages || 0,
      data.page || 0
    );
  }

  let availableSkills: string[] = data.availableSkills || [];

  // Подписка на store
  $: store = $vacancyStore;

  // Reactive переменные для UI
  $: isMobile = browser && window.innerWidth < 768;
  
  // Загружаем данные и настройки при монтировании
  onMount(async () => {
    if (browser) {
      vacancyStore.loadPaginationSettings();
      
      // Синхронизируем с URL параметрами (базовые настройки)
      const searchParams = new URLSearchParams($page.url.search);
      const skills = searchParams.get('skills')?.split(',').filter(Boolean) || [];
      if (skills.length > 0) {
        vacancyStore.setSkills(skills);
      }
      
      // Если нет данных с сервера, загружаем через сервисы
      if (store.vacancies.length === 0) {
        console.log("[CLIENT] Загружаем данные через сервисы...");
        vacancyStore.setLoading(true);
        
        try {
          // Используем сервисы вместо прямых fetch
          const vacancyResponse = await vacancyService.fetchVacanciesClient({
            page: 0,
            limit: 10,
            skills: []
          });
          
          if (vacancyResponse.error) {
            console.error("[CLIENT] Ошибка загрузки вакансий:", vacancyResponse.error);
            vacancyStore.setError(vacancyResponse.error);
          } else {
            console.log("[CLIENT] Получено", vacancyResponse.vacancies.length, "вакансий");
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
          console.log("[CLIENT] Получено", skills.length, "навыков");
          
        } catch (error) {
          console.error("[CLIENT] Ошибка загрузки данных:", error);
          vacancyStore.setError('Ошибка загрузки данных');
        } finally {
          vacancyStore.setLoading(false);
        }
      }

    }
  });

  // Фильтрация
  async function handleSkillsChange(skills: string[]) {
    vacancyStore.setSkills(skills);
    // Сбрасываем пагинацию при изменении фильтров
    vacancyStore.setPageSize(10);
    vacancyStore.setLoading(true);
    
    const response = await vacancyService.fetchVacanciesClient({
      page: 0,
      limit: 10, // Сброс к начальному лимиту
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
    // Сбрасываем пагинацию к начальному состоянию
    vacancyStore.reset();
    vacancyStore.setLoading(true);
    
    const response = await vacancyService.fetchVacanciesClient({
      page: 0,
      limit: 10, // Сброс к начальному лимиту
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

  // Загрузка дополнительных элементов (показать еще)
  async function handleLoadMore() {
    if (store.loading) return;
    
    // Запоминаем текущее количество элементов и позицию кнопки
    const currentCount = store.vacancies.length;
    const loadMoreButton = document.querySelector('.simple-pagination .load-more-btn');
    const buttonPosition = loadMoreButton ? loadMoreButton.getBoundingClientRect().top + window.scrollY : null;
    
    vacancyStore.setLoading(true);
    
    // Вычисляем количество новых элементов для загрузки
    const currentLimit = store.limit;
    let additionalItems = 10; // По умолчанию добавляем 10
    
    if (currentLimit === 10) additionalItems = 10; // 10 -> 20
    else if (currentLimit === 20) additionalItems = 10; // 20 -> 30  
    else if (currentLimit === 30) additionalItems = 20; // 30 -> 50
    else if (currentLimit === 50) additionalItems = 50; // 50 -> 100
    else additionalItems = 50; // 100+ -> +50
    
    const newLimit = currentLimit + additionalItems;
    
    try {
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
        // Берем только новые элементы (с текущего количества)
        const newVacancies = allVacancies.slice(currentCount);
        
        // Обновляем лимит в store
        vacancyStore.setPageSize(newLimit);
        
        // Добавляем новые элементы к существующим
        vacancyStore.appendVacancies(
          newVacancies,
          response.total,
          Math.ceil(response.total / newLimit), // Пересчитываем totalPages
          0
        );
        vacancyStore.setError(null);
        
        // Запускаем анимацию появления для новых элементов после рендеринга
        setTimeout(() => {
          triggerFadeInAnimation(currentCount);
          
          // Скроллим к первому новому элементу в середину экрана с небольшой задержкой
          setTimeout(() => {
            scrollToFirstNewElement(currentCount);
          }, 100);
        }, 50);
        
        // Сохраняем настройки
        vacancyStore.savePaginationSettings();
      }
    } catch (error) {
      vacancyStore.setError('Ошибка при загрузке дополнительных вакансий');
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
        }, 1200);
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

<main>
  <Filters {availableSkills} selectedSkills={store.selectedSkills} on:change={e => handleSkillsChange(e.detail)} on:reset={handleReset} />

  {#if store.loading && store.vacancies.length === 0}
    <LoadingIndicator text="Применение фильтров..." />
  {/if}

  <ErrorMessage message={store.error} />

  <VacancyList 
    vacancies={store.vacancies} 
    totalVacancies={store.total} 
    loadingFilter={store.loading && store.vacancies.length === 0} 
    loadingMore={store.loading && store.vacancies.length > 0}
    clientError={store.error} 
    on:skillClick={handleSkillClick} 
  />

  <!-- Пагинация только снизу -->
  <SimplePagination
    currentPageSize={store.limit}
    totalItems={store.total}
    showingItems={store.vacancies.length}
    loading={store.loading}
    on:loadMore={handleLoadMore}
  />
</main>

<style>
  main {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1rem;
  }

  /* Анимация появления новых элементов с оранжевым фоном */
  :global(.fade-in-new) {
    animation: fadeInOrangeSlide 1.2s ease-out;
  }

  @keyframes fadeInOrangeSlide {
    0% {
      opacity: 0;
      background-color: #ff8c00;
      transform: translateY(30px) scale(0.95);
      border-color: #ff8c00;
    }
    30% {
      opacity: 0.8;
      background-color: #ffb347;
      transform: translateY(15px) scale(0.98);
      border-color: #ffb347;
    }
    70% {
      opacity: 1;
      background-color: #fff5ee;
      transform: translateY(5px) scale(1);
      border-color: #ffd4c4;
    }
    100% {
      opacity: 1;
      background-color: white;
      transform: translateY(0) scale(1);
      border-color: #eee;
    }
  }

  /* Предотвращение layout shift при загрузке */
  :global(.vacancy-card) {
    transition: all 0.3s ease;
  }
</style>
