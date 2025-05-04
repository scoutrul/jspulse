<!-- frontend/src/routes/v/[id]/+page.svelte -->
<script lang="ts">
  import type { PageData } from "./$types";
  import VacancyCard from "$lib/components/VacancyCard.svelte";
  
  // Импортируем formatDate из того же файла, что использует VacancyCard
  import { formatDate } from "$lib/utils/date.utils";

  export let data: PageData;
  
  // Моковые данные для тестирования
  const mockVacancy = {
    _id: "mock-123",
    externalId: "ext-123",
    title: "Senior JavaScript Developer",
    company: "JS Pulse Corp",
    location: "Москва, Россия",
    description: "Тестовая вакансия для отладки",
    url: "https://example.com/job/123",
    publishedAt: new Date().toISOString(), // Текущая дата как строка - более реалистично
    source: "Mock",
    salaryFrom: 200000,
    salaryTo: 300000,
    salaryCurrency: "₽",
    skills: ["JavaScript", "TypeScript", "React", "Node.js", "SvelteKit"],
    experience: "от 3 лет",
    employment: "Полная занятость",
    schedule: "Гибкий график",
    address: "Москва, ул. Программистов, 42"
  };
  
  // Используем реальные данные, если они есть, иначе моковые
  const vacancy = data.vacancy || mockVacancy;
</script>

<svelte:head>
  <title>{vacancy.title || "Вакансия"} - JS Пульс</title>
  {#if vacancy.description}
    <meta name="description" content={vacancy.description.substring(0, 150)} />
  {/if}
</svelte:head>

<main class="vacancy-detail-page">
  <h1>Детали вакансии</h1>
  
  <!-- Используем карточку вакансии с автоматически раскрытым описанием -->
  <ul class="vacancies-list">
    <VacancyCard vacancy={vacancy} expandDescription={true} />
  </ul>
</main>

<style>
  .vacancy-detail-page {
    max-width: 900px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  h1 {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    color: #333;
  }
  
  .vacancies-list {
    padding: 0;
    margin: 0;
  }
</style>
