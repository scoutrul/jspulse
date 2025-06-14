<!-- frontend/src/routes/v/[id]/+page.svelte -->
<script lang="ts">
  import type { PageData } from "./$types";
  import VacancyCard from '$lib/components/VacancyCard/VacancyCard.svelte';
  
  export let data: PageData;
  
  $: vacancy = data.vacancy;
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

{#if vacancy}
  <VacancyCard {vacancy} />
{:else}
  <div class="loading-placeholder">
    <div class="loading-content">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p>Загрузка...</p>
    </div>
  </div>
{/if}

<style>
  .loading-placeholder {
    @apply flex items-center justify-center min-h-96;
    @apply p-8;
  }
  
  .loading-content {
    @apply flex flex-col items-center gap-4;
    @apply text-neutral-600;
  }
  
  .loading-content p {
    @apply text-lg font-medium;
    @apply m-0;
  }
  
  .loading-spinner {
    @apply w-8 h-8 border-2 border-neutral-200 border-t-primary-500 rounded-full;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: none;
      @apply border-primary-500;
    }
  }
</style>
