<script lang="ts">
  export let skill: string;
  export let variant: 'default' | 'primary' | 'outline' = 'default';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let interactive: boolean = false;
  export let onClick: ((skill: string) => void) | undefined = undefined;
  export let darkTheme: boolean = false;
  
  $: isClickable = interactive && onClick;
  
  function handleClick() {
    if (isClickable) {
      onClick?.(skill);
    }
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleClick();
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
  class="skill-tag skill-tag--{variant} skill-tag--{size}"
  class:skill-tag--interactive={isClickable}
  class:skill-tag--dark={darkTheme}
  on:click={handleClick}
  on:keydown={handleKeyDown}
  tabindex={isClickable ? 0 : undefined}
  role={isClickable ? 'button' : undefined}
  aria-label={isClickable ? `Фильтровать по навыку ${skill}` : undefined}
  data-testid="skill-tag"
>
  {skill}
</span>

<style>
  .skill-tag {
    @apply inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200;
    @apply border border-solid;
    @apply focus:outline-2 focus:outline-offset-2 focus:outline-primary-500;
    will-change: transform, box-shadow;
    backface-visibility: hidden;
  }
  
  /* Размеры */
  .skill-tag--sm {
    @apply px-2 py-1 text-xs;
  }
  
  .skill-tag--md {
    @apply px-3 py-1.5 text-sm;
  }
  
  .skill-tag--lg {
    @apply px-4 py-2 text-base;
  }
  
  /* Варианты */
  .skill-tag--default {
    @apply text-neutral-700 bg-neutral-100 border-neutral-200;
    @apply hover:bg-neutral-200 hover:border-neutral-300;
  }
  
  .skill-tag--primary {
    @apply text-white border-warning-500;
    background: linear-gradient(135deg, theme('colors.warning.600') 0%, theme('colors.warning.500') 50%, theme('colors.warning.400') 100%);
    box-shadow: 0 2px 4px rgba(251, 191, 36, 0.15);
  }
  
  .skill-tag--primary:hover {
    @apply transform scale-105;
    box-shadow: 0 4px 8px rgba(251, 191, 36, 0.25), 0 2px 4px rgba(251, 191, 36, 0.15);
  }
  
  .skill-tag--outline {
    @apply text-warning-700 bg-transparent border-warning-300;
    @apply hover:bg-warning-50 hover:border-warning-400;
  }
  
  /* Интерактивность */
  .skill-tag--interactive {
    @apply cursor-pointer select-none;
  }
  
  .skill-tag--interactive:hover {
    @apply transform -translate-y-1;
  }
  
  .skill-tag--interactive:active {
    @apply transform translate-y-0 scale-95;
  }
  
  /* Анимация пульсации для интерактивных элементов */
  .skill-tag--interactive.skill-tag--primary {
    animation: pulse-glow 3s ease-in-out infinite;
  }
  
  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 2px 4px rgba(251, 191, 36, 0.15);
    }
    50% {
      box-shadow: 0 4px 8px rgba(251, 191, 36, 0.25), 0 2px 4px rgba(251, 191, 36, 0.15);
    }
  }

  /* === ТЕМНАЯ ТЕМА === */
  .skill-tag--dark.skill-tag--default {
    @apply text-slate-200 bg-slate-600 border-slate-500;
    @apply hover:bg-slate-500 hover:border-slate-400;
  }

  .skill-tag--dark.skill-tag--primary {
    @apply text-white border-purple-400;
    background: linear-gradient(135deg, theme('colors.purple.600') 0%, theme('colors.indigo.500') 50%, theme('colors.blue.500') 100%);
    box-shadow: 0 2px 4px rgba(139, 92, 246, 0.15);
  }

  .skill-tag--dark.skill-tag--primary:hover {
    @apply transform scale-105;
    box-shadow: 0 4px 8px rgba(139, 92, 246, 0.25), 0 2px 4px rgba(139, 92, 246, 0.15);
  }

  .skill-tag--dark.skill-tag--outline {
    @apply text-purple-300 bg-transparent border-purple-400;
    @apply hover:bg-purple-900/20 hover:border-purple-300;
  }

  /* Анимация для темной темы */
  .skill-tag--dark.skill-tag--interactive.skill-tag--primary {
    animation: pulse-glow-dark 3s ease-in-out infinite;
  }

  @keyframes pulse-glow-dark {
    0%, 100% {
      box-shadow: 0 2px 4px rgba(139, 92, 246, 0.15);
    }
    50% {
      box-shadow: 0 4px 8px rgba(139, 92, 246, 0.25), 0 2px 4px rgba(139, 92, 246, 0.15);
    }
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .skill-tag {
      animation: none;
      transition: none;
    }
    
    .skill-tag--interactive:hover {
      @apply transform-none;
    }
    
    .skill-tag--primary:hover {
      @apply transform-none;
    }
  }
  
  /* Высококонтрастный режим */
  @media (prefers-contrast: high) {
    .skill-tag {
      @apply border-2;
    }
    
    .skill-tag--primary {
      @apply text-warning-900;
      background: theme('colors.warning.400');
    }
    
    .skill-tag--outline {
      @apply border-2 border-warning-600;
    }
  }
  
  /* Фокус-индикаторы */
  .skill-tag:focus-visible {
    @apply outline-2 outline-offset-2 outline-primary-500;
  }
</style> 