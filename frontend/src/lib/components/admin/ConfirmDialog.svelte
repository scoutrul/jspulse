<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Props
	export let show: boolean = false;
	export let message: string = '';
	export let confirmText: string = 'Подтвердить';
	export let cancelText: string = 'Отмена';
	export let confirmVariant: 'primary' | 'danger' = 'primary';

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		confirm: void;
		cancel: void;
	}>();

	// Обработчики событий
	function handleConfirm() {
		dispatch('confirm');
		show = false;
	}

	function handleCancel() {
		dispatch('cancel');
		show = false;
	}

	// Закрытие по ESC
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleCancel();
		}
	}

	// CSS классы для кнопки подтверждения
	$: confirmButtonClass = confirmVariant === 'danger' 
		? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-400' 
		: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-400';
</script>

<!-- Диалог подтверждения -->
{#if show}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in"
		on:click={handleCancel}
		on:keydown={handleKeydown}
		role="button"
		aria-label="Закрыть диалог"
		tabindex="0"
	>
		<!-- Dialog content -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div 
			class="bg-card rounded-lg p-6 max-w-md mx-4 shadow-xl animate-scale-in"
			on:click|stopPropagation
			role="dialog"
			aria-modal="true"
		>
			<!-- Message -->
			<div class="mb-6">
				<p class="text-primary whitespace-pre-line leading-relaxed">
					{message}
				</p>
			</div>
			
			<!-- Buttons -->
			<div class="flex justify-end space-x-3">
				<button
					on:click={handleCancel}
					class="px-4 py-2 bg-slate-500 hover:bg-slate-600 focus:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-700 dark:focus:bg-slate-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-800"
				>
					{cancelText}
				</button>
				
				<button
					on:click={handleConfirm}
					class="px-4 py-2 {confirmButtonClass} text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	@keyframes scale-in {
		from { 
			opacity: 0;
			transform: scale(0.95);
		}
		to { 
			opacity: 1;
			transform: scale(1);
		}
	}
	
	.animate-fade-in {
		animation: fade-in 0.2s ease-out;
	}
	
	.animate-scale-in {
		animation: scale-in 0.2s ease-out;
	}
</style> 