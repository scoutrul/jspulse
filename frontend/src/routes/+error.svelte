<!-- frontend/src/routes/+error.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  
  // Расширенный тип Error с гарантией наличия stack
  interface ExtendedError extends Error {
    stack: string;
  }
</script>

<div class="error-page-container">
  <h1>Ошибка {$page.status}</h1>
  <p>{$page.error?.message || "Произошла непредвиденная ошибка"}</p>

  {#if ($page.error as ExtendedError)?.stack && import.meta.env.DEV}
    <h2>Stack Trace (Development Mode):</h2>
    <pre>{($page.error as ExtendedError).stack}</pre>
  {/if}

  <a href="/">Вернуться на главную</a>
</div>

<style>
  .error-page-container {
    @apply max-w-3xl mx-auto my-16 p-8 text-center border border-danger-300 bg-danger-50 rounded-lg;
  }
  h1 {
    @apply text-danger-600 mb-4 text-2xl font-bold;
  }
  h2 {
    @apply text-danger-700 mt-6 mb-4 text-lg font-semibold;
  }
  p {
    @apply text-danger-800 mb-4;
  }
  pre {
    @apply text-left whitespace-pre-wrap break-words bg-danger-100 p-4 rounded border border-danger-200 max-h-80 overflow-y-auto mt-4 text-sm font-mono text-danger-900;
  }
  a {
    @apply inline-block mt-6 px-6 py-3 bg-primary-500 text-white rounded-lg no-underline transition-colors duration-200 hover:bg-primary-600 focus:outline-2 focus:outline-primary-500 focus:outline-offset-2;
  }
</style>
