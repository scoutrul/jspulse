<script lang="ts">
  import SkillTag from '../ui/SkillTag.svelte';
  import { createEventDispatcher } from 'svelte';
  import { processDescription } from '$lib/utils/sanitize';
  import { preloadData } from '$app/navigation';
  
  export let experience: string | undefined = undefined;
  export let employment: string | undefined = undefined;
  export let skills: string[] = [];
  export let description: string | undefined = undefined;
  export let fullDescription: any = undefined; // DescriptionContent из backend
  export let processedHtml: string | undefined = undefined;
  export let isDetailPage: boolean = false;
  export let vacancyId: string | undefined = undefined; // Добавляем ID для префетча
  export let theme: 'light' | 'dark' = 'light';
  
  const dispatch = createEventDispatcher<{
    skillClick: string;
    descriptionClick: void;
  }>();
  
  // Парсим fullDescription если это JSON строка
  $: parsedFullDescription = (() => {
    if (!fullDescription) return undefined;
    
    // Если уже объект, возвращаем как есть
    if (typeof fullDescription === 'object') {
      console.log('✅ fullDescription уже объект:', fullDescription);
      return fullDescription;
    }
    
    // Если строка, пытаемся парсить JSON
    if (typeof fullDescription === 'string') {
      try {
        const parsed = JSON.parse(fullDescription);
        console.log('✅ Успешно распарсили fullDescription:', {
          hasRaw: !!parsed.raw,
          hasProcessed: !!parsed.processed,
          hasPreview: !!parsed.preview,
          processedLength: parsed.processed?.length
        });
        return parsed;
      } catch (e) {
        console.error('❌ Failed to parse fullDescription JSON:', e);
        return undefined;
      }
    }
    
    return undefined;
  })();
  
  // Обработка контента для отображения
  $: displayContent = (() => {
    if (isDetailPage) {
      // Для страницы деталей показываем полный контент
      return parsedFullDescription?.processed || processedHtml || description || '';
    } else {
      // Для карточки показываем preview
      if (parsedFullDescription?.preview) {
        return parsedFullDescription.preview;
      } else if (processedHtml || description) {
        // Создаем preview из имеющегося контента
        const content = processedHtml || description || '';
        return processDescription(content, 'preview', 220);
      }
      return '';
    }
  })();
  
  $: hasRequirements = experience || employment;
  $: hasSkills = skills && skills.length > 0;
  $: hasRequirementsOrSkills = hasRequirements || hasSkills;
  $: hasDescription = displayContent && displayContent.trim().length > 0;
  
  function handleSkillClick(skill: string) {
    dispatch('skillClick', skill);
  }
  
  function handleDescriptionClick() {
    if (!isDetailPage && hasDescription) {
      dispatch('descriptionClick');
    }
  }
  
  // Префетч страницы при наведении для оптимизации
  async function handleDescriptionHover() {
    if (!isDetailPage && hasDescription && vacancyId) {
      try {
        await preloadData(`/v/${vacancyId}`);
        console.debug('✅ Prefetched vacancy page:', vacancyId);
      } catch (error) {
        // Игнорируем ошибки префетча - это не критично
        console.debug('❌ Prefetch failed for vacancy:', vacancyId, error);
      }
    }
  }
</script>

<div class="vacancy-content" class:dark-theme={theme === 'dark'}>
  <!-- Два блока: Требования и Навыки -->
  {#if hasRequirementsOrSkills}
    <div class="requirements-container">
      <!-- Блок 1: Требования (опыт + занятость) -->
      {#if hasRequirements}
        <section class="content-section requirements-section">
          <h3 class="section-title">Требования</h3>
          <div class="requirements-grid">
            {#if experience}
              <div class="requirement-item">
                <span class="requirement-label">Опыт работы:</span>
                <span class="requirement-value">{experience}</span>
              </div>
            {/if}
            
            {#if employment}
              <div class="requirement-item">
                <span class="requirement-label">Тип занятости:</span>
                <span class="requirement-value">{employment}</span>
              </div>
            {/if}
          </div>
        </section>
      {/if}
      
      <!-- Блок 2: Навыки -->
      {#if hasSkills}
        <section class="content-section skills-section">
          <h3 class="section-title">Требуемые навыки</h3>
          <div class="skills-container">
            {#each skills as skill}
              <SkillTag 
                {skill} 
                variant={theme === 'dark' ? 'primary' : 'outline'} 
                size="md" 
                interactive={true}
                onClick={handleSkillClick}
                darkTheme={theme === 'dark'}
              />
            {/each}
          </div>
        </section>
      {/if}
    </div>
  {/if}

  <!-- Описание без лишней вложенности -->
  {#if hasDescription}
    <div 
      id={isDetailPage ? 'vacancy-description' : undefined} 
      class="description-container" 
      class:clickable={!isDetailPage}
      class:detail-page={isDetailPage}
      on:click={handleDescriptionClick}
      on:mouseenter={handleDescriptionHover}
      on:keydown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDetailPage) {
          e.preventDefault();
          handleDescriptionClick();
        }
      }}
      tabindex={!isDetailPage ? 0 : null}
      role={!isDetailPage ? 'button' : 'region'}
      aria-label={!isDetailPage ? 'Нажмите для просмотра полного описания вакансии' : 'Описание вакансии'}
    >
      <div class="description-content">
        {#if displayContent.includes('<')}
          {@html displayContent}
        {:else}
          <p class="description-text">{displayContent}</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .vacancy-content {
    @apply flex flex-col gap-6 w-full;
    @apply flex-1; /* Растягиваем контент на всю доступную высоту */
  }
  
  /* Контейнер для требований и навыков в строку */
  .requirements-container {
    @apply flex flex-wrap gap-6 w-full;
  }
  
  .content-section {
    @apply relative;
  }
  
  .section-title {
    @apply text-base font-semibold mb-3 m-0;
    @apply text-neutral-800;
    
    /* Subtle gradient для заголовков секций */
    background: linear-gradient(135deg, theme('colors.neutral.800') 0%, theme('colors.neutral.600') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  /* Блок требований (опыт + занятость) */
  .requirements-section {
    @apply bg-neutral-50 border border-neutral-200 rounded-lg p-4;
    @apply border-l-4 border-l-primary-500;
    @apply flex-1 min-w-80;
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }
  
  /* Блок навыков */
  .skills-section {
    @apply bg-neutral-50 border border-neutral-200 rounded-lg p-4;
    @apply border-l-4 border-l-success-500;
    @apply flex-1 min-w-80;
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }
  
  .requirements-grid {
    @apply flex flex-col gap-2;
  }
  
  .requirement-item {
    @apply flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2;
  }
  
  .requirement-label {
    @apply font-medium text-neutral-600 text-sm;
    @apply sm:min-w-32;
  }
  
  .requirement-value {
    @apply font-semibold text-neutral-800;
  }
  
  .skills-container {
    @apply flex flex-wrap gap-2;
  }
  
  /* Описание - выделенный блок с серой палитрой (как у требований) */
  .description-container {
    @apply relative transition-all duration-200 ease-in-out;
    @apply bg-neutral-50 border border-neutral-200 rounded-lg p-4;
    @apply border-l-4 border-l-primary-500;
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }
  
  .description-container.clickable {
    @apply cursor-pointer;
    @apply focus:outline-2 focus:outline-offset-2 focus:outline-primary-500;
    @apply hover:border-neutral-300 hover:shadow-md;
    transition: all 0.2s ease-in-out;
  }
  
  .description-container.clickable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
  
  /* Контент описания */
  .description-content {
    @apply w-full;
    /* Убираем все возможные hover эффекты у дочерних элементов */
    pointer-events: none;
  }
  
  .description-content * {
    /* Отключаем интерактивность дочерних элементов */
    pointer-events: none !important;
    /* Убираем возможные фоновые эффекты */
    background-color: transparent !important;
    /* Сбрасываем все transitions */
    transition: none !important;
    transform: none !important;
  }
  
  .description-text {
    @apply text-neutral-700 leading-relaxed m-0;
    /* Line clamp для карточек */
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.6;
  }
  
  /* Стили для HTML контента */
  .description-content :global(p) {
    @apply text-neutral-700 leading-relaxed m-0;
    @apply mb-2 last:mb-0;
  }
  
  .description-content :global(h1),
  .description-content :global(h2),
  .description-content :global(h3) {
    @apply text-neutral-800 font-semibold mb-2 mt-3 first:mt-0;
    @apply text-sm;
  }
  
  .description-content :global(ul),
  .description-content :global(ol) {
    @apply mb-2 last:mb-0 pl-4;
  }
  
  .description-content :global(li) {
    @apply text-neutral-700 mb-1 last:mb-0;
    @apply text-sm leading-relaxed;
  }
  
  .description-content :global(strong),
  .description-content :global(b) {
    @apply font-semibold text-neutral-800;
  }
  
  .description-content :global(em),
  .description-content :global(i) {
    @apply italic;
  }
  
  /* Ограничение высоты для карточек (не для detail page) */
  .description-container:not(.detail-page) .description-content {
    max-height: 6.4em; /* ~4 lines at 1.6 line-height */
    overflow: hidden;
    position: relative;
  }

  
  /* Responsive design */
  @media (max-width: 640px) {
    .vacancy-content {
      @apply gap-4;
    }
    
    .requirements-container {
      @apply flex-col gap-4;
    }
    
    .requirements-section,
    .skills-section {
      @apply min-w-0;
    }
    
    .description-container {
      @apply min-w-0;
    }
    
    .description-container.clickable:hover {
      transform: none;
    }
    
    .description-text {
      -webkit-line-clamp: 3;
    }
    
    .description-container:not(.detail-page) .description-content {
      max-height: 4.8em; /* ~3 lines */
    }
    
    .content-section {
      @apply p-3;
    }
    
    .requirements-grid {
      @apply gap-2;
    }
    
    .requirement-item {
      @apply flex-col gap-1;
    }
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .content-section {
      transition: none;
    }
    
    .description-container {
      transition: none;
    }
    
    .description-container.clickable:hover {
      transform: none;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
  }

  /* === ТЕМНАЯ ТЕМА === */
  .vacancy-content.dark-theme .section-title {
    @apply text-slate-200;
    background: linear-gradient(135deg, theme('colors.slate.200') 0%, theme('colors.slate.300') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .vacancy-content.dark-theme .requirements-section {
    @apply bg-slate-700 border-slate-600;
    @apply border-l-purple-400;
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .vacancy-content.dark-theme .skills-section {
    @apply bg-slate-700 border-slate-600;
    @apply border-l-blue-400;
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .vacancy-content.dark-theme .requirement-label {
    @apply text-slate-300;
  }

  .vacancy-content.dark-theme .requirement-value {
    @apply text-slate-100;
  }

  .vacancy-content.dark-theme .description-container {
    @apply bg-slate-700 border-slate-600;
    @apply border-l-indigo-400;
    background: linear-gradient(135deg, #374151 0%, #4b5563 50%, #374151 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .vacancy-content.dark-theme .description-container.clickable {
    @apply hover:border-slate-500;
    @apply focus:outline-indigo-400;
  }

  .vacancy-content.dark-theme .description-container.clickable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

  .vacancy-content.dark-theme .description-text {
    @apply text-slate-200;
  }

  .vacancy-content.dark-theme .description-content :global(p) {
    @apply text-slate-200;
  }

  .vacancy-content.dark-theme .description-content :global(h1),
  .vacancy-content.dark-theme .description-content :global(h2),
  .vacancy-content.dark-theme .description-content :global(h3) {
    @apply text-slate-100;
  }

  .vacancy-content.dark-theme .description-content :global(li) {
    @apply text-slate-200;
  }

  .vacancy-content.dark-theme .description-content :global(strong),
  .vacancy-content.dark-theme .description-content :global(b) {
    @apply text-slate-100;
  }
  
  /* Высококонтрастный режим */
  @media (prefers-contrast: high) {
    .content-section {
      @apply border-2;
    }
    
    .section-title {
      @apply text-neutral-900;
      -webkit-text-fill-color: theme('colors.neutral.900');
    }
    
    .vacancy-content.dark-theme .section-title {
      @apply text-slate-100;
      -webkit-text-fill-color: theme('colors.slate.100');
    }
    
    .requirements-section {
      @apply border-2 border-primary-600 bg-neutral-100;
    }
    
    .vacancy-content.dark-theme .requirements-section {
      @apply border-2 border-purple-400 bg-slate-600;
    }
    
    .skills-section {
      @apply border-2 border-success-600 bg-neutral-100;
    }
    
    .vacancy-content.dark-theme .skills-section {
      @apply border-2 border-blue-400 bg-slate-600;
    }
    
    .description-container {
      @apply border-2 border-primary-600 bg-neutral-100;
    }
    
    .vacancy-content.dark-theme .description-container {
      @apply border-2 border-indigo-400 bg-slate-600;
    }
  }
</style> 