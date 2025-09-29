<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { theme } from '$lib/stores/themeStore';
  import { browser } from '$app/environment';

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
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316',
  ];

  const darkColorPalette = [
    '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#38bdf8',
    '#a78bfa', '#f472b6', '#22d3ee', '#a3e635', '#fb923c',
  ];

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
        dispatch('tagHover', { name: bubble.name, count: bubble.count });
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
    dispatch('tagClick', { name: tag.name, count: tag.count });
  }

  function handleKeydown(e: KeyboardEvent, tag: TagData) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTagClick(tag);
    }
  }

  // Состояние сворачивания легенды
  let isCollapsed: boolean = false;
  if (browser) {
    const saved = localStorage.getItem('jspulse:bubbleLegend:collapsed');
    if (saved !== null) isCollapsed = saved === '1';
  }
  function toggleLegend() {
    isCollapsed = !isCollapsed;
    if (browser) localStorage.setItem('jspulse:bubbleLegend:collapsed', isCollapsed ? '1' : '0');
  }
</script>

<div class="bubble-legend" class:dark-theme={$theme === 'dark'} class:collapsed={isCollapsed}>
  <button type="button" class="legend-header" aria-expanded={!isCollapsed} on:click={toggleLegend}>
    <span class="legend-arrow" class:rotated={!isCollapsed}>▸</span>
    <span class="legend-title" class:text-neutral-800={$theme !== 'dark'} class:text-neutral-200={$theme === 'dark'}>Популярные технологии</span>
  </button>
  <div class="legend-grid" hidden={isCollapsed}>
    {#each tags.slice(0, 12) as tag}
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
  .bubble-legend {
    @apply absolute top-4 right-4 bg-white rounded-lg p-4 shadow-lg border border-neutral-200 transition-colors duration-300;
    max-width: 250px;
    max-height: 300px;
    overflow-y: auto;
  }
  .bubble-legend.dark-theme { @apply bg-slate-800 border-slate-700; }

  /* Свернутое состояние: меньше паддинги и полупрозрачность */
  .bubble-legend.collapsed { @apply p-2; opacity: 0.6; }

  .legend-header { @apply w-full flex items-center gap-2 mb-2 cursor-pointer select-none text-left; }
  .bubble-legend.collapsed .legend-header { @apply mb-0; }

  .legend-arrow { @apply text-neutral-500 transition-transform duration-200; }
  .legend-arrow.rotated { transform: rotate(90deg); }

  .legend-title { @apply text-sm font-semibold transition-colors duration-300; }

  /* Кастомный скроллбар */
  .bubble-legend::-webkit-scrollbar { width: 4px; }
  .bubble-legend::-webkit-scrollbar-track { background: rgb(241 245 249); }
  .bubble-legend::-webkit-scrollbar-thumb { background: rgb(148 163 184); border-radius: 2px; }
  .bubble-legend::-webkit-scrollbar-thumb:hover { background: rgb(100 116 139); }
  :global(.dark) .bubble-legend::-webkit-scrollbar-track { background: rgb(51 65 85); }
  :global(.dark) .bubble-legend::-webkit-scrollbar-thumb { background: rgb(71 85 105); }
  :global(.dark) .bubble-legend::-webkit-scrollbar-thumb:hover { background: rgb(100 116 139); }

  /* Скрываем на мобильных */
  @media (max-width: 768px) { .bubble-legend { display: none; } }

  .legend-grid { @apply space-y-2; }

  .legend-item { @apply flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-150 ease-in-out; }
  .dark-theme .legend-item:hover { @apply bg-slate-700; }

  .legend-dot { width: 12px; height: 12px; border-radius: 50%; background-color: var(--bubble-color); flex-shrink: 0; }
  .legend-text { @apply text-sm font-medium text-neutral-800 transition-colors duration-300; flex: 1; }
  .dark-theme .legend-text { @apply text-neutral-200; }
  .legend-count { @apply text-xs text-neutral-500 font-mono transition-colors duration-300; }
  .dark-theme .legend-count { @apply text-neutral-400; }
</style> 