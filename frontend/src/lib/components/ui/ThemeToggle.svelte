<script lang="ts">
  import { theme, toggleTheme } from '$lib/stores/themeStore';
  import Sun from 'svelte-heros-v2/Sun.svelte';
</script>

<button
  class="theme-toggle"
  on:click={toggleTheme}
  aria-label={$theme === 'light' ? 'Переключить на темную тему' : 'Переключить на светлую тему'}
  title={$theme === 'light' ? 'Темная тема' : 'Светлая тема'}
>
  <div class="theme-toggle__icon" class:inverted={$theme === 'dark'}>
    <Sun size="20" />
  </div>
  
  <span class="theme-toggle__text">
    {$theme === 'light' ? 'Темная' : 'Светлая'}
  </span>
</button>

<style>
  .theme-toggle {
    @apply relative inline-flex items-center gap-2;
    @apply px-3 py-2 rounded-lg;
    @apply bg-neutral-100 hover:bg-neutral-200;
    @apply border border-neutral-200 hover:border-neutral-300;
    @apply text-neutral-700 hover:text-neutral-900;
    @apply transition-all duration-200 ease-in-out;
    @apply focus:outline-2 focus:outline-offset-2 focus:outline-primary-500;
    @apply cursor-pointer select-none;
    @apply min-w-[110px]
  }

  /* Темная тема для кнопки */
  :global(.dark) .theme-toggle {
    @apply bg-slate-700 hover:bg-slate-600;
    @apply border-slate-600 hover:border-slate-500;
    @apply text-slate-200 hover:text-slate-100;
    @apply focus:outline-purple-400;
  }

  .theme-toggle__icon {
    @apply flex items-center justify-center;
    @apply transition-transform duration-200 ease-in-out;
    /* Цвет солнышка в светлой теме - оранжевый/желтый */
    color: #f59e0b;
  }

  /* Инвертированное солнышко в темной теме - светло-желтый/белый */
  .theme-toggle__icon.inverted {
    color: #f4f0e5;
    filter: brightness(1.2);
  }

  .theme-toggle__text {
    @apply text-sm font-medium;
    @apply hidden sm:block; /* Скрываем текст на мобильных */
  }

  /* Hover эффекты - только увеличение */
  .theme-toggle:hover .theme-toggle__icon {
    @apply transform scale-110;
  }

  .theme-toggle:active {
    @apply transform scale-95;
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .theme-toggle,
    .theme-toggle__icon {
      transition: none;
    }
    
    .theme-toggle:hover .theme-toggle__icon {
      @apply transform-none;
    }
    
    .theme-toggle:active {
      @apply transform-none;
    }
  }

  /* Высококонтрастный режим */
  @media (prefers-contrast: high) {
    .theme-toggle {
      @apply border-2 border-neutral-400;
    }
    
    :global(.dark) .theme-toggle {
      @apply border-2 border-slate-400;
    }
    
    /* В высококонтрастном режиме делаем иконки более контрастными */
    .theme-toggle__icon {
      color: #d97706;
    }
    
    .theme-toggle__icon.inverted {
      color: #fde047;
      filter: brightness(1.4);
    }
  }
</style>