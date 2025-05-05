<script lang="ts">
  import { ArrowPathRoundedSquare } from 'svelte-heros-v2';
  export let text: string = "Загрузка...";
</script>

<div class="loading">
  <ArrowPathRoundedSquare size="24" class="spinner" />
  <p>{text}</p>
</div>

<style>
  .loading {
    text-align: center;
    padding: 2rem;
    color: #555;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .loading p {
    margin: 0;
    font-style: italic;
    font-weight: bold;
  }
  
  :global(.spinner) {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
