<script>
  import OrientationGuard from './components/ui/OrientationGuard.svelte';
  
  import GameManager from './components/game/GameManager.svelte';
  import HUD from './components/ui/HUD.svelte';
  
  import { currentScreen, levels, hearts, gameConfig } from './stores/gameStore.js';
  import { generateGameQueue } from './utils/levelManager.js';
  
  import fullGameData from './data/levels.json';

  function startGame() {
    gameConfig.set(fullGameData);
    hearts.set(fullGameData.meta.totalHearts || 3);
    const gameQueue = generateGameQueue(fullGameData);
    levels.set(gameQueue);
    currentScreen.set('game');
  }
</script>

<OrientationGuard />

<main>
  {#if $currentScreen === 'menu'}
    <div class="screen">
      <h1>School Journey</h1>
      <button on:click={startGame}>Start Game</button>
    </div>
  
  {:else if $currentScreen === 'game'}
  <div class="screen game-screen">
    <HUD />
    <GameManager />
  </div>

  {:else if $currentScreen === 'results'}
    <div class="screen">
      <h1>Results</h1>
      <button on:click={() => currentScreen.set('menu')}>Back to Menu</button>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    font-family: 'Arial', sans-serif;
  }
  
  .screen {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #f0f8ff;
  }

  button {
    padding: 15px 30px;
    font-size: 1.2rem;
    margin-top: 20px;
    cursor: pointer;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 10px;
  }
</style>