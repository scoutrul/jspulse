<script lang="ts">
  export let salaryFrom: number | undefined | null = undefined;
  export let salaryTo: number | undefined | null = undefined;
  export let currency: string = 'руб.';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let variant: 'default' | 'prominent' = 'default';
  
  $: hasRange = salaryFrom !== undefined || salaryTo !== undefined;
  $: formattedFrom = salaryFrom?.toLocaleString('ru-RU');
  $: formattedTo = salaryTo?.toLocaleString('ru-RU');
  
  $: salaryText = (() => {
    if (salaryFrom && salaryTo) {
      return `от ${formattedFrom} до ${formattedTo} ${currency}`;
    } else if (salaryFrom) {
      return `от ${formattedFrom} ${currency}`;
    } else if (salaryTo) {
      return `до ${formattedTo} ${currency}`;
    }
    return '';
  })();
</script>

{#if hasRange}
  <div class="salary-range salary-range--{variant} salary-range--{size}">
    <span class="salary-range__icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2V22M17 5H9.5C8.11929 5 7 6.11929 7 7.5C7 8.88071 8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5C17 13.8807 15.8807 15 14.5 15H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
    
    <span class="salary-range__text">
      {salaryText}
    </span>
  </div>
{/if}

<style>
  .salary-range {
    @apply inline-flex items-center gap-2 rounded-lg transition-all duration-200;
    @apply font-semibold;
    will-change: transform, box-shadow;
    backface-visibility: hidden;
  }
  
  /* Размеры */
  .salary-range--sm {
    @apply text-sm px-2 py-1;
  }
  
  .salary-range--md {
    @apply text-base px-3 py-2;
  }
  
  .salary-range--lg {
    @apply text-lg px-4 py-3;
  }
  
  /* Варианты */
  .salary-range--default {
    @apply text-green-700 bg-green-50 border border-green-200;
  }
  
  .salary-range--prominent {
    @apply text-white border border-green-500;
    background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.15);
  }
  
  .salary-range__icon {
    @apply flex items-center justify-center;
    @apply w-4 h-4 opacity-75;
  }
  
  .salary-range--lg .salary-range__icon {
    @apply w-5 h-5;
  }
  
  .salary-range__text {
    @apply font-semibold tabular-nums;
  }
  
  /* Hover эффекты */
  .salary-range:hover {
    @apply transform -translate-y-1;
  }
  
  .salary-range--default:hover {
    @apply bg-green-100 border-green-300;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
  }
  
  .salary-range--prominent:hover {
    @apply transform scale-105;
    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.25), 0 2px 4px rgba(16, 185, 129, 0.15);
  }
  
  /* Анимация пульсации для prominent варианта */
  .salary-range--prominent {
    animation: salary-glow 4s ease-in-out infinite;
  }
  
  @keyframes salary-glow {
    0%, 100% {
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.15);
    }
    50% {
      box-shadow: 0 4px 8px rgba(16, 185, 129, 0.25), 0 2px 4px rgba(16, 185, 129, 0.15);
    }
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .salary-range {
      animation: none;
      transition: none;
    }
    
    .salary-range:hover {
      @apply transform-none;
    }
    
    .salary-range--prominent:hover {
      @apply transform-none;
    }
  }
  
  /* Высококонтрастный режим */
  @media (prefers-contrast: high) {
    .salary-range {
      @apply border-2;
    }
    
    .salary-range--default {
      @apply border-green-600 bg-green-100;
    }
    
    .salary-range--prominent {
      @apply text-green-900;
      background: theme('colors.green.400');
    }
  }
</style> 