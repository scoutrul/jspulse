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
  export let theme: 'light' | 'dark' = 'light';
  
  $: formattedDate = publishedAt ? new Date(publishedAt).toLocaleDateString('ru-RU') : '';
  $: hasSalary = salaryFrom !== undefined || salaryTo !== undefined;
</script>

<header class="vacancy-header flex flex-col gap-4" class:dark-theme={theme === 'dark'}>
  <div class="flex gap-2 justify-between items-baseline">
    {#if showDetailLink && vacancyId}
      <h1 class="vacancy-title">
        <a href="/v/{vacancyId}" class="title-link">
          {title}
        </a>
      </h1>
    {:else}
      <h1 class="vacancy-title">{title}</h1>
    {/if}
    
    {#if hasSalary}
      <SalaryRange 
        {salaryFrom} 
        {salaryTo} 
        currency={salaryCurrency || 'руб.'} 
        variant="prominent" 
        size="sm" 
        darkTheme={theme === 'dark'}
      />
    {:else}
      <InfoBadge 
        label="" 
        hideLabel={true}
        value="Оплата не указана"    
        size="sm"
        variant="flat" 
        darkTheme={theme === 'dark'}
      />
    {/if}
  </div>  
  <div class="vacancy-meta">
    <InfoBadge 
      label="Компания" 
      hideLabel={true}
      value={company} 
      variant="primary" 
      size="sm"
      darkTheme={theme === 'dark'}
    />
    
    {#if location}
      <InfoBadge 
        label="Локация" 
        value={location} 
        variant="info" 
        size="sm"
        darkTheme={theme === 'dark'}
      />
    {/if}
    
    {#if formattedDate}
    <div class="ml-auto">
      <InfoBadge 
        label="Опубликовано" 
        value={formattedDate} 
        variant="flat" 
        size="sm"
        darkTheme={theme === 'dark'}
      />
    </div>
    {/if}
  </div>
  
</header>

<style>
  .vacancy-header {
    @apply relative;
    @apply border-b border-neutral-200;
    @apply pb-4 mb-4;
    @apply transition-all duration-300 ease-in-out;
  }

  /* Темная тема для хедера */
  .vacancy-header.dark-theme {
    @apply border-b border-slate-600;
  }
  
  .vacancy-title {
    @apply text-xl sm:text-2xl font-bold leading-tight;
    @apply m-0;
    @apply transition-all duration-300 ease-in-out;
    
    /* Применяем warning gradient как в дизайн-системе */
    background: linear-gradient(135deg, theme('colors.warning.600') 0%, theme('colors.warning.500') 50%, theme('colors.warning.400') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Темная тема для заголовка */
  .vacancy-header.dark-theme .vacancy-title {
    /* Градиент в стиле темной темы: фиолетово-синий */
    background: linear-gradient(135deg, theme('colors.purple.400') 0%, theme('colors.indigo.400') 50%, theme('colors.blue.400') 100%);
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

  /* Темная тема для ссылки заголовка */
  .vacancy-header.dark-theme .title-link {
    @apply focus:outline-purple-400;
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
  
  /* Responsive design */
  @media (max-width: 640px) {
    .vacancy-title {
      @apply text-lg;
    }
    
    .vacancy-meta {
      @apply flex-col items-start gap-2;
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
    
    .vacancy-header.dark-theme {
      @apply border-b-2 border-slate-400;
    }
    
    .vacancy-title,
    .title-link {
      @apply text-warning-700;
      -webkit-text-fill-color: theme('colors.warning.700');
    }
    
    .vacancy-header.dark-theme .vacancy-title,
    .vacancy-header.dark-theme .title-link {
      @apply text-purple-300;
      -webkit-text-fill-color: theme('colors.purple.300');
    }
  }
</style> 