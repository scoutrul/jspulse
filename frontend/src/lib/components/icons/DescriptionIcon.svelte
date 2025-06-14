<script lang="ts">
  export let icon: 'expand' | 'collapse' | 'time' | 'words' | 'chars' | 'toggle' | 'empty' | 'error' = 'expand';
  export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'muted' = 'primary';
  export let rotated: boolean = false;
  export let animated: boolean = true;
  
  // Size classes
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };
  
  // Color classes using JSPulse design system
  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-neutral-600',
    success: 'text-emerald-600',
    warning: 'text-warning-600',
    error: 'text-red-600',
    muted: 'text-neutral-400'
  };
  
  // Animation classes
  const animationClass = animated ? 'transition-all duration-300 ease-in-out' : '';
  const rotationClass = rotated ? 'rotate-180' : '';
</script>

{#if icon === 'expand'}
  <svg 
    class="{sizeClasses[size]} {colorClasses[color]} {animationClass} {rotationClass}" 
    class:rotated
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
  </svg>
{:else if icon === 'collapse'}
  <svg 
    class="{sizeClasses[size]} {colorClasses[color]} {animationClass} {rotationClass}" 
    class:rotated
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
  </svg>
{:else if icon === 'toggle'}
  <svg 
    class="{sizeClasses[size]} {colorClasses[color]} {animationClass} {rotationClass}" 
    class:rotated
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
  </svg>
{:else if icon === 'time'}
  <svg 
    class="{sizeClasses[size]} {colorClasses[color]} {animationClass}" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
{:else if icon === 'words'}
  <svg 
    class="{sizeClasses[size]} {colorClasses[color]} {animationClass}" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
{:else if icon === 'chars'}
  <svg 
    class="{sizeClasses[size]} {colorClasses[color]} {animationClass}" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
  </svg>
{:else if icon === 'empty'}
  <svg 
    class="{sizeClasses[size]} {colorClasses[color]} {animationClass}" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
{:else if icon === 'error'}
  <svg 
    class="{sizeClasses[size]} {colorClasses[color]} {animationClass}" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
{/if}

<style>
  /* Enhanced rotation animation */
  .rotated {
    @apply rotate-180;
  }
  
  /* Hover effects for interactive icons */
  svg:hover {
    @apply scale-110;
  }
  
  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    svg {
      @apply transition-none;
    }
    
    svg:hover {
      @apply scale-100;
    }
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    svg {
      @apply stroke-2;
    }
  }
</style> 