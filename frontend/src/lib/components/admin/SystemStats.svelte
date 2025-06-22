<script lang="ts">
	import StatCard from './StatCard.svelte';
	import Heading from '../ui/Heading.svelte';
	import type { SystemStats } from '../../types/admin.types';

	// Props
	export let stats: SystemStats | null = null;
	export let loading: boolean = false;

	// Форматирование времени работы системы
	function formatUptime(uptimeMs: number): string {
		const seconds = Math.floor(uptimeMs / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}д ${hours % 24}ч`;
		if (hours > 0) return `${hours}ч ${minutes % 60}м`;
		if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
		return `${seconds}с`;
	}

	// Форматирование размера памяти
	function formatMemory(bytes: number): string {
		return `${Math.round(bytes / 1024 / 1024)}MB`;
	}
</script>

<div class="space-y-6">
	<Heading level={2} size="2xl" weight="bold" variant="primary" icon="📊" class="mb-4">
		Система JSPulse
	</Heading>
	
	{#if loading}
		<div class="animate-pulse space-y-6">
			{#each Array(5) as _}
				<div class="bg-slate-200 dark:bg-slate-700 rounded-xl h-32"></div>
			{/each}
		</div>
	{:else if stats}
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
	{:else}
		<div class="text-center py-12">
			<p class="text-secondary">Нет данных о системе</p>
		</div>
	{/if}
</div> 