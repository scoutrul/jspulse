<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { theme } from '$lib/stores/themeStore';

  // Типы для входных данных
  interface TagData {
    name: string;
    count: number;
  }

  interface Bubble {
    id: string;
    name: string;
    count: number;
    radius: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    oscillationPhase: number;
    targetRadius: number;
    currentRadius: number;
  }

  // Пропы компонента
  export let tags: TagData[] = [];
  export let bubbles: Bubble[] = [];
  export let hoveredBubble: Bubble | null = null;

  // Типизация событий
  const dispatch = createEventDispatcher<{
    tagClick: TagData;
    tagHover: TagData | null;
    updateHoveredBubble: Bubble | null;
  }>();

  // Цветовые палитры
  const lightColorPalette = [
    '#3b82f6', // primary-500
    '#10b981', // success-500
    '#f59e0b', // warning-500
    '#ef4444', // danger-500
    '#0ea5e9', // info-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#f97316', // orange-500
  ];

  const darkColorPalette = [
    '#60a5fa', // blue-400
    '#34d399', // emerald-400
    '#fbbf24', // amber-400
    '#f87171', // red-400
    '#38bdf8', // sky-400
    '#a78bfa', // violet-400
    '#f472b6', // pink-400
    '#22d3ee', // cyan-400
    '#a3e635', // lime-400
    '#fb923c', // orange-400
  ];

  // Хеш функция для детерминированного цвета
  function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  function getColorForTag(tagName: string, isDark: boolean = false): string {
    const hash = hashCode(tagName);
    const palette = isDark ? darkColorPalette : lightColorPalette;
    return palette[hash % palette.length];
  }

  function handleTagHover(tag: TagData, isEnter: boolean) {
    if (isEnter) {
      const bubble = bubbles.find(b => b.name === tag.name);
      if (bubble) {
        dispatch('updateHoveredBubble', bubble);
        bubble.targetRadius = bubble.radius * 1.2;
        dispatch('tagHover', {
          name: bubble.name,
          count: bubble.count
        });
      }
    } else {
      if (hoveredBubble) {
        hoveredBubble.targetRadius = hoveredBubble.radius;
        dispatch('tagHover', null);
      }
      dispatch('updateHoveredBubble', null);
    }
  }

  function handleTagClick(tag: TagData) {
    dispatch('tagClick', {
      name: tag.name,
      count: tag.count
    });
  }

  function handleKeydown(e: KeyboardEvent, tag: TagData) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTagClick(tag);
    }
  }
</script>

<div class="bubble-legend" class:dark-theme={$theme === 'dark'}>
  <h3 class="text-sm font-semibold mb-2 transition-colors duration-300" class:text-neutral-800={$theme !== 'dark'} class:text-neutral-200={$theme === 'dark'}>
    Популярные технологии:
  </h3>
  <div class="legend-grid">
    {#each tags.slice(0, 12) as tag, index}
      <div 
        class="legend-item"
        style="--bubble-color: {getColorForTag(tag.name, $theme === 'dark')}"
        tabindex="0"
        role="button"
        on:mouseenter={() => handleTagHover(tag, true)}
        on:mouseleave={() => handleTagHover(tag, false)}
        on:click={() => handleTagClick(tag)}
        on:keydown={(e) => handleKeydown(e, tag)}
      >
        <div class="legend-dot"></div>
        <span class="legend-text">{tag.name}</span>
        <span class="legend-count">{tag.count}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  /* Статичная легенда */
  .bubble-legend {
    @apply absolute top-4 right-4 bg-white rounded-lg p-4 shadow-lg;
    @apply border border-neutral-200;
    @apply transition-colors duration-300;
    max-width: 250px;
    max-height: 300px;
    overflow-y: auto;
  }

  .bubble-legend.dark-theme {
    @apply bg-slate-800 border-slate-700;
  }

  /* Кастомный скроллбар для легенды */
  .bubble-legend::-webkit-scrollbar {
    width: 4px;
  }
  
  .bubble-legend::-webkit-scrollbar-track {
    background: rgb(241 245 249);
  }
  
  .bubble-legend::-webkit-scrollbar-thumb {
    background: rgb(148 163 184);
    border-radius: 2px;
  }
  
  .bubble-legend::-webkit-scrollbar-thumb:hover {
    background: rgb(100 116 139);
  }
  
  /* Темная тема для скроллбара */
  :global(.dark) .bubble-legend::-webkit-scrollbar-track {
    background: rgb(51 65 85);
  }
  
  :global(.dark) .bubble-legend::-webkit-scrollbar-thumb {
    background: rgb(71 85 105);
  }
  
  :global(.dark) .bubble-legend::-webkit-scrollbar-thumb:hover {
    background: rgb(100 116 139);
  }

  /* Скрываем на мобильных */
  @media (max-width: 768px) {
    .bubble-legend {
      display: none;
    }
  }

  .legend-grid {
    @apply space-y-2;
  }

  .legend-item {
    @apply flex items-center gap-2 p-1 rounded cursor-pointer;
    @apply hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50;
    @apply transition-all duration-150 ease-in-out;
  }

  .dark-theme .legend-item:hover {
    @apply bg-slate-700;
  }

  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: var(--bubble-color);
    flex-shrink: 0;
  }

  .legend-text {
    @apply text-sm font-medium text-neutral-800 transition-colors duration-300;
    flex: 1;
  }

  .dark-theme .legend-text {
    @apply text-neutral-200;
  }

  .legend-count {
    @apply text-xs text-neutral-500 font-mono transition-colors duration-300;
  }

  .dark-theme .legend-count {
    @apply text-neutral-400;
  }
</style> 