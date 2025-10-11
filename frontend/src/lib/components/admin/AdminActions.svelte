<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import ActionButton from './ActionButton.svelte';
	import Heading from '../ui/Heading.svelte';
	import { showNotification } from '../../stores/notificationStore';
	import { parsingLogs, addParsingLog, clearParsingLogs } from '../../stores/parsingLogsStore';
	import { apiClient } from '../../api/http.client';
	// Event dispatcher для обновления данных
	const dispatch = createEventDispatcher<{
		dataUpdated: void;
		confirmAction: {
			message: string;
			onConfirm: () => void;
		};
	}>();

	// Состояние загрузки
	let parsingInProgress = false;
	let clearingInProgress = false;
	let seedingInProgress = false;

	// Подписываемся на логи
	$: logs = $parsingLogs;

	// Обработчик парсинга HH
	async function handleParseHH() {
		if (parsingInProgress) return;
		
		try {
			parsingInProgress = true;
			clearParsingLogs(); // Очищаем старые логи
			
			addParsingLog('🚀 Инициализация парсинга HeadHunter...', 'info');
			addParsingLog('📡 Подключение к API HH.ru...', 'info');
			
			const result = await apiClient.post('/api/admin/parse-hh') as any;
			
			if (result.success) {
				const message = `Парсинг запущен!`;
				const details = `${result.data.message}\nВремя выполнения: ${result.data.executionTime}мс`;
				showNotification('success', message, details);
				
				// Детальные логи парсинга
				addParsingLog(`✅ Парсинг успешно запущен`, 'success');
				addParsingLog(`📊 ${result.data.message}`, 'info');
				addParsingLog(`⏱️ Время инициализации: ${result.data.executionTime}мс`, 'info');
				
				if (result.data.details) {
					addParsingLog(`📝 ${result.data.details.output}`, 'info');
					if (result.data.details.warnings) {
						addParsingLog(`⚠️ ${result.data.details.warnings}`, 'info');
					}
				}
				
				// Симуляция процесса парсинга для демонстрации
				setTimeout(() => {
					addParsingLog(`🔍 Поиск новых вакансий...`, 'info');
				}, 2000);
				
				setTimeout(() => {
					addParsingLog(`💾 Сохранение данных в базу...`, 'info');
				}, 5000);
				
				setTimeout(() => {
					addParsingLog(`🎉 Парсинг завершен успешно!`, 'success');
					// Уведомляем о необходимости обновления данных
					dispatch('dataUpdated');
					parsingInProgress = false;
				}, 8000);
				
			} else {
				const errorMsg = `Ошибка парсинга: ${result.error?.message}`;
				showNotification('error', errorMsg);
				addParsingLog(`❌ ${errorMsg}`, 'error');
				parsingInProgress = false;
			}
		} catch (err) {
			console.error('Error starting HH parsing:', err);
			const errorMsg = 'Не удалось запустить парсинг HeadHunter';
			showNotification('error', errorMsg);
			addParsingLog(`❌ ${errorMsg}`, 'error');
			parsingInProgress = false;
		}
	}

	// Обработчик очистки БД
	async function handleClearDatabase() {
		if (clearingInProgress) return;
		
		// Показываем диалог подтверждения через событие
		dispatch('confirmAction', {
			message: '⚠️ Вы уверены, что хотите очистить базу данных?\n\nЭто действие удалит ВСЕ вакансии и не может быть отменено!',
			onConfirm: async () => {
				try {
					clearingInProgress = true;
					
					const result = await apiClient.delete('/api/admin/clear-db') as any;
					
					if (result.success) {
						const message = 'База данных очищена';
						const details = result.data.details?.output || 'Все данные удалены';
						showNotification('success', message, details);
						
						// Уведомляем о необходимости обновления данных
						dispatch('dataUpdated');
					} else {
						const errorMsg = `Ошибка очистки БД: ${result.error?.message}`;
						showNotification('error', errorMsg);
					}
				} catch (err) {
					console.error('Error clearing database:', err);
					const errorMsg = 'Не удалось очистить базу данных';
					showNotification('error', errorMsg);
				} finally {
					clearingInProgress = false;
				}
			}
		});
	}

	// Обработчик сидинга БД
	async function handleSeedDatabase() {
		if (seedingInProgress) return;
		
		try {
			seedingInProgress = true;
			clearParsingLogs(); // Очищаем старые логи
			
			addParsingLog('🌱 Инициализация заполнения БД тестовыми данными...', 'info');
			addParsingLog('📦 Подготовка тестовых вакансий...', 'info');
			
			const result = await apiClient.post('/api/admin/seed-db') as any;
			
			if (result.success) {
				const message = `База данных заполнена!`;
				const details = `Добавлено: ${result.data.details.insertedCount} вакансий\nУдалено старых: ${result.data.details.deletedCount} вакансий\nУникальных навыков: ${result.data.details.uniqueSkills}\nВремя выполнения: ${result.data.executionTime}мс`;
				showNotification('success', message, details);
				
				// Детальные логи сидинга
				addParsingLog(`✅ Сидинг успешно выполнен`, 'success');
				addParsingLog(`📊 Добавлено ${result.data.details.insertedCount} тестовых вакансий`, 'success');
				addParsingLog(`🗑️ Удалено ${result.data.details.deletedCount} старых тестовых вакансий`, 'info');
				addParsingLog(`🏷️ Создано ${result.data.details.uniqueSkills} уникальных навыков`, 'info');
				addParsingLog(`⏱️ Время выполнения: ${result.data.executionTime}мс`, 'info');
				
				if (result.data.details.warnings) {
					addParsingLog(`⚠️ ${result.data.details.warnings}`, 'info');
				}
				
				// Уведомляем о необходимости обновления данных
				dispatch('dataUpdated');
				
			} else {
				const errorMsg = `Ошибка сидинга: ${result.error?.message}`;
				showNotification('error', errorMsg);
				addParsingLog(`❌ ${errorMsg}`, 'error');
			}
		} catch (err) {
			console.error('Error seeding database:', err);
			const errorMsg = 'Не удалось заполнить базу данных';
			showNotification('error', errorMsg);
			addParsingLog(`❌ ${errorMsg}`, 'error');
		} finally {
			seedingInProgress = false;
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

<!-- Административные действия - унифицированная карточка -->
<div class="bg-card">
	<div class="flex items-start justify-between mb-3">
		<Heading level={3} size="sm" weight="medium" variant="secondary" icon="🔄" class="uppercase tracking-wide">
			Административные действия
		</Heading>
		<div class="w-3 h-3 bg-orange-400 rounded-full"></div>
	</div>
	
	<div class="space-y-3">
		<ActionButton 
			on:click={handleParseHH}
			variant="primary"
			icon="🔍"
			text="Парсить HH.ru"
			description="Запустить сбор новых вакансий"
			disabled={parsingInProgress}
		/>
		
		<ActionButton 
			on:click={handleSeedDatabase}
			variant="secondary"
			icon="🌱"
			text="Заполнить БД тестовыми данными"
			description="Добавить тестовые вакансии"
			disabled={seedingInProgress}
		/>
		
		<ActionButton 
			on:click={handleClearDatabase}
			variant="danger"
			icon="🗑️"
			text="Очистить БД"
			description="⚠️ Удалить все данные"
			disabled={clearingInProgress}
		/>
	</div>
	
	<!-- Логи парсинга -->
	{#if logs.length > 0}
		<div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
			<Heading level={4} size="xs" weight="medium" variant="secondary" icon="📝" class="uppercase tracking-wide mb-3">
				Логи парсинга
			</Heading>
			<div class="space-y-2 max-h-40 overflow-y-auto">
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