<script lang="ts">
  
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
  $: hasSalary = salaryFrom != null || salaryTo != null;
</script>

<header class="vacancy-header flex flex-col gap-2" class:dark-theme={theme === 'dark'} class:light-theme={theme === 'light'}>
  <div class="row-top">
    <div class="title-wrap">
      {#if showDetailLink && vacancyId}
        <h1 class="vacancy-title">
          <a href="/v/{vacancyId}" class="title-link">{title}</a>
        </h1>
      {:else}
        <h1 class="vacancy-title">{title}</h1>
      {/if}
    </div>

    <div class="salary-wrap">
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
        <span class="salary-missing">Оплата не указана</span>
      {/if}
    </div>
  </div>

  <div class="row-meta">
    <div class="meta-left">
      <span class="company-strong">{company}</span>
      {#if location}
        <span class="dot-sep">•</span>
        <span class="location-text">{location}</span>
      {/if}
    </div>
    {#if formattedDate}
      <div class="meta-right">
        <span class="published-label">Опубликовано:</span>
        <span class="published-date">{formattedDate}</span>
      </div>
    {/if}
  </div>
</header>

<style>
  .vacancy-header {
    @apply relative;
    /* По умолчанию темная тема */
    @apply border-b border-slate-600;
    @apply pb-4 mb-4;
    @apply transition-all duration-300 ease-in-out;
  }

  /* Светлая тема для хедера */
  :global(:not(.dark)) .vacancy-header {
    @apply border-b border-neutral-200;
  }

  /* Глобальная темная тема для хедера */
  :global(.dark) .vacancy-header {
    @apply border-b border-slate-600;
  }

  /* Локальная темная тема для хедера */
  .vacancy-header.dark-theme {
    @apply border-b border-slate-600;
  }

  /* Локальная светлая тема для хедера (переопределение глобальной темной) */
  :global(.dark) .vacancy-header.light-theme {
    @apply border-b border-neutral-200;
  }
  
  .vacancy-title {
    @apply text-xl sm:text-2xl font-bold leading-tight;
    @apply m-0;
    @apply transition-all duration-300 ease-in-out;
    
    /* По умолчанию темная тема - фиолетово-синий градиент */
    background: linear-gradient(135deg, theme('colors.purple.400') 0%, theme('colors.indigo.400') 50%, theme('colors.blue.400') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Светлая тема для заголовка */
  :global(:not(.dark)) .vacancy-title {
    background: linear-gradient(135deg, theme('colors.warning.600') 0%, theme('colors.warning.500') 50%, theme('colors.warning.400') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Глобальная темная тема для заголовка */
  :global(.dark) .vacancy-title {
    /* Градиент в стиле темной темы: фиолетово-синий */
    background: linear-gradient(135deg, theme('colors.purple.400') 0%, theme('colors.indigo.400') 50%, theme('colors.blue.400') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Локальная темная тема для заголовка */
  .vacancy-header.dark-theme .vacancy-title {
    /* Градиент в стиле темной темы: фиолетово-синий */
    background: linear-gradient(135deg, theme('colors.purple.400') 0%, theme('colors.indigo.400') 50%, theme('colors.blue.400') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Локальная светлая тема для заголовка (переопределение глобальной темной) */
  :global(.dark) .vacancy-header.light-theme .vacancy-title {
    background: linear-gradient(135deg, theme('colors.warning.600') 0%, theme('colors.warning.500') 50%, theme('colors.warning.400') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .title-link {
    @apply no-underline;
    @apply transition-all duration-200;
    /* По умолчанию темная тема */
    @apply focus:outline-2 focus:outline-offset-2 focus:outline-purple-400;
    @apply rounded-sm;
    
    /* Наследуем градиент от родителя */
    background: inherit;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Светлая тема для ссылки заголовка */
  :global(:not(.dark)) .title-link {
    @apply focus:outline-primary-500;
  }

  /* Глобальная темная тема для ссылки заголовка */
  :global(.dark) .title-link {
    @apply focus:outline-purple-400;
  }

  /* Локальная темная тема для ссылки заголовка */
  .vacancy-header.dark-theme .title-link {
    @apply focus:outline-purple-400;
  }

  /* Локальная светлая тема для ссылки заголовка (переопределение глобальной темной) */
  :global(.dark) .vacancy-header.light-theme .title-link {
    @apply focus:outline-primary-500;
  }
  
  .title-link:hover {
    @apply transform scale-105;
    filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.25));
  }
  
  /* Верхний ряд: заголовок слева, зарплата справа */
  .row-top {
    @apply flex items-baseline justify-between gap-3;
  }

  .title-wrap { @apply flex-1 min-w-0; }
  .salary-wrap { @apply shrink-0; }
  
  .salary-missing {
    @apply text-sm font-medium;
    /* По умолчанию темная тема */
    @apply text-slate-400;
  }
  
  /* Светлая тема для "Оплата не указана" */
  :global(:not(.dark)) .salary-missing { 
    @apply text-neutral-500; 
  }
  
  /* Глобальная темная тема для "Оплата не указана" */
  :global(.dark) .salary-missing { 
    @apply text-slate-400; 
  }
  
  /* Локальная темная тема для "Оплата не указана" */
  .vacancy-header.dark-theme .salary-missing { 
    @apply text-slate-400; 
  }
  
  /* Локальная светлая тема для "Оплата не указана" (переопределение глобальной темной) */
  :global(.dark) .vacancy-header.light-theme .salary-missing { 
    @apply text-neutral-500; 
  }

  /* Нижний ряд: компания (важно) + локация слева, дата справа */
  .row-meta {
    @apply flex items-center justify-between gap-3;
  }

  .meta-left { @apply flex items-center gap-2 min-w-0; }
  
  .company-strong {
    @apply text-base font-semibold;
    /* По умолчанию темная тема */
    @apply text-white;
  }
  
  /* Светлая тема для названия компании */
  :global(:not(.dark)) .company-strong { 
    @apply text-neutral-900; 
  }
  
  /* Глобальная темная тема для названия компании */
  :global(.dark) .company-strong { 
    @apply text-white; 
  }
  
  /* Локальная темная тема для названия компании */
  .vacancy-header.dark-theme .company-strong { 
    @apply text-white; 
  }
  
  /* Локальная светлая тема для названия компании (переопределение глобальной темной) */
  :global(.dark) .vacancy-header.light-theme .company-strong { 
    @apply text-neutral-900; 
  }

  .dot-sep { 
    @apply opacity-40;
    /* По умолчанию темная тема */
    @apply text-slate-300;
  }
  
  /* Светлая тема для разделителя */
  :global(:not(.dark)) .dot-sep { 
    @apply text-neutral-500; 
  }
  
  /* Глобальная темная тема для разделителя */
  :global(.dark) .dot-sep { 
    @apply text-slate-300; 
  }
  
  /* Локальная темная тема для разделителя */
  .vacancy-header.dark-theme .dot-sep { 
    @apply text-slate-300; 
  }
  
  /* Локальная светлая тема для разделителя (переопределение глобальной темной) */
  :global(.dark) .vacancy-header.light-theme .dot-sep { 
    @apply text-neutral-500; 
  }

  .location-text { 
    @apply text-sm;
    /* По умолчанию темная тема */
    @apply text-slate-300;
  }
  
  /* Светлая тема для локации */
  :global(:not(.dark)) .location-text { 
    @apply text-neutral-600; 
  }
  
  /* Глобальная темная тема для локации */
  :global(.dark) .location-text { 
    @apply text-slate-300; 
  }
  
  /* Локальная темная тема для локации */
  .vacancy-header.dark-theme .location-text { 
    @apply text-slate-300; 
  }
  
  /* Локальная светлая тема для локации (переопределение глобальной темной) */
  :global(.dark) .vacancy-header.light-theme .location-text { 
    @apply text-neutral-600; 
  }

  .meta-right { @apply flex items-center gap-1; }
  
  .published-label { 
    @apply text-xs;
    /* По умолчанию темная тема */
    @apply text-slate-400;
  }
  
  /* Светлая тема для лейбла даты */
  :global(:not(.dark)) .published-label { 
    @apply text-neutral-500; 
  }
  
  /* Глобальная темная тема для лейбла даты */
  :global(.dark) .published-label { 
    @apply text-slate-400; 
  }
  
  /* Локальная темная тема для лейбла даты */
  .vacancy-header.dark-theme .published-label { 
    @apply text-slate-400; 
  }
  
  /* Локальная светлая тема для лейбла даты (переопределение глобальной темной) */
  :global(.dark) .vacancy-header.light-theme .published-label { 
    @apply text-neutral-500; 
  }
  
  .published-date { 
    @apply text-xs font-semibold;
    /* По умолчанию темная тема */
    @apply text-slate-200;
  }
  
  /* Светлая тема для даты */
  :global(:not(.dark)) .published-date { 
    @apply text-neutral-700; 
  }
  
  /* Глобальная темная тема для даты */
  :global(.dark) .published-date { 
    @apply text-slate-200; 
  }
  
  /* Локальная темная тема для даты */
  .vacancy-header.dark-theme .published-date { 
    @apply text-slate-200; 
  }
  
  /* Локальная светлая тема для даты (переопределение глобальной темной) */
  :global(.dark) .vacancy-header.light-theme .published-date { 
    @apply text-neutral-700; 
  }
  
  /* Responsive design */
  @media (max-width: 640px) {
    .vacancy-title {
      @apply text-lg;
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
    
    :global(.dark) .vacancy-header {
      @apply border-b-2 border-slate-400;
    }
    
    .vacancy-header.dark-theme {
      @apply border-b-2 border-slate-400;
    }
    
    :global(.dark) .vacancy-header.light-theme {
      @apply border-b-2 border-neutral-600;
    }
    
    .vacancy-title,
    .title-link {
      @apply text-warning-700;
      -webkit-text-fill-color: theme('colors.warning.700');
    }
    
    :global(.dark) .vacancy-title,
    :global(.dark) .title-link {
      @apply text-purple-300;
      -webkit-text-fill-color: theme('colors.purple.300');
    }
    
    .vacancy-header.dark-theme .vacancy-title,
    .vacancy-header.dark-theme .title-link {
      @apply text-purple-300;
      -webkit-text-fill-color: theme('colors.purple.300');
    }
    
    :global(.dark) .vacancy-header.light-theme .vacancy-title,
    :global(.dark) .vacancy-header.light-theme .title-link {
      @apply text-warning-700;
      -webkit-text-fill-color: theme('colors.warning.700');
    }
  }
</style> 