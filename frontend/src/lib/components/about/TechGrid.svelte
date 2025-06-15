<script lang="ts">
  export let techCategories: Array<{
    name: string;
    technologies: string[];
  }>;
</script>

<div class="tech-grid">
  {#each techCategories as category}
    <div class="tech-category">
      <h3>{category.name}</h3>
      <ul>
        {#each category.technologies as tech}
          <li>{tech}</li>
        {/each}
      </ul>
    </div>
  {/each}
</div>

<style>
  .tech-grid {
    @apply grid grid-cols-1 sm:grid-cols-3 gap-6;
  }

  .tech-category h3 {
    @apply text-lg font-semibold mb-3;
    color: var(--accent-primary);
  }

  .tech-category ul {
    @apply list-none p-0 space-y-2;
  }

  .tech-category li {
    @apply py-1 px-3 rounded-lg text-sm transition-colors;
    color: var(--text-secondary);
    background: var(--card-bg-secondary);
    border: 1px solid var(--card-border);
  }

  .tech-category li:hover {
    border-color: var(--accent-primary);
  }

  /* Мобильная адаптация */
  @media (max-width: 640px) {
    .tech-grid {
      @apply grid-cols-1 gap-4;
    }
  }
</style> 