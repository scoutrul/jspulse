<script lang="ts">
  import TagBubblesCanvas from '$lib/components/TagBubblesCanvas.svelte';

  // Тестовые данные тегов
  const sampleTags = [
    { name: 'JavaScript', count: 150 },
    { name: 'TypeScript', count: 120 },
    { name: 'React', count: 100 },
    { name: 'Vue.js', count: 80 },
    { name: 'Angular', count: 75 },
    { name: 'Node.js', count: 90 },
    { name: 'Express', count: 60 },
    { name: 'MongoDB', count: 45 },
    { name: 'PostgreSQL', count: 55 },
    { name: 'Docker', count: 40 },
    { name: 'AWS', count: 35 },
    { name: 'Git', count: 130 },
    { name: 'HTML', count: 140 },
    { name: 'CSS', count: 125 },
    { name: 'Sass', count: 30 },
    { name: 'Webpack', count: 25 },
    { name: 'Jest', count: 20 },
    { name: 'Redux', count: 50 }
  ];

  interface TagData {
    name: string;
    count: number;
  }

  function handleTagClick(event: CustomEvent<TagData>) {
    console.log('Tag clicked:', event.detail);
    alert(`Кликнут тег: ${event.detail.name} (${event.detail.count} вакансий)`);
  }

  function handleTagHover(event: CustomEvent<TagData | null>) {
    if (event.detail) {
      console.log('Tag hovered:', event.detail);
    }
  }
</script>

<div class="test-page">
  <header class="page-header">
    <h1>Тестирование TagBubblesCanvas</h1>
    <p>Интерактивная визуализация тегов вакансий в стиле CryptoBubbles</p>
  </header>

  <main class="main-content">
    <section class="demo-section">
      <h2>Демо компонента</h2>
      <div class="canvas-container">
        <TagBubblesCanvas
          tags={sampleTags}
          on:tagClick={handleTagClick}
          on:tagHover={handleTagHover}
        />
      </div>
    </section>

    <section class="info-section">
      <h3>Функциональность</h3>
      <ul>
        <li>🎨 <strong>Физическая симуляция:</strong> пузырьки притягиваются к центру и отталкиваются друг от друга</li>
        <li>🖱️ <strong>Интерактивность:</strong> наведение мыши увеличивает пузырь</li>
        <li>📊 <strong>Размер:</strong> зависит от количества вакансий</li>
        <li>🌈 <strong>Цвета:</strong> детерминированная схема на основе JSPulse палитры</li>
        <li>💫 <strong>Анимации:</strong> живые колебания и плавные переходы</li>
        <li>📱 <strong>Адаптивность:</strong> поддержка мобильных устройств</li>
        <li>♿ <strong>Accessibility:</strong> поддержка screen readers</li>
      </ul>
    </section>

    <section class="controls-section">
      <h3>Тестовые данные</h3>
      <div class="tags-grid">
        {#each sampleTags as tag}
          <div class="tag-item">
            <span class="tag-name">{tag.name}</span>
            <span class="tag-count">{tag.count}</span>
          </div>
        {/each}
      </div>
    </section>
  </main>
</div>

<style>
  .test-page {
    @apply min-h-screen bg-neutral-50 p-4;
  }

  .page-header {
    @apply text-center mb-8;
  }

  .page-header h1 {
    @apply text-4xl font-bold text-neutral-800 mb-2;
    background: linear-gradient(135deg, theme('colors.primary.600') 0%, theme('colors.primary.500') 50%, theme('colors.primary.400') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .page-header p {
    @apply text-lg text-neutral-600;
  }

  .main-content {
    @apply max-w-6xl mx-auto space-y-8;
  }

  .demo-section h2 {
    @apply text-2xl font-semibold text-neutral-800 mb-4;
  }

  .canvas-container {
    @apply bg-white rounded-xl shadow-lg p-6 border border-neutral-200;
    height: 600px;
  }

  .info-section {
    @apply bg-white rounded-xl shadow-lg p-6 border border-neutral-200;
  }

  .info-section h3 {
    @apply text-xl font-semibold text-neutral-800 mb-4;
  }

  .info-section ul {
    @apply space-y-3;
  }

  .info-section li {
    @apply flex items-start gap-2 text-neutral-700;
  }

  .controls-section {
    @apply bg-white rounded-xl shadow-lg p-6 border border-neutral-200;
  }

  .controls-section h3 {
    @apply text-xl font-semibold text-neutral-800 mb-4;
  }

  .tags-grid {
    @apply grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3;
  }

  .tag-item {
    @apply flex flex-col items-center p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-center;
  }

  .tag-name {
    @apply font-medium text-sm text-neutral-800;
  }

  .tag-count {
    @apply text-xs text-neutral-500 mt-1;
  }

  /* Мобильная адаптация */
  @media (max-width: 768px) {
    .test-page {
      @apply p-2;
    }

    .page-header h1 {
      @apply text-3xl;
    }

    .canvas-container {
      @apply p-4;
      height: 400px;
    }

    .tags-grid {
      @apply grid-cols-2 sm:grid-cols-3;
    }
  }
</style> 