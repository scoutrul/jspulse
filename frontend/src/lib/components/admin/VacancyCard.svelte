<script lang="ts">
	import Heading from '../ui/Heading.svelte';
	import { createEventDispatcher } from 'svelte';
	import { apiClient } from '../../api/http.client';
	
	const dispatch = createEventDispatcher<{
		deleted: {
			vacancyId: string;
			title: string;
		};
	}>();
	
	export let vacancy: {
		id: string;
		title: string;
		companyName: string;
		skills: string[];
		createdAt: string;
		source: string;
	};

	let isDeleting = false;

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('ru', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function formatTime(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleTimeString('ru', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getSourceIcon(source: string): string {
		switch (source.toLowerCase()) {
			case 'hh':
			case 'headhunter':
				return '🔍';
			case 'superjob':
				return '💼';
			case 'zarplata':
				return '💰';
			default:
				return '📄';
		}
	}

	function truncateTitle(title: string, maxLength: number = 50): string {
		return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
	}

	async function handleDelete() {
		if (isDeleting) return;
		
		// Подтверждение удаления
		const confirmed = confirm(`Вы уверены что хотите удалить вакансию "${vacancy.title}"?`);
		if (!confirmed) return;
		
		isDeleting = true;
		
		try {
			const result = await apiClient.delete(`/api/admin/vacancy/${vacancy.id}`) as { success: boolean; error?: { message: string } };
			
			if (result.success) {
				// Отправляем событие об успешном удалении
				dispatch('deleted', { 
					vacancyId: vacancy.id,
					title: vacancy.title 
				});
			} else {
				console.error('Failed to delete vacancy:', result.error);
				alert('Ошибка удаления: ' + (result.error?.message || 'Неизвестная ошибка'));
			}
		} catch (error: any) {
			console.error('Error deleting vacancy:', error);
			
			// Проверяем, является ли ошибка 404 (вакансия уже удалена)
			if (error?.response?.status === 404 || error?.message?.includes('404')) {
				console.log('Vacancy already deleted, removing from list');
				// Отправляем событие об удалении даже если получили 404
				dispatch('deleted', { 
					vacancyId: vacancy.id,
					title: vacancy.title 
				});
			} else {
				alert('Ошибка сети при удалении вакансии');
			}
		} finally {
			isDeleting = false;
		}
	}
</script>

<div class="group relative p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
	<!-- Кнопка удаления -->
	<button
		on:click={handleDelete}
		disabled={isDeleting}
		class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded p-1 text-xs"
		title="Удалить вакансию"
	>
		{#if isDeleting}
			⏳
		{:else}
			🗑️
		{/if}
	</button>

	<!-- Заголовок и источник -->
	<div class="flex items-start justify-between mb-2 pr-8">
		<Heading level={4} size="base" weight="medium" variant="primary" class="flex-1 mr-2">
			{truncateTitle(vacancy.title)}
		</Heading>
		<div class="flex items-center space-x-1 text-sm text-muted">
			<span>{getSourceIcon(vacancy.source)}</span>
			<span>{vacancy.source.toUpperCase()}</span>
		</div>
	</div>
	
	<!-- Компания -->
	<div class="text-sm text-secondary mb-2">
		🏢 {vacancy.companyName}
	</div>
	
	<!-- Навыки -->
	{#if vacancy.skills.length > 0}
		<div class="flex flex-wrap gap-1 mb-3">
			{#each vacancy.skills.slice(0, 4) as skill}
				<span class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">
					{skill}
				</span>
			{/each}
			{#if vacancy.skills.length > 4}
				<span class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
					+{vacancy.skills.length - 4}
				</span>
			{/if}
		</div>
	{/if}
	
	<!-- Дата и время -->
	<div class="flex items-center justify-between text-xs text-muted">
		<span>📅 {formatDate(vacancy.createdAt)}</span>
		<span>🕐 {formatTime(vacancy.createdAt)}</span>
	</div>
</div> 