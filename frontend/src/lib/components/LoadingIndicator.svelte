<script lang="ts">
  import { ArrowPathRoundedSquare } from 'svelte-heros-v2';
  export let text: string = "Загрузка...";
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let variant: 'default' | 'card' | 'overlay' = 'default';
  export let showPulse: boolean = false; // Для skeleton loading эффекта
</script>

<div class="loading {variant}" class:small={size === 'small'} class:large={size === 'large'}>
  {#if showPulse}
    <div class="pulse-container">
      <div class="pulse-dot"></div>
      <div class="pulse-dot"></div>
      <div class="pulse-dot"></div>
    </div>
  {:else}
    <ArrowPathRoundedSquare size={size === 'small' ? '20' : size === 'large' ? '32' : '24'} class="spinner" />
  {/if}
  <p>{text}</p>
</div>

<style>
  .loading {
    @apply text-center p-8 text-neutral-600 flex flex-col items-center gap-3 rounded-lg transition-all duration-200;
  }
  
  /* Size variants */
  .loading.small {
    @apply p-4 gap-2;
  }
  
  .loading.large {
    @apply p-12 gap-4;
  }
  
  /* Variant styles */
  .loading.card {
    @apply bg-neutral-50 border border-neutral-200 my-4;
  }
  
  .loading.overlay {
    @apply fixed inset-0 bg-white/95 backdrop-blur-sm z-50 justify-center p-0;
  }
  
  .loading p {
    @apply m-0 font-medium text-neutral-700 text-sm;
  }
  
  .loading.small p {
    @apply text-sm;
  }
  
  .loading.large p {
    @apply text-lg;
  }
  
  /* Enhanced spinner animation */
  :global(.spinner) {
    @apply text-primary-500;
    filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.15));
  }
  
  /* Pulse animation для skeleton loading */
  .pulse-container {
    @apply flex gap-2 items-center;
  }
  
  .pulse-dot {
    @apply w-3 h-3 rounded-full bg-primary-500;
    animation: pulse 1.4s ease-in-out infinite both;
  }
  
  .pulse-dot:nth-child(1) { animation-delay: -0.32s; }
  .pulse-dot:nth-child(2) { animation-delay: -0.16s; }
  .pulse-dot:nth-child(3) { animation-delay: 0s; }
  
  @keyframes pulse {
    0%, 80%, 100% {
      @apply scale-75 opacity-50;
    }
    40% {
      @apply scale-110 opacity-100;
    }
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    :global(.spinner) {
      animation: spin 2s linear infinite; /* Slower animation */
    }
    
    .pulse-dot {
      animation: none; /* Remove animation for motion-sensitive users */
      @apply opacity-70;
    }
  }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    .loading {
      @apply p-6;
    }
    
    .loading.large {
      @apply p-8;
    }
    
    .loading.overlay {
      @apply p-4;
    }
  }
  
  /* Focus indicators для accessibility */
  .loading:focus-within {
    @apply outline-2 outline-primary-500 outline-offset-2;
  }
</style>
