<script lang="ts">
	import { onMount } from 'svelte';
	import StatCard from '$lib/components/admin/StatCard.svelte';
	import DocumentationPanel from '$lib/components/admin/DocumentationPanel.svelte';
	import ActionButton from '$lib/components/admin/ActionButton.svelte';
	import TopSkillsChart from '$lib/components/admin/TopSkillsChart.svelte';
	import RecentVacancies from '$lib/components/admin/RecentVacancies.svelte';

	// Типы для данных из API
	interface SystemStats {
		vacancies: {
			total: number;
			recent24h: number;
			withFullDescription: number;
		};
		skills: {
			unique: number;
			total: number;
		};
		cache: {
			hitRate: number;
			size: number;
			totalRequests: number;
			totalHits: number;
		};
		scheduler: {
			status: string;
			lastRun: string;
			nextRun: string;
		};
		system: {
			uptime: number;
			memoryUsage: any;
			timestamp: string;
		};
	}

	interface TopSkill {
		skill: string;
		count: number;
		percentage: number;
	}

	interface RecentVacancy {
		id: string;
		title: string;
		companyName: string;
		skills: string[];
		createdAt: string;
		source: string;
	}

	interface DocumentationFile {
		path: string;
		name: string;
		size: number;
		modifiedAt: string;
		isDirectory: boolean;
		relativePath: string;
	}

	// Состояние компонента
	let stats: SystemStats | null = null;
	let topSkills: TopSkill[] = [];
	let recentVacancies: RecentVacancy[] = [];
	let documentationFiles: DocumentationFile[] = [];
	let loading = true;
	let error: string | null = null;

	// API URL
	const API_BASE = 'http://localhost:3001/api/admin';

	// Загрузка данных
	async function loadSystemStats() {
		try {
			const response = await fetch(`${API_BASE}/stats`);
			const result = await response.json();
			
			if (result.success) {
				stats = result.data;
			} else {
				throw new Error(result.error?.message || 'Failed to load stats');
			}
		} catch (err) {
			console.error('Error loading system stats:', err);
			error = 'Не удалось загрузить статистику системы';
		}
	}

	async function loadTopSkills() {
		try {
			const response = await fetch(`${API_BASE}/top-skills`);
			const result = await response.json();
			
			if (result.success) {
				topSkills = result.data;
			}
		} catch (err) {
			console.error('Error loading top skills:', err);
		}
	}

	async function loadRecentVacancies() {
		try {
			const response = await fetch(`${API_BASE}/recent`);
			const result = await response.json();
			
			if (result.success) {
				recentVacancies = result.data;
			}
		} catch (err) {
			console.error('Error loading recent vacancies:', err);
		}
	}

	async function loadDocumentationFiles() {
		try {
			const response = await fetch(`${API_BASE}/docs`);
			const result = await response.json();
			
			if (result.success) {
				documentationFiles = result.data;
			}
		} catch (err) {
			console.error('Error loading documentation files:', err);
		}
	}

	async function loadAllData() {
		loading = true;
		error = null;

		try {
			await Promise.all([
				loadSystemStats(),
				loadTopSkills(),
				loadRecentVacancies(),
				loadDocumentationFiles()
			]);
		} catch (err) {
			console.error('Error loading data:', err);
			error = 'Произошла ошибка при загрузке данных';
		} finally {
			loading = false;
		}
	}

	// Обработчики административных действий
	async function handleParseHH() {
		try {
			const response = await fetch(`${API_BASE}/parse-hh`, { method: 'POST' });
			const result = await response.json();
			
			if (result.success) {
				alert(`Парсинг запущен!\n${result.data.message}\nВремя выполнения: ${result.data.executionTime}мс`);
				// Перезагружаем статистику после парсинга
				await loadSystemStats();
				await loadRecentVacancies();
			} else {
				alert(`Ошибка парсинга: ${result.error?.message}`);
			}
		} catch (err) {
			console.error('Error starting HH parsing:', err);
			alert('Не удалось запустить парсинг HeadHunter');
		}
	}

	async function handleClearDatabase() {
		if (!confirm('⚠️ ВНИМАНИЕ! Это удалит ВСЕ данные из базы.\n\nВы уверены?')) {
			return;
		}

		try {
			const response = await fetch(`${API_BASE}/clear-db`, { method: 'DELETE' });
			const result = await response.json();
			
			if (result.success) {
				alert(`База данных очищена!\n${result.data.message}\nВремя выполнения: ${result.data.executionTime}мс`);
				// Перезагружаем все данные после очистки
				await loadAllData();
			} else {
				alert(`Ошибка очистки: ${result.error?.message}`);
			}
		} catch (err) {
			console.error('Error clearing database:', err);
			alert('Не удалось очистить базу данных');
		}
	}

	function handleRefresh() {
		loadAllData();
	}

	// Загружаем данные при монтировании компонента
	onMount(() => {
		loadAllData();
		
		// Автообновление каждые 30 секунд
		const interval = setInterval(loadSystemStats, 30000);
		
		return () => clearInterval(interval);
	});

	// Форматирование времени работы системы
	function formatUptime(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		return `${hours}ч ${minutes}м`;
	}

	// Форматирование памяти
	function formatMemory(bytes: number): string {
		return `${Math.round(bytes / 1024 / 1024)}MB`;
	}
</script>

<svelte:head>
	<title>JSPulse - Админ Дашборд</title>
	<meta name="description" content="Административная панель JSPulse" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
		<!-- Заголовок дашборда -->
		<div class="mb-8 text-center">
			<h1 class="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
				🔧 JSPulse Admin Dashboard
			</h1>
			<p class="text-slate-600 dark:text-slate-300">
				Административное управление системой JSPulse
			</p>
			
			<!-- Кнопка обновления -->
			<button 
				on:click={handleRefresh}
				disabled={loading}
				class="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
			>
				{loading ? '🔄 Загрузка...' : '🔄 Обновить данные'}
			</button>
		</div>

		{#if error}
			<div class="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
				❌ {error}
			</div>
		{/if}

		{#if loading}
			<div class="text-center py-12">
				<div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
				<p class="text-slate-600 dark:text-slate-300">Загрузка данных дашборда...</p>
			</div>
		{:else}
			<!-- Основной контент дашборда -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				
				<!-- Левая колонка: Система JSPulse -->
				<div class="space-y-6">
					<h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
						📊 Система JSPulse
					</h2>
					
					{#if stats}
						<StatCard 
							title="📝 Вакансии" 
							value={stats.vacancies.total} 
							subtitle="Всего в базе"
							details={`За 24ч: +${stats.vacancies.recent24h} | С описанием: ${stats.vacancies.withFullDescription}`}
						/>
						
						<StatCard 
							title="🛠️ Навыки" 
							value={stats.skills.unique} 
							subtitle="Уникальных навыков"
							details={`Всего упоминаний: ${stats.skills.total}`}
						/>
						
						<StatCard 
							title="💾 Кэш" 
							value="{stats.cache.hitRate}%" 
							subtitle="Hit Rate"
							details={`Размер: ${stats.cache.size} | Запросов: ${stats.cache.totalRequests}`}
						/>
						
						<StatCard 
							title="⚡ Планировщик" 
							value={stats.scheduler.status} 
							subtitle="Статус"
							details={`Последний запуск: ${new Date(stats.scheduler.lastRun).toLocaleString('ru')}`}
						/>
						
						<StatCard 
							title="⏱️ Система" 
							value={formatUptime(stats.system.uptime)} 
							subtitle="Время работы"
							details={`RAM: ${formatMemory(stats.system.memoryUsage.heapUsed)} / ${formatMemory(stats.system.memoryUsage.heapTotal)}`}
						/>
					{/if}

					<!-- Административные действия -->
					<div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
						<h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
							🔄 Действия
						</h3>
						
						<div class="space-y-3">
							<ActionButton 
								on:click={handleParseHH}
								variant="primary"
								icon="🔍"
								text="Парсить HH.ru"
								description="Запустить сбор новых вакансий"
							/>
							
							<ActionButton 
								on:click={handleClearDatabase}
								variant="danger"
								icon="🗑️"
								text="Очистить БД"
								description="⚠️ Удалить все данные"
							/>
						</div>
					</div>
				</div>

				<!-- Центральная колонка: Аналитика -->
				<div class="space-y-6">
					<h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
						📈 Аналитика
					</h2>
					
					{#if topSkills.length > 0}
						<TopSkillsChart skills={topSkills} />
					{/if}
					
					{#if recentVacancies.length > 0}
						<RecentVacancies vacancies={recentVacancies} />
					{/if}
				</div>

				<!-- Правая колонка: Memory Bank -->
				<div class="space-y-6">
					<h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
						📚 Memory Bank
					</h2>
					
					{#if documentationFiles.length > 0}
						<DocumentationPanel files={documentationFiles} />
					{/if}
				</div>
			</div>
		{/if}
	</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
	
	.container {
		max-width: 1400px;
	}
</style> 