<!-- frontend/src/routes/v/[id]/+page.svelte -->
<script lang="ts">
  import type { PageData } from "./$types";
  import VacancyCard from '$lib/components/VacancyCard/VacancyCard.svelte';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { theme } from '$lib/stores/themeStore';
  
  export let data: PageData;
  
  $: vacancy = data.vacancy;
  
  // Скроллим к описанию при загрузке страницы
  onMount(() => {
    if (browser) {
      // Небольшая задержка для рендеринга DOM
      setTimeout(() => {
        const descriptionElement = document.getElementById('vacancy-description');
        if (descriptionElement) {
          descriptionElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        } else {
          // Fallback - скроллим к началу страницы
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  });
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

<main>
  {#if vacancy}
  <VacancyCard {vacancy} isDetailPage={true} theme={$theme} />
{:else}
    <div class="loading-placeholder">
      <div class="loading-content">
        <div class="loading-spinner" aria-hidden="true"></div>
        <p>Загрузка...</p>
      </div>
    </div>
  {/if}
</main>

<style>
  .loading-placeholder {
    @apply flex items-center justify-center min-h-96;
    @apply p-8;
    @apply transition-colors duration-300;
  }
  
  .loading-content {
    @apply flex flex-col items-center gap-4;
    @apply text-neutral-600;
    @apply transition-colors duration-300;
  }

  /* Темная тема для loading контента */
  :global(.dark) .loading-content {
    @apply text-slate-300;
  }
  
  .loading-content p {
    @apply text-lg font-medium;
    @apply m-0;
  }
  
  .loading-spinner {
    @apply w-8 h-8 border-2 border-neutral-200 border-t-primary-500 rounded-full;
    @apply transition-colors duration-300;
    animation: spin 1s linear infinite;
  }

  /* Темная тема для спиннера */
  :global(.dark) .loading-spinner {
    @apply border-slate-600 border-t-purple-500;
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

    :global(.dark) .loading-spinner {
      @apply border-purple-500;
    }
  }
</style>
