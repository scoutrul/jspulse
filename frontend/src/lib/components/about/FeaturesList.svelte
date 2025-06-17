<script lang="ts">
  export let features: Array<{ title: string; description: string }>;
</script>

<ul class="features-list">
  {#each features as feature}
    <li>
      <strong>{feature.title}</strong> — {feature.description}
    </li>
  {/each}
</ul>

<style>
  .features-list {
    @apply space-y-3 list-none p-0;
  }

  .features-list li {
    @apply flex items-start gap-3;
    @apply relative pl-6;
    color: var(--text-secondary);
  }

  .features-list li::before {
    content: "✓";
    @apply absolute left-0 top-0;
    @apply font-bold text-lg;
    color: var(--accent-primary);
  }

  .features-list strong {
    color: var(--accent-primary);
  }
</style> 