<script lang="ts">
  import { AdjustmentsHorizontal, Tag } from 'svelte-heros-v2';
  import { createEventDispatcher } from 'svelte';
  export let availableSkills: string[] = [];
  export let selectedSkills: string[] = [];
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
  <h2>
    <AdjustmentsHorizontal size="20" />
    Фильтр по навыкам ({availableSkills?.length ?? 0})
  </h2>
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
  .filters h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.3rem;
    color: #495057;
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
</style>
