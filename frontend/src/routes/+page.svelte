<script lang="ts">
  import DOMPurify from "dompurify";
  import { formatDate } from "$lib/utils/date.utils";
  import type { VacancyDTO } from '../../../shared/types/dto/vacancy.dto';
  import type { VacanciesResponseDTO } from '../../../shared/types/dto/VacanciesResponseDTO';
  import type { SkillCountsDTO } from '../../../shared/types/dto/SkillsDTO';
  import { apiClient, HTTPError } from '../api/http.client'; // Added apiClient and HTTPError

  interface HomePageData {
    initialVacancies: VacancyDTO[];
    totalCount: number;
    skillCounts: SkillCountsDTO;
    error?: string;
  }

  export let data: HomePageData;

  let displayedVacancies: VacancyDTO[] = data.initialVacancies || [];
  let totalVacancies: number = data.totalCount || 0;
  let skillCounts: SkillCountsDTO = data.skillCounts || {};
  let loadedCount: number = displayedVacancies.length;
  let selectedSkills: string[] = [];

  let loadingMore = false;
  let loadingFilter = false;
  let clientError: string | null = data.error || null;
  let clientErrorDetails: string | null = null;

  const fetchVacancies = async (limit: number, skip: number, skills: string[]): Promise<VacanciesResponseDTO | null> => {
    clientError = null;
    clientErrorDetails = null;

    const searchParams = new URLSearchParams({
      limit: String(limit),
      skip: String(skip),
    });
    if (skills.length > 0) {
      searchParams.set('skills', skills.join(','));
    }

    try {
      // Use apiClient instead of ky
      const responseData = await apiClient
        .get('vacancies', { searchParams })
        .json<VacanciesResponseDTO>();

      return responseData;

    } catch (err) {
      console.error("Client-side API Error:", err);
      let details = "";
      if (err instanceof HTTPError) {
        clientError = `Ошибка сети или сервера: ${err.message}`;
        try {
          const errorBody = await err.response.json();
          if (errorBody && typeof errorBody === "object" && "error" in errorBody) {
            details = `Детали от сервера: ${JSON.stringify(errorBody.error)}`;
          } else {
            details = `Ответ сервера (${err.response.status}): ${await err.response.text()}`;
          }
        } catch (parseError) {
          details = `Не удалось получить детали ошибки от сервера. Status: ${err.response.status}.`;
        }
      } else if (err instanceof Error) {
        clientError = "Ошибка загрузки вакансий: " + err.message;
        details = `Stack: ${err.stack || "N/A"}`;
      } else {
        clientError = "Произошла неизвестная ошибка при загрузке вакансий.";
        details = `Unknown error type: ${JSON.stringify(err)}`;
      }
      clientErrorDetails = details;
      return null;
    }
  };

  const loadMoreVacancies = async () => {
    if (loadingMore || loadingFilter) return;
    loadingMore = true;

    const response = await fetchVacancies(5, loadedCount, selectedSkills);

    if (response) {
      displayedVacancies = [...displayedVacancies, ...response.vacancies];
      loadedCount = displayedVacancies.length;
    }
    loadingMore = false;
  };

  const applyFilters = async () => {
    if (loadingFilter || loadingMore) return;
    loadingFilter = true;
    clientError = null;
    clientErrorDetails = null;
    loadedCount = 0;

    const response = await fetchVacancies(10, 0, selectedSkills);

    if (response) {
      displayedVacancies = response.vacancies;
      loadedCount = displayedVacancies.length;
      totalVacancies = response.totalCount;
    } else {
      displayedVacancies = [];
      loadedCount = 0;
      totalVacancies = 0;
    }
    loadingFilter = false;
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      selectedSkills = selectedSkills.filter((s) => s !== skill);
    } else {
      selectedSkills = [...selectedSkills, skill];
    }
    applyFilters();
  };

  const resetFilters = () => {
    selectedSkills = [];
    applyFilters();
  };

  $: sortedSkills = Object.entries(skillCounts).sort(([, countA], [, countB]) => countB - countA);
</script>

<svelte:head>
  <title>JS Пульс - вакансии по фронтенду</title>
</svelte:head>

<main>
  <div class="filters">
    <h3>Фильтры по навыкам:</h3>
    {#if Object.keys(skillCounts).length === 0 && !clientError}
      <p>Загрузка статистики по навыкам...</p>
    {:else if Object.keys(skillCounts).length > 0}
      <div class="tags-filter">
        {#each sortedSkills as [skill, count]}
          <button
            class="tag-button {selectedSkills.includes(skill) ? 'selected' : ''}"
            on:click={() => toggleSkill(skill)}
            disabled={loadingFilter || loadingMore}
          >
            {skill} ({count})
          </button>
        {/each}
      </div>
    {/if}

    {#if selectedSkills.length > 0}
      <div class="clear-filter">
        <button
          class="clear-button"
          on:click={resetFilters}
          disabled={loadingFilter || loadingMore}
        >
          Сбросить фильтры
        </button>
      </div>
    {/if}
  </div>

  {#if loadingFilter}
    <p class="loading">Применение фильтров...</p>
  {/if}

  {#if clientError}
    <div class="error-container">
      <p class="error-message">⚠️ {clientError}</p>
      {#if clientErrorDetails}
        <details class="error-details">
          <summary>Подробнее</summary>
          <pre>{clientErrorDetails}</pre>
        </details>
      {/if}
    </div>
  {/if}

  <div class="vacancies" class:loading={loadingFilter}>
    {#if !loadingFilter}
      <h2>
        {totalVacancies} {totalVacancies === 1 ? 'вакансия' : totalVacancies >= 2 && totalVacancies <= 4 ? 'вакансии' : 'вакансий'}
        {selectedSkills.length > 0 ? ` по навыкам: ${selectedSkills.join(', ')}` : ''}
      </h2>

      {#if displayedVacancies.length === 0 && !clientError && !loadingFilter}
        <p class="no-vacancies">Вакансий не найдено</p>
      {:else}
        <ul>
          {#each displayedVacancies as vacancy (vacancy._id)}
            <li>
              <a href="/v/{vacancy._id}" class="vacancy-title-link">
                <h3>{vacancy.title}</h3>
              </a>
              <div class="vacancy-header">
                <p class="company">{vacancy.company}</p>
                <p class="location">{vacancy.location}</p>
                {#if vacancy.salaryFrom || vacancy.salaryTo}
                  <p class="salary">
                    {#if vacancy.salaryFrom}от {vacancy.salaryFrom}{/if}
                    {#if vacancy.salaryTo} до {vacancy.salaryTo}{/if}
                    {#if vacancy.salaryCurrency} {vacancy.salaryCurrency}{/if}
                  </p>
                {/if}
              </div>
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
              {#if vacancy.skills && vacancy.skills.length > 0}
                <div class="skills">
                  <strong>Навыки:</strong>
                  {#each vacancy.skills as skill}
                    <span class="skill-tag">{skill}</span>
                  {/each}
                </div>
              {/if}
              <p class="published-at">Опубликовано: {formatDate(vacancy.publishedAt.toISOString())}</p>
               {#if vacancy.description}
                 <details class="description-details">
                   <summary>Описание</summary>
                   <div>
                     {@html typeof window !== 'undefined' ? DOMPurify.sanitize(vacancy.description) : vacancy.description}
                   </div>
                 </details>
               {/if}
               <a href={vacancy.url} target="_blank" rel="noopener noreferrer" class="source-link">
                 Перейти к источнику ({vacancy.source})
               </a>
            </li>
          {/each}
        </ul>
      {/if}

      {#if loadedCount < totalVacancies && !loadingFilter}
        <div class="load-more">
          <button
            on:click={loadMoreVacancies}
            disabled={loadingMore}
          >
            {#if loadingMore}
              Загрузка...
            {:else}
              Показать еще 5
            {/if}
          </button>
        </div>
      {/if}
    {/if}
  </div>
</main>

<style>
  main {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1rem;
  }

  .filters {
    margin-bottom: 2rem;
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 8px;
    border: 1px solid #eee;
  }

  .filters h3 {
    margin-top: 0;
    margin-bottom: 0.8rem;
  }

  .tags-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.8rem;
  }

  .tag-button {
    padding: 0.3rem 0.8rem;
    border: 1px solid #ccc;
    border-radius: 15px;
    background-color: white;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;
    font-size: 0.9rem;
  }

  .tag-button:hover {
    background-color: #eee;
  }

  .tag-button.selected {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
  }
   .tag-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .clear-filter {
    margin-top: 0.8rem;
  }

  .clear-button {
    padding: 0.4rem 1rem;
    border: 1px solid #dc3545;
    border-radius: 5px;
    background-color: transparent;
    color: #dc3545;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

  .clear-button:hover {
    background-color: #dc3545;
    color: white;
  }
   .clear-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: transparent !important;
    color: #dc3545 !important;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #555;
    font-style: italic;
  }

  .vacancies {
    margin-top: 2rem;
    transition: opacity 0.3s ease-in-out;
  }
  .vacancies.loading {
      opacity: 0.5;
      pointer-events: none;
  }

  .vacancies h2 {
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
    margin-bottom: 1.5rem;
    font-size: 1.6rem;
    color: #333;
  }

  .no-vacancies {
    text-align: center;
    color: #777;
    margin-top: 2rem;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    padding: 1.5rem;
    background-color: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.2s ease-in-out;
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
   .company::before { content: "🏢 "; }
   .location::before { content: "📍 "; }
   .salary::before { content: "💰 "; }

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

  .load-more {
    text-align: center;
    margin-top: 2rem;
  }

  .load-more button {
    padding: 0.8rem 2rem;
    font-size: 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .load-more button:hover:not(:disabled) {
    background-color: #0056b3;
  }

  .load-more button:disabled {
    background-color: #aaa;
    cursor: not-allowed;
  }

  .error-container {
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
    color: #856404;
    padding: 1rem;
    border-radius: 5px;
    margin-bottom: 1.5rem;
  }

  .error-message {
    margin: 0;
    font-weight: bold;
  }

  .error-details {
    margin-top: 0.5rem;
  }

  .error-details summary {
    cursor: pointer;
    color: #664d03;
    font-size: 0.9rem;
  }

  .error-details pre {
    margin-top: 0.5rem;
    background-color: #fff9e0;
    padding: 0.5rem;
    border-radius: 3px;
    font-size: 0.85rem;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
</style>
