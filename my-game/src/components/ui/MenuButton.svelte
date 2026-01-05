<script>
  export let isOpen = false;
  
  function toggleMenu() {
    isOpen = !isOpen;
  }
  
  export function closeMenu() {
    isOpen = false;
  }
</script>

<button class="menu-button" on:click={toggleMenu} aria-label="Open menu">
  ☰
</button>

{#if isOpen}
  <slot {isOpen} {closeMenu} />
{/if}

<style>
  .menu-button {
    position: fixed;
    bottom: 20px;
    left: 80px;
    width: 50px;
    height: 50px;
    border-radius: 8px;
    background-color: #8B4513;
    color: white;
    font-size: 28px;
    font-weight: bold;
    border: 2px solid #654321;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.2s;
  }

  .menu-button:hover {
    background-color: #A0522D;
    transform: scale(1.05);
  }

  .menu-button:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    .menu-button {
      width: 45px;
      height: 45px;
      font-size: 24px;
      bottom: 15px;
      left: 70px;
    }
  }
</style>

