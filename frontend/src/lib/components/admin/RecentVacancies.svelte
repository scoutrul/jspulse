<script lang="ts">
	export let vacancies: Array<{
		id: string;
		title: string;
		companyName: string;
		skills: string[];
		createdAt: string;
		source: string;
	}> = [];

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
</script>

<div class="admin-card">
	<h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">
		⏰ Последние вакансии
	</h3>
	
	{#if vacancies.length === 0}
		<div class="text-center py-8 text-slate-500 dark:text-slate-400">
			<div class="text-4xl mb-2">📝</div>
			<p>Нет последних вакансий</p>
		</div>
	{:else}
		<div class="space-y-4 max-h-96 overflow-y-auto">
			{#each vacancies as vacancy}
				<div class="p-4 border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
					<!-- Заголовок и источник -->
					<div class="flex items-start justify-between mb-2">
						<h4 class="font-medium text-slate-800 dark:text-slate-100 flex-1 mr-2">
							{truncateTitle(vacancy.title)}
						</h4>
						<div class="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
							<span>{getSourceIcon(vacancy.source)}</span>
							<span>{vacancy.source.toUpperCase()}</span>
						</div>
					</div>
					
					<!-- Компания -->
					<div class="text-sm text-slate-600 dark:text-slate-300 mb-2">
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
					<div class="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
						<span>📅 {formatDate(vacancy.createdAt)}</span>
						<span>🕐 {formatTime(vacancy.createdAt)}</span>
					</div>
				</div>
			{/each}
		</div>
		
		<!-- Футер -->
		<div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
			<div class="text-xs text-slate-500 dark:text-slate-400 text-center">
				Показано {vacancies.length} последних вакансий
			</div>
		</div>
	{/if}
</div>

<style>
	.admin-card {
		@apply rounded-xl p-6 shadow-lg border transition-all duration-300;
		
		/* Базовая карточка в стиле проекта */
		background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
		@apply bg-white border-neutral-200;
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.04), 
			0 1px 2px rgba(0, 0, 0, 0.06);
	}

	/* Темная тема */
	:global(.dark) .admin-card {
		background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
		@apply bg-slate-800 border-slate-700;
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.2), 
			0 1px 2px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	/* Кастомный скроллбар */
	.overflow-y-auto::-webkit-scrollbar {
		width: 4px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-track {
		background: rgb(241 245 249);
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: rgb(148 163 184);
		border-radius: 2px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: rgb(100 116 139);
	}
	
	/* Темная тема для скроллбара */
	:global(.dark) .overflow-y-auto::-webkit-scrollbar-track {
		background: rgb(51 65 85);
	}
	
	:global(.dark) .overflow-y-auto::-webkit-scrollbar-thumb {
		background: rgb(71 85 105);
	}
	
	:global(.dark) .overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: rgb(100 116 139);
	}
</style> 