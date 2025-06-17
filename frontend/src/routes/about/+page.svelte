<script lang="ts">
  import { onMount } from 'svelte';
  import HeroSection from '$lib/components/about/HeroSection.svelte';
  import ContentCard from '$lib/components/about/ContentCard.svelte';
  import FeaturesList from '$lib/components/about/FeaturesList.svelte';
  import TechGrid from '$lib/components/about/TechGrid.svelte';
  import StatsGrid from '$lib/components/about/StatsGrid.svelte';
  import RoadmapList from '$lib/components/about/RoadmapList.svelte';
  import ContactInfo from '$lib/components/about/ContactInfo.svelte';
  
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });

  const features = [
    {
      title: "Агрегация вакансий",
      description: "собираем предложения с HeadHunter и других площадок"
    },
    {
      title: "Интеллектуальная фильтрация", 
      description: "поиск по навыкам, опыту работы и зарплате"
    },
    {
      title: "Визуализация трендов",
      description: "интерактивные графики популярности технологий"
    },
    {
      title: "Удобный интерфейс",
      description: "современный и отзывчивый дизайн для любых устройств"
    },
    {
      title: "Актуальные данные",
      description: "ежедневное обновление базы вакансий"
    }
  ];

  const techCategories = [
    {
      name: "Frontend",
      technologies: ["SvelteKit", "TypeScript", "Tailwind CSS", "D3.js"]
    },
    {
      name: "Backend", 
      technologies: ["Node.js", "MongoDB", "Express.js", "REST API"]
    },
    {
      name: "DevOps",
      technologies: ["Docker", "GitHub Actions", "Automated Testing", "Performance Monitoring"]
    }
  ];

  const stats = [
    { number: "200+", label: "Актуальных вакансий" },
    { number: "50+", label: "Технологий в фильтрах" },
    { number: "24/7", label: "Обновление данных" },
    { number: "100%", label: "Бесплатно для пользователей" }
  ];

  const roadmapItems = [
    "🔄 Интеграция с дополнительными job-платформами",
    "🤖 Персонализированные рекомендации на основе ИИ",
    "📱 Мобильное приложение",
    "🔔 Push-уведомления о новых вакансиях",
    "📈 Аналитика трендов рынка труда",
    "💾 Возможность сохранения избранных вакансий"
  ];
</script>

<svelte:head>
  <title>О проекте - JS Пульс</title>
  <meta name="description" content="JS Пульс - ваш надежный агрегатор вакансий для frontend разработчиков. Мы собираем и анализируем актуальные предложения работы в сфере JavaScript, React, Vue, Angular и других frontend технологий." />
</svelte:head>

<div class="about-page page">
  <HeroSection />

  <div class="content-section page-content">
    <div class="content-grid">
      
      <!-- Что такое JS Пульс -->
      <ContentCard title="🚀 Что такое JS Пульс?" fadeIn={mounted}>
        <p>
          JS Пульс — это специализированная платформа для поиска работы в сфере frontend разработки. 
          Мы автоматически собираем и анализируем вакансии с ведущих IT-площадок, предоставляя вам 
          только релевантные предложения работы.
        </p>
        <p>
          Наша цель — упростить поиск работы для JavaScript разработчиков, предоставив удобный 
          интерфейс для поиска и фильтрации вакансий по навыкам, опыту и другим параметрам.
        </p>
      </ContentCard>

      <!-- Основные возможности -->
      <ContentCard title="⚡ Основные возможности" fadeIn={mounted}>
        <FeaturesList {features} />
      </ContentCard>

      <!-- Технологии -->
      <ContentCard title="🛠️ Технологический стек" fadeIn={mounted}>
        <TechGrid {techCategories} />
      </ContentCard>

      <!-- Статистика -->
      <ContentCard title="📊 Наша статистика" type="stats" fadeIn={mounted}>
        <StatsGrid {stats} />
      </ContentCard>

      <!-- Планы развития -->
      <ContentCard title="🔮 Планы развития" fadeIn={mounted}>
        <RoadmapList {roadmapItems} />
      </ContentCard>

      <!-- Контакты и обратная связь -->
      <ContentCard title="💬 Обратная связь" type="contact" fadeIn={mounted}>
        <p>
          Проект находится в активной разработке. Мы ценим ваше мнение и предложения по улучшению!
        </p>
        <p>
          <strong>JS Пульс</strong> — это проект с открытым исходным кодом, созданный сообществом 
          для сообщества разработчиков.
        </p>
        <ContactInfo />
      </ContentCard>

    </div>
  </div>
</div>

<style>
  .about-page {
    @apply -mx-4 sm:-mx-6 lg:-mx-8;
  }

  /* Контент */
  .content-section {
    @apply px-4 sm:px-6 lg:px-8 py-16;
    @apply max-w-7xl mx-auto;
  }

  .content-grid {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-8;
  }

  /* Мобильная адаптация */
  @media (max-width: 640px) {
    .content-section {
      @apply px-4 py-8;
    }
  }
</style>