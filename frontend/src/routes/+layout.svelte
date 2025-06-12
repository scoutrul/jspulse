<script>
  import "../app.css";
  import Header from "$lib/components/Header.svelte";
</script>

<div class="app-container">
  <Header />

  <main class="content">
    <slot />
  </main>

  <!-- Можно добавить футер здесь -->
  <!-- 
  <footer>
    <p>© {new Date().getFullYear()} JS Пульс</p>
  </footer>
  -->
</div>

<style>
  .app-container {
    @apply flex flex-col min-h-screen;
  }

  .content {
    @apply flex-grow px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full;
  }

  /* Стили для футера, если он будет добавлен */
  /*
  footer {
    @apply text-center p-4 mt-auto bg-neutral-100 text-neutral-600 text-sm;
  }
  */

  /* Улучшенная адаптивность для контента */
  @media (max-width: 640px) {
    .content {
      @apply px-4 py-4;
    }
  }

  @media (max-width: 480px) {
    .content {
      @apply px-3 py-3;
    }
  }
</style>
