<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ArrowDown, ArrowPathRoundedSquare } from 'svelte-heros-v2';
  import { PAGINATION, LOCALE } from '../config/pagination.constants';

  export let currentPageSize: number = PAGINATION.DEFAULT_PAGE_SIZE;
  export let totalItems: number = 0;
  export let loading: boolean = false;
  export let showingItems: number = 0; // Количество показанных элементов

  const dispatch = createEventDispatcher<{
    loadMore: void;
  }>();

  // Вычисляем количество дополнительных элементов
  $: hasMore = showingItems < totalItems;
  $: additionalItems = getAdditionalItems(currentPageSize, totalItems, showingItems);

  function getAdditionalItems(currentLimit: number, total: number, showing: number): number {
    if (showing >= total) return 0;
    
    let additionalItems: number = PAGINATION.INCREMENTS.SMALL;
    if (currentLimit === PAGINATION.PROGRESSIVE_STEPS.STEP_1) {
      additionalItems = PAGINATION.INCREMENTS.SMALL; // 10 -> 20
    } else if (currentLimit === PAGINATION.PROGRESSIVE_STEPS.STEP_2) {
      additionalItems = PAGINATION.INCREMENTS.SMALL; // 20 -> 30  
    } else if (currentLimit === PAGINATION.PROGRESSIVE_STEPS.STEP_3) {
      additionalItems = PAGINATION.INCREMENTS.MEDIUM; // 30 -> 50
    } else if (currentLimit === PAGINATION.PROGRESSIVE_STEPS.STEP_4) {
      additionalItems = PAGINATION.INCREMENTS.LARGE; // 50 -> 100
    } else {
      additionalItems = PAGINATION.INCREMENTS.LARGE; // 100+ -> +50
    }
    
    return Math.min(additionalItems, total - showing);
  }

  function handleLoadMore() {
    if (!loading && hasMore) {
      dispatch('loadMore');
    }
  }
</script>

<div class="simple-pagination">
  {#if totalItems > 0}
    <div class="pagination-info">
      Показано {showingItems.toLocaleString(LOCALE.PRIMARY)} из {totalItems.toLocaleString(LOCALE.PRIMARY)} вакансий
    </div>

    {#if hasMore}
      <button 
        class="load-more-btn" 
        on:click={handleLoadMore} 
        disabled={loading}
        aria-label="Показать еще {additionalItems} вакансий"
      >
        {#if loading}
          <ArrowPathRoundedSquare size="18" class="spinner" />
          Загрузка...
        {:else}
          <ArrowDown size="18" />
          Показать еще {additionalItems.toLocaleString(LOCALE.PRIMARY)}
        {/if}
      </button>
    {:else}
      <div class="all-loaded">
        Все вакансии загружены
      </div>
    {/if}
  {:else}
    <div class="no-results">
      Вакансии не найдены
    </div>
  {/if}
</div>

<style>
  :global(:root) {
    --bottom-padding: 50vh;
    --load-more-min-width-desktop: 160px;
    --load-more-min-width-mobile: 140px;
  }

  .simple-pagination {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin: 2rem 0;
    padding: 1rem;
    /* Добавляем отступ внизу на половину высоты экрана */
    padding-bottom: var(--bottom-padding, 50vh);
  }

  .pagination-info {
    font-size: 0.9rem;
    color: #666;
    text-align: center;
  }

  .load-more-btn {
    padding: 0.8rem 2rem;
    font-size: 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-width: var(--load-more-min-width-desktop);
    justify-content: center;
  }

  .load-more-btn:hover:not(:disabled) {
    background-color: #0056b3;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
  }

  .load-more-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
  }

  .load-more-btn:disabled {
    background-color: #aaa;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .all-loaded {
    font-size: 0.9rem;
    color: #666;
    text-align: center;
    font-style: italic;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }

  .no-results {
    font-size: 0.9rem;
    color: #666;
    text-align: center;
    font-style: italic;
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
    .simple-pagination {
      margin: 1.5rem 0;
      padding: 0.5rem;
    }

    .load-more-btn {
      padding: 0.7rem 1.5rem;
      font-size: 0.9rem;
      min-width: var(--load-more-min-width-mobile);
    }

    .pagination-info {
      font-size: 0.8rem;
    }
  }
</style> 