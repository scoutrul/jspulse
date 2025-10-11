<script lang="ts">
	import { createEventDispatcher, onDestroy, afterUpdate } from 'svelte';
	import ActionButton from './ActionButton.svelte';
	import Heading from '../ui/Heading.svelte';
	import { showNotification } from '../../stores/notificationStore';
	import { parsingLogs, addParsingLog, clearParsingLogs, setParsingLogs } from '../../stores/parsingLogsStore';
	import { apiClient } from '../../api/http.client';
	const dispatch = createEventDispatcher<{
		dataUpdated: void;
		confirmAction: {
			message: string;
			onConfirm: () => void;
		};
	}>();

	// Состояние загрузки для каждого парсера
	let parsingStates: Record<string, boolean> = {};
	let pollingTimer: ReturnType<typeof setInterval> | null = null;
	let currentSource: string | null = null;
	let logContainer: HTMLDivElement | null = null;
	let autoScroll = true;
	let completionNotified = false;

	// Подписываемся на логи
	$: logs = $parsingLogs;

	// Автоскролл вниз при появлении новых логов (только если включен или пользователь у низа)
	afterUpdate(() => {
		if (!logContainer) return;
		if (!autoScroll) return;
		logContainer.scrollTop = logContainer.scrollHeight;
	});

	function handleLogsScroll() {
		if (!logContainer) return;
		const distanceToBottom = logContainer.scrollHeight - logContainer.scrollTop - logContainer.clientHeight;
		// Если пользователь близко к низу, держим автоскролл включенным; если ушел вверх — отключаем
		autoScroll = distanceToBottom < 8;
	}

	function scrollToBottom() {
		if (!logContainer) return;
		autoScroll = true;
		logContainer.scrollTop = logContainer.scrollHeight;
	}

	// Определяем парсеры на основе jobs из cron-runner.js
	const parsers = [
		{ id: 'careered-api', name: 'Careered API Parser', icon: '🚀', variant: 'primary' as const, description: 'Парсинг вакансий с Careered.io' },
		{ id: 'habr', name: 'Habr Parser', icon: '💼', variant: 'secondary' as const, description: 'Парсинг вакансий с Habr Career' },
		{ id: 'hh', name: 'HeadHunter Parser', icon: '🔍', variant: 'primary' as const, description: 'Парсинг вакансий с HeadHunter' },
		{ id: 'telegram-parse', name: 'Telegram Channel Parser', icon: '📱', variant: 'secondary' as const, description: 'Парсинг каналов Telegram' },
		{ id: 'telegram-enrich', name: 'Telegram Enrich/Incremental', icon: '📈', variant: 'secondary' as const, description: 'Обогащение данных Telegram' }
	];

	function startPolling(source: string) {
		stopPolling();
		currentSource = source;
		completionNotified = false;
		pollingTimer = setInterval(async () => {
			try {
				const json = await apiClient.get(`/api/admin/parsing-logs?source=${encodeURIComponent(source)}`) as any;
				if (json.success && Array.isArray(json.data)) {
					setParsingLogs(json.data);
					// Остановка при завершении парсера
					const last = json.data[json.data.length - 1];
					if (last && typeof last.message === 'string') {
						const msg: string = last.message;
						if (msg.includes('parser finished successfully') || msg.includes('parser exited with code')) {
							stopPolling();
							currentSource = null;
							if (!completionNotified) {
								completionNotified = true;
								dispatch('dataUpdated');
							}
						}
					}
				}
			} catch (e) {
				// ignore polling errors
			}
		}, 2000);
	}

	function stopPolling() {
		if (pollingTimer) {
			clearInterval(pollingTimer);
			pollingTimer = null;
		}
		// Сбрасываем состояние парсинга для всех парсеров
		Object.keys(parsingStates).forEach(key => {
			parsingStates[key] = false;
		});
	}

	onDestroy(() => {
		stopPolling();
	});

	// Обработчик парсинга для конкретного источника
	async function handleParse(parser: typeof parsers[0]) {
		if (parsingStates[parser.id]) return;
		
		try {
			parsingStates[parser.id] = true;
			clearParsingLogs();
			addParsingLog(`🚀 Инициализация парсинга ${parser.name}...`, 'info');
			addParsingLog(`📡 Подключение к ${parser.description}...`, 'info');

			// Unified endpoint
			const result = await apiClient.post(`/api/admin/parse/${parser.id}`) as any;
			
			if (result.success) {
				showNotification('success', `Парсинг ${parser.name} запущен!`, `Источник: ${parser.description}`);
				autoScroll = true;
				startPolling(parser.id);
			} else {
				const errorMsg = `Ошибка парсинга ${parser.name}: ${result.error?.message}`;
				showNotification('error', errorMsg);
				addParsingLog(`❌ ${errorMsg}`, 'error');
				parsingStates[parser.id] = false;
			}
		} catch (err) {
			const errorMsg = `Не удалось запустить парсинг ${parser.name}`;
			showNotification('error', errorMsg);
			addParsingLog(`❌ ${errorMsg}`, 'error');
			parsingStates[parser.id] = false;
		} finally {
			// Состояние будет сброшено при завершении парсинга через stopPolling
		}
	}

	// Функция для получения CSS классов лога
	function getLogClasses(type: string): string {
		switch (type) {
			case 'success': 
				return 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300';
			case 'error': 
				return 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300';
			case 'info': 
			default:
				return 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
		}
	}
</script>

<!-- Парсинг действий - унифицированная карточка -->
<div class="bg-card">
	<div class="flex items-start justify-between mb-3">
		<Heading level={3} size="sm" weight="medium" variant="secondary" icon="🔄" class="uppercase tracking-wide">
			Парсинг источников
		</Heading>
		<div class="w-3 h-3 bg-green-400 rounded-full"></div>
	</div>
	
	<div class="space-y-3">
		{#each parsers as parser (parser.id)}
			<ActionButton 
				on:click={() => handleParse(parser)}
				variant={parser.variant}
				icon={parser.icon}
				text={parser.name}
				description={`${parser.description}`}
				disabled={parsingStates[parser.id]}
			/>
		{/each}
	</div>
	
	<!-- Логи парсинга -->
	{#if logs.length > 0}
		<div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
			<div class="flex items-center justify-between mb-2">
				<Heading level={4} size="xs" weight="medium" variant="secondary" icon="📝" class="uppercase tracking-wide">
					Логи парсинга
				</Heading>
				<div class="flex items-center gap-2 text-xs">
					<button class="px-2 py-1 rounded border" on:click={() => (autoScroll = !autoScroll)}>
						Автоскролл: {autoScroll ? 'Вкл' : 'Выкл'}
					</button>
				</div>
			</div>
			<div class="space-y-2 overflow-y-auto" bind:this={logContainer} on:scroll={handleLogsScroll}>
				{#each logs as log (log.id)}
					<div class="text-xs p-2 rounded font-mono {getLogClasses(log.type)}">
						<span class="text-muted">{log.timestamp}</span>
						<span class="ml-2">{log.message}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Унифицированные стили карточек */
	.bg-card {
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
	:global(.dark) .bg-card {
		background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
		@apply bg-slate-800 border-slate-700;
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.2), 
			0 1px 2px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	/* Анимация при наведении */
	.bg-card:hover {
		transform: translateY(-2px);
	}
</style>
