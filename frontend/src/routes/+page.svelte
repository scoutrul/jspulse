<script lang="ts">
  import type { VacancyDTO } from "@jspulse/shared";
  import type { PageData } from "./$types";
  import Filters from "$lib/components/Filters.svelte";
  import VacancyList from "$lib/components/VacancyList.svelte";
  import LoadMoreButton from "$lib/components/LoadMoreButton.svelte";
  import LoadingIndicator from "$lib/components/LoadingIndicator.svelte";
  import ErrorMessage from "$lib/components/ErrorMessage.svelte";
  import { fetchVacanciesClient } from "$lib/services/vacancy.service";

  export let data: PageData;

  let displayedVacancies: (VacancyDTO & { htmlDescription?: string })[] =
    data.initialVacancies || [];
  let totalVacancies: number = data.totalCount || 0;
  let currentPage: number = data.page ?? 0;
  let totalPages: number = data.totalPages ?? 0;
  let limit: number = data.limit ?? 10;

  let availableSkills: string[] = data.availableSkills || [];
  let selectedSkills: string[] = [];

  let loadingMore = false;
  let loadingFilter = false;
  let clientError: string | null = data.error || null;

  const loadMoreVacancies = async () => {
    if (loadingMore || currentPage + 1 >= totalPages) return;
    loadingMore = true;
    
    const nextPage = currentPage + 1;
    const response = await fetchVacanciesClient({
      page: nextPage,
      limit,
      skills: selectedSkills
    });
    
    if (response.error) {
      clientError = response.error;
    } else {
      displayedVacancies = [...displayedVacancies, ...response.vacancies];
      currentPage = nextPage;
      totalVacancies = response.total;
      totalPages = response.totalPages;
      clientError = null;
    }
    
    loadingMore = false;
  };

  // Реактивный блок для перезагрузки при изменении фильтров
  $: {
    if (selectedSkills) {
      console.log("[+page.svelte] Фильтры изменились, перезагрузка:", selectedSkills);
      loadingFilter = true;
      displayedVacancies = [];
      currentPage = -1; // Сброс на первую страницу
      
      // Небольшая задержка для обновления UI перед запросом
      setTimeout(async () => {
        const response = await fetchVacanciesClient({
          page: 0,
          limit,
          skills: selectedSkills
        });
        
        if (response.error) {
          clientError = response.error;
          displayedVacancies = [];
        } else {
          displayedVacancies = response.vacancies;
          currentPage = response.page;
          totalVacancies = response.total;
          totalPages = response.totalPages;
          clientError = null;
        }
        
        loadingFilter = false;
      }, 0);
    }
  }
</script>

<svelte:head>
  <title>JS Пульс - вакансии по фронтенду</title>
</svelte:head>

<main>
  <Filters bind:selectedSkills {availableSkills} />

  {#if loadingFilter}
    <LoadingIndicator text="Применение фильтров..." />
  {/if}

  <ErrorMessage message={clientError} />

  <VacancyList vacancies={displayedVacancies} {totalVacancies} {loadingFilter} {clientError} />

  {#if !loadingFilter && currentPage + 1 < totalPages}
    <LoadMoreButton
      loading={loadingMore}
      disabled={loadingMore}
      {limit}
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
