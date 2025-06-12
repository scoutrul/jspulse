<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: number = 10;
  export let options: number[] = [10, 20, 50, 100];
  export let loading: boolean = false;
  export let compact: boolean = false;

  const dispatch = createEventDispatcher<{
    change: number;
  }>();

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newValue = parseInt(target.value);
    
    if (newValue !== value && !loading) {
      dispatch('change', newValue);
    }
  }
</script>

<div class="page-size-selector" class:compact>
  <label for="page-size-select" class="sr-only">
    Количество элементов на странице
  </label>
  
  <div class="select-wrapper">
    <span class="label" class:compact>Показать:</span>
    <select 
      id="page-size-select"
      {value}
      disabled={loading}
      on:change={handleChange}
      aria-label="Выбрать количество элементов на странице"
    >
      {#each options as option}
        <option value={option}>
          {option}
        </option>
      {/each}
    </select>
    <span class="suffix" class:compact>
      {compact ? '' : 'элементов на странице'}
    </span>
  </div>

  {#if loading}
    <div class="loading-indicator" aria-hidden="true">
      <div class="spinner"></div>
    </div>
  {/if}
</div>

<style>
  .page-size-selector {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #495057;
  }

  .page-size-selector.compact {
    font-size: 13px;
  }

  .select-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .label {
    font-weight: 500;
    white-space: nowrap;
  }

  .label.compact {
    font-size: 12px;
  }

  select {
    padding: 4px 8px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    background: #fff;
    color: #495057;
    font-size: inherit;
    cursor: pointer;
    transition: border-color 0.15s ease;
    min-width: 60px;
  }

  select:hover:not(:disabled) {
    border-color: #007bff;
  }

  select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f8f9fa;
  }

  .suffix {
    color: #6c757d;
    white-space: nowrap;
  }

  .suffix.compact {
    display: none;
  }

  .loading-indicator {
    position: absolute;
    right: -24px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Screen reader only */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    select {
      transition: none;
    }
    
    .spinner {
      animation: none;
    }
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .page-size-selector {
      font-size: 13px;
    }
    
    select {
      min-width: 50px;
      padding: 6px 8px;
    }
  }
</style> 