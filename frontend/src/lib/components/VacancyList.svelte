<script lang="ts">
  import type { VacancyWithHtml } from "@jspulse/shared";
  import VacancyCard from "$lib/components/VacancyCard.svelte";
  import MagnifyingGlass from 'svelte-heros-v2/MagnifyingGlass.svelte';
  import { createEventDispatcher } from 'svelte';

  export let vacancies: VacancyWithHtml[] = [];
  export let loadingFilter: boolean = false;
  export let clientError: string | null = null;
  export let loadingMore: boolean = false;

  const dispatch = createEventDispatcher<{
    skillClick: string;
  }>();

  $: showNoVacanciesMessage = !loadingFilter && !clientError && vacancies && vacancies.length === 0;
  $: showVacancyList = !loadingFilter && vacancies && vacancies.length > 0;

  function handleSkillClick(event: CustomEvent<string>) {
    dispatch('skillClick', event.detail);
  }
</script>

<div class="vacancies" class:loading={loadingFilter}>
  {#if !loadingFilter}
    {#if showNoVacanciesMessage}
      <p class="no-vacancies">
        <MagnifyingGlass size="36" />
        Вакансий по выбранным фильтрам не найдено
      </p>
    {:else if showVacancyList}
      <ul class:loading-more={loadingMore}>
        {#each vacancies as vacancy (vacancy._id)}
          <VacancyCard {vacancy} on:skillClick={handleSkillClick} />
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .vacancies {
    @apply mt-4 transition-opacity duration-300;
  }
  .vacancies.loading {
    @apply opacity-50 pointer-events-none;
  }

  ul.loading-more {
    @apply opacity-80;
  }

  .no-vacancies {
    @apply text-center text-neutral-500 mt-8 flex flex-col items-center gap-4;
  }

  ul {
    @apply list-none p-0;
  }
  /* Стили для li перенесены в VacancyCard.svelte */
</style>
