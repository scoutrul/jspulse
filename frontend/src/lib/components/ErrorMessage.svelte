<script lang="ts">
  export let message: string | null = null;
</script>

{#if message}
  <div class="error-container">
    <p class="error-message">⚠️ {message}</p>
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
  }
</style>
