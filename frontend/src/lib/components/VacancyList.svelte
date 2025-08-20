<script lang="ts">
  // 🔥 HOT RELOAD TEST - DELETE BUTTONS ENABLED
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
    vacancyDeleted: { vacancyId: string; title: string };
  }>();

  $: showNoVacanciesMessage = !loadingFilter && !clientError && vacancies && vacancies.length === 0;
  $: showVacancyList = !loadingFilter && vacancies && vacancies.length > 0;

  // Вспомогательная функция для получения ID вакансии
  function getVacancyId(vacancy: VacancyWithHtml): string {
    return (vacancy as any).id || vacancy._id || '';
  }

  function handleSkillClick(event: CustomEvent<string>) {
    dispatch('skillClick', event.detail);
  }

  let deletingVacancyId: string | null = null;
  
  function handleVacancyDeleted(event: CustomEvent<{ vacancyId: string; title: string }>) {
    const { vacancyId, title } = event.detail;
    
    // Устанавливаем состояние удаления
    deletingVacancyId = vacancyId;
    
    // Задержка для анимации
    setTimeout(() => {
      vacancies = vacancies.filter(v => getVacancyId(v) !== vacancyId);
      deletingVacancyId = null;
      
      dispatch('vacancyDeleted', { vacancyId, title });
    }, 200);
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
        {#each vacancies as vacancy, index (getVacancyId(vacancy) || `vacancy-${index}`)}
          <li class="vacancy-item">
            <VacancyCard 
              {vacancy} 
              showDeleteButton={true}
              isDeleting={deletingVacancyId === getVacancyId(vacancy)}
              theme={$theme}
              on:skillClick={handleSkillClick}
              on:deleted={handleVacancyDeleted}
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
    @apply align-baseline items-baseline;
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
