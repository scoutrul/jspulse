<script lang="ts">
  import SkillTag from '../ui/SkillTag.svelte';
  import SalaryRange from '../ui/SalaryRange.svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let experience: string | undefined = undefined;
  export let employment: string | undefined = undefined;
  export let skills: string[] = [];
  export let description: string | undefined = undefined;
  export let salaryFrom: number | undefined | null = undefined;
  export let salaryTo: number | undefined | null = undefined;
  export let salaryCurrency: string | undefined = undefined;
  
  const dispatch = createEventDispatcher<{
    skillClick: string;
  }>();
  
  $: hasRequirements = experience || employment;
  $: hasSkills = skills && skills.length > 0;
  $: hasSalary = salaryFrom !== undefined || salaryTo !== undefined;
  
  function handleSkillClick(skill: string) {
    dispatch('skillClick', skill);
  }
</script>

<div class="vacancy-content">
  <!-- Требования -->
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
  
  <!-- Навыки -->
  {#if hasSkills}
    <section class="content-section skills-section">
      <h3 class="section-title">Требуемые навыки</h3>
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
    </section>
  {/if}
  
  <!-- Зарплата -->
  {#if hasSalary}
    <section class="content-section salary-section">
      <h3 class="section-title">Зарплата</h3>
      <SalaryRange 
        {salaryFrom} 
        {salaryTo} 
        currency={salaryCurrency || 'руб.'} 
        variant="prominent" 
        size="lg" 
      />
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
  
  /* Требования */
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
  
  /* Навыки */
  .skills-section {
    @apply bg-white border border-warning-200 rounded-lg p-4;
    background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(254, 252, 232, 0.5) 100%);
    box-shadow: 0 1px 3px rgba(251, 191, 36, 0.08);
  }
  
  .skills-container {
    @apply flex flex-wrap gap-2;
  }
  
  /* Зарплата */
  .salary-section {
    @apply bg-green-50 border border-green-200 rounded-lg p-4;
    @apply text-center;
    background: linear-gradient(135deg, rgba(236, 253, 245, 1) 0%, rgba(209, 250, 229, 0.5) 100%);
    box-shadow: 0 1px 3px rgba(16, 185, 129, 0.08);
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
    
    .skills-section {
      @apply border-2 border-warning-600 bg-warning-50;
    }
    
    .salary-section {
      @apply border-2 border-green-600 bg-green-100;
    }
  }
</style> 