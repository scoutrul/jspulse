<script lang="ts">
  import InfoBadge from '../ui/InfoBadge.svelte';
  import SalaryRange from '../ui/SalaryRange.svelte';
  
  export let title: string;
  export let company: string;
  export let location: string | undefined = undefined;
  export let publishedAt: string | undefined = undefined;
  export let vacancyId: string | undefined = undefined;
  export let showDetailLink: boolean = false;
  export let salaryFrom: number | undefined | null = undefined;
  export let salaryTo: number | undefined | null = undefined;
  export let salaryCurrency: string | undefined = undefined;
  
  $: formattedDate = publishedAt ? new Date(publishedAt).toLocaleDateString('ru-RU') : '';
  $: hasSalary = salaryFrom !== undefined || salaryTo !== undefined;
</script>

<header class="vacancy-header">
  {#if showDetailLink && vacancyId}
    <h1 class="vacancy-title">
      <a href="/v/{vacancyId}" class="title-link">
        {title}
      </a>
    </h1>
  {:else}
    <h1 class="vacancy-title">{title}</h1>
  {/if}
  
  <div class="vacancy-meta">
    <InfoBadge 
      label="Компания" 
      value={company} 
      variant="primary" 
      size="md"
    />
    
    {#if location}
      <InfoBadge 
        label="Местоположение" 
        value={location} 
        variant="info" 
        size="sm"
      />
    {/if}
    
    {#if formattedDate}
      <InfoBadge 
        label="Опубликовано" 
        value={formattedDate} 
        variant="default" 
        size="sm"
      />
    {/if}
    <!-- Зарплата в хедере -->
    {#if hasSalary}
      <SalaryRange 
        {salaryFrom} 
        {salaryTo} 
        currency={salaryCurrency || 'руб.'} 
        variant="prominent" 
        size="sm" 
      />
    {/if}
  </div>
  
</header>

<style>
  .vacancy-header {
    @apply relative;
    @apply border-b border-neutral-200;
    @apply pb-4 mb-4;
  }
  
  .vacancy-title {
    @apply text-xl sm:text-2xl font-bold leading-tight;
    @apply mb-3 m-0;
    
    /* Применяем warning gradient как в дизайн-системе */
    background: linear-gradient(135deg, theme('colors.warning.600') 0%, theme('colors.warning.500') 50%, theme('colors.warning.400') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .title-link {
    @apply no-underline;
    @apply transition-all duration-200;
    @apply focus:outline-2 focus:outline-offset-2 focus:outline-primary-500;
    @apply rounded-sm;
    
    /* Наследуем градиент от родителя */
    background: inherit;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .title-link:hover {
    @apply transform scale-105;
    filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.25));
  }
  
  .vacancy-meta {
    @apply flex flex-wrap gap-2;
    @apply items-center;
    @apply mb-3;
  }
  
  .salary-container {
    @apply bg-green-50 border border-green-200 rounded-lg p-3;
    @apply text-center;
    background: linear-gradient(135deg, rgba(236, 253, 245, 1) 0%, rgba(209, 250, 229, 0.5) 100%);
    box-shadow: 0 1px 3px rgba(16, 185, 129, 0.08);
  }
  
  /* Responsive design */
  @media (max-width: 640px) {
    .vacancy-title {
      @apply text-lg;
    }
    
    .vacancy-meta {
      @apply flex-col items-start gap-2;
    }
    
    .salary-container {
      @apply p-2;
    }
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .title-link {
      transition: none;
    }
    
    .title-link:hover {
      @apply transform-none;
      filter: none;
    }
  }
  
  /* Высококонтрастный режим */
  @media (prefers-contrast: high) {
    .vacancy-header {
      @apply border-b-2 border-neutral-600;
    }
    
    .vacancy-title,
    .title-link {
      @apply text-warning-700;
      -webkit-text-fill-color: theme('colors.warning.700');
    }
    
    .salary-container {
      @apply border-2 border-green-600 bg-green-100;
    }
  }
</style> 