<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { theme } from '$lib/stores/themeStore';

  // Типы для входных данных
  interface TagData {
    name: string;
    count: number;
  }

  // Пропы компонента
  export let tags: TagData[] = [];
  export let width: number = 800;
  export let height: number = 600;
  export let minRadius: number = 50;
  export let maxRadius: number = 100;

  // Типизация событий
  const dispatch = createEventDispatcher<{
    tagClick: TagData;
    tagHover: TagData | null;
  }>();

  // Внутренние типы для пузырьков
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

  // DOM элементы
  let canvas: HTMLCanvasElement;
  let container: HTMLDivElement;
  
  // Определение Windows для отключения анимации дыхания
  function isWindows(): boolean {
    return typeof window !== 'undefined' && /Win/.test(window.navigator.platform);
  }

  
  // Canvas контекст и состояние
  let ctx: CanvasRenderingContext2D | null = null;
  let bubbles: Bubble[] = [];
  let animationId: number = 0;
  let simulation: any;
  let hoveredBubble: Bubble | null = null;

  // Детерминированная цветовая схема на базе JSPulse палитры
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

  // Темная цветовая палитра - более яркие и контрастные цвета
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
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  function getColorForTag(tagName: string, isDark: boolean = false): string {
    const hash = hashCode(tagName);
    const palette = isDark ? darkColorPalette : lightColorPalette;
    return palette[hash % palette.length];
  }

  // Создание пузырьков из данных тегов
  function createBubbles(tagData: TagData[], isDark: boolean = false): Bubble[] {
    if (!tagData.length) return [];

    const maxCount = Math.max(...tagData.map(t => t.count));
    const minCount = Math.min(...tagData.map(t => t.count));
    
    return tagData.map((tag, index) => {
      // Нормализация размера пузыря
      const normalizedSize = minCount === maxCount ? 0.5 : 
        (tag.count - minCount) / (maxCount - minCount);
      const radius = minRadius + normalizedSize * (maxRadius - minRadius);
      
      return {
        id: `bubble-${index}`,
        name: tag.name,
        count: tag.count,
        radius,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        color: getColorForTag(tag.name, isDark),
        oscillationPhase: Math.random() * Math.PI * 2,
        targetRadius: radius,
        currentRadius: radius,
      };
    });
  }

  // Инициализация d3-force симуляции
  async function initSimulation() {
    // Динамический импорт d3-force
    const d3 = await import('d3-force');
    
    simulation = d3.forceSimulation(bubbles)
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.01))
      .force('collision', d3.forceCollide().radius((d: any) => d.currentRadius + 5).strength(0.7))
      .force('charge', d3.forceManyBody().strength(-10)) // Очень слабое отталкивание
      .force('attract', d3.forceRadial(0, width / 2, height / 2).strength(0.01)) // Слабое притяжение к центру
      .alpha(0.2)
      .alphaDecay(0); // Бесконечное движение - отключаем затухание

    simulation.on('tick', () => {
      updateBubbles();
      render();
    });
    
    // Принудительно поддерживаем симуляцию
    setInterval(() => {
      if (simulation && simulation.alpha() < 0.1) {
        simulation.alpha(0.3).restart();
      }
    }, 2000); // Перезапускаем каждые 5 секунд
  }

  // Обновление состояния пузырьков
  function updateBubbles() {
    const time = Date.now() * 0.0008;
    
    bubbles.forEach((bubble, index) => {
      // Живые колебания радиуса (только не на Windows)
      if (!isWindows()) {
        const oscillation = Math.sin(time * 2 + bubble.oscillationPhase) * 0.05;
        bubble.currentRadius = bubble.targetRadius * (1 + oscillation);
      } else {
        // На Windows статичный размер без дыхания
        bubble.currentRadius = bubble.targetRadius;
      }
      
              // Постоянное броуновское движение
        const phase = index * 1.3;
        const oscillationX = Math.sin(time * 0.4 + phase) * 0.5;
        const oscillationY = Math.cos(time * 0.6 + phase) * 0.3;
        
        // Небольшие случайные возмущения
        const randomX = (Math.random() - 0.5) * 0.1;
        const randomY = (Math.random() - 0.5) * 0.1;
        
        bubble.x += oscillationX + randomX;
        bubble.y += oscillationY + randomY;

      // Границы
      const minPadding = 2;
      const paddingX = bubble.currentRadius + minPadding;
      const paddingY = bubble.currentRadius + minPadding;
      
      bubble.x = Math.max(paddingX, Math.min(width - paddingX, bubble.x));
      bubble.y = Math.max(paddingY, Math.min(height - paddingY, bubble.y));
    });
  }

  // Функция отрисовки одного пузыря
  function drawBubble(context: CanvasRenderingContext2D, bubble: Bubble, isHovered: boolean = false) {
    context.save();
    
    // Усиленная тень для ховера
    if (isHovered) {
      context.shadowColor = 'rgba(0, 0, 0, 0.25)';
      context.shadowBlur = 15;
      context.shadowOffsetX = 5;
      context.shadowOffsetY = 5;
    } else {
      context.shadowColor = 'rgba(0, 0, 0, 0.1)';
      context.shadowBlur = 5;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
    }
    
    // Основной цвет пузыря
    context.beginPath();
    context.arc(bubble.x, bubble.y, bubble.currentRadius, 0, Math.PI * 2);
    context.fillStyle = bubble.color;
    context.fill();
    
    // Градиент для объема
    const gradient = context.createRadialGradient(
      bubble.x - bubble.currentRadius * 0.3,
      bubble.y - bubble.currentRadius * 0.3,
      0,
      bubble.x,
      bubble.y,
      bubble.currentRadius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    context.beginPath();
    context.arc(bubble.x, bubble.y, bubble.currentRadius, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
    
    // Текст тега
    context.shadowColor = 'transparent';
    context.fillStyle = 'white';
    context.font = `bold ${Math.max(10, bubble.currentRadius * 0.3)}px Inter, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Обрезка текста по размеру пузыря
    const maxTextWidth = bubble.currentRadius * 1.6;
    let text = bubble.name;
    let textWidth = context.measureText(text).width;
    
    if (textWidth > maxTextWidth) {
      while (textWidth > maxTextWidth && text.length > 1) {
        text = text.slice(0, -1);
        textWidth = context.measureText(text + '...').width;
      }
      text = text + '...';
    }
    
    context.fillText(text, bubble.x, bubble.y);
    
    context.restore();
  }

  // Отрисовка на Canvas с текстом
  function render() {
    if (!ctx || !canvas) return;
    
    const context = ctx;

    // Очистка canvas
    context.clearRect(0, 0, width, height);

    // Сначала отрисовываем все обычные пузыри
    bubbles.forEach(bubble => {
      if (bubble !== hoveredBubble) {
        drawBubble(context, bubble, false);
      }
    });

    // Затем отрисовываем ховерный пузырь поверх всех остальных
    if (hoveredBubble) {
      drawBubble(context, hoveredBubble, true);
    }
  }

  // Обработка движения мыши
  function handleMouseMove(event: MouseEvent) {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // Правильный расчёт координат с учётом только CSS размеров
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Поиск пузыря под курсором
    const newHoveredBubble = bubbles.find(bubble => {
      const dx = mouseX - bubble.x;
      const dy = mouseY - bubble.y;
      return Math.sqrt(dx * dx + dy * dy) <= bubble.currentRadius;
    });

    if (newHoveredBubble !== hoveredBubble) {
      hoveredBubble = newHoveredBubble || null;
      
      // Изменение курсора в зависимости от наличия пузыря под курсором
      canvas.style.cursor = hoveredBubble ? 'pointer' : 'default';
      
      if (hoveredBubble) {
        // Увеличение пузыря при hover
        hoveredBubble.targetRadius = hoveredBubble.radius * 1.2;
        
        dispatch('tagHover', {
          name: hoveredBubble.name,
          count: hoveredBubble.count
        });
      } else {
        dispatch('tagHover', null);
      }
      
      // Сброс размеров других пузырей
      bubbles.forEach(bubble => {
        if (bubble !== hoveredBubble) {
          bubble.targetRadius = bubble.radius;
        }
      });
    }
  }

  // Обработка кликов
  function handleClick(event: MouseEvent) {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Поиск пузыря под курсором при клике
    const clickedBubble = bubbles.find(bubble => {
      const dx = mouseX - bubble.x;
      const dy = mouseY - bubble.y;
      return Math.sqrt(dx * dx + dy * dy) <= bubble.currentRadius;
    });

    if (clickedBubble) {
      dispatch('tagClick', {
        name: clickedBubble.name,
        count: clickedBubble.count
      });
    }
  }

  // Обработка изменения размера
  function handleResize() {
    if (!canvas || !container || typeof window === 'undefined') return;
    
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    
    // Обновление размера canvas с учетом DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    // Обновление симуляции
    if (simulation) {
      simulation.force('center', simulation.force('center').x(width / 2).y(height / 2));
      simulation.force('attract', simulation.force('attract').x(width / 2).y(height / 2));
      simulation.alpha(0.3).restart();
    }
  }

  // Lifecycle методы
  onMount(async () => {
    if (!canvas || typeof window === 'undefined') return;
    
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Инициализация canvas
    handleResize();
    
    // Создание пузырьков
    bubbles = createBubbles(tags, $theme === 'dark');
    
    // Запуск симуляции
    await initSimulation();
    
    // Обработчики событий
    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

  });

  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    
    if (simulation) {
      simulation.stop();
    }
    
    window.removeEventListener('resize', handleResize);
  });

  // Реактивность на изменение данных и темы
  $: if (tags && (bubbles.length !== tags.length || bubbles.length > 0)) {
    bubbles = createBubbles(tags, $theme === 'dark');
    if (simulation) {
      simulation.nodes(bubbles);
      simulation.alpha(1).restart();
    }
  }
</script>

<section class="tags-visualization-section -mt-4">
  <div class="tags-canvas-container">
    <div bind:this={container} class="bubbles-container">
      <canvas
        bind:this={canvas}
        class="bubbles-canvas"
        aria-label="Интерактивная визуализация тегов вакансий"
      ></canvas>
      
      <!-- Статичная легенда (скрыта на мобильных) -->
      <div class="bubble-legend">
        <h3 class="text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300 transition-colors duration-300">
          Популярные технологии:
        </h3>
        <div class="legend-grid">
          {#each tags.slice(0, 12) as tag, index}
                         <div 
               class="legend-item"
               style="--bubble-color: {createBubbles([tag], $theme === 'dark')[0]?.color}"
               tabindex="0"
               role="button"
               on:mouseenter={() => {
                 const bubble = bubbles.find(b => b.name === tag.name);
                 if (bubble) {
                   hoveredBubble = bubble;
                   bubble.targetRadius = bubble.radius * 1.2;
                   dispatch('tagHover', {
                     name: bubble.name,
                     count: bubble.count
                   });
                 }
               }}
               on:mouseleave={() => {
                 if (hoveredBubble) {
                   hoveredBubble.targetRadius = hoveredBubble.radius;
                   dispatch('tagHover', null);
                 }
                 hoveredBubble = null;
               }}
               on:click={() => {
                 dispatch('tagClick', {
                   name: tag.name,
                   count: tag.count
                 });
               }}
               on:keydown={(e) => {
                 if (e.key === 'Enter' || e.key === ' ') {
                   e.preventDefault();
                   dispatch('tagClick', {
                     name: tag.name,
                     count: tag.count
                   });
                 }
               }}
             >
              <div class="legend-dot"></div>
              <span class="legend-text">{tag.name}</span>
              <span class="legend-count">{tag.count}</span>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- SVG для accessibility (скрытый) -->
      <svg class="sr-only" aria-label="Теги вакансий">
        {#each tags as tag}
          <text>{tag.name}: {tag.count} вакансий</text>
        {/each}
      </svg>
    </div>
  </div>
</section>

<style>
  .bubbles-container {
    @apply relative w-full h-full min-h-96 bg-neutral-50 overflow-hidden;
    @apply transition-colors duration-300;
  }

  /* Темная тема для контейнера пузырей */
  :global(.dark) .bubbles-container {
    @apply bg-slate-900;
  }

  .bubbles-canvas {
    @apply w-full h-full;
    display: block;
    cursor: default;
  }

  /* Статичная легенда */
  .bubble-legend {
    @apply absolute top-4 right-4 bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg;
    @apply border border-neutral-200 dark:border-slate-700;
    @apply transition-colors duration-300;
    max-width: 250px;
    max-height: 300px;
    overflow-y: auto;
    
    /* Скрываем на мобильных */
    @media (max-width: 768px) {
      @apply hidden;
    }
  }

  .legend-grid {
    @apply space-y-2;
  }

  .legend-item {
    @apply flex items-center gap-2 p-1 rounded cursor-pointer;
    @apply hover:bg-neutral-50 dark:hover:bg-slate-700;
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50;
    @apply transition-all duration-150 ease;
  }

  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: var(--bubble-color);
    flex-shrink: 0;
  }

  .legend-text {
    @apply text-sm font-medium text-neutral-800 dark:text-neutral-200;
    @apply transition-colors duration-300;
    flex: 1;
  }

  .legend-count {
    @apply text-xs text-neutral-500 dark:text-neutral-400 font-mono;
    @apply transition-colors duration-300;
  }

  .tags-visualization-section {
    @apply -mx-4; /* Выходим за границы main контейнера */
    width: 100%;
    max-width: 100vw;
    margin-left: calc(-50vw + 50%);
  }

  .tags-canvas-container {
    @apply mx-auto;
    height: 400px;
  }

  /* Мобильная адаптация */
  @media (max-width: 768px) {
    .tags-canvas-container {
      height: 300px;
    }
  }

  /* Screen reader only content */
  .sr-only {
    @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  /* Мобильная адаптация */
  @media (max-width: 768px) {
    .bubbles-container {
      @apply min-h-80;
    }
  }

  /* Высококонтрастный режим */
  @media (prefers-contrast: high) {
    .bubbles-container {
      @apply border-2 border-neutral-400;
    }
  }
</style> 