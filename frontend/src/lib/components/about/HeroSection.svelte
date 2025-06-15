<script lang="ts">
</script>

<div class="hero-section page-hero">
  <div class="hero-content">
    <div class="logo-container">
      <img src="/jspulse.png" alt="JS Пульс" class="hero-logo" />
      <div class="logo-glow"></div>
    </div>
    
    <h1 class="hero-title heading-gradient">О проекте JS Пульс</h1>
    <p class="hero-subtitle text-secondary">
      Ваш надежный агрегатор вакансий для frontend разработчиков
    </p>
  </div>
</div>

<style>
  .hero-section {
    @apply relative px-4 sm:px-6 lg:px-8 py-16 sm:py-20;
  }

  .hero-content {
    @apply max-w-4xl mx-auto text-center;
  }

  .logo-container {
    @apply relative inline-block mb-8;
  }

  .hero-logo {
    @apply w-24 h-24 sm:w-32 sm:h-32 rounded-2xl shadow-lg relative z-10;
    filter: drop-shadow(0 8px 16px var(--accent-primary));
  }

  .logo-glow {
    @apply absolute inset-0 rounded-2xl opacity-20 blur-xl scale-110;
    background: var(--accent-primary);
    animation: glow-pulse 3s ease-in-out infinite;
  }

  @keyframes glow-pulse {
    0%, 100% { opacity: 0.2; transform: scale(1.1); }
    50% { opacity: 0.4; transform: scale(1.2); }
  }

  .hero-title {
    @apply text-4xl sm:text-5xl lg:text-6xl font-bold mb-6;
  }

  .hero-subtitle {
    @apply text-xl sm:text-2xl mb-8 max-w-2xl mx-auto;
  }

  /* Мобильная адаптация */
  @media (max-width: 640px) {
    .hero-section {
      @apply py-12 px-4;
    }

    .hero-title {
      @apply text-3xl;
    }

    .hero-subtitle {
      @apply text-lg;
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .logo-glow {
      animation: none;
    }
  }

  /* High contrast */
  @media (prefers-contrast: high) {
    .hero-title {
      -webkit-text-fill-color: theme('colors.white');
    }
  }
</style> 