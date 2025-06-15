<script lang="ts">
  import type { VacancyDTO, VacancyWithHtml } from '@jspulse/shared/types';
  import { sanitizeDescription } from '$lib/utils/sanitize';
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { saveScrollPosition } from '$lib/stores/scrollStore';
  
  import VacancyCardHeader from './VacancyCardHeader.svelte';
  import VacancyCardContent from './VacancyCardContent.svelte';
  import VacancyCardActions from './VacancyCardActions.svelte';
  
  export let vacancy: VacancyDTO | VacancyWithHtml;
  export let backUrl: string = '/';
  export let backLabel: string = 'Вернуться к списку';
  export let showDetailLink: boolean = false; // Для отображения ссылки на детальную страницу
  export let isDetailPage: boolean = false; // Указывает, что это детальная страница
  export let theme: 'light' | 'dark' = 'light'; // Тема карточки для шахматной схемы
  
  const dispatch = createEventDispatcher<{
    skillClick: string;
  }>();
  
  $: sanitizedDescription = vacancy?.description ? sanitizeDescription(vacancy.description) : '';
  
  function handleSkillClick(event: CustomEvent<string>) {
    dispatch('skillClick', event.detail);
  }
  
  function handleDescriptionClick() {
    if (!isDetailPage) {
      // Сохраняем позицию скролла перед переходом
      saveScrollPosition();
      goto(`/v/${vacancy._id}`, { noScroll: true });
    }
  }
</script>

<article class="vacancy-card" class:dark-theme={theme === 'dark'}>
  <div class="vacancy-card__container">
    <!-- Header Section -->
    <VacancyCardHeader 
      title={vacancy.title}
      company={vacancy.company}
      location={vacancy.location || undefined}
      publishedAt={typeof vacancy.publishedAt === 'string' ? vacancy.publishedAt : vacancy.publishedAt?.toISOString()}
      vacancyId={vacancy._id}
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
      vacancyId={vacancy._id}
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
    />
  </div>
  
  <!-- Градиентный декоративный элемент -->
  <div class="vacancy-card__gradient" aria-hidden="true"></div>
</article>

<style>
  .vacancy-card {
    @apply relative w-full;
    @apply bg-white border border-neutral-200 rounded-lg;
    @apply shadow-sm;
    @apply overflow-hidden;
    @apply transition-all duration-300 ease-in-out;
    
    /* Используем дизайн-систему без излишеств */
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.04), 
      0 1px 2px rgba(0, 0, 0, 0.06);
    
    /* Subtle gradient background */
    background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
  }

  /* Темная тема карточки */
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
  
  .vacancy-card__container {
    @apply relative p-4 sm:p-5;
    @apply z-10;
  }
  
  .vacancy-card__gradient {
    @apply absolute bottom-0 left-0 right-0 h-0.5;
    background: linear-gradient(90deg, 
      theme('colors.warning.400') 0%, 
      theme('colors.warning.500') 50%, 
      theme('colors.warning.600') 100%);
    opacity: 0.7;
    transition: all 0.3s ease-in-out;
  }

  /* Градиент для темной темы */
  .vacancy-card.dark-theme .vacancy-card__gradient {
    background: linear-gradient(90deg, 
      theme('colors.purple.400') 0%, 
      theme('colors.indigo.500') 50%, 
      theme('colors.blue.600') 100%);
    opacity: 0.8;
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
    
    .vacancy-card.dark-theme {
      @apply border-2 border-slate-400;
      background: #1e293b;
      box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
    }
    
    .vacancy-card__gradient {
      @apply bg-warning-600;
      background: theme('colors.warning.600');
    }
    
    .vacancy-card.dark-theme .vacancy-card__gradient {
      @apply bg-purple-500;
      background: theme('colors.purple.500');
    }
    
    .vacancy-card:focus-within {
      @apply border-2 border-primary-600;
    }
    
    .vacancy-card.dark-theme:focus-within {
      @apply border-2 border-purple-400;
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