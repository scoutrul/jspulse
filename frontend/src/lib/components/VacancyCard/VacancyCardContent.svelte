<script lang="ts">
  import SkillTag from '../ui/SkillTag.svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let experience: string | undefined = undefined;
  export let employment: string | undefined = undefined;
  export let skills: string[] = [];
  export let description: string | undefined = undefined;
  
  const dispatch = createEventDispatcher<{
    skillClick: string;
  }>();
  
  $: hasRequirements = experience || employment;
  $: hasSkills = skills && skills.length > 0;
  $: hasRequirementsOrSkills = hasRequirements || hasSkills;
  
  function handleSkillClick(skill: string) {
    dispatch('skillClick', skill);
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

  <!-- Описание -->
  {#if description}
    <section class="content-section description-section">
      <h3 class="section-title">Описание вакансии</h3>
      <div class="description-content">
        {@html description}
      </div>
    </section>
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
  
  /* Описание */
  .description-section {
    @apply bg-white border border-neutral-200 rounded-lg p-4;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }
  
  .description-content {
    @apply text-neutral-700 leading-relaxed text-sm;
  }
  
  .description-content :global(h1),
  .description-content :global(h2),
  .description-content :global(h3) {
    @apply text-neutral-800 font-semibold mt-4 mb-2;
  }
  
  .description-content :global(h1) {
    @apply text-lg;
  }
  
  .description-content :global(h2) {
    @apply text-base;
  }
  
  .description-content :global(h3) {
    @apply text-sm;
  }
  
  .description-content :global(ul),
  .description-content :global(ol) {
    @apply pl-4 my-3;
  }
  
  .description-content :global(li) {
    @apply mb-1;
  }
  
  .description-content :global(p) {
    @apply mb-3;
  }
  
  .description-content :global(strong) {
    @apply font-semibold text-neutral-800;
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