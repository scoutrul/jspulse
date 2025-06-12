<script lang="ts">
  import { AdjustmentsHorizontal, Tag } from 'svelte-heros-v2';
  import { createEventDispatcher } from 'svelte';
  export let availableSkills: string[] = [];
  export let selectedSkills: string[] = [];
  export let totalVacancies: number = 0;
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
</script>

<section class="filters">
  <div class="filters-header">
    <h2>
      <AdjustmentsHorizontal size="20" />
      Фильтр по навыкам ({availableSkills?.length ?? 0})
    </h2>
    {#if totalVacancies > 0}
      <div class="results-legend">
        Найдено: <strong>{totalVacancies.toLocaleString('ru')}</strong> {totalVacancies === 1 ? 'вакансия' : totalVacancies < 5 ? 'вакансии' : 'вакансий'}
      </div>
    {/if}
  </div>
  {#if availableSkills && availableSkills.length > 0}
    <div class="skills-list">
      {#each availableSkills as skill (skill)}
        <label>
          <input type="checkbox" checked={selectedSkills.includes(skill)} on:change={() => handleChange(skill)} />
          <Tag size="16" />
          {skill}
        </label>
      {/each}
    </div>
    <button type="button" class="reset-btn" on:click={handleReset}>Сбросить фильтр</button>
  {:else}
    <p>Нет доступных навыков для фильтрации.</p>
  {/if}
</section>

<style>
  /* Стили для фильтров */
  .filters {
    background-color: #f8f9fa;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    border: 1px solid #e9ecef;
  }
  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .filters h2 {
    margin: 0;
    font-size: 1.3rem;
    color: #495057;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .results-legend {
    font-size: 0.95rem;
    color: #6c757d;
    background-color: #e8f4fd;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    border: 1px solid #b3d9f7;
  }

  .results-legend strong {
    color: #0066cc;
  }
  .skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
  }
  .skills-list label {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    background-color: #fff;
    padding: 0.4rem 0.8rem;
    border-radius: 15px;
    border: 1px solid #dee2e6;
    font-size: 0.9rem;
    transition:
      background-color 0.2s,
      border-color 0.2s;
    gap: 0.3rem;
  }
  .skills-list label:hover {
    background-color: #f1f3f5;
  }
  .skills-list input[type="checkbox"] {
    margin-right: 0.3rem;
    accent-color: #007bff;
  }

  /* Стиль для родительского label, когда внутренний чекбокс выбран */
  .skills-list label:has(input[type="checkbox"]:checked) {
    background-color: #e7f3ff;
    border-color: #007bff;
    font-weight: 500;
  }
  .reset-btn {
    margin-top: 1rem;
    padding: 0.5rem 1.2rem;
    background: #eee;
    border: 1px solid #ccc;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
  }
  .reset-btn:hover {
    background: #e7f3ff;
    border-color: #007bff;
  }

  /* Мобильная адаптация */
  @media (max-width: 768px) {
    .filters {
      padding: 1rem;
    }

    .filters-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .filters h2 {
      font-size: 1.2rem;
    }

    .results-legend {
      font-size: 0.9rem;
      align-self: stretch;
      text-align: center;
    }

    .skills-list {
      gap: 0.4rem 0.8rem;
    }

    .skills-list label {
      font-size: 0.85rem;
      padding: 0.35rem 0.7rem;
    }
  }
</style>
