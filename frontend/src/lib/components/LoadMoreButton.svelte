<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let loading: boolean = false;
  export let disabled: boolean = false;
  export let limit: number = 10;

  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch("click");
  }
</script>

<div class="load-more">
  <button on:click={handleClick} disabled={disabled || loading}>
    {#if loading}
      Загрузка...
    {:else}
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
  }

  button:hover:not(:disabled) {
    background-color: #0056b3;
  }

  button:disabled {
    background-color: #aaa;
    cursor: not-allowed;
  }
</style>
