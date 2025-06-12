<script lang="ts">
  import { ExclamationTriangle } from 'svelte-heros-v2';
  export let message: string | null = null;
</script>

{#if message}
  <div class="error-container">
    <p class="error-message">
      <ExclamationTriangle size="20" />
      {message}
    </p>
  </div>
{/if}

<style>
  .error-container {
    @apply bg-warning-100 border border-warning-300 text-warning-800 p-4 rounded-lg mb-6;
  }

  .error-message {
    @apply m-0 font-semibold flex items-center gap-2;
  }
</style>
