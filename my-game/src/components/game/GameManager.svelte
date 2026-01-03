<script>
    import { levels, currentLevelIndex, hearts } from "../../stores/gameStore.js";

    import LevelBackpack from "./levels/LevelBackpack.svelte";
    import LevelCooking from "./levels/LevelCooking.svelte";
    import LevelTransition from "./levels/LevelTransition.svelte";
    import UnknownLevel from "./levels/UnknownLevel.svelte";

    // текущий уровень
    $: currentLevelData = $levels[$currentLevelIndex];

    let levelComplete = false;

    function handleLevelComplete() {
        // НЕ переключаем уровень сразу
        levelComplete = true;
    }

    function handleMistake() {
        // после победы больше не штрафуем
        if (levelComplete) return;

        hearts.update((h) => Math.max(0, h - 1));
    }

    function nextLevel() {
        levelComplete = false;
        currentLevelIndex.update((n) => n + 1);
    }

    function restartGame() {
        // полный рестарт игры
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

    // happy-спрайт Лины для win overlay
    $: happyChar =
        currentLevelData?.config?.character?.happy ??
        "/game/characters/Lina/pajamas/happy.png";

    // sad-спрайт Лины для проигрыша
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

    <!-- WIN (приоритетнее всего) -->
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

        <!-- GAME OVER (только если НЕ выиграли) -->
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
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999;
    }

    .character-box {
        display: flex;
        gap: 24px;
        align-items: flex-end;
    }

    .char-img {
        width: 220px;
        height: auto;
    }

    .dialog-bubble {
        background: white;
        border-radius: 18px;
        padding: 20px;
        max-width: 340px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .dialog-bubble p {
        margin: 0 0 8px;
    }

    .dialog-bubble button {
        margin-top: 12px;
        padding: 10px 14px;
        border-radius: 12px;
        border: none;
        cursor: pointer;
    }
</style>
