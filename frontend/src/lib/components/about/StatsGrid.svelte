<script lang="ts">
  export let stats: Array<{
    number: string;
    label: string;
  }>;
</script>

<div class="stats-grid">
  {#each stats as stat}
    <div class="stat-item">
      <div class="stat-number">{stat.number}</div>
      <div class="stat-label">{stat.label}</div>
    </div>
  {/each}
</div>

<style>
  .stats-grid {
    @apply grid grid-cols-2 sm:grid-cols-4 gap-6;
  }

  .stat-item {
    @apply text-center;
  }

  .stat-number {
    @apply text-3xl sm:text-4xl font-bold mb-2;
    color: var(--accent-primary);
  }

  .stat-label {
    @apply text-sm font-medium;
    color: var(--text-secondary);
  }

  /* Мобильная адаптация */
  @media (max-width: 640px) {
    .stats-grid {
      @apply grid-cols-2 gap-4;
    }
  }
</style> 