<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { ArrowUp, ArrowPathRoundedSquare } from 'svelte-heros-v2';

  export let loading: boolean = false;
  export let disabled: boolean = false;
  export let hiddenCount: number = 0;

  const dispatch = createEventDispatcher<{
    loadPrevious: void;
  }>();

  function handleClick() {
    if (!loading && !disabled) {
      dispatch("loadPrevious");
    }
  }
</script>

<div class="load-previous">
  <button on:click={handleClick} disabled={disabled || loading} class="load-previous-btn">
    {#if loading}
      <ArrowPathRoundedSquare size="18" class="spinner" />
      Загрузка...
    {:else}
      <ArrowUp size="18" />
      Показать предыдущие {hiddenCount.toLocaleString('ru')}
    {/if}
  </button>
</div>

<style>
  .load-previous {
    text-align: center;
    margin: 1rem 0;
    padding: 1rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 12px;
    border: 1px solid #dee2e6;
  }

  .load-previous-btn {
    padding: 0.8rem 2rem;
    font-size: 1rem;
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 200px;
    justify-content: center;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
  }

  .load-previous-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
  }

  .load-previous-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
  }

  .load-previous-btn:disabled {
    background: linear-gradient(135deg, #6c757d 0%, #adb5bd 100%);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  :global(.spinner) {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Мобильная адаптация */
  @media (max-width: 768px) {
    .load-previous {
      margin: 0.5rem 0;
      padding: 0.8rem;
    }

    .load-previous-btn {
      padding: 0.7rem 1.5rem;
      font-size: 0.9rem;
      min-width: 180px;
    }
  }
</style> 