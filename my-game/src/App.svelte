<script>
    import OrientationGuard from './components/ui/OrientationGuard.svelte';

    import IntroScreen from './components/ui/IntroScreen.svelte';
    import GameManager from './components/game/GameManager.svelte';
    import HUD from './components/ui/HUD.svelte';

    import { currentScreen, levels, hearts, gameConfig } from './stores/gameStore.js';
    import { generateGameQueue } from './utils/levelManager.js';

    import fullGameData from './data/levels.json';

    function initGame() {
        gameConfig.set(fullGameData);
        hearts.set(fullGameData.meta?.totalHearts || 3);

        const gameQueue = generateGameQueue(fullGameData);
        levels.set(gameQueue);
    }

    function startGame() {
        initGame();

        const intro = fullGameData?.meta?.intro;
        if (intro?.slides?.length) {
            currentScreen.set('intro');
        } else {
            currentScreen.set('game');
        }
    }

    function finishIntro() {
        currentScreen.set('game');
    }

    function backToMenu() {
        currentScreen.set('menu');
    }
</script>

<OrientationGuard />

<main>
    {#if $currentScreen === 'menu'}
        <div class="screen">
            <h1>School Journey</h1>
            <button on:click={startGame}>Start Game</button>
        </div>

    {:else if $currentScreen === 'intro'}
        <IntroScreen intro={$gameConfig?.meta?.intro} on:done={finishIntro} />

    {:else if $currentScreen === 'game'}
        <div class="screen game-screen">
            <HUD />
            <GameManager />
        </div>

    {:else if $currentScreen === 'results'}
        <div class="screen">
            <h1>Results</h1>
            <button on:click={backToMenu}>Back to Menu</button>
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

    .game-screen {
        justify-content: flex-start;
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
