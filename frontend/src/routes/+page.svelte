<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '../api/http.client';
	import type { VacancyDTO } from '@jspulse/shared';
	import axios from 'axios';
	
	let vacancies: VacancyDTO[] = [];
	let loading = true;
	let error: string | null = null;
	let selectedSkills = [];
	let availableSkills = [];
	
	// Загрузка вакансий
	const loadVacancies = async (skillFilter: string[] | null = null) => {
		loading = true;
		error = null;
		
		try {
			const endpoint = skillFilter && skillFilter.length > 0
				? '/api/vacancies'
				: '/api/vacancies';
				
			const response = await apiClient.get<VacancyDTO[]>(endpoint);
			const responseData = response.data;
			
			if (Array.isArray(responseData)) {
				vacancies = responseData;
					
				// Собираем все уникальные навыки (skills)
				if (!skillFilter) {
					const skillsSet = new Set<string>();
					vacancies.forEach(vacancy => {
						if (vacancy.skills && Array.isArray(vacancy.skills)) {
							vacancy.skills.forEach(skill => skillsSet.add(skill));
						}
					});
					availableSkills = Array.from(skillsSet).sort();
				}
			} else {
				error = 'Получен неожиданный формат данных от сервера';
			}
		} catch (err) {
			console.error("Ошибка API:", err);
			if (axios.isAxiosError(err)) {
				error = `Ошибка сети или сервера: ${err.message}`;
			} else if (err instanceof Error) {
				error = 'Ошибка загрузки вакансий: ' + err.message;
			} else {
				error = 'Произошла неизвестная ошибка при загрузке вакансий.';
			}
		} finally {
			loading = false;
		}
	};
	
	// Обрабатываем выбор/отмену навыка
	const toggleSkill = (skill: string) => {
		if (selectedSkills.includes(skill)) {
			selectedSkills = selectedSkills.filter(s => s !== skill);
		} else {
			selectedSkills = [...selectedSkills, skill];
		}
		
		// Применяем фильтрацию
		loadVacancies(selectedSkills.length > 0 ? selectedSkills : null);
	};
	
	// Форматируем дату для отображения
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('ru-RU', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(date);
	};
	
	onMount(() => {
		loadVacancies();
	});
</script>

<svelte:head>
	<title>JS Пульс - вакансии по фронтенду</title>
</svelte:head>

<main>
	<header>
		<img src="/jspulse.png" alt="JS Пульс логотип" class="logo" />
		<h1>JS Пульс</h1>
	</header>
	
	<p class="description">Агрегатор вакансий по Frontend/JavaScript</p>
	
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
				<button class="clear-button" on:click={() => { selectedSkills = []; loadVacancies(); }}>
					Сбросить фильтры
				</button>
			</div>
		{/if}
	</div>
	
	{#if loading}
		<p class="loading">Загрузка вакансий...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else}
		<div class="vacancies">
			<h2>Последние вакансии {selectedSkills.length > 0 ? `по навыкам: ${selectedSkills.join(', ')}` : ''}</h2>
			
			{#if vacancies.length === 0}
				<p class="no-vacancies">Вакансий не найдено</p>
			{:else}
				<ul>
					{#each vacancies as vacancy}
						<li>
							<h3>{vacancy.title}</h3>
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
							
							<div class="description">
								{@html vacancy.description}
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
										<span class="date">Опубликовано: {formatDate(vacancy.publishedAt)}</span>
									{/if}
									<a href={vacancy.url} target="_blank" rel="noopener noreferrer" class="apply-button">
										Перейти к вакансии
									</a>
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
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
	}
	
	header {
		display: flex;
		align-items: center;
		margin-bottom: 1rem;
	}
	
	.logo {
		width: 60px;
		height: 60px;
		margin-right: 1rem;
	}
	
	h1 {
		color: #fdc007;
		margin: 0;
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
		box-shadow: 0 2px 5px rgba(0,0,0,0.05);
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
	
	.location, .salary {
		margin: 0;
	}
	
	.salary {
		color: #2ecc71;
		font-weight: bold;
	}
	
	.description {
		margin-bottom: 1.5rem;
		white-space: pre-line;
		line-height: 1.5;
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
	
	.error {
		color: #e74c3c;
		text-align: center;
		padding: 2rem;
		border: 1px solid #e74c3c;
		border-radius: 8px;
	}
</style>
