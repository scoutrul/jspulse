<script lang="ts">
	import Heading from '../ui/Heading.svelte';
	import { apiClient } from '../../api/http.client';

	let starting = false;
	let stopping = false;
	let statusLoading = true;
	let running: boolean = false;
	let pid: number | null = null;
	let startedAt: number | null = null;
	let statusTimer: ReturnType<typeof setInterval> | null = null;

	async function fetchStatus() {
		try {
			statusLoading = true;
			const json = await apiClient.get('/api/admin/cron/status') as { success: boolean; data: { running: boolean; pid: number | null; startedAt: number | null } };
			if (json.success) {
				running = json.data.running;
				pid = json.data.pid;
				startedAt = json.data.startedAt;
			}
		} catch (e) {
			// ignore
		} finally {
			statusLoading = false;
			// Если не запущен — останавливаем частый опрос
			if (!running && statusTimer) {
				clearInterval(statusTimer);
				statusTimer = null;
			}
		}
	}

	async function startCron() {
		if (starting) return;
		starting = true;
		try {
			await apiClient.post('/api/admin/cron/start');
			await fetchStatus();
			// Если запущен — включаем периодический опрос
			if (running && !statusTimer) {
				statusTimer = setInterval(fetchStatus, 5000);
			}
		} finally {
			starting = false;
		}
	}

	async function stopCron() {
		if (stopping) return;
		stopping = true;
		try {
			await apiClient.post('/api/admin/cron/stop');
			await fetchStatus();
		} finally {
			stopping = false;
		}
	}

	function formatSince(ts: number | null): string {
		if (!ts) return '—';
		const diff = Date.now() - ts;
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'менее минуты';
		if (mins < 60) return `${mins} мин`;
		const hours = Math.floor(mins / 60);
		return `${hours} ч ${mins % 60} мин`;
	}

	// Первичный одноразовый чек статуса без постоянного опроса
	fetchStatus();
</script>

<div class="bg-card">
	<div class="flex items-start justify-between mb-3">
		<Heading level={3} size="sm" weight="medium" variant="secondary" icon="⏱️" class="uppercase tracking-wide">
			Крон-планировщик
		</Heading>
		<div class="w-3 h-3 rounded-full {running ? 'bg-green-400' : 'bg-slate-400'}"></div>
	</div>

	<div class="flex items-center gap-3 mb-3">
		<button class="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400" on:click={startCron} disabled={starting || running}>
			{starting ? 'Запускаю…' : 'Запустить'}
		</button>
		<button class="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400" on:click={stopCron} disabled={stopping || !running}>
			{stopping ? 'Останавливаю…' : 'Остановить'}
		</button>
	</div>

	<div class="text-xs text-secondary">
		<div>Статус: {statusLoading ? 'Загрузка…' : running ? 'Работает' : 'Остановлен'}</div>
		<div>PID: {pid ?? '—'}</div>
		<div>Работает: {formatSince(startedAt)}</div>
	</div>
</div>

<style>
	.bg-card {
		@apply rounded-xl p-6 shadow-lg border transition-all duration-300;
		@apply hover:shadow-xl;
		background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
		@apply bg-white border-neutral-200;
		box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
	}
	:global(.dark) .bg-card {
		background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
		@apply bg-slate-800 border-slate-700;
		box-shadow: 0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1);
	}
	.bg-card:hover { transform: translateY(-2px); }
</style>

