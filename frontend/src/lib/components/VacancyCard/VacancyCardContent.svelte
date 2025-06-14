<script lang="ts">
  import SkillTag from '../ui/SkillTag.svelte';
  import DescriptionRenderer from '../Description/DescriptionRenderer.svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let experience: string | undefined = undefined;
  export let employment: string | undefined = undefined;
  export let skills: string[] = [];
  export let description: string | undefined = undefined;
  export let fullDescription: any = undefined; // DescriptionContent из backend
  export let processedHtml: string | undefined = undefined;
  export let isDetailPage: boolean = false;
  
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
  
  $: hasRequirements = experience || employment;
  $: hasSkills = skills && skills.length > 0;
  $: hasRequirementsOrSkills = hasRequirements || hasSkills;
  $: hasDescription = description || parsedFullDescription || processedHtml;
  
  function handleSkillClick(skill: string) {
    dispatch('skillClick', skill);
  }
  
  function handleDescriptionClick() {
    if (!isDetailPage && hasDescription) {
      dispatch('descriptionClick');
    }
  }
</script>

<div class="vacancy-content">
  <!-- Требования и навыки в одном блоке -->
  {#if hasRequirementsOrSkills}
    <section class="content-section requirements-section">
      <h3 class="section-title">Требования</h3>
      
      {#if hasRequirements}
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
      {/if}
      
      {#if hasSkills}
        <div class="skills-subsection">
          <h4 class="subsection-title">Требуемые навыки</h4>
          <div class="skills-container">
            {#each skills as skill}
              <SkillTag 
                {skill} 
                variant="outline" 
                size="md" 
                interactive={true}
                onClick={handleSkillClick}
              />
            {/each}
          </div>
        </div>
      {/if}
    </section>
  {/if}

  <!-- Описание без заголовка и с кликабельным контейнером -->
  {#if hasDescription}
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div 
      class="description-container" 
      class:clickable={!isDetailPage}
      on:click={handleDescriptionClick}
      on:keydown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDetailPage) {
          e.preventDefault();
          handleDescriptionClick();
        }
      }}
      tabindex={!isDetailPage ? 0 : undefined}
      role={!isDetailPage ? 'button' : 'region'}
      aria-label={!isDetailPage ? 'Нажмите для просмотра полного описания вакансии' : 'Описание вакансии'}
    >
      <DescriptionRenderer 
        content={processedHtml || description || ''}
        processedContent={parsedFullDescription}
        mode={isDetailPage ? 'full' : 'auto'}
        maxPreviewLength={220}
        allowToggle={false}
        showToggleButton={false}
        variant="enhanced"
        showMetrics={false}
      />
    </div>
  {/if}
</div>

<style>
  .vacancy-content {
    @apply flex flex-col gap-6;
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
  
  .subsection-title {
    @apply text-sm font-medium mb-2 mt-4 m-0;
    @apply text-neutral-700;
  }
  
  /* Требования и навыки */
  .requirements-section {
    @apply bg-neutral-50 border border-neutral-200 rounded-lg p-4;
    @apply border-l-4 border-l-primary-500;
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
  
  .skills-subsection {
    @apply mt-4 pt-4;
    @apply border-t border-neutral-300;
  }
  
  .skills-container {
    @apply flex flex-wrap gap-2;
  }
  
  /* Описание без заголовка - кликабельный контейнер */
  .description-container {
    @apply relative transition-all duration-200 ease-in-out;
  }
  
  .description-container.clickable {
    @apply cursor-pointer;
    @apply hover:bg-neutral-50 active:bg-neutral-100;
    @apply rounded-lg p-3 -mx-3;
    @apply focus:outline-2 focus:outline-offset-2 focus:outline-primary-500;
    @apply border border-transparent hover:border-neutral-200;
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease-in-out;
  }
  
  .description-container.clickable:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
  
  .description-container.clickable:active {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }
  
  /* Индикатор кликабельности */
  .description-container.clickable::after {
    content: "";
    @apply absolute top-2 right-2 w-2 h-2;
    @apply bg-primary-400 rounded-full;
    @apply opacity-0 transition-opacity duration-200;
  }
  
  .description-container.clickable:hover::after {
    @apply opacity-60;
  }
  
  /* Responsive design */
  @media (max-width: 640px) {
    .vacancy-content {
      @apply gap-4;
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
    
    .requirements-section {
      @apply border-2 border-primary-600 bg-neutral-100;
    }
    
    .skills-subsection {
      @apply border-t-2 border-neutral-600;
    }
  }
</style> 