<script lang="ts">
  import { onMount } from 'svelte';
  
  export let title: string;
  export let type: 'default' | 'stats' | 'contact' = 'default';
  export let fadeIn: boolean = false;
  
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });
</script>

<section class="content-card card flex flex-col gap-4" class:fade-in={mounted && fadeIn} class:stats-card={type === 'stats'} class:contact-card={type === 'contact'}>
  <div class="card-header">
    <h2 class="section-title heading-gradient px-4 pt-4">{title}</h2>
  </div>
  <div class="card-content">
    <slot />
  </div>
  <div class="card-gradient"></div>
</section>

<style>
  .content-card {
    @apply opacity-0 transform translate-y-8;
  }

  .content-card.fade-in {
    @apply opacity-100 transform translate-y-0;
    transition: all 0.6s ease-out;
  }

  .section-title {
    @apply text-2xl font-bold m-0;
  }

  .card-content {
    @apply leading-relaxed;
    color: var(--text-secondary);
  }

  .card-content p {
    @apply mb-4 last:mb-0;
  }

  .card-content strong {
    color: var(--accent-primary);
    @apply font-semibold;
  }

  /* Карточка статистики */
  .stats-card {
    @apply lg:col-span-2;
  }

  /* Карточка контактов */
  .contact-card {
    @apply lg:col-span-2;
  }

  /* Мобильная адаптация */
  @media (max-width: 640px) {
    .card-content {
      @apply p-3 sm:p-4;
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .content-card {
      @apply opacity-100 transform-none;
    }

    .content-card.fade-in {
      transition: none;
    }
  }

  /* High contrast */
  @media (prefers-contrast: high) {
    .section-title {
      -webkit-text-fill-color: var(--accent-primary);
    }
  }
</style> 