<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ArrowDown, ArrowPathRoundedSquare } from 'svelte-heros-v2';
  import { PAGINATION, LOCALE } from '../config/pagination.constants';
  import GradientButton from '$lib/components/ui/GradientButton.svelte';
  import { page } from '$app/stores';

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

  async function handlePrefetch() {
    try {
      const params = new URLSearchParams($page.url.search);
      const nextLimit = currentPageSize + getAdditionalItems(currentPageSize, totalItems, showingItems, isOffsetMode);
      params.set('limit', nextLimit.toString());
      
      const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const prefetchUrl = `${backendUrl}/api/vacancies?${params.toString()}`;
      await fetch(prefetchUrl);
      console.debug('✅ Prefetched data:', prefetchUrl);
    } catch (error) {
      console.debug('❌ Prefetch failed:', error);
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
        <GradientButton 
          on:click={handleLoadMore} 
          on:mouseenter={handlePrefetch}
          disabled={loading}
          variant="primary"
          size="lg"
        >
          <div class="button-content">
            {#if loading}
              <ArrowPathRoundedSquare size="18" class="spinner" />
              <span>Загрузка...</span>
            {:else}
              <ArrowDown size="18" />
              <span>{buttonText}</span>
            {/if}
          </div>
        </GradientButton>
        
        {#if showLoadAllButton}
          <GradientButton 
            on:click={handleLoadAll} 
            on:mouseenter={handlePrefetch}
            disabled={loading}
            variant="secondary"
            size="lg"
          >
            <div class="button-content">
              {#if loading}
                <ArrowPathRoundedSquare size="18" class="spinner" />
                <span>Загрузка...</span>
              {:else}
                <ArrowDown size="18" />
                <span>Показать все ({remainingItems})</span>
              {/if}
            </div>
          </GradientButton>
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
    @apply transition-colors duration-300;
    padding-bottom: var(--bottom-padding, 50vh);
  }

  /* Темная тема для пагинации */
  :global(.dark) .simple-pagination {
    @apply bg-slate-800 border-slate-700;
  }

  .pagination-info {
    @apply text-sm text-neutral-600 text-center font-medium px-4 py-2 bg-white rounded-md border border-neutral-200;
    @apply transition-colors duration-300;
  }

  /* Темная тема для информации о пагинации */
  :global(.dark) .pagination-info {
    @apply text-slate-300 bg-slate-700 border-slate-600;
  }

  .pagination-buttons {
    @apply flex gap-5 items-center flex-wrap justify-center;
  }

  .button-content {
    @apply flex items-center gap-2;
  }

  /* Enhanced loading state animation */
  :global(.spinner) {
    filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.3));
  }

  /* Enhanced status messages */
  .all-loaded {
    @apply text-sm text-neutral-600 text-center font-medium px-5 py-3 bg-gradient-to-r from-info-50 to-info-100 rounded-xl border border-info-200 relative;
    @apply transition-colors duration-300;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  /* Темная тема для "все загружено" */
  :global(.dark) .all-loaded {
    @apply text-blue-200 bg-gradient-to-r from-blue-900/30 to-blue-800/30 border-blue-400/30;
  }

  .all-loaded::before {
    content: "✅";
    margin-right: 0.5rem;
    font-size: 1.1rem;
  }

  .no-results {
    @apply text-sm text-neutral-600 text-center font-medium px-5 py-3 bg-gradient-to-r from-warning-50 to-warning-100 rounded-xl border border-warning-300;
    @apply transition-colors duration-300;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  /* Темная тема для "нет результатов" */
  :global(.dark) .no-results {
    @apply text-yellow-200 bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border-yellow-400/30;
  }

  .no-results::before {
    content: "🔍";
    margin-right: 0.5rem;
    font-size: 1.1rem;
  }

  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
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

    .pagination-info {
      @apply text-sm px-4 py-3;
    }
  }

  @media (max-width: 480px) {
    .simple-pagination {
      @apply p-3 my-4;
    }
    

  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .pagination-info,
    .all-loaded,
    .no-results {
      @apply border-2 border-current;
    }
  }
</style> 