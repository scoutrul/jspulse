<script lang="ts">
  import { processDescription } from '$lib/utils/sanitize';
  import DescriptionIcon from '../icons/DescriptionIcon.svelte';

  export let content: string = '';
  export let maxLength: number = 200;
  export let showEllipsis: boolean = true;
  export let variant: 'default' | 'enhanced' | 'minimal' = 'enhanced';
  export let className: string = '';

  // Reactive processing
  $: processedHtml = processDescription(content || '', 'preview', maxLength);
  
  // Определяем, нужно ли показывать многоточие
  $: needsEllipsis = showEllipsis && content && content.length > maxLength;
</script>

<div class="description-preview description-preview-{variant} description-preview-enhanced {className}">
  <!-- Основной контент -->
  <div class="description-preview-content">
    {#if processedHtml}
      {@html processedHtml}
    {:else if content}
      <p class="description-paragraph-enhanced">{content.substring(0, maxLength)}</p>
    {:else}
      <div class="description-empty-state">
        <DescriptionIcon icon="empty" size="lg" color="muted" />
        <p class="empty-message">Описание отсутствует</p>
      </div>
    {/if}
    
    <!-- Ellipsis indicator -->
    {#if needsEllipsis}
      <span class="ellipsis-indicator" aria-label="Продолжение доступно">...</span>
    {/if}
  </div>
  
  <!-- Gradient fade overlay for visual cutoff -->
  {#if needsEllipsis}
    <div class="fade-overlay" aria-hidden="true"></div>
  {/if}
</div>

<style>
  .description-preview {
    @apply relative overflow-hidden;
  }
  
  .description-preview-default {
    @apply bg-neutral-50 rounded-lg p-3 border border-neutral-200;
  }
  
  .description-preview-minimal {
    @apply bg-transparent p-0;
  }
  
  .description-preview-content {
    @apply relative z-10;
    /* Line clamp for consistent height */
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.6;
  }
  
  /* Enhanced variant gets styles from CSS system */
  .description-preview-enhanced .description-preview-content {
    display: block; /* Override line clamp for better HTML support */
    max-height: 6.4em; /* ~4 lines at 1.6 line-height */
    overflow: hidden;
  }
  
  /* Empty state styling */
  .description-empty-state {
    @apply flex flex-col items-center justify-center;
    @apply py-8 px-4 text-center;
    @apply text-neutral-500;
  }
  
  .empty-message {
    @apply mt-2 text-sm font-medium;
    @apply text-neutral-400;
  }
  
  /* Ellipsis indicator */
  .ellipsis-indicator {
    @apply absolute bottom-0 right-0;
    @apply px-2 bg-white text-neutral-500;
    @apply font-bold text-base leading-none;
    z-index: 20;
  }
  
  .description-preview-enhanced .ellipsis-indicator {
    @apply bg-gradient-to-l from-neutral-100 via-neutral-50 to-transparent;
    @apply px-3 py-1 rounded-bl-lg;
  }
  
  /* Fade overlay for smooth cutoff */
  .fade-overlay {
    @apply absolute bottom-0 left-0 right-0;
    @apply h-8 pointer-events-none;
    background: linear-gradient(transparent, rgba(255, 255, 255, 0.9) 60%, white 100%);
    z-index: 15;
  }
  
  .description-preview-enhanced .fade-overlay {
    background: linear-gradient(
      transparent, 
      rgba(250, 250, 250, 0.8) 40%, 
      rgba(245, 245, 245, 0.95) 80%, 
      rgb(240, 240, 240) 100%
    );
  }
  
  /* Mobile optimizations */
  @media (max-width: 640px) {
    .description-preview-content {
      -webkit-line-clamp: 3;
      max-height: 4.8em; /* ~3 lines */
    }
    
    .description-empty-state {
      @apply py-6 px-3;
    }
  }
  
  /* Small mobile screens */
  @media (max-width: 480px) {
    .description-preview-content {
      -webkit-line-clamp: 2;
      max-height: 3.2em; /* ~2 lines */
    }
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .fade-overlay {
      background: linear-gradient(transparent, white 80%);
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .description-preview-default,
    .description-preview-enhanced {
      @apply border-2 border-neutral-600;
    }
    
    .ellipsis-indicator {
      @apply bg-white text-neutral-900 border border-neutral-600;
    }
    
    .fade-overlay {
      background: linear-gradient(transparent, white 90%);
    }
  }
  
  /* Print styles */
  @media print {
    .fade-overlay,
    .ellipsis-indicator {
      @apply hidden;
    }
    
    .description-preview-content {
      -webkit-line-clamp: unset;
      max-height: unset;
      overflow: visible;
    }
  }
</style> 