<script>
	import { onMount } from 'svelte';
	
	let vacancies = [];
	let loading = true;
	let error = null;
	
	onMount(async () => {
		try {
			const response = await fetch('http://localhost:3001/api/vacancies');
			const data = await response.json();
			vacancies = data.data || [];
			loading = false;
		} catch (err) {
			error = 'Ошибка загрузки вакансий';
			loading = false;
		}
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
	
	{#if loading}
		<p class="loading">Загрузка вакансий...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else}
		<div class="vacancies">
			<h2>Последние вакансии</h2>
			{#if vacancies.length === 0}
				<p>Вакансий пока нет</p>
			{:else}
				<ul>
					{#each vacancies as vacancy}
						<li>
							<h3>{vacancy.title}</h3>
							<p>Компания: {vacancy.company}</p>
							<p>Локация: {vacancy.location}</p>
							<div class="tags">
								{#each vacancy.tags as tag}
									<span class="tag">{tag}</span>
								{/each}
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
		max-width: 1200px;
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
		margin-bottom: 2rem;
	}
	
	.vacancies {
		margin-top: 2rem;
	}
	
	ul {
		list-style: none;
		padding: 0;
	}
	
	li {
		border: 1px solid #eee;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1rem;
		box-shadow: 0 2px 5px rgba(0,0,0,0.05);
	}
	
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	
	.tag {
		background: #fef6d8;
		color: #b78e00;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}
	
	.loading {
		text-align: center;
		color: #888;
	}
	
	.error {
		color: #e74c3c;
		text-align: center;
	}
</style>
