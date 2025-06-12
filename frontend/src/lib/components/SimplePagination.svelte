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
    loadAll: void;
  }>();
  // Проверка режима offset-based пагинации
  $: isOffsetMode = currentPageSize >= PAGINATION.THRESHOLDS.OFFSET_MODE_LIMIT && totalItems > PAGINATION.THRESHOLDS.OFFSET_MODE_LIMIT;
  
  // Вычисляем количество дополнительных элементов
  $: hasMore = showingItems < totalItems; // Проверяем есть ли еще элементы для показа
    (showingItems < totalItems); // В прогрессивном режиме проверяем показаны ли все элементы
  $: additionalItems = getAdditionalItems(currentPageSize, totalItems, showingItems, isOffsetMode);
  $: buttonText = getButtonText(currentPageSize, additionalItems, isOffsetMode);
  
  // Логика для кнопки "Показать все"
  $: showLoadAllButton = !isOffsetMode && hasMore && totalItems <= PAGINATION.THRESHOLDS.SHOW_ALL_MAX_TOTAL && showingItems < totalItems;
  $: remainingItems = totalItems - showingItems;

  function getAdditionalItems(currentLimit: number, total: number, showing: number, offsetMode: boolean): number {
    if (showing >= total) return 0;
    
    // В offset-режиме всегда показываем следующую порцию
    if (offsetMode) {
      return PAGINATION.THRESHOLDS.OFFSET_WINDOW_SIZE;
    }
    
    // Прогрессивное увеличение до 100
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
      // После максимального элемента загружаем порциями
      additionalItems = PAGINATION.INCREMENTS.LARGE; // 100 -> 150
    }
    
    return Math.min(additionalItems, total - showing);
  }

  function getButtonText(currentLimit: number, additionalItems: number, offsetMode: boolean): string {
    if (offsetMode) {
      return `Следующие ${additionalItems}`;
    }
    return `Показать еще ${additionalItems.toLocaleString(LOCALE.PRIMARY)}`;
  }

  function handleLoadMore() {
    if (!loading && hasMore) {
      dispatch('loadMore');
    }
  }

  function handleLoadAll() {
    if (!loading && showLoadAllButton) {
      dispatch('loadAll');
    }
  }
</script>

<div class="simple-pagination">
  {#if totalItems > 0}
    <div class="pagination-info">
      Показано {showingItems.toLocaleString(LOCALE.PRIMARY)} из {totalItems.toLocaleString(LOCALE.PRIMARY)} вакансий
    </div>

    {#if hasMore}
      <div class="pagination-buttons">
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
            {buttonText}
          {/if}
        </button>
        
        {#if showLoadAllButton}
          <button 
            class="load-all-btn" 
            on:click={handleLoadAll} 
            disabled={loading}
            aria-label="Показать все {remainingItems} оставшихся вакансий"
          >
            {#if loading}
              <ArrowPathRoundedSquare size="18" class="spinner" />
              Загрузка...
            {:else}
              <ArrowDown size="18" />
              Показать все ({remainingItems})
            {/if}
          </button>
        {/if}
      </div>
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

  .pagination-buttons {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
  }

  .load-more-btn,
  .load-all-btn {
    padding: 0.8rem 2rem;
    font-size: 1rem;
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

  .load-more-btn {
    background-color: #007bff;
  }

  .load-all-btn {
    background-color: #28a745;
  }

  .load-more-btn:hover:not(:disabled) {
    background-color: #0056b3;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
  }

  .load-all-btn:hover:not(:disabled) {
    background-color: #218838;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
  }

  .load-more-btn:active:not(:disabled),
  .load-all-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .load-more-btn:active:not(:disabled) {
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
  }

  .load-all-btn:active:not(:disabled) {
    box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
  }

  .load-more-btn:disabled,
  .load-all-btn:disabled {
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

    .pagination-buttons {
      flex-direction: column;
      gap: 0.75rem;
    }

    .load-more-btn,
    .load-all-btn {
      padding: 0.7rem 1.5rem;
      font-size: 0.9rem;
      min-width: var(--load-more-min-width-mobile);
    }

    .pagination-info {
      font-size: 0.8rem;
    }
  }
</style> 