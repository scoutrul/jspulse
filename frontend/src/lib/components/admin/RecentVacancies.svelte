<script lang="ts">
	import Heading from '../ui/Heading.svelte';
	import VacancyCard from './VacancyCard.svelte';
	
	export let vacancies: Array<{
		id: string;
		title: string;
		companyName: string;
		skills: string[];
		createdAt: string;
		source: string;
	}> = [];
</script>

<div class="bg-card p-6 rounded-xl">
	<Heading level={3} size="lg" weight="semibold" variant="primary" icon="⏰" class="mb-6">
		Последние вакансии
	</Heading>
	
	{#if vacancies.length === 0}
		<div class="text-center py-8 text-muted">
			<div class="text-4xl mb-2">📝</div>
			<p>Нет последних вакансий</p>
		</div>
	{:else}
		<div class="space-y-4 max-h-96 overflow-y-auto">
			{#each vacancies as vacancy}
				<VacancyCard {vacancy} />
			{/each}
		</div>
		
		<!-- Футер -->
		<div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
			<div class="text-xs text-muted text-center">
				Показано {vacancies.length} последних вакансий
			</div>
		</div>
	{/if}
</div> 