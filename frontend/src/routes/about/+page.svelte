<script lang="ts">
  import { onMount } from 'svelte';
  
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });
</script>

<svelte:head>
  <title>О проекте - JS Пульс</title>
  <meta name="description" content="JS Пульс - ваш надежный агрегатор вакансий для frontend разработчиков. Мы собираем и анализируем актуальные предложения работы в сфере JavaScript, React, Vue, Angular и других frontend технологий." />
</svelte:head>

<div class="about-page">
  <div class="hero-section">
    <div class="hero-content">
      <div class="logo-container">
        <img src="/jspulse.png" alt="JS Пульс" class="hero-logo" />
        <div class="logo-glow"></div>
      </div>
      
      <h1 class="hero-title">О проекте JS Пульс</h1>
      <p class="hero-subtitle">
        Ваш надежный агрегатор вакансий для frontend разработчиков
      </p>
    </div>
  </div>

  <div class="content-section">
    <div class="content-grid">
      
      <!-- Что такое JS Пульс -->
      <section class="content-card" class:fade-in={mounted}>
        <div class="card-header">
          <h2 class="section-title">🚀 Что такое JS Пульс?</h2>
        </div>
        <div class="card-content">
          <p>
            JS Пульс — это специализированная платформа для поиска работы в сфере frontend разработки. 
            Мы автоматически собираем и анализируем вакансии с ведущих IT-площадок, предоставляя вам 
            только релевантные предложения работы.
          </p>
          <p>
            Наша цель — упростить поиск работы для JavaScript разработчиков, предоставив удобный 
            интерфейс для поиска и фильтрации вакансий по навыкам, опыту и другим параметрам.
          </p>
        </div>
      </section>

      <!-- Основные возможности -->
      <section class="content-card" class:fade-in={mounted}>
        <div class="card-header">
          <h2 class="section-title">⚡ Основные возможности</h2>
        </div>
        <div class="card-content">
          <ul class="features-list">
            <li>
              <strong>Агрегация вакансий</strong> — собираем предложения с HeadHunter и других площадок
            </li>
            <li>
              <strong>Интеллектуальная фильтрация</strong> — поиск по навыкам, опыту работы и зарплате
            </li>
            <li>
              <strong>Визуализация трендов</strong> — интерактивные графики популярности технологий
            </li>
            <li>
              <strong>Удобный интерфейс</strong> — современный и отзывчивый дизайн для любых устройств
            </li>
            <li>
              <strong>Актуальные данные</strong> — ежедневное обновление базы вакансий
            </li>
          </ul>
        </div>
      </section>

      <!-- Технологии -->
      <section class="content-card" class:fade-in={mounted}>
        <div class="card-header">
          <h2 class="section-title">🛠️ Технологический стек</h2>
        </div>
        <div class="card-content">
          <div class="tech-grid">
            <div class="tech-category">
              <h3>Frontend</h3>
              <ul>
                <li>SvelteKit</li>
                <li>TypeScript</li>
                <li>Tailwind CSS</li>
                <li>D3.js</li>
              </ul>
            </div>
            <div class="tech-category">
              <h3>Backend</h3>
              <ul>
                <li>Node.js</li>
                <li>MongoDB</li>
                <li>Express.js</li>
                <li>REST API</li>
              </ul>
            </div>
            <div class="tech-category">
              <h3>DevOps</h3>
              <ul>
                <li>Docker</li>
                <li>GitHub Actions</li>
                <li>Automated Testing</li>
                <li>Performance Monitoring</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Статистика -->
      <section class="content-card stats-card" class:fade-in={mounted}>
        <div class="card-header">
          <h2 class="section-title">📊 Наша статистика</h2>
        </div>
        <div class="card-content">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">200+</div>
              <div class="stat-label">Актуальных вакансий</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">50+</div>
              <div class="stat-label">Технологий в фильтрах</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">24/7</div>
              <div class="stat-label">Обновление данных</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">100%</div>
              <div class="stat-label">Бесплатно для пользователей</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Планы развития -->
      <section class="content-card" class:fade-in={mounted}>
        <div class="card-header">
          <h2 class="section-title">🔮 Планы развития</h2>
        </div>
        <div class="card-content">
          <ul class="roadmap-list">
            <li>🔄 Интеграция с дополнительными job-платформами</li>
            <li>🤖 Персонализированные рекомендации на основе ИИ</li>
            <li>📱 Мобильное приложение</li>
            <li>🔔 Push-уведомления о новых вакансиях</li>
            <li>📈 Аналитика трендов рынка труда</li>
            <li>💾 Возможность сохранения избранных вакансий</li>
          </ul>
        </div>
      </section>

      <!-- Контакты и обратная связь -->
      <section class="content-card contact-card" class:fade-in={mounted}>
        <div class="card-header">
          <h2 class="section-title">💬 Обратная связь</h2>
        </div>
        <div class="card-content">
          <p>
            Проект находится в активной разработке. Мы ценим ваше мнение и предложения по улучшению!
          </p>
          <p>
            <strong>JS Пульс</strong> — это проект с открытым исходным кодом, созданный сообществом 
            для сообщества разработчиков.
          </p>
          <div class="contact-info">
            <p>
              <strong>Версия:</strong> Beta 1.0<br>
              <strong>Последнее обновление:</strong> Январь 2025
            </p>
          </div>
        </div>
      </section>

    </div>
  </div>
</div>

<style>
  .about-page {
    @apply min-h-screen -mx-4 sm:-mx-6 lg:-mx-8;
  }

  /* Hero секция */
  .hero-section {
    @apply relative bg-gradient-to-br from-warning-50 via-blue-50 to-indigo-100;
    @apply px-4 sm:px-6 lg:px-8 py-16 sm:py-20;
    background-image: 
      radial-gradient(circle at 20% 80%, rgba(251, 191, 36, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
  }

  .hero-content {
    @apply max-w-4xl mx-auto text-center;
  }

  .logo-container {
    @apply relative inline-block mb-8;
  }

  .hero-logo {
    @apply w-24 h-24 sm:w-32 sm:h-32 rounded-2xl shadow-lg relative z-10;
    filter: drop-shadow(0 8px 16px rgba(251, 191, 36, 0.25));
  }

  .logo-glow {
    @apply absolute inset-0 bg-warning-400 rounded-2xl opacity-20 blur-xl scale-110;
    animation: glow-pulse 3s ease-in-out infinite;
  }

  @keyframes glow-pulse {
    0%, 100% { opacity: 0.2; transform: scale(1.1); }
    50% { opacity: 0.4; transform: scale(1.2); }
  }

  .hero-title {
    @apply text-4xl sm:text-5xl lg:text-6xl font-bold mb-6;
    background: linear-gradient(135deg, theme('colors.warning.600') 0%, theme('colors.blue.600') 50%, theme('colors.indigo.600') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    @apply text-xl sm:text-2xl text-neutral-600 mb-8 max-w-2xl mx-auto;
  }

  /* Контент */
  .content-section {
    @apply px-4 sm:px-6 lg:px-8 py-16;
    @apply max-w-7xl mx-auto;
  }

  .content-grid {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-8;
  }

  .content-card {
    @apply bg-white border border-neutral-200 rounded-xl p-6 shadow-sm;
    @apply hover:shadow-md transition-all duration-300;
    @apply opacity-0 transform translate-y-8;
  }

  .content-card.fade-in {
    @apply opacity-100 transform translate-y-0;
    transition: all 0.6s ease-out;
  }

  .card-header {
    @apply mb-4;
  }

  .section-title {
    @apply text-2xl font-bold text-neutral-800 m-0;
    background: linear-gradient(135deg, theme('colors.neutral.800') 0%, theme('colors.neutral.600') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .card-content {
    @apply text-neutral-600 leading-relaxed;
  }

  .features-list {
    @apply space-y-3 list-none p-0;
  }

  .features-list li {
    @apply flex items-start gap-3;
    @apply relative pl-6;
  }

  .features-list li::before {
    content: "✓";
    @apply absolute left-0 top-0;
    @apply text-success-500 font-bold text-lg;
  }

  /* Технологии */
  .tech-grid {
    @apply grid grid-cols-1 sm:grid-cols-3 gap-6;
  }

  .tech-category h3 {
    @apply text-lg font-semibold text-neutral-800 mb-3;
  }

  .tech-category ul {
    @apply list-none p-0 space-y-2;
  }

  .tech-category li {
    @apply text-neutral-600 py-1 px-3 bg-neutral-50 rounded-lg text-sm;
    @apply border border-neutral-200;
  }

  /* Статистика */
  .stats-card {
    @apply lg:col-span-2 bg-gradient-to-br from-success-50 to-blue-50;
    @apply border-success-200;
  }

  .stats-grid {
    @apply grid grid-cols-2 sm:grid-cols-4 gap-6;
  }

  .stat-item {
    @apply text-center;
  }

  .stat-number {
    @apply text-3xl sm:text-4xl font-bold text-success-600 mb-2;
  }

  .stat-label {
    @apply text-sm text-neutral-600 font-medium;
  }

  /* Roadmap */
  .roadmap-list {
    @apply space-y-3 list-none p-0;
  }

  .roadmap-list li {
    @apply flex items-start gap-3 py-2;
    @apply border-l-4 border-blue-200 pl-4;
    @apply bg-blue-50 rounded-r-lg;
  }

  /* Контакты */
  .contact-card {
    @apply lg:col-span-2 bg-gradient-to-br from-warning-50 to-orange-50;
    @apply border-warning-200;
  }

  .contact-info {
    @apply mt-4 p-4 bg-white rounded-lg border border-warning-200;
  }

  /* Мобильная адаптация */
  @media (max-width: 640px) {
    .hero-section {
      @apply py-12 px-4;
    }

    .hero-title {
      @apply text-3xl;
    }

    .hero-subtitle {
      @apply text-lg;
    }

    .content-section {
      @apply px-4 py-8;
    }

    .content-card {
      @apply p-4;
    }

    .tech-grid {
      @apply grid-cols-1 gap-4;
    }

    .stats-grid {
      @apply grid-cols-2 gap-4;
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .logo-glow {
      animation: none;
    }

    .content-card {
      @apply opacity-100 transform-none;
    }

    .content-card.fade-in {
      transition: none;
    }
  }

  /* High contrast */
  @media (prefers-contrast: high) {
    .content-card {
      @apply border-2 border-neutral-400;
    }

    .hero-title,
    .section-title {
      -webkit-text-fill-color: theme('colors.neutral.900');
    }
  }
</style>