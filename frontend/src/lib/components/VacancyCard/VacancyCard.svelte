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

<article class="vacancy-card">
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
    />
    
    <!-- Content Section -->
    <VacancyCardContent 
      experience={vacancy.experience || undefined}
      employment={vacancy.employment || undefined}
      skills={vacancy.skills || []}
      description={sanitizedDescription}
      fullDescription={vacancy.fullDescription}
      processedHtml={vacancy.processedHtml}
      {isDetailPage}
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
    
    /* Используем дизайн-систему без излишеств */
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.04), 
      0 1px 2px rgba(0, 0, 0, 0.06);
    
    /* Subtle gradient background */
    background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
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
    
    .vacancy-card__gradient {
      @apply bg-warning-600;
      background: theme('colors.warning.600');
    }
    
    .vacancy-card:focus-within {
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