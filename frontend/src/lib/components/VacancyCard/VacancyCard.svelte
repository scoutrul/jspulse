<script lang="ts">
  import type { VacancyDTO, VacancyWithHtml } from '@jspulse/shared/types';
  import { sanitizeDescription } from '$lib/utils/sanitize';
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { saveScrollPosition } from '$lib/stores/scrollStore';
  import { DEFAULT_THEME } from '$lib/constants/theme';
  import { fly } from 'svelte/transition';
  
  import VacancyCardHeader from './VacancyCardHeader.svelte';
  import VacancyCardContent from './VacancyCardContent.svelte';
  import VacancyCardActions from './VacancyCardActions.svelte';
  
  export let vacancy: VacancyDTO | VacancyWithHtml;
  export let backUrl: string = '/';
  export let backLabel: string = 'Вернуться к списку';
  export let showDetailLink: boolean = false; // Для отображения ссылки на детальную страницу
  export let isDetailPage: boolean = false; // Указывает, что это детальная страница
  export let theme: 'light' | 'dark' = DEFAULT_THEME; // Тема карточки (теперь используется только для переопределения глобальной темы)
  export let showDeleteButton: boolean = false; // Показывать ли кнопку удаления
  export let isDeleting: boolean = false; // Состояние удаления для анимации
  
  const dispatch = createEventDispatcher<{
    skillClick: string;
    deleted: { vacancyId: string; title: string }; // Событие удаления
  }>();
  
  $: sanitizedDescription = vacancy?.description ? sanitizeDescription(vacancy.description) : '';
  
  // Вспомогательная функция для получения ID вакансии
  function getVacancyId(vacancy: VacancyDTO | VacancyWithHtml): string {
    return (vacancy as any).id || vacancy._id || '';
  }
  
  function handleSkillClick(event: CustomEvent<string>) {
    dispatch('skillClick', event.detail);
  }
  
  function handleDescriptionClick() {
    if (!isDetailPage) {
      // Сохраняем позицию скролла перед переходом
      saveScrollPosition();
      goto(`/v/${getVacancyId(vacancy)}`, { noScroll: true });
    }
  }

  function handleVacancyDeleted(event: CustomEvent<{ vacancyId: string; title: string }>) {
    // Устанавливаем состояние удаления
    isDeleting = true;
    
    // Небольшая задержка для анимации, затем передаем событие
    setTimeout(() => {
      dispatch('deleted', event.detail);
    }, 200);
  }
</script>

<article 
  class="vacancy-card" 
  class:dark-theme={theme === 'dark'} 
  class:light-theme={theme === 'light'} 
  class:is-deleting={isDeleting}
  data-testid="vacancy-card"
  in:fly={{ y: 20, duration: 300, delay: 100 }}
  out:fly={{ x: -200, opacity: 0, duration: 200 }}
>
  <div class="vacancy-card__container">
    <!-- Header Section -->
    <VacancyCardHeader 
      title={vacancy.title}
      company={vacancy.company}
      location={vacancy.location || undefined}
      publishedAt={typeof vacancy.publishedAt === 'string' ? vacancy.publishedAt : vacancy.publishedAt?.toISOString()}
      vacancyId={getVacancyId(vacancy)}
      {showDetailLink}
      salaryFrom={vacancy.salaryFrom || undefined}
      salaryTo={vacancy.salaryTo || undefined}
      salaryCurrency={vacancy.salaryCurrency || undefined}
      {theme}
    />
    
    <!-- Content Section -->
    <VacancyCardContent 
      experience={vacancy.experience || undefined}
      employment={vacancy.employment || undefined}
      skills={vacancy.skills || []}
      description={sanitizedDescription}
      fullDescription={vacancy.fullDescription}
      processedHtml={vacancy.processedHtml}
      vacancyId={getVacancyId(vacancy)}
      {isDetailPage}
      {theme}
      on:skillClick={handleSkillClick}
      on:descriptionClick={handleDescriptionClick}
    />
    
    <!-- Actions Section -->
    <VacancyCardActions 
      url={vacancy.url}
      source={vacancy.source}
      {backUrl}
      {backLabel}
      vacancyId={getVacancyId(vacancy)}
      vacancyTitle={vacancy.title}
      {showDeleteButton}
      on:deleted={handleVacancyDeleted}
    />
  </div>
  
  <!-- Градиентный декоративный элемент -->
  <div class="vacancy-card__gradient" aria-hidden="true"></div>
</article>

<style>
  .vacancy-card {
    @apply relative w-full;
    /* По умолчанию темная тема */
    @apply bg-slate-800 border-slate-700 rounded-lg;
    @apply shadow-sm;
    @apply overflow-hidden;
    @apply transition-all duration-300 ease-in-out;
    
    /* Поддержка растягивания по высоте в сетке */
    @apply flex flex-col;
    
    /* Темная цветовая схема по умолчанию */
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.2), 
      0 1px 2px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  /* Состояние удаления */
  .vacancy-card.is-deleting {
    @apply opacity-50 scale-95;
    @apply bg-red-900 border-red-600;
    transform: translateX(-10px) scale(0.95);
    transition: all 0.2s ease-in-out;
  }

  /* Светлая тема как переопределение */
  :global(:not(.dark)) .vacancy-card {
    @apply bg-white border border-neutral-200;
    
    /* Светлая цветовая схема */
    background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.04), 
      0 1px 2px rgba(0, 0, 0, 0.06);
  }
    
  /* Глобальная темная тема */
  :global(.dark) .vacancy-card {
    @apply bg-slate-800 border-slate-700;
    
    /* Темная цветовая схема */
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    
    /* Подстроенная тень для темной темы */
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.2), 
      0 1px 2px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  /* Локальная темная тема карточки (для переопределения) */
  .vacancy-card.dark-theme {
    @apply bg-slate-800 border-slate-700;
    
    /* Темная цветовая схема */
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    
    /* Подстроенная тень для темной темы */
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.2), 
      0 1px 2px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  /* Локальная светлая тема карточки (для переопределения глобальной темной темы) */
  :global(.dark) .vacancy-card.light-theme {
    @apply bg-white border border-neutral-200;
    
    /* Светлая цветовая схема */
    background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
    
    /* Светлая тень */
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.04), 
      0 1px 2px rgba(0, 0, 0, 0.06);
  }
  
  .vacancy-card__container {
    @apply relative p-4 sm:p-5;
    @apply z-10;
    @apply flex-1 flex flex-col; /* Растягиваем контейнер и делаем его flex */
  }
  
  .vacancy-card__gradient {
    @apply absolute bottom-0 left-0 right-0 h-0.5;
    /* По умолчанию темная тема */
    background: linear-gradient(90deg, 
      theme('colors.purple.400') 0%, 
      theme('colors.indigo.500') 50%, 
      theme('colors.blue.600') 100%);
    opacity: 0.8;
    transition: all 0.3s ease-in-out;
  }

  /* Светлая тема для градиента */
  :global(:not(.dark)) .vacancy-card__gradient {
    background: linear-gradient(90deg, 
      theme('colors.warning.400') 0%, 
      theme('colors.warning.500') 50%, 
      theme('colors.warning.600') 100%);
    opacity: 0.7;
  }

  /* Глобальная темная тема для градиента */
  :global(.dark) .vacancy-card__gradient {
    background: linear-gradient(90deg, 
      theme('colors.purple.400') 0%, 
      theme('colors.indigo.500') 50%, 
      theme('colors.blue.600') 100%);
    opacity: 0.8;
  }

  /* Локальная темная тема для градиента */
  .vacancy-card.dark-theme .vacancy-card__gradient {
    background: linear-gradient(90deg, 
      theme('colors.purple.400') 0%, 
      theme('colors.indigo.500') 50%, 
      theme('colors.blue.600') 100%);
    opacity: 0.8;
  }

  /* Локальная светлая тема для градиента (переопределение глобальной темной) */
  :global(.dark) .vacancy-card.light-theme .vacancy-card__gradient {
    background: linear-gradient(90deg, 
      theme('colors.warning.400') 0%, 
      theme('colors.warning.500') 50%, 
      theme('colors.warning.600') 100%);
    opacity: 0.7;
  }
  
  /* Focus state для accessibility */
  .vacancy-card:focus-within {
    @apply outline-2 outline-offset-2 outline-primary-500;
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.04), 
      0 1px 2px rgba(0, 0, 0, 0.06),
      0 0 0 2px theme('colors.primary.300');
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .vacancy-card {
      @apply rounded-md;
    }
    
    .vacancy-card__container {
      @apply p-3 sm:p-4;
    }
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .vacancy-card {
      transition: none;
    }
  }
  
  /* Высококонтрастный режим */
  @media (prefers-contrast: high) {
    .vacancy-card {
      @apply border-2 border-neutral-400;
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    
    :global(.dark) .vacancy-card {
      @apply border-2 border-slate-400;
      background: #1e293b;
      box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
    }
    
    .vacancy-card.dark-theme {
      @apply border-2 border-slate-400;
      background: #1e293b;
      box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
    }
    
    :global(.dark) .vacancy-card.light-theme {
      @apply border-2 border-neutral-400;
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    
    .vacancy-card__gradient {
      @apply bg-warning-600;
      background: theme('colors.warning.600');
    }
    
    :global(.dark) .vacancy-card__gradient {
      @apply bg-purple-500;
      background: theme('colors.purple.500');
    }
    
    .vacancy-card.dark-theme .vacancy-card__gradient {
      @apply bg-purple-500;
      background: theme('colors.purple.500');
    }
    
    :global(.dark) .vacancy-card.light-theme .vacancy-card__gradient {
      @apply bg-warning-600;
      background: theme('colors.warning.600');
    }
    
    .vacancy-card:focus-within {
      @apply border-2 border-primary-600;
    }
    
    :global(.dark) .vacancy-card:focus-within {
      @apply border-2 border-purple-400;
    }
    
    .vacancy-card.dark-theme:focus-within {
      @apply border-2 border-purple-400;
    }
    
    :global(.dark) .vacancy-card.light-theme:focus-within {
      @apply border-2 border-primary-600;
    }
  }
  
  /* Print styles */
  @media print {
    .vacancy-card {
      @apply shadow-none border border-neutral-400;
      @apply break-inside-avoid;
    }
    
    .vacancy-card__gradient {
      @apply hidden;
    }
  }
</style> 