<script lang="ts">
  import { processDescription } from '$lib/utils/sanitize';
  import type { DescriptionContent } from '@jspulse/shared/types';
  import DescriptionIcon from '../icons/DescriptionIcon.svelte';

  export let content: string = '';
  export let processedContent: DescriptionContent | undefined = undefined;
  export let variant: 'default' | 'enhanced' | 'minimal' = 'enhanced';
  export let allowHtml: boolean = true;
  export let showMetrics: boolean = true;
  export let className: string = '';

  // Reactive processing
  $: processedHtml = processedContent?.processed || 
    processDescription(content || '', 'full');

  // Content metrics calculation
  $: contentMetrics = (() => {
    if (!content && !processedContent) return null;
    
    const textContent = processedContent?.textOnly || 
      content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = textContent.length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200)); // Avg reading speed 200 wpm
    
    return {
      words: wordCount,
      chars: charCount,
      readTime: readTime
    };
  })();

  // Проверка на пустое содержимое
  $: isEmpty = !processedHtml && !content;
</script>

<div class="description-full description-full-{variant} description-full-enhanced description-system {className}">
  <!-- Основной контент -->
  <div class="description-full-content">
    {#if processedHtml}
      {@html processedHtml}
    {:else if content}
      <p class="description-paragraph-enhanced">{content}</p>
    {:else}
      <div class="description-empty-state">
        <DescriptionIcon icon="empty" size="xl" color="muted" />
        <h3 class="empty-title">Полное описание отсутствует</h3>
        <p class="empty-message">К сожалению, для этой вакансии нет подробного описания.</p>
      </div>
    {/if}
  </div>

  <!-- Content metrics -->
  {#if showMetrics && contentMetrics && !isEmpty}
    <div class="description-metrics-enhanced">
      <div class="metrics-item">
        <DescriptionIcon icon="time" size="xs" color="muted" />
        <span class="metric-value">{contentMetrics.readTime}</span>
        <span class="metric-label">мин чтения</span>
      </div>
      
      <span class="metrics-separator">•</span>
      
      <div class="metrics-item">
        <DescriptionIcon icon="words" size="xs" color="muted" />
        <span class="metric-value">{contentMetrics.words}</span>
        <span class="metric-label">слов</span>
      </div>
      
      <span class="metrics-separator">•</span>
      
      <div class="metrics-item">
        <DescriptionIcon icon="chars" size="xs" color="muted" />
        <span class="metric-value">{contentMetrics.chars}</span>
        <span class="metric-label">символов</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .description-full {
    @apply relative w-full;
  }
  
  .description-full-default {
    @apply bg-white rounded-lg p-4 border border-neutral-200 shadow-sm;
  }
  
  .description-full-minimal {
    @apply bg-transparent p-0 border-none shadow-none;
  }
  
  .description-full-content {
    @apply text-neutral-800 leading-relaxed max-w-none;
    @apply text-base;
  }
  
  /* Enhanced variant uses global CSS system styles */
  .description-full-enhanced .description-full-content {
    @apply text-base; /* Slightly larger text for full view */
  }
  
  /* Empty state styling */
  .description-empty-state {
    @apply flex flex-col items-center justify-center;
    @apply py-12 px-6 text-center;
    @apply text-neutral-500;
  }
  
  .empty-title {
    @apply mt-4 text-lg font-semibold text-neutral-600;
    @apply mb-2;
  }
  
  .empty-message {
    @apply text-sm text-neutral-500;
    @apply max-w-md;
  }
  
  /* Content metrics styling is handled by global CSS */
  .description-metrics-enhanced .metric-label {
    @apply text-neutral-400 ml-1;
  }
  
  /* Responsive design */
  @media (max-width: 640px) {
    .description-full-content {
      @apply text-sm;
    }
    
    .description-empty-state {
      @apply py-8 px-4;
    }
    
    .empty-title {
      @apply text-base;
    }
    
    .empty-message {
      @apply text-xs;
    }
  }
  
  /* Small mobile screens */
  @media (max-width: 480px) {
    .description-full-content {
      @apply text-sm;
    }
    
    .description-empty-state {
      @apply py-6 px-3;
    }
  }
  
  /* Override prose styles for better integration */
  .description-full-content :global(h1),
  .description-full-content :global(h2),
  .description-full-content :global(h3),
  .description-full-content :global(h4),
  .description-full-content :global(h5),
  .description-full-content :global(h6) {
    @apply mt-6 mb-4 first:mt-0;
  }
  
  .description-full-content :global(p) {
    @apply mb-4;
  }
  
  .description-full-content :global(ul),
  .description-full-content :global(ol) {
    @apply mb-4;
  }
  
  .description-full-content :global(li) {
    @apply mb-1;
  }
  
  .description-full-content :global(blockquote) {
    @apply my-6 border-l-4 border-warning-400 pl-6;
    @apply bg-gradient-to-r from-warning-50 to-neutral-50;
    @apply rounded-r-lg p-4;
  }
  
  .description-full-content :global(strong),
  .description-full-content :global(b) {
    @apply font-semibold text-neutral-900;
  }
  
  .description-full-content :global(em),
  .description-full-content :global(i) {
    @apply italic text-neutral-800;
  }
  
  .description-full-content :global(a) {
    @apply text-primary-600 hover:text-primary-700;
    @apply underline decoration-2 underline-offset-2;
    @apply transition-colors duration-200;
  }
  
  .description-full-content :global(code) {
    @apply bg-neutral-100 text-neutral-800 px-1 py-0.5 rounded text-sm;
    @apply font-mono;
  }
  
  .description-full-content :global(pre) {
    @apply bg-neutral-100 p-4 rounded-lg overflow-x-auto;
    @apply text-sm;
  }
  
  .description-full-content :global(pre code) {
    @apply bg-transparent p-0 text-neutral-800;
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .description-full-content :global(a) {
      @apply transition-none;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .description-full-default,
    .description-full-enhanced {
      @apply border-2 border-neutral-600;
    }
    
    .description-full-content :global(a) {
      @apply text-blue-700 underline-offset-4;
    }
    
    .description-full-content :global(blockquote) {
      @apply border-l-4 border-neutral-600 bg-neutral-100;
    }
    
    .description-full-content :global(code) {
      @apply bg-neutral-200 text-neutral-900 border border-neutral-600;
    }
  }
  
  /* Print styles */
  @media print {
    .description-full {
      @apply bg-white border-none shadow-none;
    }
    
    .description-full-content {
      @apply text-black;
    }
    
    .description-full-content :global(a) {
      @apply text-black underline;
    }
    
    .description-full-content :global(blockquote) {
      @apply border-l-4 border-black bg-transparent;
    }
    
    .description-metrics-enhanced {
      @apply hidden;
    }
  }
</style> 