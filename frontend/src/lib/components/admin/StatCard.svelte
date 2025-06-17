<script lang="ts">
	export let title: string;
	export let value: string | number;
	export let subtitle: string;
	export let details: string = '';
	export let variant: 'default' | 'success' | 'warning' | 'danger' = 'default';

	// Определяем цвета в зависимости от варианта (используем глобальную схему)
	const variants = {
		default: '',
		success: 'variant-success',
		warning: 'variant-warning', 
		danger: 'variant-danger'
	};

	$: cardClass = variants[variant];
</script>

<div class="stat-card {cardClass}">
	<!-- Заголовок карточки -->
	<div class="flex items-start justify-between mb-3">
		<h3 class="text-sm font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wide">
			{title}
		</h3>
		
		<!-- Индикатор варианта -->
		{#if variant === 'success'}
			<div class="w-3 h-3 bg-green-400 rounded-full"></div>
		{:else if variant === 'warning'}
			<div class="w-3 h-3 bg-yellow-400 rounded-full"></div>
		{:else if variant === 'danger'}
			<div class="w-3 h-3 bg-red-400 rounded-full"></div>
		{:else}
			<div class="w-3 h-3 bg-blue-400 rounded-full"></div>
		{/if}
	</div>

	<!-- Основное значение -->
	<div class="mb-2">
		<div class="text-3xl font-bold text-slate-800 dark:text-slate-100">
			{value}
		</div>
		<div class="text-sm text-slate-500 dark:text-slate-400">
			{subtitle}
		</div>
	</div>

	<!-- Дополнительные детали -->
	{#if details}
		<div class="pt-3 border-t border-slate-100 dark:border-slate-700">
			<p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
				{details}
			</p>
		</div>
	{/if}
</div>

<style>
	.stat-card {
		@apply rounded-xl p-6 shadow-lg border transition-all duration-300;
		@apply hover:shadow-xl;
		
		/* Базовая карточка в стиле проекта */
		background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
		@apply bg-white border-neutral-200;
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.04), 
			0 1px 2px rgba(0, 0, 0, 0.06);
	}

	/* Темная тема */
	:global(.dark) .stat-card {
		background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
		@apply bg-slate-800 border-slate-700;
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.2), 
			0 1px 2px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	/* Варианты */
	.stat-card.variant-success {
		@apply bg-green-50 border-green-200;
	}
	:global(.dark) .stat-card.variant-success {
		@apply bg-green-900/20 border-green-700;
	}

	.stat-card.variant-warning {
		@apply bg-yellow-50 border-yellow-200;
	}
	:global(.dark) .stat-card.variant-warning {
		@apply bg-yellow-900/20 border-yellow-700;
	}

	.stat-card.variant-danger {
		@apply bg-red-50 border-red-200;
	}
	:global(.dark) .stat-card.variant-danger {
		@apply bg-red-900/20 border-red-700;
	}

	/* Анимация при наведении */
	.stat-card:hover {
		transform: translateY(-2px);
	}
</style> 