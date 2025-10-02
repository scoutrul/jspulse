<script lang="ts">
	import { onMount } from 'svelte';
	import SystemStats from '$lib/components/admin/SystemStats.svelte';
	import AdminActions from '$lib/components/admin/AdminActions.svelte';
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

	// Состояние диалога подтверждения
	let showConfirmDialog = false;
	let confirmMessage = '';
	let confirmCallback: (() => void) | null = null;

	// Загрузка данных при монтировании компонента
	onMount(async () => {
		await loadSystemStats();
	});

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
			error = 'Не удалось загрузить статистику системы';
		} finally {
			loading = false;
		}
	}

	// Обработчик обновления данных из AdminActions
	function handleDataUpdated() {
		loadSystemStats();
	}

	// Обработчик запроса подтверждения из AdminActions
	function handleConfirmAction(event: CustomEvent<{ message: string; onConfirm: () => void }>) {
		confirmMessage = event.detail.message;
		confirmCallback = event.detail.onConfirm;
		showConfirmDialog = true;
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
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			
			<!-- Левая колонка: Система JSPulse -->
			<div class="space-y-6">
				<SystemStats {stats} {loading} />
			</div>

			<!-- Правая колонка: Административные действия -->
			<div class="space-y-6">
				<Heading level={2} size="2xl" weight="bold" variant="primary" icon="🔄" class="mb-4">
					Административные действия
				</Heading>
				
				<AdminActions 
					on:dataUpdated={handleDataUpdated}
					on:confirmAction={handleConfirmAction}
				/>
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