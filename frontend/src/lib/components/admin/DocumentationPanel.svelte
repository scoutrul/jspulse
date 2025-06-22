<script lang="ts">
	import { onMount } from 'svelte';
	import Heading from '../ui/Heading.svelte';

	export let files: Array<{
		path: string;
		name: string;
		size: number;
		modifiedAt: string;
		isDirectory: boolean;
		relativePath: string;
	}> = [];

	let searchTerm = '';
	let selectedFile: string | null = null;
	let fileContent = '';
	let loadingContent = false;

	// Фильтрация файлов по поисковому запросу
	$: filteredFiles = files.filter(file => 
		file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		file.relativePath.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Группировка файлов по директориям
	$: groupedFiles = filteredFiles.reduce((acc, file) => {
		const dir = file.isDirectory ? 'Директории' : getFileCategory(file.name);
		if (!acc[dir]) acc[dir] = [];
		acc[dir].push(file);
		return acc;
	}, {} as Record<string, typeof files>);

	function getFileCategory(filename: string): string {
		if (filename.endsWith('.md')) return 'Документация';
		if (filename.endsWith('.ts') || filename.endsWith('.js')) return 'Код';
		if (filename.endsWith('.json')) return 'Конфигурация';
		return 'Другие';
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes}B`;
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
		return `${Math.round(bytes / 1024 / 1024)}MB`;
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('ru', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getFileIcon(file: { name: string; isDirectory: boolean }): string {
		if (file.isDirectory) return '📁';
		if (file.name.endsWith('.md')) return '📄';
		if (file.name.endsWith('.ts')) return '🔷';
		if (file.name.endsWith('.js')) return '📜';
		if (file.name.endsWith('.json')) return '⚙️';
		return '📄';
	}

	async function loadFileContent(filePath: string) {
		if (loadingContent) return;
		
		loadingContent = true;
		selectedFile = filePath;
		
		try {
			const response = await fetch(`http://localhost:3001/api/admin/docs/${encodeURIComponent(filePath)}`);
			const result = await response.json();
			
			if (result.success) {
				fileContent = result.data.content;
			} else {
				fileContent = `Ошибка загрузки файла: ${result.error?.message || 'Неизвестная ошибка'}`;
			}
		} catch (error) {
			console.error('Error loading file content:', error);
			fileContent = 'Не удалось загрузить содержимое файла';
		} finally {
			loadingContent = false;
		}
	}

	function closeFileView() {
		selectedFile = null;
		fileContent = '';
	}
</script>

<div class="admin-card overflow-hidden">
	{#if !selectedFile}
		<!-- Обзор файлов -->
		<div class="p-6">
			<Heading level={3} size="lg" weight="semibold" variant="primary" icon="📚" class="mb-4">
				Memory Bank
			</Heading>
			
			<!-- Поиск -->
			<div class="mb-4">
				<input
					type="text"
					placeholder="Поиск файлов..."
					bind:value={searchTerm}
					class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-primary placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			
			<!-- Список файлов -->
			<div class="space-y-4 max-h-96 overflow-y-auto">
				{#if Object.keys(groupedFiles).length === 0}
					<div class="text-center py-8 text-slate-500 dark:text-slate-400">
						<div class="text-4xl mb-2">📄</div>
						<p>Файлы не найдены</p>
					</div>
				{:else}
					{#each Object.entries(groupedFiles) as [category, categoryFiles]}
						<div>
							<Heading level={4} size="sm" weight="medium" variant="secondary" class="mb-2 uppercase tracking-wide">
								{category}
							</Heading>
							<div class="space-y-1">
								{#each categoryFiles as file}
									<button
										on:click={() => !file.isDirectory && loadFileContent(file.relativePath)}
										disabled={file.isDirectory}
										class="w-full p-3 text-left rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<div class="flex items-center justify-between">
											<div class="flex items-center space-x-2">
												<span class="text-lg">{getFileIcon(file)}</span>
												<div>
													<div class="font-medium text-primary text-sm">
														{file.name}
													</div>
													<div class="text-xs text-slate-500 dark:text-slate-400">
														{file.relativePath}
													</div>
												</div>
											</div>
											<div class="text-xs text-slate-400 dark:text-slate-500 text-right">
												<div>{formatFileSize(file.size)}</div>
												<div>{formatDate(file.modifiedAt)}</div>
											</div>
										</div>
									</button>
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{:else}
		<!-- Просмотр файла -->
		<div class="flex flex-col h-96">
			<!-- Заголовок с кнопкой закрытия -->
			<div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
				<Heading level={4} size="base" weight="medium" variant="primary" icon="📄" class="truncate mr-2">
					{selectedFile}
				</Heading>
				<button
					on:click={closeFileView}
					class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
				>
					<span class="text-xl">❌</span>
				</button>
			</div>
			
			<!-- Содержимое файла -->
			<div class="flex-1 p-4 overflow-y-auto">
				{#if loadingContent}
					<div class="flex items-center justify-center h-full">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
					</div>
				{:else}
					<pre class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{fileContent}</pre>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.admin-card {
		@apply rounded-xl shadow-lg border transition-all duration-300;
		
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