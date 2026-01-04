<script>
    import { createEventDispatcher, onMount, onDestroy } from "svelte";

    export let data;

    const dispatch = createEventDispatcher();

    $: config = data?.config ?? {};
    $: mazeConfig = config?.maze ?? {};

    $: backgroundImage = config?.background ?? "";
    $: overlayImage = config?.mazeImage ?? "";

    $: imageSource = mazeConfig?.fromImage ?? "";
    $: gridWidthFromImage = Number(mazeConfig?.imageGrid?.w ?? 0);
    $: gridHeightFromImage = Number(mazeConfig?.imageGrid?.h ?? 0);
    $: brightnessThreshold = Number(mazeConfig?.threshold ?? 200);
    $: shouldInvert = !!mazeConfig?.invert;

    let gridWidth = 0;
    let gridHeight = 0;
    $: {
        if (imageSource && gridWidthFromImage > 0) {
            gridWidth = gridWidthFromImage;
        } else {
            gridWidth = Number(mazeConfig?.gridWidth ?? 0);
        }
        if (imageSource && gridHeightFromImage > 0) {
            gridHeight = gridHeightFromImage;
        } else {
            gridHeight = Number(mazeConfig?.gridHeight ?? 0);
        }
    }

    $: cellSize = Number(mazeConfig?.cellSize ?? 64);

    let mazeGrid = [];
    $: defaultCells = mazeConfig?.cells ?? [];

    $: startPosition = mazeConfig?.start ?? { x: 1, y: 1 };
    $: endPosition = mazeConfig?.finish ?? { x: Math.max(1, gridWidth - 2), y: Math.max(1, gridHeight - 2) };

    $: playerImage = config?.player?.image ?? "";
    $: playerScale = Number(config?.player?.scale ?? 1);

    $: stageWidth = gridWidth * cellSize;
    $: stageHeight = gridHeight * cellSize;

    let debugGrid = false;
    let debugCoordinates = false;
    let debugTint = false;

    let playerX = 1;
    let playerY = 1;
    let facingDirection = "down";

    function initializePlayerPosition() {
        if (startPosition && startPosition.x !== undefined) {
            playerX = startPosition.x;
        } else {
            playerX = 1;
        }
        if (startPosition && startPosition.y !== undefined) {
            playerY = startPosition.y;
        } else {
            playerY = 1;
        }
        facingDirection = "down";
    }

    let isTouchDevice = false;
    let mediaQuery;

    function handlePointerTypeChange() {
        if (mediaQuery && mediaQuery.matches) {
            isTouchDevice = true;
        } else {
            isTouchDevice = false;
        }
        updateViewportScale();
    }

    let enableMobileControls = false;
    $: {
        const mobileSetting = config?.controls?.mobile;
        if (mobileSetting === "onScreenArrows" && isTouchDevice) {
            enableMobileControls = true;
        } else {
            enableMobileControls = false;
        }
    }

    let containerElement;
    let viewportScale = 1;
    let resizeObserver;
    let preIntroVisible = true;
    let introVisible = false;
    const welcomeMessage =
        config?.ui?.introText ?? "Help Lina find the way to the bus!";
    const welcomeButtonText =
        config?.ui?.introButton ?? "OK";

    let stairsSound;
    let birdNatureSound;
    let fromHouseSound;
    let fromHouseToMazeSound;
    let mazeMusicSound;
    let linaImageLoaded = false;
    let dialogText = "";
    let dialogFullText = "I'm already ready. I need to hurry to school. I'll go to the bus right now. Mom said I might get lost, but I don't believe it!";
    let dialogTypingIndex = 0;
    let dialogTypingComplete = false;

    let houseSceneVisible = false;
    let fadeBlack = false;
    let linaThinkingLoaded = false;
    let dialogText2 = "";
    let dialogFullText2 = "What wonderful weather. A great first day of school. Time to go!";
    let dialogTypingIndex2 = 0;
    let dialogTypingComplete2 = false;

    let mazeSceneVisible = false;
    let mazeSceneBackgroundLoaded = false;
    let linaScaredLoaded = false;
    let dialogText3 = "";
    let dialogFullText3 = "I thought I had already walked this path with mom. But now I can't find the way. Oh no. I can't be late for school. Where is the right path?";
    let dialogTypingIndex3 = 0;
    let dialogTypingComplete3 = false;

    let introTextTyped = "";
    let introTextFull = config?.ui?.introText ?? "Help Lina find the way to the bus!";
    let introTypingIndex = 0;
    let introTypingComplete = false;

    function dismissPreIntro() {
        preIntroVisible = false;
        houseSceneVisible = true;
        
        birdNatureSound = new Audio("/game/sfx/birdnature.wav");
        birdNatureSound.play().catch(() => {});
        
        setTimeout(() => {
            fromHouseSound = new Audio("/game/sfx/fromhouse.wav");
            fromHouseSound.play().catch(() => {});
            
            setTimeout(() => {
                linaThinkingLoaded = true;
                setTimeout(() => {
                    startTyping2();
                }, 500);
            }, 500);
        }, 1000);
    }

    function dismissHouseScene() {
        fadeBlack = true;
        setTimeout(() => {
            houseSceneVisible = false;
            fadeBlack = false;
            mazeSceneVisible = true;
            mazeSceneBackgroundLoaded = true;
            
            setTimeout(() => {
                fromHouseToMazeSound = new Audio("/game/sfx/fromhousetomaze.wav");
                fromHouseToMazeSound.play().catch(() => {});
                
                setTimeout(() => {
                    fadeBlack = true;
                    setTimeout(() => {
                        fadeBlack = false;
                        linaScaredLoaded = true;
                        setTimeout(() => {
                            startTyping3();
                        }, 500);
                    }, 500);
                }, 1500);
            }, 300);
        }, 500);
    }

    function dismissMazeScene() {
        mazeSceneVisible = false;
        introVisible = true;
        
        mazeMusicSound = new Audio("/game/sfx/mazemusic.wav");
        mazeMusicSound.play().catch(() => {});
        
        setTimeout(() => {
            startTypingIntro();
        }, 300);
    }

    function startTypingIntro() {
        if (introTypingIndex < introTextFull.length) {
            introTextTyped = introTextFull.substring(0, introTypingIndex + 1);
            introTypingIndex++;
            setTimeout(startTypingIntro, 30);
        } else {
            introTypingComplete = true;
        }
    }

    function startTyping2() {
        if (dialogTypingIndex2 < dialogFullText2.length) {
            dialogText2 = dialogFullText2.substring(0, dialogTypingIndex2 + 1);
            dialogTypingIndex2++;
            setTimeout(startTyping2, 30);
        } else {
            dialogTypingComplete2 = true;
        }
    }

    function startTyping3() {
        if (dialogTypingIndex3 < dialogFullText3.length) {
            dialogText3 = dialogFullText3.substring(0, dialogTypingIndex3 + 1);
            dialogTypingIndex3++;
            setTimeout(startTyping3, 30);
        } else {
            dialogTypingComplete3 = true;
        }
    }

    function dismissIntro() {
        introVisible = false;
    }

    function startTyping() {
        if (dialogTypingIndex < dialogFullText.length) {
            dialogText = dialogFullText.substring(0, dialogTypingIndex + 1);
            dialogTypingIndex++;
            setTimeout(startTyping, 30);
        } else {
            dialogTypingComplete = true;
        }
    }

    function updateViewportScale() {
        if (!containerElement) return;
        if (!stageWidth || !stageHeight) return;

        const rect = containerElement.getBoundingClientRect();
        const padding = 16;
        let controlsHeight = 0;
        if (enableMobileControls) {
            controlsHeight = 170;
        }

        const w = rect.width - padding * 2;
        const h = rect.height - padding * 2 - controlsHeight;

        if (w <= 0 || h <= 0) return;

        const scaleW = w / stageWidth;
        const scaleH = h / stageHeight;
        let scale = scaleW;
        if (scaleH < scaleW) {
            scale = scaleH;
        }

        if (scale > 1) scale = 1;
        if (scale < 0.2) scale = 0.2;

        viewportScale = scale;
    }

    function getCellValue(col, row) {
        if (!mazeGrid || mazeGrid.length === 0) {
            return 1;
        }

        if (row < 0 || row >= gridHeight) {
            return 1;
        }
        if (col < 0 || col >= gridWidth) {
            return 1;
        }

        if (!mazeGrid[row]) {
            return 1;
        }

        if (mazeGrid[row][col] === undefined) {
            return 1;
        }

        return mazeGrid[row][col];
    }

    function attemptMovement(deltaX, deltaY) {
        if (deltaX === 1) facingDirection = "right";
        if (deltaX === -1) facingDirection = "left";
        if (deltaY === 1) facingDirection = "down";
        if (deltaY === -1) facingDirection = "up";

        const newX = playerX + deltaX;
        const newY = playerY + deltaY;

        if (getCellValue(newX, newY) === 1) {
            return;
        }

        playerX = newX;
        playerY = newY;

        if (Math.abs(playerX - endPosition.x) <= 1 && Math.abs(playerY - endPosition.y) <= 1) {
            dispatch("complete");
        }
    }

    let autoMoveInterval = null;
    let currentMoveDirection = null;

    function startAutoMove(deltaX, deltaY) {
        if (autoMoveInterval) {
            clearInterval(autoMoveInterval);
        }
        currentMoveDirection = { x: deltaX, y: deltaY };
        attemptMovement(deltaX, deltaY);
        autoMoveInterval = setInterval(() => {
            attemptMovement(deltaX, deltaY);
        }, 150);
    }

    function stopAutoMove() {
        if (autoMoveInterval) {
            clearInterval(autoMoveInterval);
            autoMoveInterval = null;
        }
        currentMoveDirection = null;
    }

    function handleKeyboardInput(event) {
        if (event.key === "g") {
            debugGrid = !debugGrid;
            return;
        }
        if (event.key === "c") {
            debugCoordinates = !debugCoordinates;
            return;
        }
        if (event.key === "t") {
            debugTint = !debugTint;
            return;
        }

        if (event.key === "ArrowLeft") {
            if (event.type === "keydown") {
                startAutoMove(-1, 0);
            }
        }
        if (event.key === "ArrowRight") {
            if (event.type === "keydown") {
                startAutoMove(1, 0);
            }
        }
        if (event.key === "ArrowUp") {
            if (event.type === "keydown") {
                startAutoMove(0, -1);
            }
        }
        if (event.key === "ArrowDown") {
            if (event.type === "keydown") {
                startAutoMove(0, 1);
            }
        }
    }

    function handleKeyUp(event) {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown") {
            stopAutoMove();
        }
    }

    function blockArrowKeyScrolling(event) {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
        }
    }

    function processImageToMazeGrid(imageUrl, width, height, thresholdValue = 200, invertColors = false) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imageUrl;

            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                ctx.imageSmoothingEnabled = true;
                ctx.drawImage(img, 0, 0, width, height);

                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;

                const result = [];
                for (let row = 0; row < height; row++) {
                    result[row] = [];
                    for (let col = 0; col < width; col++) {
                        const i = (row * width + col) * 4;
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const brightness = (r + g + b) / 3;

                        let isWall = brightness < thresholdValue;
                        if (invertColors) {
                            isWall = !isWall;
                        }

                        result[row][col] = isWall ? 1 : 0;
                    }
                }

                resolve(result);
            };

            img.onerror = (e) => {
                reject(e);
            };
        });
    }

    $: void initializeMaze();

    onMount(() => {
        stairsSound = new Audio("/game/sfx/stairsrun.wav");
        stairsSound.play().catch(() => {});

        setTimeout(() => {
            linaImageLoaded = true;
            setTimeout(() => {
                startTyping();
            }, 500);
        }, 1500);

        mediaQuery = window.matchMedia("(pointer: coarse)");
        
        if (mediaQuery && mediaQuery.matches) {
            isTouchDevice = false;
            setTimeout(() => {
                updateViewportScale();
                setTimeout(() => {
                    handlePointerTypeChange();
                }, 50);
            }, 50);
        } else {
            handlePointerTypeChange();
        }

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handlePointerTypeChange);
        } else {
            mediaQuery.addListener(handlePointerTypeChange);
        }

        resizeObserver = new ResizeObserver(updateViewportScale);
        resizeObserver.observe(containerElement);
        updateViewportScale();
        window.addEventListener("orientationchange", updateViewportScale);

        window.addEventListener("keydown", handleKeyboardInput);
        window.addEventListener("keydown", blockArrowKeyScrolling, { passive: false });
    });

    onDestroy(() => {
        if (mediaQuery) {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener("change", handlePointerTypeChange);
            } else {
                mediaQuery.removeListener(handlePointerTypeChange);
            }
        }
        if (resizeObserver) resizeObserver.disconnect();

        window.removeEventListener("orientationchange", updateViewportScale);
        window.removeEventListener("keydown", handleKeyboardInput);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("keydown", blockArrowKeyScrolling);
        stopAutoMove();
    });

    $: playerPixelX = playerX * cellSize;
    $: playerPixelY = playerY * cellSize;

    let mazeInitialized = false;
    let initializationError = "";

    async function initializeMaze() {
        mazeInitialized = false;
        initializationError = "";

        if (imageSource && gridWidth > 0 && gridHeight > 0) {
            try {
                mazeGrid = await processImageToMazeGrid(imageSource, gridWidth, gridHeight, brightnessThreshold, shouldInvert);
                mazeInitialized = true;
                initializePlayerPosition();
                updateViewportScale();
            } catch (error) {
                console.error("Failed to build maze from image:", imageSource, error);
                initializationError = "Image load failed: " + imageSource;
                mazeGrid = defaultCells;
                if (mazeGrid && mazeGrid.length > 0) {
                    mazeInitialized = true;
                }
                initializePlayerPosition();
            }
        } else {
            mazeGrid = defaultCells;
            if (mazeGrid && mazeGrid.length > 0) {
                mazeInitialized = true;
            }
            initializePlayerPosition();
        }
    }

</script>

{#if !gridWidth || !gridHeight || !stageWidth || !stageHeight}
    <div class="debug">
        <h3>Maze config missing</h3>
        <pre>{JSON.stringify(mazeConfig, null, 2)}</pre>
    </div>
{:else}
    <div class="wrap" bind:this={containerElement} style="background-image:url('{backgroundImage}')">
        {#if fadeBlack}
            <div class="fade-black"></div>
        {/if}
        {#if preIntroVisible}
            <div class="pre-intro-scene">
                <img src="/game/backgrounds/stairs.png" alt="stairs" class="stairs-bg" />
                {#if linaImageLoaded}
                    <img src="/game/characters/Lina/suit/base.png" alt="Lina" class="lina-character" />
                    <div class="dialog-box">
                        <p class="dialog-text">{dialogText}<span class="cursor">|</span></p>
                        {#if dialogTypingComplete}
                            <button class="continue-btn" on:click={dismissPreIntro}>Continue</button>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
        {#if houseSceneVisible}
            <div class="house-scene">
                <img src="/game/backgrounds/house.png" alt="house" class="house-bg" />
                {#if linaThinkingLoaded}
                    <img src="/game/characters/Lina/suit/thinking.png" alt="Lina thinking" class="lina-thinking" />
                    <div class="dialog-box dialog-box-right">
                        <p class="dialog-text">{dialogText2}<span class="cursor">|</span></p>
                        {#if dialogTypingComplete2}
                            <button class="continue-btn" on:click={dismissHouseScene}>Continue</button>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
        {#if mazeSceneVisible}
            <div class="maze-scene">
                {#if mazeSceneBackgroundLoaded}
                    <img src="/game/backgrounds/maze_scene.png" alt="maze scene" class="maze-scene-bg" />
                {/if}
                {#if linaScaredLoaded}
                    <img src="/game/characters/Lina/suit/scared.png" alt="Lina scared" class="lina-scared" />
                    <div class="dialog-box">
                        <p class="dialog-text">{dialogText3}<span class="cursor">|</span></p>
                        {#if dialogTypingComplete3}
                            <button class="continue-btn" on:click={dismissMazeScene}>Continue</button>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
        {#if !mazeInitialized}
            <div class="banner">
                Loading maze… {initializationError}
            </div>
        {/if}
        {#if introVisible}
            <div class="overlay">
                <div class="modal">
                    <p class="intro-text">{introTextTyped}<span class="cursor">|</span></p>
                    {#if introTypingComplete}
                        <button class="ok-btn" on:click={dismissIntro}>OK</button>
                    {/if}
                </div>
            </div>
        {/if}


        <div class="stageHolder" style="width:{stageWidth * viewportScale}px; height:{stageHeight * viewportScale}px;">
            <div
                    class="stage"
                    style="
                    width:{stageWidth}px;
                    height:{stageHeight}px;
                    transform: scale({viewportScale});
                    transform-origin: top left;
                "
            >
                {#if overlayImage}
                    <img
                            class="mazeOverlay"
                            src={overlayImage}
                            alt="maze"
                            draggable="false"
                    />
                {/if}

                <div class="walls">
                    {#each Array(gridHeight) as _, rowIndex}
                        {#each Array(gridWidth) as _, colIndex}
                            {#if getCellValue(colIndex, rowIndex) === 1}
                                <div
                                        class="wall"
                                        style="
                                        left:{colIndex * cellSize}px;
                                        top:{rowIndex * cellSize}px;
                                        width:{cellSize}px;
                                        height:{cellSize}px;
                                    "
                                ></div>
                            {/if}
                        {/each}
                    {/each}
                </div>

                <div
                        class="finish"
                        style="
                        left:{endPosition.x * cellSize}px;
                        top:{endPosition.y * cellSize}px;
                        width:{cellSize}px;
                        height:{cellSize}px;
                    "
                ></div>

                <div
                        class="player {facingDirection}"
                        style="
                        left:{playerPixelX}px;
                        top:{playerPixelY}px;
                        width:{cellSize * 1.5}px;
                        height:{cellSize * 1.5}px;
                        --ps:{playerScale};
                    "
                >
                    {#if playerImage}
                        <img src={playerImage} alt="player" draggable="false" />
                    {:else}
                        <div class="fallback"></div>
                    {/if}
                </div>

                {#if debugGrid}
                    <div class="grid">
                        {#each Array(gridHeight) as _, rowIndex}
                            {#each Array(gridWidth) as _, colIndex}
                                <div
                                        class="cell {debugTint ? (getCellValue(colIndex, rowIndex) === 1 ? 'wallCell' : 'freeCell') : ''}"
                                        style="
                                        left:{colIndex * cellSize}px;
                                        top:{rowIndex * cellSize}px;
                                        width:{cellSize}px;
                                        height:{cellSize}px;
                                    "
                                >
                                    {#if debugCoordinates}
                                        <span>{colIndex},{rowIndex}</span>
                                    {/if}
                                </div>
                            {/each}
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        {#if enableMobileControls}
            <div class="controls" aria-label="Mobile controls">
                <button 
                    on:mousedown={() => startAutoMove(0, -1)}
                    on:mouseup={stopAutoMove}
                    on:mouseleave={stopAutoMove}
                    on:touchstart={() => startAutoMove(0, -1)}
                    on:touchend={stopAutoMove}
                    aria-label="Up">▲</button>
                <div class="row">
                    <button 
                        on:mousedown={() => startAutoMove(-1, 0)}
                        on:mouseup={stopAutoMove}
                        on:mouseleave={stopAutoMove}
                        on:touchstart={() => startAutoMove(-1, 0)}
                        on:touchend={stopAutoMove}
                        aria-label="Left">◀</button>
                    <button 
                        on:mousedown={() => startAutoMove(1, 0)}
                        on:mouseup={stopAutoMove}
                        on:mouseleave={stopAutoMove}
                        on:touchstart={() => startAutoMove(1, 0)}
                        on:touchend={stopAutoMove}
                        aria-label="Right">▶</button>
                </div>
                <button 
                    on:mousedown={() => startAutoMove(0, 1)}
                    on:mouseup={stopAutoMove}
                    on:mouseleave={stopAutoMove}
                    on:touchstart={() => startAutoMove(0, 1)}
                    on:touchend={stopAutoMove}
                    aria-label="Down">▼</button>
            </div>
        {/if}
    </div>
{/if}

<style>
    .wrap {
        width: 100%;
        height: 100%;
        position: relative;
        display: grid;
        place-items: center;
        padding: 16px;
        box-sizing: border-box;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        overflow: hidden;
    }

    .stageHolder { display: grid; place-items: center; }

    .stage {
        position: relative;
        overflow: hidden;
        user-select: none;
        pointer-events: none;
    }

    .mazeOverlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: fill;
        pointer-events: none;
        user-select: none;
        z-index: 5;
    }

    .walls {
        position: absolute;
        inset: 0;
        z-index: 8;
        pointer-events: none;
    }
    .wall {
        position: absolute;
        background: transparent;
        border-radius: 3px;
    }

    .player {
        position: absolute;
        display: grid;
        place-items: center;
        pointer-events: none;
        z-index: 10;
    }

    .player img {
        width: 100%;
        height: 100%;
        user-select: none;
        transform: scale(var(--ps, 1));
    }

    .player.left img { transform: scaleX(-1) scale(var(--ps, 1)); }

    .fallback {
        width: 70%;
        height: 70%;
        border-radius: 12px;
        background: rgba(255, 0, 0, 0.6);
    }

    .finish {
        position: absolute;
        border-radius: 12px;
        outline: 3px solid rgba(46, 204, 113, 0.9);
        outline-offset: -6px;
        z-index: 9;
        pointer-events: none;
    }

    .grid { position: absolute; inset: 0; z-index: 30; pointer-events: none; }
    .cell { position: absolute; outline: 1px solid rgba(0,0,0,0.16); box-sizing: border-box; }
    .freeCell { background: rgba(0,255,0,0.05); }
    .wallCell { background: rgba(255,0,0,0.07); }
    .cell span {
        position: absolute;
        left: 4px; top: 3px;
        font-size: 10px;
        background: rgba(255,255,255,0.6);
        padding: 1px 4px;
        border-radius: 6px;
        color: #111;
    }

    .controls { display: none; }

    @media (pointer: coarse) and (hover: none) {
        .controls {
            position: absolute;
            right: 18px;
            bottom: 18px;
            display: grid;
            gap: 10px;
            justify-items: center;
            z-index: 60;
            pointer-events: auto;
        }
        .controls .row {
            display: flex;
            gap: 12px;
        }
        .controls button {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            border: 0;
            font-size: 22px;
            background: rgba(255,255,255,0.88);
            box-shadow: 0 8px 20px rgba(0,0,0,0.18);
        }
        .controls button:active {
            transform: scale(0.98);
        }
    }

    .debug {
        padding: 16px;
        background: rgba(0,0,0,0.06);
        border-radius: 12px;
        max-width: 900px;
        margin: 20px auto;
    }
    .debug pre {
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 12px;
    }
    .banner{
        position:absolute;
        top:10px;
        right:10px;
        z-index:999;
        background: rgba(0,0,0,0.6);
        color:#fff;
        padding:8px 12px;
        border-radius:10px;
        font-size:12px;
    }
    .overlay{
        position:absolute;
        inset:0;
        z-index:9999;
        display:grid;
        place-items:center;
        background: rgba(0,0,0,0.25);
    }

    .modal{
        width: min(520px, 92vw);
        padding: 26px 24px 22px;
        background: #ffffff;
        border-radius: 26px;
        border: 3px solid #ff8fb8;
        box-shadow: 0 18px 40px rgba(0,0,0,0.18);
        text-align: center;
    }

    .intro-text{
        margin: 0 0 18px;
        font-size: 18px;
        color: #333;
        font-weight: 500;
    }

    .ok-btn{
        min-width: 120px;
        padding: 10px 26px;
        border: none;
        border-radius: 999px;
        background: linear-gradient(180deg, #ff7fb3, #ff5fa2);
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 6px 0 #e94c8f;
    }

    .ok-btn:active{
        transform: translateY(2px);
        box-shadow: 0 4px 0 #e94c8f;
    }

    .pre-intro-scene {
        position: absolute;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.3);
    }

    .stairs-bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 1;
    }

    .lina-character {
        position: absolute;
        bottom: 15%;
        left: 10%;
        height: 50vh;
        width: auto;
        z-index: 2;
        animation: fadeInChar 0.5s ease-in;
    }

    .dialog-box {
        position: absolute;
        bottom: 20%;
        left: 25%;
        right: 10%;
        background: white;
        padding: 24px 28px;
        border-radius: 20px;
        border: 4px solid #ff8fb8;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
        z-index: 3;
        max-width: 600px;
    }

    .dialog-text {
        margin: 0 0 16px;
        font-size: 18px;
        line-height: 1.6;
        color: #333;
        min-height: 80px;
    }

    .cursor {
        animation: blink 1s infinite;
        color: #ff8fb8;
    }

    .continue-btn {
        padding: 10px 24px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(180deg, #ff7fb3, #ff5fa2);
        color: white;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 0 #e94c8f;
    }

    .continue-btn:active {
        transform: translateY(2px);
        box-shadow: 0 2px 0 #e94c8f;
    }

    @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
    }

    @keyframes fadeInChar {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .fade-black {
        position: absolute;
        inset: 0;
        background: black;
        z-index: 10001;
        animation: fadeBlack 1s ease-in-out;
    }

    @keyframes fadeBlack {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
    }

    .house-scene {
        position: absolute;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.3);
    }

    .house-bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 1;
    }

    .lina-thinking {
        position: absolute;
        bottom: 15%;
        right: 5%;
        height: 50vh;
        width: auto;
        z-index: 2;
        animation: fadeInChar 0.5s ease-in;
    }

    .dialog-box-right {
        position: absolute;
        bottom: 20%;
        right: 25%;
        left: 10%;
        max-width: 600px;
    }

    .maze-scene {
        position: absolute;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.3);
    }

    .maze-scene-bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 1;
    }

    .lina-scared {
        position: absolute;
        bottom: 15%;
        left: 10%;
        height: 50vh;
        width: auto;
        z-index: 2;
        animation: fadeInChar 0.5s ease-in;
    }

</style>