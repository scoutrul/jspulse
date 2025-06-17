<script lang="ts">
  export let version: string = "Beta 1.0";
  export let lastUpdate: string = "Январь 2025";
</script>

<div class="contact-info">
  <p>
    <strong>Версия:</strong> {version}<br>
    <strong>Последнее обновление:</strong> {lastUpdate}
  </p>
</div>

<style>
  .contact-info {
    @apply mt-4 p-4 rounded-lg;
    background: var(--card-bg-secondary);
    border: 1px solid var(--accent-primary);
  }

  .contact-info p {
    @apply m-0;
    color: var(--text-secondary);
  }

  .contact-info strong {
    color: var(--accent-primary);
  }
</style> 