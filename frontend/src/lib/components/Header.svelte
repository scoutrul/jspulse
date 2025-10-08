<script lang="ts">
  import ThemeToggle from './ui/ThemeToggle.svelte';
  import { authStore, signIn, signOutUser } from '$lib/stores/authStore.js';
  
  export const rootPath: string = '/';
  
  async function handleSignIn() {
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  }
  
  async function handleSignOut() {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }
</script>

<header class="header">
  <div class="header-container">
    <div class="main-row">
      <a href="{rootPath}" class="header-link" aria-label="Перейти на главную страницу">
        <div class="logo-section">
          <img src="/jspulse.png" alt="" class="logo" />
          <div class="title-section">
            <h1 class="title">JS Пульс</h1>
            <span class="tagline">Frontend Jobs</span>
          </div>
        </div>
      </a>
      
      <nav class="header-nav">
        <a href="/about" class="nav-link">О проекте</a>
        {#if $authStore.isAdmin}
          <a href="/admin" class="nav-link admin-link">Админка</a>
        {/if}
      </nav>
      
      <div class="header-actions">
        <ThemeToggle />
        
        {#if $authStore.isAdmin}
          <button 
            class="nav-link sign-out-btn" 
            on:click={handleSignOut}
            title="Выйти"
          >
            Выйти
          </button>
        {:else if !$authStore.loading}
          <button 
            class="nav-link sign-in-btn" 
            on:click={handleSignIn}
            title="Войти как админ"
          >
            Войти
          </button>
        {/if}
      
        <div class="beta-badge">
          <span>Beta</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Градиентный декоративный элемент -->
  <div class="absolute bottom-0 left-0 right-0 h-1 gradient-animated"></div>
</header>

<style>
  .header {
    @apply relative bg-white border-b border-neutral-200 overflow-hidden;
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.08);
    @apply transition-all duration-300 ease-in-out;
  }

  /* Темная тема для шапки */
  :global(.dark) .header {
    @apply bg-slate-800 border-slate-700;
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  .header-container {
    @apply relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4;
    /* Мобильная версия: flex-col (столбец) */
    @apply flex flex-col gap-3;
    /* Десктопная версия: flex-row (строка) */
    @apply sm:flex-row sm:items-center sm:justify-between sm:gap-0;
  }
  
  .main-row {
    @apply flex items-center w-full gap-4;
  }
  
  .header-nav {
    @apply flex items-center ml-auto mr-4 gap-2;
  }
  
  .header-actions {
    @apply flex items-center gap-3;
  }
  
  .nav-link {
    @apply px-4 py-2 text-sm font-medium text-neutral-600 hover:text-warning-600;
    @apply bg-transparent hover:bg-warning-50 rounded-lg transition-all duration-200;
    @apply border border-transparent hover:border-warning-200;
    @apply no-underline focus:outline-2 focus:outline-offset-2 focus:outline-primary-500;
  }

  /* Темная тема для навигации */
  :global(.dark) .nav-link {
    @apply text-slate-300 hover:text-purple-300;
    @apply hover:bg-purple-900/20;
    @apply hover:border-purple-400/30;
    @apply focus:outline-purple-400;
  }

  /* Стили для админ-ссылки */
  .admin-link {
    @apply bg-gradient-to-r from-blue-50 to-purple-50;
    @apply border-blue-200 text-blue-700;
    @apply hover:from-blue-100 hover:to-purple-100;
    @apply hover:border-blue-300 hover:text-blue-800;
    @apply shadow-sm hover:shadow-md;
    font-weight: 600;
  }

  /* Темная тема для админ-ссылки */
  :global(.dark) .admin-link {
    @apply bg-gradient-to-r from-blue-900/30 to-purple-900/30;
    @apply border-blue-400/50 text-blue-300;
    @apply hover:from-blue-800/40 hover:to-purple-800/40;
    @apply hover:border-blue-300 hover:text-blue-200;
    @apply shadow-sm hover:shadow-lg;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
  }

  :global(.dark) .admin-link:hover {
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2), 0 0 8px rgba(59, 130, 246, 0.1);
  }

  /* Стили для кнопок входа/выхода */
  .sign-in-btn, .sign-out-btn {
    @apply cursor-pointer border-0;
    @apply bg-transparent hover:bg-warning-50;
    @apply hover:border-warning-200;
  }

  .sign-out-btn {
    @apply text-red-600 hover:text-red-700;
    @apply hover:bg-red-50 hover:border-red-200;
  }

  :global(.dark) .sign-in-btn {
    @apply hover:bg-purple-900/20;
    @apply hover:border-purple-400/30;
  }

  :global(.dark) .sign-out-btn {
    @apply text-red-400 hover:text-red-300;
    @apply hover:bg-red-900/20 hover:border-red-400/30;
  }

  .header-link {
    @apply flex items-center no-underline text-inherit transition-all duration-200 rounded-lg p-2 -m-2 focus:outline-2 focus:outline-primary-500 focus:outline-offset-2;
  }

  .logo-section {
    @apply flex items-center gap-4;
  }

  .logo {
    @apply w-12 h-12 sm:w-14 sm:h-14 rounded-xl shadow-sm;
    filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.15));
    transition: all 0.2s ease-in-out;
  }

  .header-link:hover .logo {
    @apply scale-105;
    filter: drop-shadow(0 4px 8px rgba(251, 191, 36, 0.25));
  }

  .title-section {
    @apply flex flex-col;
  }

  .title {
    @apply m-0 text-2xl sm:text-3xl font-bold leading-none;
    background: linear-gradient(135deg, theme('colors.warning.600') 0%, theme('colors.warning.500') 50%, theme('colors.warning.400') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Темная тема для заголовка */
  :global(.dark) .title {
    background: linear-gradient(135deg, theme('colors.purple.400') 0%, theme('colors.indigo.400') 50%, theme('colors.blue.400') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tagline {
    @apply text-sm font-medium text-neutral-500 mt-0.5 tracking-wide uppercase;
    letter-spacing: 0.5px;
  }

  /* Темная тема для подзаголовка */
  :global(.dark) .tagline {
    @apply text-slate-400;
  }


  .beta-badge {
    @apply relative;
  }

  .beta-badge span {
    @apply inline-flex items-center px-3 py-1.5 text-xs font-semibold text-warning-700 bg-warning-100 border border-warning-300 rounded-full shadow-sm;
    animation: pulse-glow 3s ease-in-out infinite;
  }

  /* Темная тема для beta badge */
  :global(.dark) .beta-badge span {
    @apply text-purple-200 bg-purple-900/50 border-purple-400;
    animation: pulse-glow-dark 3s ease-in-out infinite;
  }



  @keyframes pulse-glow {
    0%, 100% {
      @apply shadow-sm;
      box-shadow: 0 1px 2px rgba(251, 191, 36, 0.1);
    }
    50% {
      @apply shadow-md;
      box-shadow: 0 4px 8px rgba(251, 191, 36, 0.2), 0 0 12px rgba(251, 191, 36, 0.15);
    }
  }

  @keyframes pulse-glow-dark {
    0%, 100% {
      @apply shadow-sm;
      box-shadow: 0 1px 2px rgba(139, 92, 246, 0.15);
    }
    50% {
      @apply shadow-md;
      box-shadow: 0 4px 8px rgba(139, 92, 246, 0.25), 0 0 12px rgba(139, 92, 246, 0.2);
    }
  }



  /* Мобильная адаптация */
  @media (max-width: 640px) {
    .header-container {
      @apply px-4 py-3;
    }
    
    .main-row {
      @apply flex-wrap gap-2;
    }
    
    .header-nav {
      @apply order-3 w-full justify-center ml-0 mr-0 mt-2;
    }
    
    .header-actions {
      @apply order-2 ml-auto gap-2;
    }
  }

  /* Адаптация для очень маленьких экранов */
  @media (max-width: 480px) {
    .title {
      @apply text-xl;
    }

    .tagline {
      @apply text-xs;
    }

    .logo {
      @apply w-10 h-10;
    }

    .header-container {
      @apply px-3 py-2;
    }
  }

  /* Поддержка для пользователей с ограниченными возможностями */
  @media (prefers-reduced-motion: reduce) {
    .logo,
    .beta-badge span {
      animation: none;
    }

    .header-link:hover .logo {
      @apply scale-100;
      filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.15));
    }
  }

  /* Высококонтрастный режим */
  @media (prefers-contrast: high) {
    .header {
      @apply border-2 border-neutral-400;
    }

    .title {
      @apply text-warning-700;
      -webkit-text-fill-color: theme('colors.warning.700');
    }

    .beta-badge span {
      @apply border-2;
    }
  }

  /* Фокус-индикаторы для клавиатурной навигации */
  .header-link:focus-visible,
  .nav-link:focus-visible {
    @apply outline-2 outline-offset-2 outline-primary-500;
  }
</style> 