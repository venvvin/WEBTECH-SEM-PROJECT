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
    let introVisible = true;
    const welcomeMessage =
        config?.ui?.introText ?? "Help Lina find the way to the bus!";
    const welcomeButtonText =
        config?.ui?.introButton ?? "OK";

    function dismissIntro() {
        introVisible = false;
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

    function handleKeyboardInput(event) {
        if (event.repeat) return;

        if (event.key === "ArrowLeft") {
            attemptMovement(-1, 0);
        }
        if (event.key === "ArrowRight") {
            attemptMovement(1, 0);
        }
        if (event.key === "ArrowUp") {
            attemptMovement(0, -1);
        }
        if (event.key === "ArrowDown") {
            attemptMovement(0, 1);
        }

        if (event.key === "g") {
            debugGrid = !debugGrid;
        }
        if (event.key === "c") {
            debugCoordinates = !debugCoordinates;
        }
        if (event.key === "t") {
            debugTint = !debugTint;
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
        window.removeEventListener("keydown", blockArrowKeyScrolling);
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
        {#if !mazeInitialized}
            <div class="banner">
                Loading maze… {initializationError}
            </div>
        {/if}
        {#if introVisible}
            <div class="overlay">
                <div class="modal">
                    <p class="intro-text">{welcomeMessage}</p>
                    <button class="ok-btn" on:click={dismissIntro}>OK</button>
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
                        width:{cellSize * 1.8}px;
                        height:{cellSize * 1.8}px;
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
                <button on:click={() => attemptMovement(0, -1)} aria-label="Up">▲</button>
                <div class="row">
                    <button on:click={() => attemptMovement(-1, 0)} aria-label="Left">◀</button>
                    <button on:click={() => attemptMovement(1, 0)} aria-label="Right">▶</button>
                </div>
                <button on:click={() => attemptMovement(0, 1)} aria-label="Down">▼</button>
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



</style>