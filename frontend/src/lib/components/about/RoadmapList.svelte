<script lang="ts">
  export let roadmapItems: string[];
</script>

<ul class="roadmap-list">
  {#each roadmapItems as item}
    <li>{item}</li>
  {/each}
</ul>

<style>
  .roadmap-list {
    @apply space-y-3 list-none p-0;
  }

  .roadmap-list li {
    @apply flex items-start gap-3 py-2 pl-4 rounded-r-lg;
    border-left: 4px solid var(--accent-primary);
    color: var(--text-secondary);
  }

  /* Светлая тема */
  :root:not(.dark) .roadmap-list li {
    background: rgba(245, 158, 11, 0.1);
  }

  /* Темная тема */
  :root.dark .roadmap-list li,
  .dark .roadmap-list li {
    background: rgba(139, 92, 246, 0.1);
  }
</style> 