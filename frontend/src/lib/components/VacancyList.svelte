<script lang="ts">
  import type { VacancyWithHtml } from "@jspulse/shared";
  import VacancyCard from "$lib/components/VacancyCard/VacancyCard.svelte";
  import MagnifyingGlass from 'svelte-heros-v2/MagnifyingGlass.svelte';
  import { createEventDispatcher } from 'svelte';
  import { theme } from '$lib/stores/themeStore';

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
      <ul class="vacancy-list" class:loading-more={loadingMore}>
        {#each vacancies as vacancy, index (vacancy._id)}
          <li class="vacancy-item">
            <VacancyCard 
              {vacancy} 
              showDetailLink={true} 
              theme={$theme}
              on:skillClick={handleSkillClick} 
            />
          </li>
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

  .vacancy-list {
    @apply align-baseline;
    @apply list-none p-0 m-0;
    @apply space-y-8; /* Увеличенные отступы между карточками на мобильных */
  }
  
  /* Двухколоночная сетка на широких экранах (xl и выше) */
  @media (min-width: 1280px) {
    .vacancy-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem; /* Увеличенный gap */
      margin: 0;
      padding: 0;
      list-style: none;
    }
    
    .vacancy-list > * + * {
      margin-top: 0; /* Убираем space-y-8 */
    }
  }
  
  /* На очень широких экранах еще больше увеличиваем gap */
  @media (min-width: 1536px) {
    .vacancy-list {
      gap: 2.5rem; /* gap-10 */
    }
  }

  .vacancy-list.loading-more {
    @apply opacity-80;
  }

  .vacancy-item {
    @apply w-full;
  }
  
  /* Обеспечиваем равную высоту карточек в сетке */
  @media (min-width: 1280px) {
    .vacancy-item {
      display: flex;
    }
    
    .vacancy-item :global(.vacancy-card) {
      flex: 1;
    }
  }

  .no-vacancies {
    @apply text-center text-neutral-500 mt-8 flex flex-col items-center gap-4;
  }
</style>
