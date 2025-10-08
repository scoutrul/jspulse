<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import GradientButton from '../ui/GradientButton.svelte';
  import { createEventDispatcher } from 'svelte';
  import { vacancyService } from '$lib/services/vacancy.service';
  import { authStore } from '$lib/stores/authStore.js';
  
  const dispatch = createEventDispatcher();
  
  export let url: string | undefined = undefined;
  export let source: string | undefined = undefined;
  export let backUrl: string = '/';
  export let backLabel: string = 'Вернуться к списку';
  export let vacancyId: string | undefined = undefined;
  export let showDeleteButton: boolean = false; // Показывать ли кнопку удаления
  export let vacancyTitle: string = 'эту вакансию'; // Для текста подтверждения
  
  let isDeleting = false;
  
  function handleBackClick() {
    // Используем программную навигацию с опцией noScroll
    // Это позволит нашему кастомному scrollStore восстановить позицию
    goto(backUrl, { noScroll: true });
  }

  async function handleDelete() {
    if (isDeleting || !vacancyId) return;
    
    // Подтверждение удаления
    const confirmed = confirm(`Вы уверены что хотите удалить вакансию "${vacancyTitle}"?`);
    if (!confirmed) return;
    
    isDeleting = true;
    
    try {
      const result = await vacancyService.deleteVacancy(vacancyId);
      
      if (result.success) {
        // Отправляем событие об успешном удалении
        dispatch('deleted', { 
          vacancyId: vacancyId,
          title: vacancyTitle 
        });
        
        // Переходим к списку ТОЛЬКО с детальных страниц
        if ($page.url.pathname !== '/') {
          goto(backUrl);
        }
      } else {
        console.error('Failed to delete vacancy:', result.error);
        alert('Ошибка удаления: ' + (result.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Error deleting vacancy:', error);
      alert('Ошибка сети при удалении вакансии');
    } finally {
      isDeleting = false;
    }
  }
</script>

{#if $page.url.pathname !== '/'}
<div class="vacancy-actions">
  <div class="actions-container">
      <div class="secondary-action">
        <GradientButton variant="outline" size="lg" on:click={handleBackClick}>
          <span class="button-content">
            <span class="button-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="button-text">
              {backLabel}
            </span>
          </span>
        </GradientButton>
      </div>
      
      <!-- Кнопка удаления -->
      {#if showDeleteButton && vacancyId && $authStore.isAdmin}
        <div class="delete-action">
          <GradientButton variant="outline" size="lg" disabled={isDeleting} on:click={handleDelete}>
            <span class="button-content">
              <span class="button-icon" aria-hidden="true">
                {#if isDeleting}
                  ⏳
                {:else}
                  🗑️
                {/if}
              </span>
              <span class="button-text">
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </span>
            </span>
          </GradientButton>
        </div>
      {/if}
      
      {#if url}
        <div class="primary-action ml-auto">
          <GradientButton variant="primary" size="lg" href={url} target="_blank" rel="noopener noreferrer">
            <span class="button-content">
              <span class="button-text">
                Посмотреть на {source || 'сайте'}
              </span>
              <span class="button-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 17L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 7H17V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </span>
          </GradientButton>
        </div>
      {/if}
    </div>
  </div>
{:else if showDeleteButton && vacancyId && $authStore.isAdmin}
  <!-- Главная страница - показываем только кнопку удаления при hover -->
  <div class="vacancy-actions main-page-actions">
    <div class="actions-container">
      <div class="delete-action-hover">
        <GradientButton variant="outline" size="lg" disabled={isDeleting} on:click={handleDelete}>
          <span class="button-content">
            <span class="button-icon" aria-hidden="true">
              {#if isDeleting}
                ⏳
              {:else}
                🗑️
              {/if}
            </span>
            <span class="button-text">
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </span>
          </span>
        </GradientButton>
      </div>
    </div>
  </div>
{/if}

<style>
  .vacancy-actions {
    @apply mt-6 pt-4;
    @apply border-t border-neutral-200;
    @apply transition-colors duration-300;
  }

  /* Темная тема для actions */
  :global(.dark) .vacancy-actions {
    @apply border-slate-600;
  }
  
  .actions-container {
    @apply flex flex-col sm:flex-row gap-3;
    @apply items-stretch sm:items-center;
  }
  
  .primary-action {
    @apply flex-1 sm:flex-initial;
  }
  
  .secondary-action {
    @apply flex-1 sm:flex-initial;
  }
  
  /* legacy .action-link removed */
  
  .button-content {
    @apply flex items-center justify-center gap-2;
  }
  
  .button-text {
    @apply font-medium;
  }
  
  .button-icon {
    @apply flex items-center justify-center;
    @apply transition-transform duration-200;
  }
  
  /* Hover эффекты только для кликабельных элементов */
  :global(.primary-action .gradient-button:hover .button-icon) {
    @apply transform translate-x-1 -translate-y-1;
  }
  
  :global(.secondary-action .gradient-button:hover .button-icon) {
    @apply transform -translate-x-1;
  }
  
  /* Кнопка удаления на главной странице */
  .main-page-actions {
    @apply mt-6 pt-4 border-t border-neutral-200;
    @apply transition-colors duration-300;
  }
  
  /* Темная тема для main-page-actions */
  :global(.dark) .main-page-actions {
    @apply border-slate-600;
  }
  
  .delete-action-hover {
    @apply flex;
  }
  
  /* Кнопка удаления как GradientButton */
  :global(.delete-action .gradient-button) {
    @apply text-red-600;
  }
  :global(.dark .delete-action .gradient-button) {
    @apply text-red-400;
  }
  :global(.delete-action .gradient-button:hover) {
    @apply text-red-700;
  }
  :global(.dark .delete-action .gradient-button:hover) {
    @apply text-red-300;
  }
  :global(.delete-action .gradient-button:disabled) {
    @apply opacity-50 cursor-not-allowed;
  }


  /* Responsive design */
  @media (max-width: 640px) {
    .vacancy-actions {
      @apply mt-4 pt-3;
    }
    
    .actions-container {
      @apply gap-2;
    }
    
    .button-content {
      @apply text-sm;
    }
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .button-icon {
      transition: none;
    }
    
    :global(.primary-action .gradient-button:hover .button-icon),
    :global(.secondary-action .gradient-button:hover .button-icon) {
      @apply transform-none;
    }
  }
  
  /* Высококонтрастный режим */
  @media (prefers-contrast: high) {
    .vacancy-actions {
      @apply border-t-2 border-neutral-600;
    }

    :global(.dark) .vacancy-actions {
      @apply border-slate-400;
    }
  }
  
  /* Focus стили для клавиатурной навигации — применяются внутри GradientButton */

  /* Стили для кнопки удаления — см. блок выше */
</style> 