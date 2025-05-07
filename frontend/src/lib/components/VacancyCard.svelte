<script lang="ts">
  import type { VacancyDTO } from "@jspulse/shared";
  import { z } from "zod";
  import { formatDate } from "$lib/utils/dayjs.utils";
  import BuildingOffice from 'svelte-heros-v2/BuildingOffice.svelte';
  import MapPin from 'svelte-heros-v2/MapPin.svelte';
  import CurrencyDollar from 'svelte-heros-v2/CurrencyDollar.svelte';
  import Clock from 'svelte-heros-v2/Clock.svelte';
  import Calendar from 'svelte-heros-v2/Calendar.svelte';
  import Briefcase from 'svelte-heros-v2/Briefcase.svelte';
  import Home from 'svelte-heros-v2/Home.svelte';
  import Tag from 'svelte-heros-v2/Tag.svelte';
  import CalendarDays from 'svelte-heros-v2/CalendarDays.svelte';
  import ArrowTopRightOnSquare from 'svelte-heros-v2/ArrowTopRightOnSquare.svelte';

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
      <p class="company">
        <BuildingOffice size="18" />
        {validVacancy.company}
      </p>
    {/if}
    {#if validVacancy.location}
      <p class="location">
        <MapPin size="18" />
        {validVacancy.location}
      </p>
    {/if}
    {#if hasSalary}
      <p class="salary">
        <CurrencyDollar size="18" />
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
        <p class="experience">
          <Briefcase size="16" />
          <strong>Опыт:</strong> {validVacancy.experience}
        </p>
      {/if}
      {#if validVacancy.employment}
        <p class="employment">
          <Clock size="16" />
          <strong>Занятость:</strong> {validVacancy.employment}
        </p>
      {/if}
      {#if validVacancy.schedule}
        <p class="schedule">
          <Calendar size="16" />
          <strong>График:</strong> {validVacancy.schedule}
        </p>
      {/if}
      {#if validVacancy.address}
        <p class="address">
          <Home size="16" />
          <strong>Адрес:</strong> {validVacancy.address}
        </p>
      {/if}
    </div>
  {/if}
  {#if hasSkills}
    <div class="skills">
      <Tag size="18" /><strong>Навыки:</strong>
      {#each validVacancy.skills as skill}
        <span class="skill-tag">{skill}</span>
      {/each}
    </div>
  {/if}
  {#if validVacancy.publishedAt}
    <p class="published-at">
      <CalendarDays size="16" /> Опубликовано: {formatDate(validVacancy.publishedAt)}
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
          <div>{validVacancy.description}</div>
        </div>
      {/if}
    </details>
  {:else if validVacancy.description}
    <details class="description-details" open={expandDescription}>
      <summary>Описание</summary>
      <div>{validVacancy.description}</div>
    </details>
  {/if}
  {#if validVacancy.url}
    <a href={validVacancy.url} target="_blank" rel="noopener noreferrer" class="source-link">
      <ArrowTopRightOnSquare size="16" /> Перейти к источнику ({validVacancy.source})
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
    display: flex;
    align-items: center;
    gap: 0.3rem;
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
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .skills {
    margin-top: 1rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;
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
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.3rem;
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
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
    max-width: 100%;
  }
  
  /* Стили для HTML-элементов внутри описания */
  .description-details > div :global(ul),
  .description-details > div :global(ol) {
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .description-details > div :global(p) {
    margin-bottom: 0.8rem;
  }
  
  .description-details > div :global(h1),
  .description-details > div :global(h2),
  .description-details > div :global(h3),
  .description-details > div :global(h4),
  .description-details > div :global(h5),
  .description-details > div :global(h6) {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: #333;
  }
  
  .description-details > div :global(pre),
  .description-details > div :global(code) {
    background-color: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.9rem;
    font-family: monospace;
  }
  
  .description-details > div :global(img) {
    max-width: 100%;
    height: auto;
  }
  
  .description-details > div :global(a) {
    color: #0056b3;
    text-decoration: none;
  }
  
  .description-details > div :global(a:hover) {
    text-decoration: underline;
  }
  
  .source-link {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: #0056b3;
    text-decoration: none;
    margin-top: 0.5rem;
    font-size: 0.9rem;
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
