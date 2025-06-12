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
  import type { VacancyWithHtml } from "@jspulse/shared";
  import { vacancyStore } from '../stores/vacancyStore';
  import { createEventDispatcher } from 'svelte';
  import GradientButton from './ui/GradientButton.svelte';

  // type VacancyWithHtml = VacancyDTO & { htmlDescription?: string };
  export let vacancy: VacancyWithHtml;
  // Параметр для автоматического раскрытия описания
  export let expandDescription = false;
  // Параметр для отображения полного неусеченного описания
  export let showFullDescription = false;

  // Используем данные напрямую (валидация убрана для совместимости с клиентом)
  $: validVacancy = vacancy;
  $: hasSalary = validVacancy.salaryFrom || validVacancy.salaryTo || validVacancy.salaryCurrency;
  $: hasDetails = validVacancy.experience || validVacancy.employment || validVacancy.schedule || validVacancy.address;
  $: hasSkills = validVacancy.skills && validVacancy.skills.length > 0;

  const dispatch = createEventDispatcher<{
    skillClick: string;
  }>();

  function handleSkillClick(skill: string) {
    dispatch('skillClick', skill);
  }
</script>

<li class="vacancy-card">
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
        <button type="button" class="skill-tag" on:click={() => handleSkillClick(skill)}>
          {skill}
        </button>
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
  <div class="vacancy-actions">
    {#if validVacancy.url}
      <a href={validVacancy.url} target="_blank" rel="noopener noreferrer" class="source-link">
        <ArrowTopRightOnSquare size="16" /> Перейти к источнику ({validVacancy.source})
      </a>
    {/if}
    
    <GradientButton 
      variant="secondary" 
      size="sm" 
      hideOnMobile={true}
      on:click={() => alert('Функция отклика будет доступна в ближайшее время!')}
    >
      Откликнуться
    </GradientButton>
  </div>
</li>

<style>
  li {
    @apply border border-neutral-300 rounded-lg mb-6 p-6 bg-white shadow-md transition-all duration-200 ease-in-out list-none;
  }
  li:hover {
    @apply shadow-lg -translate-y-0.5 border-neutral-400;
  }

  li:focus-within {
    @apply outline-2 outline-primary-500 outline-offset-2;
  }

  li h3 {
    @apply mt-0 mb-2 text-xl text-primary-800 font-semibold leading-snug;
  }
  .vacancy-title-link {
    @apply no-underline text-inherit rounded;
  }
  .vacancy-title-link:hover h3 {
    @apply underline text-primary-700;
  }
  .vacancy-title-link:focus {
    @apply outline-2 outline-primary-500 outline-offset-2;
  }

  .vacancy-header {
    @apply flex flex-wrap gap-3 gap-x-6 mb-4 text-neutral-700 text-sm;
  }

  .company,
  .location,
  .salary {
    @apply m-0 flex items-center gap-2;
  }

  @media (max-width: 768px) {
    .vacancy-header {
      flex-direction: column;
      gap: 0.5rem;
    }
    .company,
    .location,
    .salary {
      width: 100%;
    }
  }

  .vacancy-details {
    @apply grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3 gap-x-6 mb-4 text-sm text-neutral-600;
  }
  .vacancy-details p {
    @apply m-0 flex items-center gap-2;
  }

  @media (max-width: 768px) {
    .vacancy-details {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
  }

  .skills {
    @apply mt-4 mb-4 flex items-start gap-2 flex-wrap;
  }
  .skills strong {
    @apply mr-2 text-neutral-700 flex-shrink-0;
  }

  .skill-tag {
    @apply inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-xl mr-2 mb-2 text-sm font-medium border border-primary-200 transition-all duration-150 ease-in-out cursor-pointer min-h-[32px];
  }

  .skill-tag:hover {
    @apply bg-primary-200 border-primary-300 -translate-y-px;
  }

  .skill-tag:focus {
    @apply outline-2 outline-primary-500 outline-offset-2;
  }

  .published-at {
    @apply text-sm text-neutral-500 mt-4 text-right flex items-center justify-end gap-2;
  }

  @media (max-width: 768px) {
    .published-at {
      text-align: left;
      justify-content: flex-start;
    }
  }

  .description-details {
    @apply mt-4 mb-4 text-sm leading-relaxed border border-neutral-200 rounded-lg overflow-hidden;
  }
  .description-details summary {
    @apply cursor-pointer font-semibold px-4 py-3 mb-0 text-neutral-700 bg-neutral-50 border-b border-neutral-200 transition-colors duration-150 hover:bg-neutral-100;
  }
  .description-details[open] summary {
    @apply mb-0;
  }
  .description-details > div {
    @apply p-4 border-l-0 bg-white break-words max-w-full;
  }
  
  .description-details > div :global(ul),
  .description-details > div :global(ol) {
    @apply pl-6 mb-4;
  }
  
  .description-details > div :global(p) {
    @apply mb-3 text-neutral-700;
  }
  
  .description-details > div :global(h1),
  .description-details > div :global(h2),
  .description-details > div :global(h3),
  .description-details > div :global(h4),
  .description-details > div :global(h5),
  .description-details > div :global(h6) {
    @apply mt-4 mb-2 text-neutral-800 font-semibold;
  }
  
  .description-details > div :global(pre),
  .description-details > div :global(code) {
    @apply bg-neutral-100 px-2 py-1 rounded border border-neutral-200 overflow-x-auto text-sm font-mono;
  }
  
  .description-details > div :global(img) {
    @apply max-w-full h-auto rounded;
  }
  
  .description-details > div :global(a) {
    @apply text-primary-700 no-underline hover:underline hover:text-primary-800;
  }
  
  .vacancy-actions {
    @apply mt-4 flex items-center justify-between flex-wrap gap-4;
  }
  
  .source-link {
    @apply inline-flex items-center gap-2 text-primary-700 no-underline text-sm font-medium px-3 py-2 rounded-md border border-neutral-200 bg-neutral-50 transition-all duration-150 min-h-[40px] hover:bg-neutral-100 hover:border-neutral-300 hover:-translate-y-px focus:outline-2 focus:outline-primary-500 focus:outline-offset-2;
  }

  .full-description {
    @apply mt-6 pt-4 border-t border-neutral-200;
  }
  
  .full-description h4 {
    @apply mt-0 mb-2 text-base text-neutral-600 font-semibold;
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 480px) {
    li {
      @apply mb-4 p-4;
    }
    
    li h3 {
      @apply text-lg;
    }
    
    .skills {
      @apply flex-col items-stretch;
    }
    
    .skills strong {
      @apply mb-2;
    }
  }
</style>
