<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { ArrowDown, ArrowPathRoundedSquare } from 'svelte-heros-v2';
  import GradientButton from '$lib/components/ui/GradientButton.svelte';

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
  <GradientButton 
    on:click={handleClick}
    disabled={disabled || loading}
    variant="primary"
    size="lg"
  >
    {#if loading}
      <ArrowPathRoundedSquare size="18" class="spinner" />
      Загрузка...
    {:else}
      <ArrowDown size="18" />
      Показать еще {limit}
    {/if}
  </GradientButton>
</div>

<style>
  .load-more {
    @apply text-center mt-8;
  }
  
  :global(.spinner) {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
