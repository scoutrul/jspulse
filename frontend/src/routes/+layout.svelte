<script>
  import "../app.css";
  import Header from "$lib/components/Header.svelte";
  import { theme } from '$lib/stores/themeStore';
  import { onMount } from 'svelte';
  
  // Синхронизация стора с DOM после загрузки
  onMount(() => {
    // Стор уже инициализирован, просто подписываемся на изменения
    const unsubscribe = theme.subscribe(currentTheme => {
      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
    
    return unsubscribe;
  });
</script>

<div class="app-container flex flex-col min-h-screen gap-4">
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
    @apply transition-colors duration-300;
  }

  .content {
    @apply flex-grow px-4 sm:px-6 lg:px-8 pb-6 max-w-7xl mx-auto w-full;
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
      @apply px-4 pb-4;
    }
  }

  @media (max-width: 480px) {
    .content {
      @apply px-3 pb-3;
    }
  }
</style>
