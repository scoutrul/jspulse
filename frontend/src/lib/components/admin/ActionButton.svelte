<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';
	export let icon: string = '';
	export let text: string;
	export let description: string = '';
	export let disabled: boolean = false;
	export let loading: boolean = false;

	const dispatch = createEventDispatcher<{
		click: MouseEvent;
	}>();

	// Определяем стили для разных вариантов
	const variants = {
		primary: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500',
		secondary: 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500',
		danger: 'bg-red-500 hover:bg-red-600 text-white border-red-500',
		success: 'bg-green-500 hover:bg-green-600 text-white border-green-500'
	};

	$: buttonClass = variants[variant];

	function handleClick(event: MouseEvent) {
		if (!disabled && !loading) {
			dispatch('click', event);
		}
	}
</script>

<button 
	on:click={handleClick}
	{disabled}
	class="w-full p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed {buttonClass}"
	class:animate-pulse={loading}
>
	<div class="flex items-center justify-start space-x-3">
		<!-- Иконка -->
		<div class="text-2xl flex-shrink-0">
			{#if loading}
				<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
			{:else}
				{icon}
			{/if}
		</div>
		
		<!-- Текст и описание -->
		<div class="text-left">
			<div class="font-semibold text-lg">
				{text}
			</div>
			{#if description}
				<div class="text-sm opacity-90">
					{description}
				</div>
			{/if}
		</div>
		
		<!-- Стрелка -->
		{#if !loading}
			<div class="ml-auto text-xl opacity-75">
				➜
			</div>
		{/if}
	</div>
</button>

<style>
	button:hover:not(:disabled) {
		transform: translateY(-1px);
	}
	
	button:active:not(:disabled) {
		transform: translateY(0);
	}
</style> 