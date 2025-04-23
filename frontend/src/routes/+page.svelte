<script lang="ts">
  import { onMount } from "svelte";
  import { apiClient } from "../api/http.client";
  import type { VacancyDTO, PaginatedVacanciesResponse } from "@jspulse/shared";
  import { HTTPError } from "ky";
  import DOMPurify from "dompurify";
  import { formatDate } from "$lib/utils/date.utils";

  let vacancies: VacancyDTO[] = [];
  let loading = true;
  let error: string | null = null;
  let errorDetails: string | null = null;
  let selectedSkills: string[] = [];
  let availableSkills: string[] = [];

  // Загрузка вакансий
  const loadVacancies = async (skillFilter: string[] | null = null) => {
    loading = true;
    error = null;
    errorDetails = null;

    try {
      const endpoint = "api/vacancies";
      const searchParams: Record<string, string> = {};
      if (skillFilter && skillFilter.length > 0) {
        searchParams.skills = skillFilter.join(",");
      }

      // Указываем тип ApiResponse для .json()
      const responseData = await apiClient
        .get(endpoint, { searchParams })
        .json<PaginatedVacanciesResponse>();

      // Проверяем статус и извлекаем данные из data.vacancies
      if (
        responseData &&
        responseData.status === "OK" &&
        responseData.data &&
        Array.isArray(responseData.data.vacancies)
      ) {
        // Преобразуем строки дат в объекты Date перед сохранением
        vacancies = responseData.data.vacancies.map((vacancy: VacancyDTO) => ({
          ...vacancy,
          // Превращаем строку publishedAt в объект Date
          publishedAt: new Date(vacancy.publishedAt),
          // Добавляем проверку для createdAt и updatedAt, если они используются и тоже строки
          createdAt: vacancy.createdAt ? new Date(vacancy.createdAt) : undefined,
          updatedAt: vacancy.updatedAt ? new Date(vacancy.updatedAt) : undefined,
        }));

        if (!skillFilter) {
          const skillsSet = new Set<string>();
          vacancies.forEach((vacancy) => {
            if (vacancy.skills && Array.isArray(vacancy.skills)) {
              vacancy.skills.forEach((skill: string) => skillsSet.add(skill));
            }
          });
          availableSkills = Array.from(skillsSet).sort();
        }
      } else {
        let errorMsg = "Получен неожиданный формат данных от сервера.";
        if (responseData && responseData.status === "ERROR" && responseData.error) {
          errorMsg = `Ошибка от сервера: ${responseData.error}`;
        } else if (responseData) {
          errorMsg += ` Ожидался { status: 'OK', data: { vacancies: [...] } }, получено: ${JSON.stringify(responseData).substring(0, 200)}...`;
        }
        error = errorMsg;
      }
    } catch (err) {
      console.error("Ошибка API:", err);
      let details = "";

      if (err instanceof HTTPError) {
        error = `Ошибка сети или сервера: ${err.message}`;
        try {
          // Пытаемся получить тело ответа, там может быть поле 'error' от бэкенда
          const errorBody = await err.response.json();
          if (errorBody && typeof errorBody === "object" && "error" in errorBody) {
            details = `Детали от сервера: ${JSON.stringify(errorBody.error)}`;
          } else {
            // Если тело не JSON или нет поля error, пробуем получить текст
            details = `Ответ сервера (${err.response.status}): ${await err.response.text()}`;
          }
        } catch (parseError) {
          // Если тело ответа не удалось распарсить
          details = `Не удалось получить детали ошибки от сервера. Status: ${err.response.status}. Stack: ${err.stack || "N/A"}`;
        }
      } else if (err instanceof Error) {
        error = "Ошибка загрузки вакансий: " + err.message;
        details = `Stack trace: ${err.stack || "N/A"}`;
      } else {
        error = "Произошла неизвестная ошибка при загрузке вакансий.";
        details = `Неизвестный тип ошибки: ${JSON.stringify(err)}`;
      }
      errorDetails = details;
    } finally {
      loading = false;
    }
  };

  // Обрабатываем выбор/отмену навыка
  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      selectedSkills = selectedSkills.filter((s) => s !== skill);
    } else {
      selectedSkills = [...selectedSkills, skill];
    }

    // Применяем фильтрацию
    loadVacancies(selectedSkills.length > 0 ? selectedSkills : null);
  };

  onMount(() => {
    loadVacancies();
  });
</script>

<svelte:head>
  <title>JS Пульс - вакансии по фронтенду</title>
</svelte:head>

<main>
  <!-- Фильтры по навыкам -->
  <div class="filters">
    <h3>Фильтры по навыкам:</h3>
    <div class="tags-filter">
      {#each availableSkills as skill}
        <button
          class="tag-button {selectedSkills.includes(skill) ? 'selected' : ''}"
          on:click={() => toggleSkill(skill)}
        >
          {skill}
        </button>
      {/each}
    </div>
    {#if selectedSkills.length > 0}
      <div class="clear-filter">
        <button
          class="clear-button"
          on:click={() => {
            selectedSkills = [];
            loadVacancies();
          }}
        >
          Сбросить фильтры
        </button>
      </div>
    {/if}
  </div>

  {#if loading}
    <p class="loading">Загрузка вакансий...</p>
  {:else if error}
    <div class="error-container">
      <p class="error-message">⚠️ {error}</p>
      {#if errorDetails}
        <details class="error-details">
          <summary>Подробнее</summary>
          <pre>{errorDetails}</pre>
        </details>
      {/if}
    </div>
  {:else}
    <div class="vacancies">
      <h2>
        Последние вакансии {selectedSkills.length > 0
          ? `по навыкам: ${selectedSkills.join(", ")}`
          : ""}
      </h2>

      {#if vacancies.length === 0}
        <p class="no-vacancies">Вакансий не найдено</p>
      {:else}
        <ul>
          {#each vacancies as vacancy}
            <li>
              <!-- Оборачиваем заголовок в ссылку -->
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

              <!-- Добавляем отображение доп. полей -->
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

              <div class="description">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html DOMPurify.sanitize(vacancy.description || "")}
              </div>

              <div class="vacancy-footer">
                <div class="tags">
                  {#each vacancy.skills as skill}
                    <button
                      class="tag {selectedSkills.includes(skill) ? 'selected' : ''}"
                      on:click={() => toggleSkill(skill)}
                    >
                      {skill}
                    </button>
                  {/each}
                </div>
                <div class="meta">
                  {#if vacancy.publishedAt}
                    <span class="date"
                      >Опубликовано: {formatDate(vacancy.publishedAt.toISOString())}</span
                    >
                  {/if}
                  <a href="/v/{vacancy._id}" class="apply-button"> Подробнее </a>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 1000px;
    padding: 0;
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell,
      "Helvetica Neue", sans-serif;
  }

  .description {
    font-size: 1.2rem;
    color: #555;
    margin-bottom: 1.5rem;
  }

  .filters {
    margin-bottom: 2rem;
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 8px;
  }

  .filters h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: #555;
  }

  .tags-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag-button {
    background: #f0f0f0;
    border: 1px solid #ddd;
    color: #555;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tag-button.selected {
    background: #fdc007;
    border-color: #fdc007;
    color: white;
  }

  .clear-filter {
    margin-top: 1rem;
  }

  .clear-button {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .vacancies {
    margin-top: 2rem;
  }

  .no-vacancies {
    text-align: center;
    color: #888;
    font-style: italic;
    padding: 2rem;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }

  .vacancy-header {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
    color: #666;
  }

  .company {
    font-weight: bold;
    margin: 0;
  }

  .location,
  .salary {
    margin: 0;
  }

  .salary {
    color: #2ecc71;
    font-weight: bold;
  }

  .vacancy-details {
    margin-bottom: 1.5rem;
  }

  .vacancy-footer {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag {
    background: #fef6d8;
    color: #b78e00;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .tag.selected {
    background: #fdc007;
    color: white;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    color: #888;
    gap: 0.5rem;
  }

  .apply-button {
    display: inline-block;
    background: #fdc007;
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: bold;
    transition: background 0.2s;
  }

  .apply-button:hover {
    background: #e3ab00;
  }

  .loading {
    text-align: center;
    color: #888;
    padding: 2rem;
  }

  .error-container {
    color: #e74c3c;
    background-color: #fbeae5;
    border: 1px solid #e74c3c;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 2rem;
  }

  .error-message {
    margin: 0 0 0.5rem 0;
    font-weight: bold;
  }

  .error-details {
    margin-top: 1rem;
    font-size: 0.85em;
    background-color: #fdf6f3;
    border: 1px dashed #f5c6b8;
    border-radius: 4px;
    padding: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .error-details summary {
    cursor: pointer;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .error-details pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
  }

  /* Стили для ссылки заголовка */
  li h3 {
    margin-top: 0; /* Убираем верхний отступ у h3, если ссылка будет блочной */
    margin-bottom: 0.5rem; /* Добавляем немного отступа снизу */
    font-size: 1.3rem; /* Можно немного увеличить */
    color: #333;
  }

  .vacancy-title-link {
    text-decoration: none;
    color: inherit; /* Наследуем цвет текста */
    display: block; /* Делаем ссылку блочной для удобства клика */
    transition: color 0.2s;
    margin-bottom: 0.5rem; /* Добавим отступ после заголовка */
  }
  .vacancy-title-link:hover h3 {
    color: #fdc007; /* Цвет при наведении */
  }
</style>
