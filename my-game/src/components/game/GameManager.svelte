<script>
  import { onMount, onDestroy } from "svelte";
  import { levels, currentLevelIndex, hearts, characterOutfit, gameTimer, isTimerRunning } from "../../stores/gameStore.js";
  import { getLevelComponent } from "../../utils/levelComponents.js";
  import HintButton from "../ui/HintButton.svelte";
  import { saveCurrentTime, saveBestTime, clearCurrentTime } from "../../utils/timerManager.js";

  $: currentLevelData = $levels[$currentLevelIndex];
  let levelComplete = false;
  let timerInterval = null;
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
  
  $: {
      if (isGameOver) {
          stopTimer();
          saveCurrentTime($gameTimer);
      }
  }

  function handleLevelComplete() {
      levelComplete = true;
  }

  function handleMistake() {
      if (levelComplete) return;
      hearts.update((h) => Math.max(0, h - 1));
  }

  function nextLevel() {
      levelComplete = false;
      const nextIndex = $currentLevelIndex + 1;
      currentLevelIndex.set(nextIndex);
      
      if (nextIndex >= $levels.length) {
          stopTimer();
          saveCurrentTime($gameTimer);
          saveBestTime($gameTimer);
      }
  }

  function restartGame() {
      const allAudioElements = document.querySelectorAll('audio');
      allAudioElements.forEach(audio => {
          audio.pause();
          audio.currentTime = 0;
      });
      if (typeof window !== 'undefined' && window['_passwordMusicSound']) {
          try {
              window['_passwordMusicSound'].pause();
              window['_passwordMusicSound'].currentTime = 0;
              window['_passwordMusicSound'] = null;
          } catch (e) {}
      }
      stopTimer();
      clearCurrentTime();
      gameTimer.set(0);
      hearts.set(3);
      currentLevelIndex.set(0);
      characterOutfit.set('pajamas');
      levelComplete = false;
  }

  function startTimer() {
      if (timerInterval) return;
      isTimerRunning.set(true);
      timerInterval = setInterval(() => {
          gameTimer.update(t => t + 1);
      }, 1000);
  }

  function stopTimer() {
      if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
      }
      isTimerRunning.set(false);
  }

  /** @type {any} */
  $: CurrentComponent = currentLevelData ? getLevelComponent(currentLevelData.type) : null;

  $: {
      if (currentLevelData) {
          const allAudioElements = document.querySelectorAll('audio');
          allAudioElements.forEach(audio => {
              audio.pause();
              audio.currentTime = 0;
          });
          
          if ($currentLevelIndex === 0 && !$isTimerRunning) {
              startTimer();
          }
      }
  }

  onMount(() => {
      if ($levels.length > 0 && $currentLevelIndex === 0) {
          startTimer();
      }
  });

  onDestroy(() => {
      stopTimer();
  });
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

  {#if currentLevelData && !levelComplete && !isGameOver}
    <HintButton hintText={currentLevelData.config?.hint || "Text will be here."} />
  {/if}

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

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
</style>