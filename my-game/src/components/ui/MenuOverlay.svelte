<script>
  import { gameTimer } from '../../stores/gameStore.js';
  import { formatTime, getBestTime, saveBestTime } from '../../utils/timerManager.js';
  
  export let onRestart = () => {};
  export let onContinue = () => {};
  export let onClose = () => {};
  
  let showStats = false;
  let bestTime = null;
  
  $: bestTimeFormatted = bestTime !== null ? formatTime(bestTime) : '—';
  $: currentTimeFormatted = formatTime($gameTimer);
  
  function handleRestart() {
    onRestart();
    onClose();
  }
  
  function handleContinue() {
    onContinue();
    onClose();
  }
  
  function handleShowStats() {
    bestTime = getBestTime();
    showStats = true;
  }
  
  function handleCloseStats() {
    showStats = false;
  }
  
  function handlePrintHint() {
  }
</script>

<div class="menu-overlay" on:click={onClose} role="dialog" aria-modal="true" aria-label="Game menu" tabindex="-1" on:keydown={(e) => e.key === 'Escape' && onClose()}>
  <div class="menu-window" on:click|stopPropagation>
    <button class="close-button" on:click={onClose} aria-label="Close menu">
      ×
    </button>
    
    {#if !showStats}
      <div class="menu-content">
        <h2>Menu</h2>
        <button class="menu-item" on:click={handleRestart}>Restart Game</button>
        <button class="menu-item" on:click={handleContinue}>Continue Game</button>
        <button class="menu-item" on:click={handleShowStats}>Show Statistics</button>
        <button class="menu-item" on:click={handlePrintHint} disabled>Print Hint</button>
      </div>
    {:else}
      <div class="stats-content">
        <h2>Statistics</h2>
        <div class="stats-info">
          <div>Current Time: {currentTimeFormatted}</div>
          <div>Best Time: {bestTimeFormatted}</div>
        </div>
        <button class="back-button" on:click={handleCloseStats}>Back</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-window {
    position: relative;
    background-color: #FFE4E1;
    border: 2px solid #8B4513;
    padding: 20px;
    max-width: 400px;
    width: 80%;
  }

  .close-button {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 30px;
    height: 30px;
    background-color: #8B4513;
    color: white;
    font-size: 20px;
    border: none;
    cursor: pointer;
  }

  .close-button:hover {
    background-color: #A0522D;
  }

  h2 {
    margin: 0 0 15px 0;
    text-align: center;
    color: #8B4513;
  }

  .menu-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .menu-item {
    padding: 10px;
    background-color: #8B4513;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 16px;
  }

  .menu-item:hover:not(:disabled) {
    background-color: #A0522D;
  }

  .menu-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .stats-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .stats-info {
    padding: 15px;
    background-color: white;
    border: 1px solid #8B4513;
  }

  .stats-info div {
    margin: 10px 0;
    font-size: 16px;
  }

  .back-button {
    padding: 10px 20px;
    background-color: #8B4513;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 16px;
    margin-top: 10px;
  }

  .back-button:hover {
    background-color: #A0522D;
  }
</style>

