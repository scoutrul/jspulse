<script lang="ts">
	export let level: 1 | 2 | 3 | 4 | 5 | 6 = 1;
	export let size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' = 'base';
	export let weight: 'normal' | 'medium' | 'semibold' | 'bold' = 'normal';
	export let variant: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'accent' | 'gradient' = 'primary';
	export let icon: string = '';
	export let tag: string = '';
	
	// Дополнительные CSS классы
	let className = '';
	export { className as class };

	// Определение размеров текста
	const sizeClasses = {
		'xs': 'text-xs',
		'sm': 'text-sm', 
		'base': 'text-base',
		'lg': 'text-lg',
		'xl': 'text-xl',
		'2xl': 'text-2xl',
		'3xl': 'text-3xl',
		'4xl': 'text-4xl',
		'5xl': 'text-5xl',
		'6xl': 'text-6xl'
	};

	// Определение весов шрифта
	const weightClasses = {
		'normal': 'font-normal',
		'medium': 'font-medium',
		'semibold': 'font-semibold',
		'bold': 'font-bold'
	};

	// Определение вариантов цвета (используем CSS переменные из design-system.css)
	const variantClasses = {
		'primary': 'text-primary',
		'secondary': 'text-secondary', 
		'tertiary': 'text-tertiary',
		'muted': 'text-muted',
		'accent': 'text-accent',
		'gradient': 'text-accent-gradient heading-gradient'
	};

	// Формирование финальных CSS классов
	$: finalClasses = [
		sizeClasses[size],
		weightClasses[weight],
		variantClasses[variant],
		className
	].filter(Boolean).join(' ');

	// Формирование содержимого заголовка
	$: headingContent = icon ? `${icon} ${tag || ''}`.trim() : tag;
</script>

{#if level === 1}
	<h1 class={finalClasses}>
		{headingContent}<slot />
	</h1>
{:else if level === 2}
	<h2 class={finalClasses}>
		{headingContent}<slot />
	</h2>
{:else if level === 3}
	<h3 class={finalClasses}>
		{headingContent}<slot />
	</h3>
{:else if level === 4}
	<h4 class={finalClasses}>
		{headingContent}<slot />
	</h4>
{:else if level === 5}
	<h5 class={finalClasses}>
		{headingContent}<slot />
	</h5>
{:else if level === 6}
	<h6 class={finalClasses}>
		{headingContent}<slot />
	</h6>
{/if}

<style>
	/* Дополнительные стили для компонента если нужны */
	:global(.heading-gradient) {
		background: var(--gradient-accent);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
</style> 