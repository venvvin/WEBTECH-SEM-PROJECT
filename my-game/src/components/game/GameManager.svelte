<script>
    import { levels, currentLevelIndex, hearts } from "../../stores/gameStore.js";

    import LevelBackpack from "./levels/LevelBackpack.svelte";
    import LevelCooking from "./levels/LevelCooking.svelte";
    import LevelTransition from "./levels/LevelTransition.svelte";
    import UnknownLevel from "./levels/UnknownLevel.svelte";


    $: currentLevelData = $levels[$currentLevelIndex];

    let levelComplete = false;

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
        levelComplete = false;
    }

    function getComponent(type) {
        switch (type) {
            case "drag-drop-sort":
                return LevelBackpack;
            case "cooking":
                return LevelCooking;
            case "maze-transition":
                return LevelTransition;
            default:
                return UnknownLevel;
        }
    }

    /** @type {any} */
    $: CurrentComponent = currentLevelData ? getComponent(currentLevelData.type) : null;

    $: happyChar =
        currentLevelData?.config?.character?.happy ??
        "/game/characters/Lina/pajamas/happy.png";

    $: sadChar =
        currentLevelData?.config?.character?.sad ??
        "/game/characters/Lina/pajamas/sad.png";

    $: isGameOver = $hearts <= 0;
</script>

<div class="game-container">
    {#if currentLevelData && CurrentComponent}
        <svelte:component
                this={CurrentComponent}
                data={currentLevelData}
                on:complete={handleLevelComplete}
                on:mistake={handleMistake}
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
</div>

<style>
  .game-container {
      width: 100%;
      height: 100%;
      position: relative;
  }

  .win-overlay,
  .gameover-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.85);
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
  }
  
  .dialog-bubble button:active {
      transform: scale(0.95);
  }
  
  @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
  }
</style>