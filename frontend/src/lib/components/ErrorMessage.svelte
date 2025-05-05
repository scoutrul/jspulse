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
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
    color: #856404;
    padding: 1rem;
    border-radius: 5px;
    margin-bottom: 1.5rem;
  }

  .error-message {
    margin: 0;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
