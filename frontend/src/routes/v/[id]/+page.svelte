<!-- frontend/src/routes/v/[id]/+page.svelte -->
<script lang="ts">
  import type { PageData } from "./$types";
  import VacancyCard from "$lib/components/VacancyCard.svelte";
  import { VacancyDTOSchema, type VacancyDTO } from "@jspulse/shared";
  
  // Определяем тип локально
  type VacancyWithHtml = VacancyDTO & { htmlDescription?: string };
  
  export let data: PageData;
  
  // Создаем базовую моковую вакансию для случаев, когда данных нет
  const mockVacancy = {
    _id: "mock-123",
    externalId: "ext-123",
    title: "Senior JavaScript Developer",
    company: "JS Pulse Corp",
    location: "Москва, Россия",
    description: "Моковая вакансия для использования, когда реальные данные недоступны.",
    url: "https://example.com/job/123",
    publishedAt: new Date().toISOString(),
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
  const rawVacancy = data.vacancy || mockVacancy;
  
  // Преобразуем null в undefined для совместимости типов
  const vacancy = {
    ...rawVacancy,
    salaryFrom: rawVacancy.salaryFrom === null ? undefined : rawVacancy.salaryFrom,
    salaryTo: rawVacancy.salaryTo === null ? undefined : rawVacancy.salaryTo,
    salaryCurrency: rawVacancy.salaryCurrency === null ? undefined : rawVacancy.salaryCurrency,
    experience: rawVacancy.experience === null ? undefined : rawVacancy.experience,
    employment: rawVacancy.employment === null ? undefined : rawVacancy.employment,
    address: rawVacancy.address === null ? undefined : rawVacancy.address,
    htmlDescription: rawVacancy.htmlDescription === null ? undefined : rawVacancy.htmlDescription
  };
  
  // Валидируем данные вакансии через Zod
  $: validationResult = VacancyDTOSchema.safeParse(vacancy);
  $: if (!validationResult.success) {
    console.warn('[+page.svelte] Невалидные данные вакансии:', validationResult.error);
  }
  
  // Используем валидированные данные для мета-тегов с явным приведением типа
  $: validVacancy = validationResult.success 
    ? validationResult.data as VacancyWithHtml 
    : vacancy as VacancyWithHtml;
</script>

<svelte:head>
  <title>{validVacancy.title || "Вакансия"} - JS Пульс</title>
  {#if validVacancy.description}
    <meta name="description" content={validVacancy.description.substring(0, 150)} />
  {/if}
</svelte:head>

<main class="vacancy-detail-page">
  <h1>Детали вакансии</h1>
  
  <!-- Используем карточку вакансии с автоматически раскрытым описанием и полным исходным текстом -->
  <ul class="vacancies-list">
    <VacancyCard 
      vacancy={validVacancy} 
      expandDescription={true} 
      showFullDescription={true} 
    />
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
