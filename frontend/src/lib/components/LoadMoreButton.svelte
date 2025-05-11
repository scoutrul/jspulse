<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { ArrowDown, ArrowPathRoundedSquare } from 'svelte-heros-v2';

  export let loading: boolean = false;
  export let disabled: boolean = false;
  export let limit: number = 10;

  const dispatch = createEventDispatcher<{
    click: void;
  }>();

  function handleClick() {
    dispatch("click");
  }
</script>

<div class="load-more">
  <button on:click={handleClick} disabled={disabled || loading}>
    {#if loading}
      <ArrowPathRoundedSquare size="18" class="spinner" />
      Загрузка...
    {:else}
      <ArrowDown size="18" />
      Показать еще {limit}
    {/if}
  </button>
</div>

<style>
  .load-more {
    text-align: center;
    margin-top: 2rem;
  }

  button {
    padding: 0.8rem 2rem;
    font-size: 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  button:hover:not(:disabled) {
    background-color: #0056b3;
  }

  button:disabled {
    background-color: #aaa;
    cursor: not-allowed;
  }
  
  :global(.spinner) {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
