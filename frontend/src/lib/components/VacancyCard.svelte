<script lang="ts">
  // @ts-ignore TODO: Define proper Vacancy type, maybe reuse from shared?
  import type { VacancyDTO } from "@jspulse/shared";
  import { formatDate } from "$lib/utils/date.utils";

  type VacancyWithHtml = VacancyDTO & { htmlDescription?: string };
  export let vacancy: VacancyWithHtml;

  $: hasSalary = vacancy.salaryFrom || vacancy.salaryTo || vacancy.salaryCurrency;
  $: hasDetails = vacancy.experience || vacancy.employment || vacancy.schedule || vacancy.address;
  $: hasSkills = vacancy.skills && vacancy.skills.length > 0;
</script>

<li>
  <a href="/v/{vacancy._id}" class="vacancy-title-link">
    <h3>{vacancy.title}</h3>
  </a>
  <div class="vacancy-header">
    {#if vacancy.company}
      <p class="company">{vacancy.company}</p>
    {/if}
    {#if vacancy.location}
      <p class="location">{vacancy.location}</p>
    {/if}
    {#if hasSalary}
      <p class="salary">
        {#if vacancy.salaryFrom}от {vacancy.salaryFrom}{/if}
        {#if vacancy.salaryTo}
          до {vacancy.salaryTo}{/if}
        {#if vacancy.salaryCurrency}
          {vacancy.salaryCurrency}{/if}
      </p>
    {/if}
  </div>
  {#if hasDetails}
    <div class="vacancy-details">
      {#if vacancy.experience}
        <p class="experience"><strong>Опыт:</strong> {vacancy.experience}</p>
      {/if}
      {#if vacancy.employment}
        <p class="employment"><strong>Занятость:</strong> {vacancy.employment}</p>
      {/if}
      {#if vacancy.schedule}
        <p class="schedule"><strong>График:</strong> {vacancy.schedule}</p>
      {/if}
      {#if vacancy.address}
        <p class="address"><strong>Адрес:</strong> {vacancy.address}</p>
      {/if}
    </div>
  {/if}
  {#if hasSkills}
    <div class="skills">
      <strong>Навыки:</strong>
      {#each vacancy.skills as skill}
        <span class="skill-tag">{skill}</span>
      {/each}
    </div>
  {/if}
  {#if vacancy.publishedAt}
    <p class="published-at">
      Опубликовано: {formatDate(vacancy.publishedAt)}
    </p>
  {/if}
  {#if vacancy.htmlDescription}
    <details class="description-details">
      <summary>Описание</summary>
      <div>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html vacancy.htmlDescription}
      </div>
    </details>
  {:else if vacancy.description}
    <details class="description-details">
      <summary>Описание (raw)</summary>
      <pre>{vacancy.description}</pre>
    </details>
  {/if}
  {#if vacancy.url}
    <a href={vacancy.url} target="_blank" rel="noopener noreferrer" class="source-link">
      Перейти к источнику ({vacancy.source})
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
</style>
