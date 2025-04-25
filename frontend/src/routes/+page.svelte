<script lang="ts">
  // import DOMPurify from "dompurify"; // Удаляем неиспользуемый импорт
  import { formatDate } from "$lib/utils/date.utils";
  import type { PaginatedVacanciesResponse } from "@jspulse/shared";
  import { apiClient, HTTPError } from "../api/http.client";
  import type { PageData } from "./$types"; // Импортируем PageData

  export let data: PageData;

  // Выводим тип из данных сервера
  type VacancyWithHtml = PageData["initialVacancies"][number];
  let displayedVacancies: VacancyWithHtml[] = data.initialVacancies || [];

  let totalVacancies: number = data.totalCount || 0;
  let loadedCount: number = displayedVacancies.length;
  let selectedSkills: string[] = []; // Оставляем для фильтрации, но не получаем из data

  let loadingMore = false;
  let loadingFilter = false;
  let clientError: string | null = data.error || null;
  let clientErrorDetails: string | null = null;

  const fetchVacancies = async (
    limit: number,
    skip: number,
    skills: string[]
  ): Promise<PaginatedVacanciesResponse["data"] | null> => {
    clientError = null;
    clientErrorDetails = null;

    const searchParams = new URLSearchParams({
      limit: String(limit),
      skip: String(skip),
    });
    if (skills.length > 0) {
      searchParams.set("skills", skills.join(","));
    }

    try {
      const response = await apiClient
        .get("api/vacancies", { searchParams }) // Добавляем api/
        .json<PaginatedVacanciesResponse>();

      if (response.status === "OK") {
        return response.data; // Возвращаем вложенные данные
      } else {
        console.error("Client-side API Error (Non-OK status):", response);
        clientError = `Ошибка API: ${response.message}`;
        return null;
      }
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

    const responseData = await fetchVacancies(5, loadedCount, selectedSkills);

    if (responseData) {
      // Преобразуем даты перед добавлением
      const newVacancies = responseData.vacancies.map((v) => ({
        ...v,
        publishedAt: new Date(v.publishedAt),
      }));
      displayedVacancies = [...displayedVacancies, ...newVacancies];
      loadedCount = displayedVacancies.length;
    }
    loadingMore = false;
  };

  // Удаляем неиспользуемые функции
  /*
  const applyFilters = async () => {
    // ...
  };

  const toggleSkill = (skill: string) => {
    // ...
  };

  const resetFilters = () => {
    // ...
  };
  */
</script>

<svelte:head>
  <title>JS Пульс - вакансии по фронтенду</title>
</svelte:head>

<main>
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
        {totalVacancies}
        {totalVacancies === 1
          ? "вакансия"
          : totalVacancies >= 2 && totalVacancies <= 4
            ? "вакансии"
            : "вакансий"}
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
                    {#if vacancy.salaryTo}
                      до {vacancy.salaryTo}{/if}
                    {#if vacancy.salaryCurrency}
                      {vacancy.salaryCurrency}{/if}
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
              <p class="published-at">
                Опубликовано: {formatDate(vacancy.publishedAt.toISOString())}
              </p>
              <details class="description-details">
                <summary>Описание</summary>
                <div>
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html vacancy.htmlDescription}
                </div>
              </details>
              <a href={vacancy.url} target="_blank" rel="noopener noreferrer" class="source-link">
                Перейти к источнику ({vacancy.source})
              </a>
            </li>
          {/each}
        </ul>
      {/if}

      {#if loadedCount < totalVacancies && !loadingFilter}
        <div class="load-more">
          <button on:click={loadMoreVacancies} disabled={loadingMore}>
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
