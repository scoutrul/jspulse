<script lang="ts">
  import type { VacancyDTO, VacancyWithHtml } from "@jspulse/shared";
  import VacancyCard from "$lib/components/VacancyCard.svelte";
  import Briefcase from 'svelte-heros-v2/Briefcase.svelte';
  import MagnifyingGlass from 'svelte-heros-v2/MagnifyingGlass.svelte';

  export let vacancies: VacancyWithHtml[] = [];
  export let totalVacancies: number = 0;
  export let loadingFilter: boolean = false;
  export let clientError: string | null = null;

  $: vacanciesCountText = (() => {
    const count = vacancies?.length ?? 0;
    if (count === 1) return "вакансия найдена";
    if (count >= 2 && count <= 4) return "вакансии найдено";
    return "вакансий найдено";
  })();

  $: showNoVacanciesMessage = !loadingFilter && !clientError && vacancies && vacancies.length === 0;
  $: showVacancyList = !loadingFilter && vacancies && vacancies.length > 0;
</script>

<div class="vacancies" class:loading={loadingFilter}>
  {#if !loadingFilter}
    <h2>
      <Briefcase size="24" />
      {vacancies?.length ?? 0}
      {vacanciesCountText} (из {totalVacancies} всего)
    </h2>

    {#if showNoVacanciesMessage}
      <p class="no-vacancies">
        <MagnifyingGlass size="36" />
        Вакансий по выбранным фильтрам не найдено
      </p>
    {:else if showVacancyList}
      <ul>
        {#each vacancies as vacancy (vacancy._id)}
          <VacancyCard {vacancy} />
        {/each}
      </ul>
    {/if}
    <!-- Кнопка LoadMore будет добавлена позже как отдельный компонент или слот -->
  {/if}
</div>

<style>
  .vacancies {
    margin-top: 1rem;
    transition: opacity 0.3s ease-in-out;
  }
  .vacancies.loading {
    opacity: 0.5;
    pointer-events: none;
  }

  .vacancies h2 {
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
    margin-bottom: 1.5rem;
    font-size: 1.4rem;
    color: #333;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .no-vacancies {
    text-align: center;
    color: #777;
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  ul {
    list-style: none;
    padding: 0;
  }
  /* Стили для li перенесены в VacancyCard.svelte */
</style>
