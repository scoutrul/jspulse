<script lang="ts">
  import GradientButton from '../ui/GradientButton.svelte';
  
  export let url: string | undefined = undefined;
  export let source: string | undefined = undefined;
  export let backUrl: string = '/';
  export let backLabel: string = 'Вернуться к поиску';
</script>

<div class="vacancy-actions">
  <div class="actions-container">
    {#if url}
      <div class="primary-action">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          class="action-link"
        >
          <GradientButton variant="primary" size="lg">
            <span class="button-content">
              <span class="button-text">
                Посмотреть на {source || 'сайте'}
              </span>
              <span class="button-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 17L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 7H17V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </span>
          </GradientButton>
        </a>
      </div>
    {/if}
    
    <div class="secondary-action">
      <a href={backUrl} class="action-link">
        <GradientButton variant="outline" size="lg">
          <span class="button-content">
            <span class="button-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="button-text">
              {backLabel}
            </span>
          </span>
        </GradientButton>
      </a>
    </div>
  </div>
</div>

<style>
  .vacancy-actions {
    @apply mt-6 pt-4;
    @apply border-t border-neutral-200;
  }
  
  .actions-container {
    @apply flex flex-col sm:flex-row gap-3;
    @apply items-stretch sm:items-center;
  }
  
  .primary-action {
    @apply flex-1 sm:flex-initial;
  }
  
  .secondary-action {
    @apply flex-1 sm:flex-initial;
  }
  
  .action-link {
    @apply block w-full;
    @apply no-underline;
    @apply transition-all duration-200;
    @apply focus:outline-2 focus:outline-offset-2 focus:outline-primary-500;
    @apply rounded-lg;
  }
  
  .button-content {
    @apply flex items-center justify-center gap-2;
  }
  
  .button-text {
    @apply font-medium;
  }
  
  .button-icon {
    @apply flex items-center justify-center;
    @apply transition-transform duration-200;
  }
  
  /* Hover эффекты только для кликабельных элементов */
  .primary-action .action-link:hover .button-icon {
    @apply transform translate-x-1 -translate-y-1;
  }
  
  .secondary-action .action-link:hover .button-icon {
    @apply transform -translate-x-1;
  }
  
  /* Responsive design */
  @media (max-width: 640px) {
    .vacancy-actions {
      @apply mt-4 pt-3;
    }
    
    .actions-container {
      @apply gap-2;
    }
    
    .button-content {
      @apply text-sm;
    }
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .button-icon {
      transition: none;
    }
    
    .primary-action .action-link:hover .button-icon,
    .secondary-action .action-link:hover .button-icon {
      @apply transform-none;
    }
  }
  
  /* Высококонтрастный режим */
  @media (prefers-contrast: high) {
    .vacancy-actions {
      @apply border-t-2 border-neutral-600;
    }
  }
  
  /* Focus стили для клавиатурной навигации */
  .action-link:focus-visible {
    @apply outline-2 outline-offset-2 outline-primary-500;
  }
</style> 