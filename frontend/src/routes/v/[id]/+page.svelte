<!-- frontend/src/routes/v/[id]/+page.svelte -->
<script lang="ts">
  import type { PageData } from "./$types";
  import { sanitizeDescription } from "$lib/utils/sanitize";
  import GradientButton from '$lib/components/ui/GradientButton.svelte';
  
  export let data: PageData;
  
  $: vacancy = data.vacancy;
  $: sanitizedDescription = vacancy?.description ? sanitizeDescription(vacancy.description) : '';
</script>

<svelte:head>
  <title>{vacancy?.title ? `${vacancy.title} | JS Пульс` : 'Вакансия | JS Пульс'}</title>
  <meta name="description" content={vacancy?.description ? 
    `${vacancy.title} в компании ${vacancy.company}. ${vacancy.description.slice(0, 150)}...` : 
    'Детали вакансии на JS Пульс'} />
  
  <!-- Open Graph метаданные -->
  <meta property="og:title" content={vacancy?.title || 'Вакансия'} />
  <meta property="og:description" content={vacancy?.description ? 
    `${vacancy.title} в компании ${vacancy.company}` : 
    'Детали вакансии на JS Пульс'} />
  <meta property="og:type" content="article" />
</svelte:head>

<div class="vacancy-detail">
  <div class="vacancy-header">
    <h1 class="vacancy-title">{vacancy?.title || 'Загрузка...'}</h1>
    <div class="vacancy-meta">
      <span class="company">{vacancy?.company}</span>
      {#if vacancy?.location}
        <span class="location">{vacancy.location}</span>
      {/if}
      {#if vacancy?.publishedAt}
        <span class="published">
          Опубликовано: {new Date(vacancy.publishedAt).toLocaleDateString('ru-RU')}
        </span>
      {/if}
    </div>
  </div>

  <div class="vacancy-content">
    {#if vacancy?.experience || vacancy?.employment}
      <div class="vacancy-requirements">
        {#if vacancy.experience}
          <div class="requirement">
            <strong>Опыт работы:</strong> {vacancy.experience}
          </div>
        {/if}
        {#if vacancy.employment}
          <div class="requirement">
            <strong>Тип занятости:</strong> {vacancy.employment}
          </div>
        {/if}
        {#if vacancy.schedule}
          <div class="requirement">
            <strong>График работы:</strong> {vacancy.schedule}
          </div>
        {/if}
      </div>
    {/if}

    {#if vacancy?.skills && vacancy.skills.length > 0}
      <div class="vacancy-skills">
        <h3>Требуемые навыки:</h3>
        <div class="skills-list">
          {#each vacancy.skills as skill}
            <GradientButton variant="outline" size="sm">
              {skill}
            </GradientButton>
          {/each}
        </div>
      </div>
    {/if}

    {#if sanitizedDescription}
      <div class="vacancy-description">
        <h3>Описание вакансии:</h3>
        <div class="description-content">
          {@html sanitizedDescription}
        </div>
      </div>
    {/if}

    {#if vacancy?.salaryFrom || vacancy?.salaryTo}
      <div class="vacancy-salary">
        <h3>Зарплата:</h3>
        <div class="salary-range">
          {#if vacancy.salaryFrom && vacancy.salaryTo}
            от {vacancy.salaryFrom.toLocaleString()} до {vacancy.salaryTo.toLocaleString()}
          {:else if vacancy.salaryFrom}
            от {vacancy.salaryFrom.toLocaleString()}
          {:else if vacancy.salaryTo}
            до {vacancy.salaryTo.toLocaleString()}
          {/if}
          {#if vacancy.salaryCurrency}
            {vacancy.salaryCurrency}
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <div class="vacancy-actions">
    {#if vacancy?.url}
      <a 
        href={vacancy.url} 
        target="_blank" 
        rel="noopener noreferrer"
      >
        <GradientButton variant="primary" size="lg">
          Посмотреть на {vacancy.source || 'сайте'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 17L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7 7H17V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </GradientButton>
      </a>
    {/if}
    
    <a href="/">
      <GradientButton variant="outline" size="lg">
        ← Вернуться к поиску
      </GradientButton>
    </a>
  </div>
</div>

<style>
  .vacancy-detail {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    line-height: 1.6;
  }

  .vacancy-header {
    border-bottom: 2px solid var(--primary-color, #007acc);
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
  }

  .vacancy-title {
    font-size: 2rem;
    margin: 0 0 1rem 0;
    color: var(--text-primary, #333);
    font-weight: 600;
  }

  .vacancy-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.95rem;
    color: var(--text-secondary, #666);
  }

  .company {
    font-weight: 600;
    color: var(--primary-color, #007acc);
  }

  .vacancy-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .vacancy-requirements {
    background: var(--background-light, #f8f9fa);
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid var(--primary-color, #007acc);
  }

  .requirement {
    margin-bottom: 0.5rem;
  }

  .requirement:last-child {
    margin-bottom: 0;
  }

  .vacancy-skills h3,
  .vacancy-description h3,
  .vacancy-salary h3 {
    margin: 0 0 1rem 0;
    color: var(--text-primary, #333);
    font-size: 1.2rem;
  }

  .skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }



  .description-content {
    color: var(--text-primary, #333);
  }

  .description-content :global(h1),
  .description-content :global(h2),
  .description-content :global(h3) {
    margin: 1.5rem 0 1rem 0;
    color: var(--text-primary, #333);
  }

  .description-content :global(ul),
  .description-content :global(ol) {
    padding-left: 2rem;
    margin: 1rem 0;
  }

  .description-content :global(p) {
    margin: 1rem 0;
  }

  .salary-range {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--success-color, #28a745);
  }

  .vacancy-actions {
    display: flex;
    gap: 1rem;
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color, #e9ecef);
  }



  @media (max-width: 768px) {
    .vacancy-detail {
      padding: 1rem;
    }

    .vacancy-title {
      font-size: 1.5rem;
    }

    .vacancy-meta {
      flex-direction: column;
      gap: 0.5rem;
    }

    .vacancy-actions {
      flex-direction: column;
    }

    .skills-list {
      gap: 0.3rem;
    }
  }
</style>
