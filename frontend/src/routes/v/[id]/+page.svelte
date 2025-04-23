<!-- frontend/src/routes/v/[id]/+page.svelte -->
<script lang="ts">
  import type { PageData } from "./$types";
  import DOMPurify from "dompurify";
  import { browser } from "$app/environment"; // Для использования DOMPurify только в браузере
  import { formatDate } from "$lib/utils/date.utils"; // <-- Добавляем импорт

  export let data: PageData; // Данные из load функции в +page.server.ts

  // DOMPurify можно использовать только в браузере
  let sanitizedDescription = "";
  $: if (browser && data.vacancy?.description) {
    sanitizedDescription = DOMPurify.sanitize(data.vacancy.description);
  } else if (data.vacancy?.description) {
    // На сервере можно оставить как есть или применить базовую очистку, если нужно
    // Но безопаснее всего рендерить HTML только на клиенте после DOMPurify
    sanitizedDescription = ""; // Или отобразить заглушку/текстовую версию
  }
</script>

<svelte:head>
  <title>{data.vacancy?.title || "Вакансия"} - JS Пульс</title>
  {#if data.vacancy?.description}
    <meta name="description" content={data.vacancy.description.substring(0, 150)} />
  {/if}
</svelte:head>

<main class="vacancy-detail-page">
  {#if data.vacancy}
    {@const vacancy = data.vacancy}
    <article>
      <header class="vacancy-header">
        <h1>{vacancy.title}</h1>
        <div class="company-info">
          {#if vacancy.employer?.logo_urls?.["90"]}
            <img
              src={vacancy.employer.logo_urls["90"]}
              alt={`Логотип ${vacancy.employer?.name || "компании"}`}
              class="company-logo"
            />
          {/if}
          <div>
            <p class="company-name">
              {#if vacancy.employer?.alternate_url}
                <a href={vacancy.employer.alternate_url} target="_blank" rel="noopener noreferrer">
                  {vacancy.employer?.name || "Не указано"}
                </a>
              {:else}
                {vacancy.employer?.name || "Не указано"}
              {/if}
            </p>
            {#if vacancy.location}
              <p class="location">{vacancy.location}</p>
            {/if}
          </div>
        </div>
        {#if vacancy.salaryFrom || vacancy.salaryTo}
          <p class="salary">
            {#if vacancy.salaryFrom}от {vacancy.salaryFrom.toLocaleString("ru-RU")}{/if}
            {#if vacancy.salaryTo}
              до {vacancy.salaryTo.toLocaleString("ru-RU")}{/if}
            {#if vacancy.salaryCurrency}
              {vacancy.salaryCurrency}{/if}
            {#if vacancy.salary?.gross === false}
              (на руки){/if}
          </p>
        {/if}
        <p class="published-date">Опубликовано: {formatDate(vacancy.publishedAt)}</p>
        <a
          href={vacancy.url}
          target="_blank"
          rel="noopener noreferrer"
          class="apply-button external"
        >
          Перейти к вакансии на {vacancy.source || "источник"}
        </a>
      </header>

      <section class="details-grid">
        {#if vacancy.experience}
          <div class="detail-item">
            <span class="detail-label">Опыт:</span>
            <span class="detail-value">{vacancy.experience}</span>
          </div>
        {/if}
        {#if vacancy.employment}
          <div class="detail-item">
            <span class="detail-label">Занятость:</span>
            <span class="detail-value">{vacancy.employment}</span>
          </div>
        {/if}
        {#if vacancy.schedule}
          <div class="detail-item">
            <span class="detail-label">График:</span>
            <span class="detail-value">{vacancy.schedule}</span>
          </div>
        {/if}
        {#if vacancy.address}
          <div class="detail-item address-item">
            <span class="detail-label">Адрес:</span>
            <span class="detail-value">{vacancy.address}</span>
          </div>
        {/if}
      </section>

      {#if vacancy.skills && vacancy.skills.length > 0}
        <section class="skills-section">
          <h2>Ключевые навыки:</h2>
          <div class="tags">
            {#each vacancy.skills as skill}
              <span class="tag">{skill}</span>
            {/each}
          </div>
        </section>
      {/if}

      {#if sanitizedDescription}
        <section class="description-section">
          <h2>Описание вакансии:</h2>
          <div class="description-content">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html sanitizedDescription}
          </div>
        </section>
      {/if}
    </article>
  {:else}
    <!-- Эта часть не должна показываться, если load функция отработала правильно и вернула ошибку -->
    <p class="error-message">Не удалось загрузить информацию о вакансии.</p>
  {/if}
</main>

<style>
  .vacancy-detail-page {
    max-width: 900px;
    margin: 2rem auto;
    padding: 1.5rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }

  .vacancy-header {
    border-bottom: 1px solid #eee;
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .vacancy-header h1 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: #333;
  }

  .company-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .company-logo {
    width: 50px;
    height: 50px;
    object-fit: contain;
    border-radius: 4px;
    border: 1px solid #eee;
  }

  .company-name {
    font-weight: bold;
    font-size: 1.1rem;
    margin: 0;
  }
  .company-name a {
    color: inherit;
    text-decoration: none;
  }
  .company-name a:hover {
    text-decoration: underline;
  }

  .location {
    color: #666;
    font-size: 0.95rem;
    margin: 0.2rem 0 0 0;
  }

  .salary {
    font-size: 1.2rem;
    font-weight: bold;
    color: #2ecc71;
    margin: 0.5rem 0;
  }

  .published-date {
    color: #888;
    font-size: 0.9rem;
    margin-top: 0.75rem;
    margin-bottom: 1rem;
  }

  .apply-button.external {
    display: inline-block;
    margin-top: 1rem;
    background: #fdc007;
    color: white;
    text-decoration: none;
    padding: 0.6rem 1.2rem;
    border-radius: 4px;
    font-weight: bold;
    transition: background 0.2s;
    font-size: 0.95rem;
  }
  .apply-button.external:hover {
    background: #e3ab00;
  }

  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
    background-color: #f9f9f9;
    padding: 1rem;
    border-radius: 6px;
  }

  .detail-item {
    font-size: 0.95rem;
  }
  .detail-item.address-item {
    grid-column: span 2; /* Адрес может занимать больше места */
  }

  .detail-label {
    font-weight: bold;
    color: #555;
    margin-right: 0.5rem;
  }

  .detail-value {
    color: #333;
  }

  .skills-section,
  .description-section {
    margin-bottom: 2rem;
  }

  h2 {
    font-size: 1.4rem;
    color: #444;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag {
    background: #fef6d8;
    color: #b78e00;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .description-content {
    line-height: 1.6;
    color: #333;
  }

  /* Стили для HTML контента из description */
  .description-content :global(ul),
  .description-content :global(ol) {
    padding-left: 20px;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }
  .description-content :global(li) {
    margin-bottom: 0.3em;
  }
  .description-content :global(p) {
    margin-bottom: 0.7em;
  }
  .description-content :global(strong),
  .description-content :global(b) {
    font-weight: 600; /* Более жирный шрифт */
  }

  .error-message {
    color: #e74c3c;
    text-align: center;
    padding: 2rem;
    border: 1px solid #e74c3c;
    border-radius: 8px;
    background-color: #fbeae5;
  }
</style>
