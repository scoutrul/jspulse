<script lang="ts">
  import { formatDate } from "$lib/utils/date.utils";
  // @ts-ignore // eslint-disable-line @typescript-eslint/ban-ts-comment
  import type { PaginatedVacanciesResponse, VacancyDTO } from "@jspulse/shared";
  import { apiClient, KyHTTPError } from "../api/http.client";
  import type { PageData } from "./$types";

  export let data: PageData;

  type VacancyWithHtml = VacancyDTO & { htmlDescription?: string };

  // Переменные для отображения и пагинации
  let displayedVacancies: VacancyWithHtml[] = data.initialVacancies || [];
  let totalVacancies: number = data.totalCount || 0;
  let currentPage: number = data.page ?? 0; // Начинаем с текущей страницы от сервера
  let totalPages: number = data.totalPages ?? 0;
  let limit: number = data.limit ?? 10;

  // Навыки для фильтрации
  let availableSkills: string[] = data.availableSkills || [];
  let selectedSkills: string[] = [];

  // Состояния загрузки
  let loadingMore = false;
  let loadingFilter = false;
  let clientError: string | null = data.error || null;

  // Функция для загрузки вакансий (восстанавливаем и адаптируем)
  const fetchVacancies = async (
    pageToLoad: number,
    skillsToLoad: string[]
  ): Promise<PaginatedVacanciesResponse["data"] | null> => {
    clientError = null;

    // Определяем параметры запроса
    const searchParams = {
      limit: String(limit),
      page: String(pageToLoad),
      skills: skillsToLoad.join(',') // Передаем навыки через запятую
    };

    try {
      // Исправляем путь запроса и передаем параметры
      const response = await apiClient
        .get("api/vacancies", { searchParams }) // Добавляем 'api/' к пути
        .json<PaginatedVacanciesResponse>();

      if (response.status === "OK" && response.data) {
        // Преобразуем даты перед возвратом
        const vacanciesWithDates = response.data.items.map((vacancy: VacancyDTO) => ({
           ...vacancy,
           publishedAt: new Date(vacancy.publishedAt),
           // Важно: htmlDescription здесь не будет, он генерируется только в +page.server.ts
           // Если нужно описание для новых вакансий, придется его запрашивать отдельно или менять API
           htmlDescription: vacancy.description // Пока берем сырое описание
        }));
        // Обновляем общее количество и страницы (может измениться при фильтрации)
        totalVacancies = response.data.total;
        totalPages = response.data.totalPages;

        return { ...response.data, items: vacanciesWithDates };
      } else {
        console.error("Client-side API Error (Non-OK status or no data):", response);
        clientError = `Ошибка API: ${response.message || 'Не удалось получить данные'}`;
        return null;
      }
    } catch (err) {
      console.error("Client-side API Error:", err);
      if (err instanceof KyHTTPError) {
        clientError = `Ошибка сети или сервера: ${err.message}`;
        try {
           const errorBody = await err.response.json();
           if (errorBody?.message) clientError += ` (${errorBody.message})`;
        } catch { /* ignore */ }
      } else if (err instanceof Error) {
        clientError = "Ошибка загрузки вакансий: " + err.message;
      } else {
        clientError = "Произошла неизвестная ошибка при загрузке вакансий.";
      }
      return null;
    }
  };

  // Функция для загрузки следующей страницы
  const loadMoreVacancies = async () => {
    if (loadingMore || currentPage + 1 >= totalPages) return;
    loadingMore = true;

    const nextPage = currentPage + 1;
    const responseData = await fetchVacancies(nextPage, selectedSkills);

    if (responseData) {
      displayedVacancies = [...displayedVacancies, ...responseData.items];
      currentPage = nextPage;
    }
    loadingMore = false;
  };

  // Реакция на изменение фильтров
  $: {
    if (selectedSkills) { // Реагируем только на selectedSkills
      console.log("[+page.svelte] Фильтры изменились, перезагрузка:", selectedSkills);
      loadingFilter = true;
      displayedVacancies = []; // Очищаем список перед загрузкой
      currentPage = -1; // Сбрасываем страницу, чтобы loadMore начал с 0
      // Используем setTimeout, чтобы Svelte успел очистить список перед началом загрузки
      setTimeout(() => {
         loadMoreVacancies().finally(() => {
             loadingFilter = false;
         });
      }, 0);
    }
  }
</script>

<svelte:head>
  <title>JS Пульс - вакансии по фронтенду</title>
</svelte:head>

<main>

  <section class="filters">
    <h2>Фильтр по навыкам ({availableSkills?.length ?? 0})</h2>
    {#if availableSkills && availableSkills.length > 0}
      <div class="skills-list">
        {#each availableSkills as skill (skill)}
          <label>
            <input type="checkbox" bind:group={selectedSkills} value={skill} />
            {skill}
          </label>
        {/each}
      </div>
    {:else}
      <p>Нет доступных навыков для фильтрации.</p>
    {/if}
  </section>

  {#if loadingFilter}
    <p class="loading">Применение фильтров...</p>
  {/if}

  {#if clientError && !loadingFilter}
    <div class="error-container">
      <p class="error-message">⚠️ {clientError}</p>
    </div>
  {/if}

  <div class="vacancies" class:loading={loadingFilter}>
    {#if !loadingFilter}
      <h2>
        {displayedVacancies?.length ?? 0}
        {(displayedVacancies?.length ?? 0) === 1
          ? "вакансия найдена"
          : (displayedVacancies?.length ?? 0) >= 2 && (displayedVacancies?.length ?? 0) <= 4
            ? "вакансии найдено"
            : "вакансий найдено"}
         (из {totalVacancies} всего)
      </h2>

       {#if displayedVacancies && displayedVacancies.length === 0 && !clientError}
        <p class="no-vacancies">Вакансий по выбранным фильтрам не найдено</p>
      {:else if displayedVacancies}
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
                Опубликовано: {formatDate(vacancy.publishedAt)}
              </p>
              <!-- Описание может быть не очищено для подгруженных вакансий -->
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
              <a href={vacancy.url} target="_blank" rel="noopener noreferrer" class="source-link">
                Перейти к источнику ({vacancy.source})
              </a>
            </li>
          {/each}
        </ul>
      {/if}

      <!-- Возвращаем кнопку "Показать еще" -->
      {#if !loadingFilter && currentPage + 1 < totalPages}
        <div class="load-more">
          <button on:click={loadMoreVacancies} disabled={loadingMore}>
            {#if loadingMore}
              Загрузка...
            {:else}
              Показать еще {limit}
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

  /* Стили для фильтров */
  .filters {
    background-color: #f8f9fa;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    border: 1px solid #e9ecef;
  }
  .filters h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.3rem;
    color: #495057;
  }
  .skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
  }
  .skills-list label {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    background-color: #fff;
    padding: 0.4rem 0.8rem;
    border-radius: 15px;
    border: 1px solid #dee2e6;
    font-size: 0.9rem;
    transition: background-color 0.2s, border-color 0.2s;
  }
  .skills-list label:hover {
      background-color: #f1f3f5;
  }
   .skills-list input[type="checkbox"] {
      margin-right: 0.5rem;
      accent-color: #007bff; /* Цвет чекбокса */
   }
   .skills-list input[type="checkbox"]:checked + label {
        background-color: #e7f3ff;
        border-color: #007bff;
        font-weight: 500;
   }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #555;
    font-style: italic;
  }

  .vacancies {
    margin-top: 1rem;
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
    font-size: 1.4rem; /* Уменьшил размер заголовка списка */
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

  /* Возвращаем стили для .load-more */
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
</style>
