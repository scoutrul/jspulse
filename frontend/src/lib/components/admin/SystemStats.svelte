<script lang="ts">
	import StatCard from './StatCard.svelte';
	import Heading from '../ui/Heading.svelte';
	import type { SystemStats } from '../../types/admin.types';

	// Props
	export let stats: SystemStats | null = null;
	export let loading: boolean = false;

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
		
	{:else}
		<div class="text-center py-12">
			<p class="text-secondary">Нет данных о системе</p>
		</div>
	{/if}
</div> 