<script lang="ts">
  export let label: string;
  export let value: string;
  export let variant: 'default' | 'primary' | 'success' | 'info' | 'flat' | 'archived' = 'default';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let icon: string | undefined = undefined;
  export let hideLabel: boolean = false;
  export let href: string | undefined = undefined;
  export let darkTheme: boolean = false;

  $: variantClasses = {
    default: darkTheme 
      ? 'bg-slate-500/20 text-slate-200 border-slate-400/30' 
      : 'bg-neutral-100 text-neutral-800 border-neutral-200',
    primary: darkTheme 
      ? 'bg-purple-500/20 text-purple-200 border-purple-400/30' 
      : 'bg-blue-100 text-blue-800 border-blue-200',
    info: darkTheme 
      ? 'bg-blue-500/20 text-blue-200 border-blue-400/30' 
      : 'bg-blue-100 text-blue-800 border-blue-200',
    success: darkTheme 
      ? 'bg-green-500/20 text-green-200 border-green-400/30' 
      : 'bg-green-100 text-green-800 border-green-200',
    flat: darkTheme 
      ? 'bg-slate-600/20 text-slate-300 border-slate-500/30' 
      : 'bg-gray-100 text-gray-600 border-gray-300',
    archived: darkTheme 
      ? 'bg-gray-500/20 text-gray-200 border-gray-400/30' 
      : 'bg-gray-100 text-gray-600 border-gray-300'
  }[variant];

  $: sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  }[size];
</script>

{#if href}
  <a {href} class="info-badge info-badge--{variant} info-badge--{size} info-badge--link" class:info-badge--dark={darkTheme}>
    {#if icon}
      <span class="info-badge__icon" aria-hidden="true">
        {@html icon}
      </span>
    {/if}
    
    <div class="info-badge__content">
      {#if !hideLabel}
        <span class="info-badge__label">{label}:</span>
      {/if}
      <span class="info-badge__value">{value}</span>
    </div>
  </a>
{:else}
  <div class="info-badge info-badge--{variant} info-badge--{size}" class:info-badge--dark={darkTheme}>
    {#if icon}
      <span class="info-badge__icon" aria-hidden="true">
        {@html icon}
      </span>
    {/if}
    
    <div class="info-badge__content">
      {#if !hideLabel}
        <span class="info-badge__label">{label}:</span>
      {/if}
      <span class="info-badge__value">{value}</span>
    </div>
  </div>
{/if}

<style>
  .info-badge {
    @apply inline-flex items-center gap-2 rounded-lg transition-all duration-200;
    @apply border border-solid;
    will-change: transform, box-shadow;
    backface-visibility: hidden;
  }
  
  /* Размеры */
  .info-badge--sm {
    @apply px-2 py-1 text-xs;
  }
  
  .info-badge--md {
    @apply px-3 py-2 text-sm;
  }
  
  .info-badge--lg {
    @apply px-4 py-3 text-base;
  }
  
  /* Варианты */
  .info-badge--default {
    @apply bg-neutral-50 border-neutral-200 text-neutral-700;
    @apply hover:bg-neutral-100 hover:border-neutral-300;
  }
  
  .info-badge--primary {
    @apply bg-warning-50 border-warning-200 text-warning-800;
    @apply hover:bg-warning-100 hover:border-warning-300;
  }
  
  .info-badge--success {
    @apply bg-green-50 border-green-200 text-green-800;
    @apply hover:bg-green-100 hover:border-green-300;
  }
  
  .info-badge--info {
    @apply bg-blue-50 border-blue-200 text-blue-800;
    @apply hover:bg-blue-100 hover:border-blue-300;
  }

  .info-badge--flat {
    @apply bg-transparent border-none text-neutral-700;
    @apply hover:bg-transparent hover:border-none;
  }

  .info-badge--archived {
    @apply bg-gray-50 border-gray-300 text-gray-600;
    @apply hover:bg-gray-100 hover:border-gray-400;
  }
  
  .info-badge__content {
    @apply flex gap-1 whitespace-nowrap;
  }
  
  .info-badge--sm .info-badge__content {
    @apply flex-row gap-1;
  }
  
  .info-badge__label {
    @apply font-medium opacity-75;
  }
  
  .info-badge__value {
    @apply font-semibold;
  }
  
  .info-badge__icon {
    @apply flex items-center justify-center;
    @apply w-4 h-4 opacity-60;
  }
  
  .info-badge--lg .info-badge__icon {
    @apply w-5 h-5;
  }
  
  /* Hover эффекты только для ссылок */
  .info-badge--link:hover {
    @apply transform -translate-y-1 cursor-pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .info-badge--link {
    @apply no-underline; /* Убираем подчеркивание для ссылок */
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .info-badge {
      transition: none;
    }
    
    .info-badge--link:hover {
      @apply transform-none;
      box-shadow: none;
    }
  }
  
  /* === ТЕМНАЯ ТЕМА === */
  .info-badge--dark.info-badge--default {
    @apply bg-slate-600 border-slate-500 text-slate-200;
    @apply hover:bg-slate-500 hover:border-slate-400;
  }
  
  .info-badge--dark.info-badge--primary {
    @apply bg-purple-900/50 border-purple-400 text-purple-200;
    @apply hover:bg-purple-900/70 hover:border-purple-300;
  }
  
  .info-badge--dark.info-badge--success {
    @apply bg-green-900/50 border-green-400 text-green-200;
    @apply hover:bg-green-900/70 hover:border-green-300;
  }
  
  .info-badge--dark.info-badge--info {
    @apply bg-blue-900/50 border-blue-400 text-blue-200;
    @apply hover:bg-blue-900/70 hover:border-blue-300;
  }

  .info-badge--dark.info-badge--flat {
    @apply bg-transparent border-none text-slate-300;
    @apply hover:bg-transparent hover:border-none;
  }

  .info-badge--dark.info-badge--archived {
    @apply bg-gray-800 border-gray-600 text-gray-300;
    @apply hover:bg-gray-700 hover:border-gray-500;
  }
  
  /* Высококонтрастный режим */
  @media (prefers-contrast: high) {
    .info-badge {
      @apply border-2;
    }
    
    .info-badge--primary {
      @apply border-warning-600 bg-warning-100;
    }
    
    .info-badge--success {
      @apply border-green-600 bg-green-100;
    }
    
    .info-badge--info {
      @apply border-blue-600 bg-blue-100;
    }

    .info-badge--archived {
      @apply border-gray-500 bg-gray-100;
    }

    .info-badge--dark.info-badge--primary {
      @apply border-purple-300 bg-purple-800 text-purple-100;
    }
    
    .info-badge--dark.info-badge--success {
      @apply border-green-300 bg-green-800 text-green-100;
    }
    
    .info-badge--dark.info-badge--info {
      @apply border-blue-300 bg-blue-800 text-blue-100;
    }

    .info-badge--dark.info-badge--flat {
      @apply text-slate-100;
    }

    .info-badge--dark.info-badge--archived {
      @apply border-gray-400 bg-gray-800 text-gray-100;
    }
  }
</style>

 