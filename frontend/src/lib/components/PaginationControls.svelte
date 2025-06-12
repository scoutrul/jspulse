<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import PageSizeSelector from './PageSizeSelector.svelte';
  import PageJumper from './PageJumper.svelte';
  import { PAGINATION, LOCALE } from '../config/pagination.constants';

  export let currentPage: number = 0;
  export let totalPages: number = 0;
  export let totalItems: number = 0;
  export let pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE;
  export let loading: boolean = false;
  export let compact: boolean = false;

  const dispatch = createEventDispatcher<{
    pageChange: number;
    pageSizeChange: number;
  }>();

  const pageSizeOptions = [...PAGINATION.AVAILABLE_PAGE_SIZES];

  // Вычисляем видимые номера страниц для умной навигации
  $: visiblePages = getVisiblePages(currentPage, totalPages);
  $: hasNext = currentPage < totalPages - 1;
  $: hasPrev = currentPage > 0;
  $: startItem = totalItems > 0 ? currentPage * pageSize + 1 : 0;
  $: endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  function getVisiblePages(current: number, total: number): number[] {
    if (total <= 7) {
      // Если страниц мало, показываем все
      return Array.from({ length: total }, (_, i) => i);
    }

    const pages: number[] = [];
    
    // Всегда показываем первую страницу
    pages.push(0);
    
    if (current <= 3) {
      // Если мы в начале, показываем 0,1,2,3,...,last
      pages.push(1, 2, 3);
      if (total > 5) pages.push(-1); // ellipsis
      pages.push(total - 1);
    } else if (current >= total - 4) {
      // Если мы в конце, показываем 0,...,last-3,last-2,last-1,last
      if (total > 5) pages.push(-1); // ellipsis
      pages.push(total - 4, total - 3, total - 2, total - 1);
    } else {
      // Если мы в середине, показываем 0,...,current-1,current,current+1,...,last
      pages.push(-1); // ellipsis
      pages.push(current - 1, current, current + 1);
      pages.push(-1); // ellipsis
      pages.push(total - 1);
    }

    return pages;
  }

  function handlePageClick(page: number) {
    if (page !== currentPage && !loading && page >= 0 && page < totalPages) {
      dispatch('pageChange', page);
    }
  }

  function handlePrevClick() {
    if (hasPrev && !loading) {
      dispatch('pageChange', currentPage - 1);
    }
  }

  function handleNextClick() {
    if (hasNext && !loading) {
      dispatch('pageChange', currentPage + 1);
    }
  }

  function handlePageSizeChange(event: CustomEvent<number>) {
    dispatch('pageSizeChange', event.detail);
  }

  function handlePageJump(event: CustomEvent<number>) {
    handlePageClick(event.detail);
  }
</script>

<!-- Desktop Full Pagination -->
<nav 
  class="pagination-container" 
  class:compact
  aria-label="Пагинация вакансий"
>
  {#if !compact}
    <div class="pagination-full">
      <!-- Page Navigation -->
      <div class="page-controls">
        <!-- Previous Button -->
        <button 
          class="pagination-btn prev-btn"
          disabled={!hasPrev || loading}
          on:click={handlePrevClick}
          aria-label="Предыдущая страница"
          title="Предыдущая страница"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
          </svg>
        </button>

        <!-- Page Numbers -->
        <div class="page-numbers">
          {#each visiblePages as page}
            {#if page === -1}
              <span class="ellipsis" aria-hidden="true">...</span>
            {:else}
              <button
                class="pagination-btn page-btn"
                class:active={page === currentPage}
                disabled={loading}
                on:click={() => handlePageClick(page)}
                aria-label="Перейти на страницу {page + 1}"
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page + 1}
              </button>
            {/if}
          {/each}
        </div>

        <!-- Next Button -->
        <button 
          class="pagination-btn next-btn"
          disabled={!hasNext || loading}
          on:click={handleNextClick}
          aria-label="Следующая страница"
          title="Следующая страница"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      </div>

      <!-- Page Info and Controls -->
      <div class="pagination-info">
        <div class="items-info">
          {#if totalItems > 0}
            Показано {startItem}–{endItem} из {totalItems.toLocaleString(LOCALE.PRIMARY)} вакансий
          {:else}
            Вакансии не найдены
          {/if}
        </div>
        
        <div class="controls-row">
          <PageSizeSelector 
            value={pageSize}
            options={pageSizeOptions}
            {loading}
            on:change={handlePageSizeChange}
          />
          
          <PageJumper 
            maxPage={totalPages}
            {loading}
            on:jump={handlePageJump}
          />
        </div>
      </div>
    </div>
  {:else}
    <!-- Mobile Compact Pagination -->
    <div class="pagination-compact">
      <div class="compact-controls">
        <button 
          class="pagination-btn prev-btn"
          disabled={!hasPrev || loading}
          on:click={handlePrevClick}
          aria-label="Предыдущая страница"
        >
          ←
        </button>

        <div class="page-info">
          <span class="current-page">Страница {currentPage + 1} из {totalPages}</span>
          <PageJumper 
            maxPage={totalPages}
            {loading}
            compact={true}
            on:jump={handlePageJump}
          />
        </div>

        <button 
          class="pagination-btn next-btn"
          disabled={!hasNext || loading}
          on:click={handleNextClick}
          aria-label="Следующая страница"
        >
          →
        </button>
      </div>

      <div class="compact-info">
        <PageSizeSelector 
          value={pageSize}
          options={pageSizeOptions}
          {loading}
          compact={true}
          on:change={handlePageSizeChange}
        />
        <span class="items-count">{totalItems.toLocaleString('ru')} результатов</span>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="loading-overlay" aria-label="Загрузка...">
      <div class="loading-spinner"></div>
    </div>
  {/if}
</nav>

<style>
  .pagination-container {
    position: relative;
    padding: 20px 0;
    border-top: 1px solid #e9ecef;
    background: #fff;
  }

  .pagination-container.compact {
    padding: 12px 0;
  }

  /* Desktop Full Pagination */
  .pagination-full {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }

  .page-controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .page-numbers {
    display: flex;
    align-items: center;
    gap: 2px;
    margin: 0 8px;
  }

  .pagination-btn {
    min-width: 40px;
    height: 40px;
    padding: 8px 12px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    background: #fff;
    color: #495057;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pagination-btn:hover:not(:disabled) {
    border-color: #007bff;
    color: #007bff;
    background: #f8f9ff;
  }

  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f8f9fa;
  }

  .pagination-btn.active {
    background: #007bff;
    border-color: #007bff;
    color: #fff;
  }

  .ellipsis {
    padding: 8px 4px;
    color: #6c757d;
    font-weight: 500;
  }

  .pagination-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: #6c757d;
  }

  .controls-row {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .items-info {
    font-weight: 500;
  }

  /* Mobile Compact Pagination */
  .pagination-compact {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  .compact-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    justify-content: space-between;
  }

  .compact-controls .pagination-btn {
    min-width: 44px;
    height: 44px;
    font-size: 18px;
  }

  .page-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
  }

  .current-page {
    font-size: 14px;
    font-weight: 500;
    color: #495057;
  }

  .compact-info {
    display: flex;
    align-items: center;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .items-count {
    font-size: 13px;
    color: #6c757d;
  }

  /* Loading State */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .pagination-full {
      display: none;
    }
    
    .pagination-compact {
      display: flex;
    }
  }

  @media (min-width: 769px) {
    .pagination-full {
      display: flex;
    }
    
    .pagination-compact {
      display: none;
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .pagination-btn {
      transition: none;
    }
    
    .loading-spinner {
      animation: none;
    }
  }

  /* Focus styles for keyboard navigation */
  .pagination-btn:focus-visible {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }
</style> 