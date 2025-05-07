<script lang="ts">
  import type { VacancyDTO } from "@jspulse/shared";
  import { z } from "zod";
  import { formatDate } from "$lib/utils/dayjs.utils";

  // Определяем VacancyDTOSchema локально для валидации
  const VacancyDTOSchema = z.object({
    _id: z.string(),
    title: z.string(),
    company: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    skills: z.array(z.string()).default([]),
    url: z.string().nullable().optional(),
    source: z.string(),
    publishedAt: z.date().nullable().optional(),
    salaryFrom: z.number().nullable().optional(),
    salaryTo: z.number().nullable().optional(),
    salaryCurrency: z.string().nullable().optional(),
    experience: z.string().nullable().optional(),
    employment: z.string().nullable().optional(),
    schedule: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    htmlDescription: z.string().nullable().optional()
  });

  type VacancyWithHtml = VacancyDTO & { htmlDescription?: string };
  export let vacancy: VacancyWithHtml;
  // Параметр для автоматического раскрытия описания
  export let expandDescription = false;
  // Параметр для отображения полного неусеченного описания
  export let showFullDescription = false;

  // Валидируем входящие данные
  $: validationResult = VacancyDTOSchema.safeParse(vacancy);
  $: if (!validationResult.success) {
    console.warn('[VacancyCard] Невалидные данные вакансии:', validationResult.error);
  }

  // Используем данные только если они валидны, или используем исходные данные с проверками
  $: validVacancy = validationResult.success ? validationResult.data : vacancy;
  $: hasSalary = validVacancy.salaryFrom || validVacancy.salaryTo || validVacancy.salaryCurrency;
  $: hasDetails = validVacancy.experience || validVacancy.employment || validVacancy.schedule || validVacancy.address;
  $: hasSkills = validVacancy.skills && validVacancy.skills.length > 0;
</script>

<li>
  <a href="/v/{validVacancy._id}" class="vacancy-title-link">
    <h3>{validVacancy.title}</h3>
  </a>
  <div class="vacancy-header">
    {#if validVacancy.company}
      <p class="company">{validVacancy.company}</p>
    {/if}
    {#if validVacancy.location}
      <p class="location">{validVacancy.location}</p>
    {/if}
    {#if hasSalary}
      <p class="salary">
        {#if validVacancy.salaryFrom}от {validVacancy.salaryFrom}{/if}
        {#if validVacancy.salaryTo}
          до {validVacancy.salaryTo}{/if}
        {#if validVacancy.salaryCurrency}
          {validVacancy.salaryCurrency}{/if}
      </p>
    {/if}
  </div>
  {#if hasDetails}
    <div class="vacancy-details">
      {#if validVacancy.experience}
        <p class="experience"><strong>Опыт:</strong> {validVacancy.experience}</p>
      {/if}
      {#if validVacancy.employment}
        <p class="employment"><strong>Занятость:</strong> {validVacancy.employment}</p>
      {/if}
      {#if validVacancy.schedule}
        <p class="schedule"><strong>График:</strong> {validVacancy.schedule}</p>
      {/if}
      {#if validVacancy.address}
        <p class="address"><strong>Адрес:</strong> {validVacancy.address}</p>
      {/if}
    </div>
  {/if}
  {#if hasSkills}
    <div class="skills">
      <strong>Навыки:</strong>
      {#each validVacancy.skills as skill}
        <span class="skill-tag">{skill}</span>
      {/each}
    </div>
  {/if}
  {#if validVacancy.publishedAt}
    <!-- Добавляем диагностический вывод в консоль -->
    {@const publishedAtDiag = (function() {
      console.log('[VacancyCard] ДИАГНОСТИКА publishedAt:', {
        raw: validVacancy.publishedAt,
        type: typeof validVacancy.publishedAt,
        valueOf: validVacancy.publishedAt && typeof validVacancy.publishedAt === 'object' 
          ? validVacancy.publishedAt.valueOf() 
          : null,
        instanceOf: validVacancy.publishedAt instanceof Date,
        isValidDate: validVacancy.publishedAt instanceof Date 
          ? !isNaN(validVacancy.publishedAt.getTime()) 
          : false,
        toString: String(validVacancy.publishedAt)
      });
      return true;
    })()}
    <p class="published-at">
      Опубликовано: {formatDate(validVacancy.publishedAt)}
    </p>
  {/if}
  {#if validVacancy.htmlDescription}
    <details class="description-details" open={expandDescription}>
      <summary>Описание</summary>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <div>{@html validVacancy.htmlDescription}</div>
      
      {#if showFullDescription && validVacancy.description}
        <div class="full-description">
          <h4>Исходный текст:</h4>
          <pre>{validVacancy.description}</pre>
        </div>
      {/if}
    </details>
  {:else if validVacancy.description}
    <details class="description-details" open={expandDescription}>
      <summary>Описание</summary>
      <pre>{validVacancy.description}</pre>
    </details>
  {/if}
  {#if validVacancy.url}
    <a href={validVacancy.url} target="_blank" rel="noopener noreferrer" class="source-link">
      Перейти к источнику ({validVacancy.source})
    </a>
  {/if}
</li>

<style>
  li {
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    padding: 1.5rem;
    background-color: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.2s ease-in-out;
    list-style: none;
  }
  li:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  li h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 1.3rem;
    color: #0056b3;
  }
  .vacancy-title-link {
    text-decoration: none;
    color: inherit;
  }
  .vacancy-title-link:hover h3 {
    text-decoration: underline;
  }

  .vacancy-header {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    margin-bottom: 1rem;
    color: #555;
    font-size: 0.95rem;
  }

  .company,
  .location,
  .salary {
    margin: 0;
  }
  .company::before {
    content: "🏢 ";
  }
  .location::before {
    content: "📍 ";
  }
  .salary::before {
    content: "💰 ";
  }

  .vacancy-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.5rem 1.5rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: #666;
  }
  .vacancy-details p {
    margin: 0;
  }

  .skills {
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
  .skills strong {
    margin-right: 0.5rem;
  }

  .skill-tag {
    display: inline-block;
    background-color: #e7f3ff;
    color: #0056b3;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    margin-right: 0.4rem;
    margin-bottom: 0.4rem;
    font-size: 0.85rem;
  }

  .published-at {
    font-size: 0.85rem;
    color: #888;
    margin-top: 1rem;
    text-align: right;
  }

  .description-details {
    margin-top: 1rem;
    margin-bottom: 1rem;
    font-size: 0.95rem;
    line-height: 1.6;
  }
  .description-details summary {
    cursor: pointer;
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: #444;
  }
  .description-details[open] summary {
    margin-bottom: 0.8rem;
  }
  .description-details > div {
    padding: 0.5rem;
    border-left: 3px solid #eee;
    background-color: #fdfdfd;
  }
  .description-details pre {
    margin-top: 0.5rem;
    background-color: #f8f9fa;
    padding: 0.5rem;
    border-radius: 3px;
    font-size: 0.85rem;
    white-space: pre-wrap;
    word-wrap: break-word;
    border: 1px solid #e9ecef;
  }

  .source-link {
    display: block;
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #007bff;
    text-decoration: none;
  }
  .source-link:hover {
    text-decoration: underline;
  }

  .full-description {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px dashed #ddd;
  }
  
  .full-description h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    color: #666;
  }
</style>
