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
  import { get } from 'svelte/store';

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

  let selectedSkills: string[] = [];
  let displayedVacancies: VacancyWithHtml[] = (data.initialVacancies || []).map(convertVacancy);
  let totalVacancies: number = data.totalCount || 0;
  let currentPage: number = data.page ?? 0;
  let totalPages: number = data.totalPages ?? 0;
  let loading = false;
  let clientError: string | null = data.error || null;

  // Фильтрация
  async function handleSkillsChange(skills: string[]) {
    selectedSkills = skills;
    loading = true;
    const response = await vacancyService.fetchVacanciesClient({
      page: 0,
      limit: store.limit,
      skills: selectedSkills
    });
    if (response.error) {
      displayedVacancies = [];
      totalVacancies = 0;
      totalPages = 0;
      currentPage = 0;
      clientError = response.error;
    } else {
      displayedVacancies = response.vacancies.map(convertVacancy);
      totalVacancies = response.total;
      totalPages = response.totalPages;
      currentPage = response.page;
      clientError = null;
    }
    loading = false;
  }

  // Сброс фильтра
  async function handleReset() {
    selectedSkills = [];
    loading = true;
    const response = await vacancyService.fetchVacanciesClient({
      page: 0,
      limit: store.limit,
      skills: []
    });
    if (response.error) {
      displayedVacancies = [];
      totalVacancies = 0;
      totalPages = 0;
      currentPage = 0;
      clientError = response.error;
    } else {
      displayedVacancies = response.vacancies.map(convertVacancy);
      totalVacancies = response.total;
      totalPages = response.totalPages;
      currentPage = response.page;
      clientError = null;
    }
    loading = false;
  }

  // Клик по тегу-навыку
  function handleSkillClick(event: CustomEvent<string>) {
    handleSkillsChange([event.detail]);
  }

  // Пагинация
  async function loadMoreVacancies() {
    if (loading || currentPage + 1 >= totalPages) return;
    loading = true;
    const nextPage = currentPage + 1;
    const response = await vacancyService.fetchVacanciesClient({
      page: nextPage,
      limit: store.limit,
      skills: selectedSkills
    });
    if (response.error) {
      clientError = response.error;
    } else {
      displayedVacancies = [...displayedVacancies, ...response.vacancies.map(convertVacancy)];
      currentPage = nextPage;
      totalVacancies = response.total;
      totalPages = response.totalPages;
      clientError = null;
    }
    loading = false;
  }
</script>

<svelte:head>
  <title>JS Пульс - вакансии по фронтенду</title>
</svelte:head>

<main>
  <Filters {availableSkills} {selectedSkills} on:change={e => handleSkillsChange(e.detail)} on:reset={handleReset} />

  {#if loading}
    <LoadingIndicator text="Применение фильтров..." />
  {/if}

  <ErrorMessage message={clientError} />

  <VacancyList {displayedVacancies} totalVacancies={totalVacancies} loadingFilter={loading} clientError={clientError} on:skillClick={handleSkillClick} />

  {#if !loading && currentPage + 1 < totalPages}
    <LoadMoreButton
      loading={loading}
      disabled={loading}
      {store.limit}
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
