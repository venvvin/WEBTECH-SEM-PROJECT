<script>
  let count = $state(0)
  const increment = () => {
    count += 1
  }
</script>

<button onclick={increment}>
  count is {count}
</button>

<style>
  button {
    background-color: purple;
    transform: scale(2);
  }
</style>