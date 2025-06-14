<script lang="ts">
  import InfoBadge from './InfoBadge.svelte';
  
  export let salaryFrom: number | undefined | null = undefined;
  export let salaryTo: number | undefined | null = undefined;
  export let currency: string = 'руб.';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let variant: 'default' | 'prominent' = 'default';
  export let href: string | undefined = undefined; // Пропускаем href в InfoBadge
  
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
  <div class="salary-range salary-range--{variant}">
    <InfoBadge 
      label=""
      hideLabel={true}
      value={salaryText}
      variant="success"
      {size}
      {href}
    />
  </div>
{/if}

<style>
  .salary-range {
    @apply inline-block;
  }
  
  /* Дополнительные стили для prominent варианта */
  .salary-range--prominent :global(.info-badge) {
    @apply font-bold;
    background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.15);
    animation: salary-glow 4s ease-in-out infinite;
  }
  
  .salary-range--prominent :global(.info-badge__value) {
    @apply text-white tabular-nums;
  }
  
  /* Hover эффекты для prominent */
  .salary-range--prominent :global(.info-badge--link:hover) {
    @apply transform scale-105;
    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.25), 0 2px 4px rgba(16, 185, 129, 0.15);
  }
  
  /* Анимация пульсации для prominent варианта */
  @keyframes salary-glow {
    0%, 100% {
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.15);
    }
    50% {
      box-shadow: 0 4px 8px rgba(16, 185, 129, 0.25), 0 2px 4px rgba(16, 185, 129, 0.15);
    }
  }
  
  /* Табличные цифры для всех вариантов */
  .salary-range :global(.info-badge__value) {
    @apply tabular-nums;
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .salary-range--prominent :global(.info-badge) {
      animation: none;
    }
    
    .salary-range--prominent :global(.info-badge--link:hover) {
      @apply transform-none;
    }
  }
  
  /* Высококонтрастный режим */
  @media (prefers-contrast: high) {
    .salary-range--prominent :global(.info-badge) {
      @apply text-green-900;
      background: theme('colors.green.400');
    }
  }
</style> 