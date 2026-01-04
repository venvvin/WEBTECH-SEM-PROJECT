<script>
  import { levels, currentLevelIndex, hearts, characterOutfit } from "../../stores/gameStore.js";

  import LevelBackpack from "./levels/LevelBackpack.svelte";
  import LevelCooking from "./levels/LevelCooking.svelte";
  import LevelDressUp from './levels/LevelDressUp.svelte';
  import LevelMaze from "./levels/LevelMaze.svelte";
  import LevelFixWires from "./levels/LevelFixWires.svelte";
  import UnknownLevel from "./levels/UnknownLevel.svelte";

  $: currentLevelData = $levels[$currentLevelIndex];
  let levelComplete = false;
      $: console.log("Current Outfit in Store:", $characterOutfit);
    $: console.log("Selected Happy Image:", happyChar);

  const charImages = {
      pajamas: {
          happy: '/game/characters/Lina/pajamas/happy.png', 
          sad: '/game/characters/Lina/pajamas/sad.png'
      },
      school_uniform: {
          happy: '/game/characters/Lina/suit/happy.png', 
          sad: '/game/characters/Lina/suit/sad.png'
      }
  };

  $: currentOutfitImages = charImages[$characterOutfit] || charImages.pajamas;

  $: happyChar = $characterOutfit !== 'pajamas'
        ? (charImages[$characterOutfit]?.happy || charImages.pajamas.happy)
        : (currentLevelData?.config?.character?.happy || charImages.pajamas.happy);

    $: sadChar = $characterOutfit !== 'pajamas'
        ? (charImages[$characterOutfit]?.sad || charImages.pajamas.sad)
        : (currentLevelData?.config?.character?.sad || charImages.pajamas.sad);

  $: isGameOver = $hearts <= 0 && !(currentLevelData?.config?.rules?.restartOnFail && $currentLevelIndex === 0);

  function handleLevelComplete() {
      levelComplete = true;
  }

  function handleMistake() {
      if (levelComplete) return;
      hearts.update((h) => Math.max(0, h - 1));
  }

  function nextLevel() {
      levelComplete = false;
      currentLevelIndex.update((n) => n + 1);
  }

  function restartGame() {
      hearts.set(3);
      currentLevelIndex.set(0);
      characterOutfit.set('pajamas');
      levelComplete = false;
  }

  function getComponent(type) {
      switch (type) {
          case "drag-drop-sort": return LevelBackpack;
          case "cooking": return LevelCooking;
          case 'dress-up-iron': return LevelDressUp;
          case "maze": return LevelMaze;
          case "wires-connect": return LevelFixWires;
          default: return UnknownLevel;
      }
  }

  /** @type {any} */
  $: CurrentComponent = currentLevelData ? getComponent(currentLevelData.type) : null;
</script>

<div class="game-container">
  
  {#if currentLevelData && CurrentComponent}
      <svelte:component
              this={CurrentComponent}
              data={currentLevelData}
              on:complete={handleLevelComplete}
              on:mistake={handleMistake}
              on:restartGame={restartGame}
      />
  {:else}
      <p>Game Finished or Error!</p>
  {/if}

  {#if levelComplete}
      <div class="win-overlay">
          <div class="character-box">
              <img src={happyChar} alt="Lina Happy" class="char-img" />
              <div class="dialog-bubble">
                  <p>Great! Everything is ready!</p>
                  <p>What should I do next?</p>
                  <button on:click={nextLevel}>Next Step ➡</button>
              </div>
          </div>
      </div>

  {:else if isGameOver}
      <div class="gameover-overlay">
          <div class="character-box">
              <img src={sadChar} alt="Lina Sad" class="char-img" />
              <div class="dialog-bubble">
                  <p>Oh no… I made too many mistakes.</p>
                  <button on:click={restartGame}>Start again</button>
              </div>
          </div>
      </div>
  {/if}

  <button class="debug-skip-btn" on:click={nextLevel}>
    ⏩ SKIP LEVEL
  </button>

</div>

<style>
.game-container {
    width: 100%; height: 100%; position: relative;
}

.win-overlay, .gameover-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    animation: fadeIn 0.5s;
}

.character-box {
    display: flex;
    align-items: center;
    gap: 30px;
}

.char-img {
    height: 400px;
    width: auto;
    object-fit: contain;
    filter: drop-shadow(5px 5px 15px rgba(0,0,0,0.2));
}

.dialog-bubble {
    background: white;
    border-radius: 20px;
    padding: 30px;
    max-width: 300px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    border: 4px solid #3498db;
    position: relative;
}

.dialog-bubble::before {
    content: '';
    position: absolute;
    left: -20px; top: 50%;
    transform: translateY(-50%);
    border: 10px solid transparent;
    border-right-color: #3498db;
}

.dialog-bubble p {
    margin: 0 0 10px;
    font-size: 1.2rem;
    color: #2c3e50;
}

.dialog-bubble button {
    margin-top: 15px;
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    background: #2ecc71;
    color: white;
    font-size: 1.1rem;
    width: 100%;
    transition: transform 0.1s;
    font-weight: bold;
}

.dialog-bubble button:active {
    transform: scale(0.95);
}

.debug-skip-btn {
      position: fixed;
      top: 10px; right: 10px;
      z-index: 9999;
      background-color: red;
      color: white;
      border: 2px solid white;
      padding: 8px 12px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      opacity: 0.7;
  }

  .debug-skip-btn:hover {
      opacity: 1;
  }

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
</style>