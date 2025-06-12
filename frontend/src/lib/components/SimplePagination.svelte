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
    @apply flex flex-col items-center gap-6 my-8 p-6 rounded-lg bg-neutral-50 border border-neutral-200;
    padding-bottom: var(--bottom-padding, 50vh);
  }

  .pagination-info {
    @apply text-sm text-neutral-600 text-center font-medium px-4 py-2 bg-white rounded-md border border-neutral-200;
  }

  .pagination-buttons {
    @apply flex gap-5 items-center flex-wrap justify-center;
  }

  .load-more-btn,
  .load-all-btn {
    @apply px-9 py-4 text-base font-medium text-white border-2 border-transparent rounded-xl cursor-pointer transition-all duration-300 inline-flex items-center gap-3 min-h-[48px] relative overflow-hidden;
    min-width: var(--load-more-min-width-desktop);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Enhanced button colors */
  .load-more-btn {
    background: linear-gradient(135deg, theme('colors.primary.500') 0%, theme('colors.primary.600') 100%);
  }

  .load-all-btn {
    background: linear-gradient(135deg, theme('colors.success.500') 0%, theme('colors.success.600') 100%);
  }

  /* Enhanced hover states */
  .load-more-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, theme('colors.primary.600') 0%, theme('colors.primary.700') 100%);
    @apply -translate-y-0.5;
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3), 0 4px 8px rgba(59, 130, 246, 0.2);
    @apply border-white/20;
  }

  .load-all-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, theme('colors.success.600') 0%, theme('colors.success.700') 100%);
    @apply -translate-y-0.5;
    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3), 0 4px 8px rgba(16, 185, 129, 0.2);
    @apply border-white/20;
  }

  /* Enhanced active states */
  .load-more-btn:active:not(:disabled),
  .load-all-btn:active:not(:disabled) {
    @apply -translate-y-px transition-all duration-100;
  }

  .load-more-btn:active:not(:disabled) {
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  }

  .load-all-btn:active:not(:disabled) {
    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
  }

  /* Enhanced disabled state */
  .load-more-btn:disabled,
  .load-all-btn:disabled {
    background: linear-gradient(135deg, theme('colors.neutral.400') 0%, theme('colors.neutral.500') 100%);
    @apply cursor-not-allowed transform-none opacity-70;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  /* Enhanced loading state animation */
  :global(.spinner) {
    animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
    filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.3));
  }
  
  @keyframes spin {
    0% { 
      transform: rotate(0deg) scale(1);
    }
    50% {
      transform: rotate(180deg) scale(1.1);
    }
    100% { 
      transform: rotate(360deg) scale(1);
    }
  }

  /* Enhanced status messages */
  .all-loaded {
    @apply text-sm text-neutral-600 text-center font-medium px-5 py-3 bg-gradient-to-r from-info-50 to-info-100 rounded-xl border border-info-200 relative;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .all-loaded::before {
    content: "✅";
    margin-right: 0.5rem;
    font-size: 1.1rem;
  }

  .no-results {
    @apply text-sm text-neutral-600 text-center font-medium px-5 py-3 bg-gradient-to-r from-warning-50 to-warning-100 rounded-xl border border-warning-300;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .no-results::before {
    content: "🔍";
    margin-right: 0.5rem;
    font-size: 1.1rem;
  }

  /* Enhanced focus indicators для accessibility */
  .load-more-btn:focus,
  .load-all-btn:focus {
    @apply outline-2 outline-warning-400 outline-offset-2;
  }

  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .load-more-btn,
    .load-all-btn {
      @apply transition-colors duration-200;
    }
    
    .load-more-btn:hover:not(:disabled),
    .load-all-btn:hover:not(:disabled) {
      @apply transform-none;
    }
    
    :global(.spinner) {
      animation: spin 2s linear infinite;
    }
  }

  /* Enhanced mobile optimization */
  @media (max-width: 768px) {
    .simple-pagination {
      @apply my-6 p-4 gap-4;
    }

    .pagination-buttons {
      @apply flex-col gap-4 w-full;
    }

    .load-more-btn,
    .load-all-btn {
      @apply px-6 py-4 text-sm min-w-[200px] w-full max-w-sm;
    }

    .pagination-info {
      @apply text-sm px-4 py-3;
    }
  }

  @media (max-width: 480px) {
    .simple-pagination {
      @apply p-3 my-4;
    }
    
    .load-more-btn,
    .load-all-btn {
      @apply text-sm px-5 py-4;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .load-more-btn,
    .load-all-btn {
      @apply border-2 border-current;
    }
    
    .pagination-info,
    .all-loaded,
    .no-results {
      @apply border-2 border-current;
    }
  }
</style> 