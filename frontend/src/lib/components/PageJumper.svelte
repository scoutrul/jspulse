<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let maxPage: number = 1;
  export let loading: boolean = false;
  export let compact: boolean = false;

  const dispatch = createEventDispatcher<{
    jump: number;
  }>();

  let inputValue: string = '';
  let showInput: boolean = false;
  let inputElement: HTMLInputElement;

  function toggleInput() {
    if (loading) return;
    
    showInput = !showInput;
    inputValue = '';
    
    // Focus на input при открытии
    if (showInput) {
      setTimeout(() => {
        inputElement?.focus();
      }, 0);
    }
  }

  function handleSubmit() {
    const pageNumber = parseInt(inputValue.trim());
    
    // Валидация номера страницы (приводим к 0-based indexing)
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > maxPage) {
      inputValue = '';
      return;
    }
    
    // Отправляем 0-based page number
    dispatch('jump', pageNumber - 1);
    
    // Закрываем input
    showInput = false;
    inputValue = '';
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      showInput = false;
      inputValue = '';
    }
  }

  function handleBlur() {
    // Небольшая задержка, чтобы клик по кнопке "Go" успел обработаться
    setTimeout(() => {
      if (showInput && !inputValue.trim()) {
        showInput = false;
      }
    }, 150);
  }

  // Закрываем input если maxPage изменился и текущее значение некорректно
  $: {
    if (showInput && inputValue) {
      const pageNumber = parseInt(inputValue.trim());
      if (!isNaN(pageNumber) && pageNumber > maxPage) {
        inputValue = '';
      }
    }
  }
</script>

<div class="page-jumper" class:compact>
  {#if !showInput}
    <button 
      class="jump-button"
      class:compact
      disabled={loading || maxPage <= 1}
      on:click={toggleInput}
      aria-label="Перейти к странице"
      title="Перейти к странице"
    >
      {#if compact}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
        </svg>
      {:else}
        или перейти к:
      {/if}
    </button>
  {:else}
    <div class="jump-input-container" class:compact>
      <label for="page-jump-input" class="sr-only">
        Номер страницы для перехода
      </label>
      <input
        id="page-jump-input"
        bind:this={inputElement}
        bind:value={inputValue}
        type="number"
        min="1"
        max={maxPage}
        placeholder={compact ? "№" : "Страница"}
        disabled={loading}
        on:keydown={handleKeyDown}
        on:blur={handleBlur}
        aria-label="Введите номер страницы от 1 до {maxPage}"
      />
      <button 
        class="go-button"
        class:compact
        disabled={loading || !inputValue.trim()}
        on:click={handleSubmit}
        aria-label="Перейти"
        title="Перейти на указанную страницу"
      >
        {compact ? '→' : 'Go!'}
      </button>
      <button 
        class="cancel-button"
        class:compact
        disabled={loading}
        on:click={toggleInput}
        aria-label="Отмена"
        title="Отменить переход"
      >
        ✕
      </button>
    </div>
  {/if}

  {#if maxPage > 1 && !compact}
    <span class="page-limit" aria-live="polite">
      (1-{maxPage})
    </span>
  {/if}
</div>

<style>
  .page-jumper {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
  }

  .page-jumper.compact {
    font-size: 13px;
  }

  .jump-button {
    padding: 6px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    background: #fff;
    color: #6c757d;
    font-size: inherit;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .jump-button.compact {
    padding: 8px;
    min-width: 32px;
    justify-content: center;
  }

  .jump-button:hover:not(:disabled) {
    border-color: #007bff;
    color: #007bff;
    background: #f8f9ff;
  }

  .jump-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f8f9fa;
  }

  .jump-input-container {
    display: flex;
    align-items: center;
    gap: 4px;
    animation: fadeIn 0.2s ease;
  }

  .jump-input-container.compact {
    gap: 2px;
  }

  input {
    width: 80px;
    padding: 6px 8px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: inherit;
    text-align: center;
    transition: border-color 0.15s ease;
  }

  .compact input {
    width: 50px;
    padding: 4px 6px;
  }

  input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  input:disabled {
    opacity: 0.6;
    background: #f8f9fa;
  }

  /* Скрываем стрелки в number input для лучшего вида */
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .go-button, .cancel-button {
    padding: 6px 10px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    background: #fff;
    color: #495057;
    font-size: inherit;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
  }

  .compact .go-button,
  .compact .cancel-button {
    padding: 4px 8px;
    min-width: 28px;
  }

  .go-button {
    background: #007bff;
    border-color: #007bff;
    color: #fff;
    font-weight: 500;
  }

  .go-button:hover:not(:disabled) {
    background: #0056b3;
    border-color: #0056b3;
  }

  .go-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .cancel-button:hover:not(:disabled) {
    border-color: #dc3545;
    color: #dc3545;
    background: #fff5f5;
  }

  .cancel-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .page-limit {
    font-size: 12px;
    color: #6c757d;
    margin-left: 4px;
  }

  /* Screen reader only */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .jump-button,
    .go-button,
    .cancel-button,
    input {
      transition: none;
    }
    
    .jump-input-container {
      animation: none;
    }
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .page-jumper {
      font-size: 13px;
    }
    
    input {
      width: 60px;
    }
    
    .go-button, .cancel-button {
      padding: 6px 8px;
      min-width: 32px;
    }
  }
</style> 