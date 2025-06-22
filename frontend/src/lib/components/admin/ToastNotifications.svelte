<script lang="ts">
	import { notifications, removeNotification } from '../../stores/notificationStore';
	import type { NotificationData } from '../../types/admin.types';

	// Подписываемся на уведомления
	$: notificationList = $notifications;

	// Функция для получения иконки по типу
	function getIcon(type: NotificationData['type']): string {
		switch (type) {
			case 'success': return '✅';
			case 'error': return '❌';
			case 'info': return 'ℹ️';
			default: return 'ℹ️';
		}
	}

	// Функция для получения CSS классов по типу
	function getTypeClasses(type: NotificationData['type']): string {
		switch (type) {
			case 'success': return 'border-l-green-500';
			case 'error': return 'border-l-red-500';
			case 'info': return 'border-l-blue-500';
			default: return 'border-l-blue-500';
		}
	}
</script>

<!-- Контейнер для уведомлений -->
{#if notificationList.length > 0}
	<div class="fixed top-4 right-4 z-50 space-y-2">
		{#each notificationList as notification (notification.id)}
			<div 
				class="max-w-sm bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 border-l-4 {getTypeClasses(notification.type)} animate-slide-in"
				role="alert"
			>
				<div class="flex justify-between items-start">
					<div class="flex-1">
						<p class="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
							<span>{getIcon(notification.type)}</span>
							<span>{notification.message}</span>
						</p>
						
						{#if notification.details}
							<p class="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line">
								{notification.details}
							</p>
						{/if}
						
						<p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
							{notification.timestamp}
						</p>
					</div>
					
					<button 
						on:click={() => removeNotification(notification.id)}
						class="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-lg leading-none transition-colors"
						aria-label="Закрыть уведомление"
					>
						×
					</button>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	@keyframes slide-in {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
	
	.animate-slide-in {
		animation: slide-in 0.3s ease-out;
	}
</style> 