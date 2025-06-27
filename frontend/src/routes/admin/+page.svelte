<script lang="ts">
	import { onMount } from 'svelte';
	import SystemStats from '$lib/components/admin/SystemStats.svelte';
	import AdminActions from '$lib/components/admin/AdminActions.svelte';
	import TopSkillsChart from '$lib/components/admin/TopSkillsChart.svelte';
	import RecentVacancies from '$lib/components/admin/RecentVacancies.svelte';
	import DocumentationPanel from '$lib/components/admin/DocumentationPanel.svelte';
	import ToastNotifications from '$lib/components/admin/ToastNotifications.svelte';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import Heading from '$lib/components/ui/Heading.svelte';
	import type { SystemStats as SystemStatsType } from '$lib/types/admin.types';

	// API базовый URL
	const API_BASE = 'http://localhost:3001/api/admin';

	// Состояние приложения
	let loading = true;
	let error: string | null = null;
	let stats: SystemStatsType | null = null;
	let topSkills: any[] = [];
	let recentVacancies: any[] = [];
	let documentationFiles: any[] = [];

	// Состояние диалога подтверждения
	let showConfirmDialog = false;
	let confirmMessage = '';
	let confirmCallback: (() => void) | null = null;

	// Загрузка данных при монтировании компонента
	onMount(async () => {
		await loadAllData();
	});

	// Функция загрузки всех данных
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
			console.error('Error loading admin data:', err);
			error = 'Не удалось загрузить данные дашборда';
		} finally {
			loading = false;
		}
	}

	// Загрузка системной статистики
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
			throw err;
		}
	}

	// Загрузка топ навыков
	async function loadTopSkills() {
		try {
			const response = await fetch(`${API_BASE}/top-skills`);
			const result = await response.json();
			
			if (result.success) {
				topSkills = result.data || [];
			} else {
				throw new Error(result.error?.message || 'Failed to load top skills');
			}
		} catch (err) {
			console.error('Error loading top skills:', err);
			// Не критичная ошибка, продолжаем загрузку
			topSkills = [];
		}
	}

	// Загрузка последних вакансий
	async function loadRecentVacancies() {
		try {
			const response = await fetch(`${API_BASE}/recent`);
			const result = await response.json();
			
			if (result.success) {
				recentVacancies = result.data || [];
			} else {
				throw new Error(result.error?.message || 'Failed to load recent vacancies');
			}
		} catch (err) {
			console.error('Error loading recent vacancies:', err);
			// Не критичная ошибка, продолжаем загрузку
			recentVacancies = [];
		}
	}

	// Загрузка файлов документации
	async function loadDocumentationFiles() {
		try {
			const response = await fetch(`${API_BASE}/docs`);
			const result = await response.json();
			
			if (result.success) {
				documentationFiles = result.data || [];
			} else {
				throw new Error(result.error?.message || 'Failed to load documentation files');
			}
		} catch (err) {
			console.error('Error loading documentation files:', err);
			// Не критичная ошибка, продолжаем загрузку
			documentationFiles = [];
		}
	}

	// Обработчик обновления данных
	async function handleRefresh() {
		await loadAllData();
	}

	// Обработчик обновления данных из AdminActions
	function handleDataUpdated() {
		loadSystemStats();
		loadRecentVacancies();
	}

	// Обработчик запроса подтверждения из AdminActions
	function handleConfirmAction(event: CustomEvent<{ message: string; onConfirm: () => void }>) {
		confirmMessage = event.detail.message;
		confirmCallback = event.detail.onConfirm;
		showConfirmDialog = true;
	}

	// Обработчик удаления вакансии
	function handleVacancyDeleted(event: CustomEvent<{ vacancyId: string; title: string }>) {
		const { title } = event.detail;
		
		// Показываем уведомление об успешном удалении
		console.log(`✅ Вакансия "${title}" удалена`);
		
		// Обновляем статистику
		loadSystemStats();
	}

	// Обработчики диалога подтверждения
	function handleConfirm() {
		if (confirmCallback) {
			confirmCallback();
		}
		showConfirmDialog = false;
		confirmCallback = null;
	}

	function handleCancel() {
		showConfirmDialog = false;
		confirmCallback = null;
	}
</script>

<svelte:head>
	<title>JSPulse - Админ Дашборд</title>
	<meta name="description" content="Административная панель JSPulse" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Заголовок дашборда -->
	<div class="mb-8 text-center">
		<Heading level={1} size="4xl" weight="bold" variant="primary" icon="🔧" class="mb-2">
			JSPulse Admin Dashboard
		</Heading>
		<p class="text-secondary">
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
			<p class="text-secondary">Загрузка данных дашборда...</p>
		</div>
	{:else}
		<!-- Основной контент дашборда -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			
			<!-- Левая колонка: Система JSPulse -->
			<div class="space-y-6">
				<SystemStats {stats} {loading} />
				
				<!-- Административные действия -->
				<AdminActions 
					on:dataUpdated={handleDataUpdated}
					on:confirmAction={handleConfirmAction}
				/>
			</div>

			<!-- Центральная колонка: Аналитика -->
			<div class="space-y-6">
				<Heading level={2} size="2xl" weight="bold" variant="primary" icon="📈" class="mb-4">
					Аналитика
				</Heading>
				
				{#if topSkills.length > 0}
					<TopSkillsChart skills={topSkills} />
				{/if}
				
				{#if recentVacancies.length > 0}
					<RecentVacancies vacancies={recentVacancies} on:vacancyDeleted={handleVacancyDeleted} />
				{/if}
			</div>

			<!-- Правая колонка: Memory Bank -->
			<div class="space-y-6">
				<Heading level={2} size="2xl" weight="bold" variant="primary" icon="📚" class="mb-4">
					Memory Bank
				</Heading>
				
				{#if documentationFiles.length > 0}
					<DocumentationPanel files={documentationFiles} />
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Глобальные компоненты -->
<ToastNotifications />

<ConfirmDialog 
	bind:show={showConfirmDialog}
	message={confirmMessage}
	confirmVariant="danger"
	on:confirm={handleConfirm}
	on:cancel={handleCancel}
/>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
	
	.container {
		max-width: 1400px;
	}
</style> 