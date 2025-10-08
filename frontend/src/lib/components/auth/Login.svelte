<script lang="ts">
  import { signIn } from '$lib/stores/authStore.js';
  import GradientButton from '../ui/GradientButton.svelte';

  let isLoading = false;

  async function handleSignIn() {
    if (isLoading) return;
    
    isLoading = true;
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
      // You can add toast notification here
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <h2 class="login-title">Вход в админку</h2>
    <p class="login-description">Для доступа к административным функциям необходимо войти через Google</p>
    
    <GradientButton 
      variant="primary" 
      size="lg" 
      disabled={isLoading}
      on:click={handleSignIn}
    >
      <span class="button-content">
        <span class="button-icon" aria-hidden="true">
          {#if isLoading}
            ⏳
          {:else}
            🔐
          {/if}
        </span>
        <span class="button-text">
          {isLoading ? 'Вход...' : 'Войти с Google'}
        </span>
      </span>
    </GradientButton>
  </div>
</div>

<style>
  .login-container {
    @apply flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100;
  }

  :global(.dark) .login-container {
    @apply bg-gradient-to-br from-slate-900 to-slate-800;
  }

  .login-card {
    @apply bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4;
    @apply border border-neutral-200;
  }

  :global(.dark) .login-card {
    @apply bg-slate-800 border-slate-700;
  }

  .login-title {
    @apply text-2xl font-bold text-center mb-4;
    @apply text-neutral-800;
  }

  :global(.dark) .login-title {
    @apply text-slate-100;
  }

  .login-description {
    @apply text-neutral-600 text-center mb-6;
  }

  :global(.dark) .login-description {
    @apply text-slate-300;
  }

  .button-content {
    @apply flex items-center justify-center gap-3;
  }

  .button-icon {
    @apply text-lg;
  }

  .button-text {
    @apply font-medium;
  }
</style>
