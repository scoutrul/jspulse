<script lang="ts">
  export let label: string;
  export let value: string;
  export let variant: 'default' | 'primary' | 'success' | 'info' = 'default';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let icon: string | undefined = undefined;
</script>

<div class="info-badge info-badge--{variant} info-badge--{size}">
  {#if icon}
    <span class="info-badge__icon" aria-hidden="true">
      {@html icon}
    </span>
  {/if}
  
  <div class="info-badge__content">
    <span class="info-badge__label">{label}:</span>
    <span class="info-badge__value">{value}</span>
  </div>
</div>

<style>
  .info-badge {
    @apply inline-flex items-center gap-2 rounded-lg transition-all duration-200;
    @apply border border-solid;
    will-change: transform, box-shadow;
    backface-visibility: hidden;
  }
  
  /* Размеры */
  .info-badge--sm {
    @apply px-2 py-1 text-xs;
  }
  
  .info-badge--md {
    @apply px-3 py-2 text-sm;
  }
  
  .info-badge--lg {
    @apply px-4 py-3 text-base;
  }
  
  /* Варианты */
  .info-badge--default {
    @apply bg-neutral-50 border-neutral-200 text-neutral-700;
    @apply hover:bg-neutral-100 hover:border-neutral-300;
  }
  
  .info-badge--primary {
    @apply bg-warning-50 border-warning-200 text-warning-800;
    @apply hover:bg-warning-100 hover:border-warning-300;
  }
  
  .info-badge--success {
    @apply bg-green-50 border-green-200 text-green-800;
    @apply hover:bg-green-100 hover:border-green-300;
  }
  
  .info-badge--info {
    @apply bg-blue-50 border-blue-200 text-blue-800;
    @apply hover:bg-blue-100 hover:border-blue-300;
  }
  
  .info-badge__content {
    @apply flex flex-col;
  }
  
  .info-badge--sm .info-badge__content {
    @apply flex-row gap-1;
  }
  
  .info-badge__label {
    @apply font-medium opacity-75;
  }
  
  .info-badge__value {
    @apply font-semibold;
  }
  
  .info-badge__icon {
    @apply flex items-center justify-center;
    @apply w-4 h-4 opacity-60;
  }
  
  .info-badge--lg .info-badge__icon {
    @apply w-5 h-5;
  }
  
  /* Hover эффекты */
  .info-badge:hover {
    @apply transform -translate-y-1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .info-badge {
      transition: none;
    }
    
    .info-badge:hover {
      @apply transform-none;
      box-shadow: none;
    }
  }
  
  /* Высококонтрастный режим */
  @media (prefers-contrast: high) {
    .info-badge {
      @apply border-2;
    }
    
    .info-badge--primary {
      @apply border-warning-600 bg-warning-100;
    }
    
    .info-badge--success {
      @apply border-green-600 bg-green-100;
    }
    
    .info-badge--info {
      @apply border-blue-600 bg-blue-100;
    }
  }
</style> 