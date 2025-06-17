<script lang="ts">
  import { onMount } from 'svelte';
  import { createDescriptionVariants } from '$lib/utils/sanitize';
  import type { DescriptionContent } from '@jspulse/shared/types';
  import DescriptionPreview from './DescriptionPreview.svelte';
  import DescriptionFull from './DescriptionFull.svelte';
  import DescriptionIcon from '../icons/DescriptionIcon.svelte';
  
  export let content: string = '';
  export let processedContent: DescriptionContent | undefined = undefined;
  export let mode: 'preview' | 'full' | 'auto' = 'auto';
  export let maxPreviewLength: number = 200;
  export let allowToggle: boolean = true;
  export let showToggleButton: boolean = true;
  export let variant: 'default' | 'enhanced' | 'minimal' = 'enhanced';
  export let showMetrics: boolean = false;
  
  let isExpanded = false;
  let finalProcessedContent: DescriptionContent | undefined = undefined;
  let shouldShowToggle = false;
  
  // Реактивные вычисления
  $: currentMode = isExpanded ? 'full' : (mode === 'auto' ? 'preview' : mode);
  
  $: {
    // Создаем или используем обработанный контент
    if (processedContent) {
      finalProcessedContent = processedContent;
    } else if (content) {
      finalProcessedContent = createDescriptionVariants(content);
    } else {
      finalProcessedContent = undefined;
    }
    
    // Определяем нужность кнопки переключения
    if (allowToggle && finalProcessedContent) {
      const hasFullContent = finalProcessedContent.processed && finalProcessedContent.processed.length > maxPreviewLength;
      const previewDifferent = finalProcessedContent.preview !== finalProcessedContent.processed;
      shouldShowToggle = hasFullContent || previewDifferent;
    } else {
      shouldShowToggle = false;
    }
  }
  
  function toggleExpansion() {
    if (shouldShowToggle) {
      isExpanded = !isExpanded;
    }
  }
  
  function handleToggleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpansion();
    }
  }
</script>

<div class="description-renderer description-renderer--{variant} description-system" class:expanded={isExpanded}>
  <!-- Основной контент с использованием специализированных компонентов -->
  <div class="description-content" aria-live="polite">
    {#if currentMode === 'preview'}
      <DescriptionPreview 
        content={content}
        maxLength={maxPreviewLength}
        showEllipsis={!shouldShowToggle}
      />
    {:else if currentMode === 'full'}
      <DescriptionFull 
        content={content}
        processedContent={finalProcessedContent}
        variant={variant}
        allowHtml={true}
        showMetrics={showMetrics}
      />
    {/if}
  </div>
  
  <!-- Кнопка переключения с улучшенной анимацией -->
  {#if shouldShowToggle && showToggleButton}
    <div class="toggle-container">
      <button 
        class="description-toggle description-toggle--{variant} description-toggle-enhanced"
        on:click={toggleExpansion}
        on:keydown={handleToggleKeydown}
        aria-expanded={isExpanded}
        aria-controls="description-content"
        aria-label={isExpanded 
          ? 'Свернуть описание вакансии' 
          : 'Развернуть полное описание вакансии'
        }
      >
        <span class="toggle-content">
          <span class="toggle-text">
            {isExpanded ? 'Свернуть' : 'Читать полностью'}
          </span>
          <span class="toggle-icon" aria-hidden="true">
            <DescriptionIcon 
              icon={isExpanded ? 'collapse' : 'expand'}
              size="sm" 
              color="primary"
              rotated={isExpanded}
            />
          </span>
        </span>
        
        <!-- Индикатор загрузки для плавности переходов -->
        {#if isExpanded}
          <div class="expand-indicator" aria-hidden="true">
            <div class="indicator-line"></div>
          </div>
        {/if}
      </button>
    </div>
  {/if}
</div>

<style>
  .description-renderer {
    @apply relative w-full;
  }
  
  .description-renderer--default {
    @apply space-y-3;
  }
  
  .description-renderer--enhanced {
    @apply space-y-4;
  }
  
  .description-renderer--minimal {
    @apply space-y-2;
  }
  
  .description-content {
    @apply transition-all duration-300 ease-in-out;
    @apply min-h-0; /* Для плавной анимации */
  }
  
  .description-renderer.expanded .description-content {
    @apply animate-fade-in-up;
  }
  
  /* Контейнер для кнопки переключения */
  .toggle-container {
    @apply flex justify-center items-center mt-4;
    @apply pt-3 border-t border-neutral-200;
  }
  
  /* Кнопка переключения с улучшенным дизайном */
  .description-toggle {
    @apply relative flex items-center gap-2 px-4 py-2;
    @apply text-sm font-medium text-primary-600 hover:text-primary-700;
    @apply bg-transparent hover:bg-primary-50 active:bg-primary-100;
    @apply border border-transparent hover:border-primary-200;
    @apply rounded-lg transition-all duration-200;
    @apply focus:outline-2 focus:outline-offset-2 focus:outline-primary-500;
    @apply cursor-pointer;
  }
  
  .description-toggle--enhanced {
    @apply px-6 py-3 rounded-xl;
    @apply bg-gradient-to-r from-primary-50 to-primary-100;
    @apply hover:from-primary-100 hover:to-primary-200;
    @apply border-primary-200;
    @apply shadow-sm hover:shadow-md;
  }
  
  .description-toggle--minimal {
    @apply px-2 py-1 text-xs;
    @apply hover:bg-neutral-100;
  }
  
  .toggle-content {
    @apply flex items-center gap-2;
  }
  
  .toggle-text {
    @apply transition-colors duration-200 font-medium;
  }
  
  .toggle-icon {
    @apply flex items-center justify-center;
    @apply transition-all duration-300 ease-in-out;
  }
  
  .toggle-icon svg {
    @apply transition-transform duration-300 ease-in-out;
  }
  
  .toggle-icon svg.rotated {
    @apply rotate-180;
  }
  
  .description-toggle:hover .toggle-icon {
    @apply scale-110;
  }
  
  .description-toggle:active .toggle-icon {
    @apply scale-95;
  }
  
  /* Индикатор расширения */
  .expand-indicator {
    @apply absolute -bottom-1 left-1/2 transform -translate-x-1/2;
    @apply w-8 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600;
    @apply rounded-full;
    @apply animate-pulse;
  }
  
  .indicator-line {
    @apply w-full h-full bg-gradient-to-r from-primary-500 to-primary-700;
    @apply rounded-full;
    @apply animate-shimmer;
  }
  
  /* Улучшенные анимации */
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.4s ease-out;
  }
  
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(0%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  .animate-shimmer {
    animation: shimmer 2s ease-in-out infinite;
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .description-content,
    .toggle-icon,
    .toggle-icon svg,
    .animate-fade-in {
      transition: none !important;
      animation: none !important;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .description-content :global(.description-heading) {
      @apply text-neutral-900;
      background: none;
      -webkit-text-fill-color: unset;
    }
    
    .description-content :global(.description-item::before) {
      @apply text-neutral-900;
    }
    
    .description-content :global(.description-quote) {
      @apply border-l-4 border-neutral-600;
      @apply bg-neutral-100;
    }
  }
  
  /* Print styles */
  @media print {
    .description-toggle {
      @apply hidden;
    }
    
    .description-content {
      @apply text-black;
    }
    
    .description-content :global(.description-heading) {
      @apply text-black;
      background: none;
      -webkit-text-fill-color: unset;
    }
  }
</style> 