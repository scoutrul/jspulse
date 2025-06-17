<script lang="ts">
	export let skills: Array<{
		skill: string;
		count: number;
		percentage: number;
	}> = [];

	// Цвета для графика
	const colors = [
		'bg-blue-500',
		'bg-green-500',
		'bg-purple-500',
		'bg-yellow-500',
		'bg-red-500',
		'bg-indigo-500',
		'bg-pink-500',
		'bg-teal-500',
		'bg-orange-500',
		'bg-cyan-500'
	];

	function getColorClass(index: number): string {
		return colors[index % colors.length];
	}
</script>

<div class="admin-card">
	<h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">
		🏆 Топ навыков
	</h3>
	
	{#if skills.length === 0}
		<div class="text-center py-8 text-slate-500 dark:text-slate-400">
			<div class="text-4xl mb-2">📊</div>
			<p>Нет данных о навыках</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each skills as skill, index}
				<div class="flex items-center space-x-3">
					<!-- Позиция -->
					<div class="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full text-sm font-bold text-slate-600 dark:text-slate-300">
						{index + 1}
					</div>
					
					<!-- Информация о навыке -->
					<div class="flex-1">
						<div class="flex items-center justify-between mb-1">
							<span class="font-medium text-slate-800 dark:text-slate-100">
								{skill.skill}
							</span>
							<div class="text-sm text-slate-500 dark:text-slate-400">
								{skill.count} ({skill.percentage.toFixed(1)}%)
							</div>
						</div>
						
						<!-- Прогресс-бар -->
						<div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
							<div 
								class="{getColorClass(index)} h-2 rounded-full transition-all duration-500 ease-out"
								style="width: {skill.percentage}%"
							></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
		
		<!-- Итоговая статистика -->
		<div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
			<div class="text-xs text-slate-500 dark:text-slate-400 text-center">
				Показано топ {skills.length} навыков из всех уникальных
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

	/* Анимация появления прогресс-баров */
	.bg-blue-500, .bg-green-500, .bg-purple-500, .bg-yellow-500, .bg-red-500,
	.bg-indigo-500, .bg-pink-500, .bg-teal-500, .bg-orange-500, .bg-cyan-500 {
		animation: fillBar 1s ease-out;
	}
	
	@keyframes fillBar {
		from {
			width: 0%;
		}
		to {
			width: var(--final-width);
		}
	}
</style> 