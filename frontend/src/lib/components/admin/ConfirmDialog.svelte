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
		? 'bg-red-500 hover:bg-red-600 focus:ring-red-500' 
		: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500';
</script>

<!-- Диалог подтверждения -->
{#if show}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in"
		on:click={handleCancel}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- Dialog content -->
		<div 
			class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md mx-4 shadow-xl animate-scale-in"
			on:click|stopPropagation
			role="document"
		>
			<!-- Message -->
			<div class="mb-6">
				<p class="text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">
					{message}
				</p>
			</div>
			
			<!-- Buttons -->
			<div class="flex justify-end space-x-3">
				<button
					on:click={handleCancel}
					class="px-4 py-2 bg-gray-500 hover:bg-gray-600 focus:bg-gray-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
				>
					{cancelText}
				</button>
				
				<button
					on:click={handleConfirm}
					class="px-4 py-2 {confirmButtonClass} text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
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