<script lang="ts">
  import { AdjustmentsHorizontal, Tag, ChevronDown, ChevronUp } from 'svelte-heros-v2';
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';
  import GradientButton from './ui/GradientButton.svelte';
  
  export let availableSkills: string[] = [];
  export let selectedSkills: string[] = [];
  export let totalVacancies: number = 0;
  
  // Состояние коллапса (по умолчанию скрыт)
  let isExpanded: boolean = false;
  
  const dispatch = createEventDispatcher<{
    change: string[];
    reset: void;
  }>();

  function handleChange(skill: string) {
    let newSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill];
    dispatch('change', newSkills);
  }
  
  function handleReset() {
    dispatch('reset');
  }
  
  function toggleExpanded() {
    isExpanded = !isExpanded;
  }
</script>

<section class="filters">
  <div class="filters-header">
    <button class="filters-toggle" on:click={toggleExpanded} aria-expanded={isExpanded}>
      <h2>
        <AdjustmentsHorizontal size="20" />
        Фильтр по навыкам ({availableSkills?.length ?? 0})
        {#if selectedSkills.length > 0}
          <span class="selected-count">({selectedSkills.length})</span>
        {/if}
      </h2>
      <span class="toggle-icon">
        {#if isExpanded}
          <ChevronUp size="20" />
        {:else}
          <ChevronDown size="20" />
        {/if}
      </span>
    </button>
    {#if totalVacancies > 0}
      <div class="results-legend">
        Найдено: <strong>{totalVacancies.toLocaleString('ru')}</strong> {totalVacancies === 1 ? 'вакансия' : totalVacancies < 5 ? 'вакансии' : 'вакансий'}
      </div>
    {/if}
  </div>
  
  {#if isExpanded}
    <div class="filters-content" transition:slide={{ duration: 300 }}>
      {#if availableSkills && availableSkills.length > 0}
        <div class="skills-list mb-4">
          {#each availableSkills as skill (skill)}
            <label>
              <input type="checkbox" checked={selectedSkills.includes(skill)} on:change={() => handleChange(skill)} />
              <Tag size="16" />
              {skill}
            </label>
          {/each}
        </div>
        <GradientButton 
          variant="primary" 
          size="md" 
          fullWidth={true} 
          hideOnMobile={false} 
          on:click={handleReset}
        >
          Сбросить фильтр
        </GradientButton>
      {:else}
        <p>Нет доступных навыков для фильтрации.</p>
      {/if}
    </div>
  {/if}
</section>

<style>
  /* Стили для фильтров */
  .filters {
    @apply bg-neutral-50 p-6 rounded-lg mb-8 border border-neutral-300;
  }
  .filters-header {
    @apply flex flex-col gap-4;
  }

  .filters-toggle {
    @apply w-full flex justify-between items-center p-0 bg-transparent border-none cursor-pointer transition-colors duration-200 hover:bg-neutral-100 rounded-lg px-2 py-1;
  }

  .filters h2 {
    @apply m-0 text-xl text-neutral-700 flex items-center gap-2 font-semibold;
  }

  .selected-count {
    @apply text-primary-600 bg-primary-100 px-2 py-1 rounded-full text-sm font-medium;
  }

  .toggle-icon {
    @apply text-neutral-500 transition-transform duration-200;
  }

  .filters-content {
    @apply pt-4;
  }

  .results-legend {
    @apply text-sm text-neutral-600 bg-info-50 px-3 py-2 rounded-md border border-info-200;
  }

  .results-legend strong {
    @apply text-info-700;
  }
  .skills-list {
    @apply flex flex-wrap gap-2;
  }
  .skills-list label {
    @apply cursor-pointer inline-flex items-center bg-white px-3 py-2 rounded-xl border border-neutral-300 text-sm transition-all duration-200 gap-2 hover:bg-neutral-100;
  }
  .skills-list input[type="checkbox"] {
    @apply mr-1 accent-primary-500;
  }

  /* Стиль для родительского label, когда внутренний чекбокс выбран */
  .skills-list label:has(input[type="checkbox"]:checked) {
    @apply bg-primary-50 border-primary-300 font-medium text-primary-800;
  }
  /* Стили для кнопки сброса перенесены в компонент GradientButton */

  /* Мобильная адаптация */
  @media (max-width: 768px) {
    .filters {
      @apply p-4;
    }

    .filters-header {
      @apply flex-col items-start gap-3;
    }

    .filters h2 {
      @apply text-lg;
    }

    .results-legend {
      @apply text-sm self-stretch text-center;
    }

    .skills-list {
      @apply gap-2;
    }

    .skills-list label {
      @apply text-sm px-3 py-2;
    }
  }
</style>
