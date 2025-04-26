<script lang="ts">
  // @ts-ignore // eslint-disable-line @typescript-eslint/ban-ts-comment
  // TODO: Уточнить, нужен ли ts-ignore после всех рефакторингов типов
  import type { PaginatedVacanciesResponse, VacancyDTO } from "@jspulse/shared";
  import { apiClient, KyHTTPError } from "../api/http.client";
  import type { PageData } from "./$types";
  import Filters from "$lib/components/Filters.svelte";
  import VacancyList from "$lib/components/VacancyList.svelte";
  import LoadMoreButton from "$lib/components/LoadMoreButton.svelte";
  import LoadingIndicator from "$lib/components/LoadingIndicator.svelte";
  import ErrorMessage from "$lib/components/ErrorMessage.svelte";
  import VacancyCard from "$lib/components/VacancyCard.svelte"; // Этот импорт нужен VacancyList

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

  const fetchVacancies = async (
    pageToLoad: number,
    skillsToLoad: string[]
  ): Promise<PaginatedVacanciesResponse["data"] | null> => {
    clientError = null;
    const searchParams = {
      limit: String(limit),
      page: String(pageToLoad),
      skills: skillsToLoad.join(","),
    };

    try {
      const response = await apiClient
        .get("api/vacancies", { searchParams })
        .json<PaginatedVacanciesResponse>();

      if (response.status === "OK" && response.data) {
        const vacanciesWithDates = response.data.items.map((vacancy: VacancyDTO) => ({
          ...vacancy,
          publishedAt: new Date(vacancy.publishedAt),
          htmlDescription: vacancy.description,
        }));
        totalVacancies = response.data.total;
        totalPages = response.data.totalPages;
        return { ...response.data, items: vacanciesWithDates };
      } else {
        console.error("Client-side API Error (Non-OK status or no data):", response);
        clientError = `Ошибка API: ${response.message || "Не удалось получить данные"}`;
        return null;
      }
    } catch (err) {
      console.error("Client-side API Error:", err);
      if (err instanceof KyHTTPError) {
        clientError = `Ошибка сети или сервера: ${err.message}`;
        try {
          const errorBody = await err.response.json();
          if (errorBody?.message) clientError += ` (${errorBody.message})`;
        } catch {
          /* ignore */
        }
      } else if (err instanceof Error) {
        clientError = "Ошибка загрузки вакансий: " + err.message;
      } else {
        clientError = "Произошла неизвестная ошибка при загрузке вакансий.";
      }
      return null;
    }
  };

  const loadMoreVacancies = async () => {
    if (loadingMore || currentPage + 1 >= totalPages) return;
    loadingMore = true;
    const nextPage = currentPage + 1;
    const responseData = await fetchVacancies(nextPage, selectedSkills);
    if (responseData) {
      displayedVacancies = [...displayedVacancies, ...responseData.items];
      currentPage = nextPage;
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
      setTimeout(() => {
        loadMoreVacancies().finally(() => {
          loadingFilter = false;
        });
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
