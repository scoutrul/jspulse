<!-- frontend/src/routes/+error.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
</script>

<div class="error-page-container">
  <h1>Ошибка {$page.status}</h1>
  <p>{$page.error?.message || "Произошла непредвиденная ошибка"}</p>

  {#if $page.error?.stack && import.meta.env.DEV}
    <h2>Stack Trace (Development Mode):</h2>
    <pre>{$page.error.stack}</pre>
  {/if}

  <a href="/">Вернуться на главную</a>
</div>

<style>
  .error-page-container {
    max-width: 800px;
    margin: 4rem auto;
    padding: 2rem;
    text-align: center;
    border: 1px solid #e74c3c;
    background-color: #fbeae5;
    border-radius: 8px;
  }
  h1 {
    color: #e74c3c;
    margin-bottom: 1rem;
  }
  pre {
    text-align: left;
    white-space: pre-wrap;
    word-wrap: break-word;
    background-color: #fdf6f3;
    padding: 1rem;
    border-radius: 4px;
    border: 1px dashed #f5c6b8;
    max-height: 300px;
    overflow-y: auto;
    margin-top: 1rem;
    font-size: 0.85em;
  }
  a {
    display: inline-block;
    margin-top: 1.5rem;
    color: #007bff;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
</style>
