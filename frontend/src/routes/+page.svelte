<script lang="ts">
  import type { VacancyDTO, VacancyWithHtml } from "@jspulse/shared";
  import type { PageData } from "./$types";
  import Filters from "$lib/components/Filters.svelte";
  import VacancyList from "$lib/components/VacancyList.svelte";
  import LoadMoreButton from "$lib/components/LoadMoreButton.svelte";
  import LoadingIndicator from "$lib/components/LoadingIndicator.svelte";
  import ErrorMessage from "$lib/components/ErrorMessage.svelte";
  import { vacancyService } from "$lib/services/vacancy.service";
  import { vacancyStore } from "$lib/stores/vacancyStore";

  export let data: PageData;

  function convertVacancy(v: any): VacancyWithHtml {
    return {
      ...v,
      htmlDescription: v.htmlDescription === null ? undefined : v.htmlDescription
    };
  }

  // Инициализация store начальными данными
  vacancyStore.init({
    vacancies: (data.initialVacancies || []).map(convertVacancy),
    total: data.totalCount || 0,
    page: data.page ?? 0,
    totalPages: data.totalPages ?? 0,
    limit: data.limit ?? 10,
    selectedSkills: [],
    loading: false,
    error: data.error || null
  });

  let availableSkills: string[] = data.availableSkills || [];

  // Подписка на store
  $: store = $vacancyStore;

  // Фильтрация
  async function handleSkillsChange(skills: string[]) {
    vacancyStore.setSkills(skills);
    vacancyStore.setLoading(true);
    const response = await vacancyService.fetchVacanciesClient({
      page: 0,
      limit: store.limit,
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
    vacancyStore.setLoading(true);
    const response = await vacancyService.fetchVacanciesClient({
      page: 0,
      limit: store.limit,
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

  // Пагинация
  async function loadMoreVacancies() {
    if (store.loading || store.page + 1 >= store.totalPages) return;
    
    vacancyStore.setLoading(true);
    const nextPage = store.page + 1;
    
    console.log(`Загружаем дополнительные вакансии: страница ${nextPage}, текущая страница ${store.page}, limit=${store.limit}`);
    
    try {
      // Прямой запрос к API с обходом клиента
      const url = `http://localhost:3001/api/vacancies?page=${nextPage}&limit=${store.limit}${store.selectedSkills.length ? '&skills=' + store.selectedSkills.join(',') : ''}`;
      console.log('Прямой запрос к URL:', url);
      
      const fetchResponse = await fetch(url);
      const response = await fetchResponse.json();
      
      console.log('Ответ API при пагинации:', response);
      
      if (!response.success) {
        vacancyStore.setError('Ошибка при получении данных');
      } else if (response.data && response.data.length > 0) {
        const newVacancies = response.data.map(convertVacancy);
        vacancyStore.appendVacancies(
          newVacancies,
          response.meta.totalItems,
          response.meta.totalPages,
          response.meta.page
        );
        vacancyStore.setError(null);
      } else {
        console.warn('Получен пустой список вакансий при пагинации');
        vacancyStore.setError('Не удалось загрузить дополнительные вакансии');
      }
    } catch (err) {
      console.error('Ошибка при загрузке дополнительных вакансий:', err);
      vacancyStore.setError('Не удалось загрузить дополнительные вакансии');
    } finally {
      vacancyStore.setLoading(false);
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

  {#if !store.loading && store.page + 1 < store.totalPages}
    <LoadMoreButton
      loading={store.loading}
      disabled={store.loading}
      limit={store.limit}
      on:click={loadMoreVacancies}
    />
  {/if}
</main>

<style>
  main {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1rem;
  }
</style>
