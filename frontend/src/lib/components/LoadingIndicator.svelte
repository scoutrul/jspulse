<script lang="ts">
  export let text: string = "Загрузка...";
</script>

<p class="loading">{text}</p>

<style>
  .loading {
    text-align: center;
    padding: 2rem;
    color: #555;
    font-style: italic;
    font-weight: bold;
  }
</style>
