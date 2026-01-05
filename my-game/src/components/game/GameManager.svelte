<script>
    import { onMount, onDestroy } from "svelte";
    import { levels, currentLevelIndex, hearts, characterOutfit, gameTimer, isTimerRunning, currentScreen, gameConfig, forceMenuOpen } from "../../stores/gameStore.js";
    import { generateGameQueue } from "../../utils/levelManager.js";
    import MenuButton from "../ui/MenuButton.svelte";
    import MenuOverlay from "../ui/MenuOverlay.svelte";
    import { getLevelComponent } from "../../utils/levelComponents.js";
    import HintButton from "../ui/HintButton.svelte";
    import LevelTransition from "../ui/LevelTransition.svelte";
    import { saveCurrentTime, saveBestTime, clearCurrentTime } from "../../utils/timerManager.js";
    import fullGameData from "../../data/levels.json";

    $: currentLevelData = ($currentLevelIndex >= 0 && $currentLevelIndex < $levels.length) ? $levels[$currentLevelIndex] : null;
  $: isGameComplete = $currentLevelIndex >= $levels.length;
  let levelComplete = false;
  let timerInterval = null;
  let showTransition = false;
  let transitionInstruction = "";
  let menuOpen = false;

    $: {
        if ($forceMenuOpen) {
            menuOpen = true;
            forceMenuOpen.set(false);
        }
    }

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
        const nextIndex = $currentLevelIndex + 1;
        if (nextIndex >= $levels.length) {
            stopTimer();
            saveCurrentTime($gameTimer);
            currentLevelIndex.set(nextIndex);
        }
    }

    function handleMistake() {
        if (levelComplete) return;
        hearts.update((h) => Math.max(0, h - 1));
    }

    function nextLevel() {
        levelComplete = false;
        const nextIndex = $currentLevelIndex + 1;

        if (nextIndex >= $levels.length) {
            stopTimer();
            saveCurrentTime($gameTimer);
            saveBestTime($gameTimer);
            currentLevelIndex.set(nextIndex);
            return;
        }
        
        if (nextIndex >= 0 && nextIndex < $levels.length) {
            const nextLevelData = $levels[nextIndex];
            if (nextLevelData) {
                transitionInstruction = nextLevelData.instruction || "";
                showTransition = true;
            } else {
                currentLevelIndex.set(nextIndex);
            }
        } else {
            currentLevelIndex.set(nextIndex);
        }
    }

    function handleTransitionComplete() {
        showTransition = false;
        const nextIndex = $currentLevelIndex + 1;
        currentLevelIndex.set(nextIndex);
    }

    function finishGame() {
        saveBestTime($gameTimer);
        currentScreen.set('results');
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

    function restartGameFromMenu() {
        stopTimer();
        clearCurrentTime();
        gameTimer.set(0);
        hearts.set(fullGameData.meta?.totalHearts || 3);
        currentLevelIndex.set(0);
        characterOutfit.set('pajamas');
        levelComplete = false;

        gameConfig.set(fullGameData);
        const gameQueue = generateGameQueue(fullGameData);
        levels.set(gameQueue);

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

        currentScreen.set('intro');
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

    {#if showTransition}
        <LevelTransition instruction={transitionInstruction} on:complete={handleTransitionComplete} />
    {/if}

    <div class="game-screen">
        {#if currentLevelData && CurrentComponent && !showTransition}
            <svelte:component
                    this={CurrentComponent}
                    data={currentLevelData}
                    on:complete={handleLevelComplete}
                    on:mistake={handleMistake}
                    on:restartGame={restartGame}
            />
        {:else if isGameComplete}
            <div class="game-complete-overlay">
                <div class="character-box">
                    <img src={happyChar} alt="Lina Happy" class="char-img" />
                    <div class="dialog-bubble">
                        <p>Congratulations! You completed all levels!</p>
                        <button on:click={finishGame}>Finish the Game</button>
                    </div>
                </div>
            </div>
        {/if}

        {#if levelComplete && !isGameComplete}
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

  {#if (currentLevelData && !levelComplete && !isGameOver && !showTransition)  || isGameComplete}
    <HintButton hintText={currentLevelData.config?.hint || "Text will be here."} />
  {/if}
  <MenuButton bind:isOpen={menuOpen}>
    {#if menuOpen}
      <MenuOverlay 
        onRestart={restartGameFromMenu}
        onContinue={() => {}}
        onClose={() => menuOpen = false}
      />
    {/if}
  </MenuButton>
</div>
</div>

<style>
    .game-container {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .game-screen {
        width: 100%;
        height: 100%;
    }

    .win-overlay, .gameover-overlay, .game-complete-overlay {
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
        left: -20px;
        top: 50%;
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

    .print-hints {
        display: none;
    }

    @media print {
        .game-screen,
        .win-overlay,
        .gameover-overlay,
        .game-complete-overlay,
        .hint-button,
        .menu-button,
        button,
        canvas,
        [class*="timer"],
        [class*="heart"],
        [class*="level"],
        [class*="menu"] {
            display: none !important;
        }

        .game-container {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
        }

        .print-hints {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            color: black !important;
            padding: 20px !important;
            margin: 0 !important;
            page-break-inside: avoid;
            font-family: "Times New Roman", Times, serif !important;
        }

        .print-title {
            margin: 0 0 20px 0 !important;
            font-size: 28pt !important;
            font-weight: bold !important;
            color: #000 !important;
            text-align: center !important;
            border-bottom: 2px solid #000 !important;
            padding-bottom: 15px !important;
        }

        .print-subtitle {
            margin: 25px 0 12px 0 !important;
            font-size: 18pt !important;
            font-weight: bold !important;
            color: #000 !important;
            border-bottom: 1px solid #333 !important;
            padding-bottom: 5px !important;
        }

        .print-block {
            margin: 15px 0 !important;
            font-size: 14pt !important;
            line-height: 1.6 !important;
            color: #000 !important;
        }

        .print-list {
            margin: 12px 0 12px 25px !important;
            font-size: 13pt !important;
            line-height: 1.7 !important;
            color: #000 !important;
        }

        .print-list li {
            margin-bottom: 8px !important;
        }

        * {
            background: transparent !important;
            box-shadow: none !important;
            text-shadow: none !important;
            border-color: #000 !important;
        }

        a, a:visited {
            color: #000 !important;
            text-decoration: none !important;
        }

        img {
            display: none !important;
        }
    }
</style>