<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let variant: 'primary' | 'secondary' | 'outline' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let fullWidth = false;
  export let disabled = false;
  export let hideOnMobile = false;
  
  const dispatch = createEventDispatcher<{
    click: MouseEvent;
    mouseenter: MouseEvent;
  }>();
  
  function handleClick(event: MouseEvent) {
    if (!disabled) {
      dispatch('click', event);
    }
  }

  function handleMouseEnter(event: MouseEvent) {
    if (!disabled) {
      dispatch('mouseenter', event);
    }
  }
  
  // Классы для разных вариантов кнопок
  const variantClasses = {
    primary: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-800',
    secondary: 'bg-primary-50 text-primary-700 hover:bg-primary-100 hover:text-primary-800',
    outline: 'bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-800'
  };
  
  // Классы для разных размеров
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-5 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
</script>

<div class="rounded-md relative inline-block gradient-border {hideOnMobile ? 'hidden sm:block' : ''} {fullWidth ? 'w-full' : ''} flex">
  <button
    {type}
    class="rounded-md cursor-pointer font-medium transition-all duration-200 border-0 relative gradient-border-content {variantClasses[variant]} {sizeClasses[size]} {fullWidth ? 'w-full' : ''} focus:outline-2 focus:outline-primary-500 focus:outline-offset-2 active:bg-white active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    {disabled}
    on:click={handleClick}
    on:mouseenter={handleMouseEnter}
  >
    <slot />
  </button>
</div> 