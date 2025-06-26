<script lang="ts">
  export let type: 'info' | 'warning' | 'success' | 'archived' = 'info';
  export let text: string;
  export let icon: string = '';

  $: badgeClasses = {
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    success: 'bg-green-100 text-green-800 border-green-200',
    archived: 'bg-gray-100 text-gray-600 border-gray-300'
  }[type];
</script>

<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border {badgeClasses}">
  {#if icon}
    <span class="text-sm">{icon}</span>
  {/if}
  {text}
</span>

 