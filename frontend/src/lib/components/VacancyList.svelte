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
    margin-top: 1rem;
    transition: opacity 0.3s ease-in-out;
  }
  .vacancies.loading {
    opacity: 0.5;
    pointer-events: none;
  }

  ul.loading-more {
    opacity: 0.8;
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
