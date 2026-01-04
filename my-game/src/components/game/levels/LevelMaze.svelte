<script>
    import { createEventDispatcher, onMount, onDestroy } from "svelte";

    export let data;

    const dispatch = createEventDispatcher();

    $: cfg = data?.config ?? {};
    $: m = cfg?.maze ?? {};

    $: bg = cfg?.background ?? "";
    $: mazeImage = cfg?.mazeImage ?? "";

    $: fromImage = m?.fromImage ?? "";
    $: imageGridW = Number(m?.imageGrid?.w ?? 0);
    $: imageGridH = Number(m?.imageGrid?.h ?? 0);
    $: threshold = Number(m?.threshold ?? 200);
    $: invert = !!m?.invert;

    $: gridWidth = fromImage && imageGridW ? imageGridW : Number(m?.gridWidth ?? 0);
    $: gridHeight = fromImage && imageGridH ? imageGridH : Number(m?.gridHeight ?? 0);

    $: cellSize = Number(m?.cellSize ?? 64);

    let cells = [];
    $: baseCells = m?.cells ?? [];

    $: start = m?.start ?? { x: 1, y: 1 };
    $: finish = m?.finish ?? { x: Math.max(1, gridWidth - 2), y: Math.max(1, gridHeight - 2) };

    $: playerImg = cfg?.player?.image ?? "";
    $: playerScale = Number(cfg?.player?.scale ?? 1);

    $: stageW = gridWidth * cellSize;
    $: stageH = gridHeight * cellSize;

    let showGrid = false;
    let showCoords = false;
    let tintCells = false;

    let x = 1;
    let y = 1;
    let direction = "down";

    function resetPlayerToStart() {
        x = Number.isFinite(start?.x) ? Number(start.x) : 1;
        y = Number.isFinite(start?.y) ? Number(start.y) : 1;
        direction = "down";
    }

    let isCoarsePointer = false;
    let mq;

    function updatePointer() {
        isCoarsePointer = !!mq?.matches;
        recomputeScale();
    }

    $: showMobile =
        (cfg?.controls?.mobile ?? "onScreenArrows") === "onScreenArrows" &&
        isCoarsePointer;

    let wrapEl;
    let scale = 1;
    let ro;
    let showIntro = true;
    const introText =
        cfg?.ui?.introText ?? "Help Lina find the way to the bus!";
    const introButton =
        cfg?.ui?.introButton ?? "OK";

    function closeIntro() {
        showIntro = false;
    }
    function recomputeScale() {
        if (!wrapEl || !stageW || !stageH) return;

        const r = wrapEl.getBoundingClientRect();
        const padding = 16;
        const reservedForControls = showMobile ? 170 : 0;

        const availW = Math.max(1, r.width - padding * 2);
        const availH = Math.max(1, r.height - padding * 2 - reservedForControls);

        const s = Math.min(availW / stageW, availH / stageH);
        scale = Math.min(1, Math.max(0.2, s));
    }

    function cellAt(cx, cy) {
        if (!cells?.length) return 1;

        if (cy < 0 || cy >= gridHeight || cx < 0 || cx >= gridWidth) return 1;

        const row = cells[cy];
        if (!row) return 1;

        return row[cx] ?? 1;
    }

    function setDir(dx, dy) {
        if (dx === 1) direction = "right";
        else if (dx === -1) direction = "left";
        else if (dy === 1) direction = "down";
        else if (dy === -1) direction = "up";
    }

    function tryMove(dx, dy) {
        setDir(dx, dy);

        const nx = x + dx;
        const ny = y + dy;


        if (cellAt(nx, ny) === 1) {
            return;
        }

        x = nx;
        y = ny;

        const FINISH_RADIUS = 1;

        if (
            Math.abs(x - finish.x) <= FINISH_RADIUS &&
            Math.abs(y - finish.y) <= FINISH_RADIUS
        ) {
            dispatch("complete");
        }

    }


    function onKeyDown(e) {
        if (e.repeat) return;

        if (e.key === "ArrowLeft") tryMove(-1, 0);
        if (e.key === "ArrowRight") tryMove(1, 0);
        if (e.key === "ArrowUp") tryMove(0, -1);
        if (e.key === "ArrowDown") tryMove(0, 1);

        if (e.key === "g") showGrid = !showGrid;
        if (e.key === "c") showCoords = !showCoords;
        if (e.key === "t") tintCells = !tintCells;
    }

    function preventScrollKeys(e) {
        const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
        if (keys.includes(e.key)) e.preventDefault();
    }

    function buildCellsFromImage(src, gw, gh, thr = 200, inv = false) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = src;

            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = gw;
                canvas.height = gh;

                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                ctx.imageSmoothingEnabled = true;

                ctx.drawImage(img, 0, 0, gw, gh);

                const { data } = ctx.getImageData(0, 0, gw, gh);

                const out = Array.from({ length: gh }, () => Array(gw).fill(1));

                for (let yy = 0; yy < gh; yy++) {
                    for (let xx = 0; xx < gw; xx++) {
                        const i = (yy * gw + xx) * 4;
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];

                        const brightness = (r + g + b) / 3;

                        let isWall = brightness < thr;
                        if (inv) isWall = !isWall;

                        out[yy][xx] = isWall ? 1 : 0;
                    }
                }

                resolve(out);
            };

            img.onerror = (e) => reject(e);
        });
    }

    let lastLoadKey = "";

    $: void loadCells();

    onMount(() => {
        mq = window.matchMedia("(pointer: coarse)");
        updatePointer();

        if (mq.addEventListener) mq.addEventListener("change", updatePointer);
        else mq.addListener(updatePointer);

        ro = new ResizeObserver(recomputeScale);
        ro.observe(wrapEl);
        recomputeScale();
        window.addEventListener("orientationchange", recomputeScale);

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keydown", preventScrollKeys, { passive: false });
    });

    onDestroy(() => {
        if (mq) {
            if (mq.removeEventListener) mq.removeEventListener("change", updatePointer);
            else mq.removeListener(updatePointer);
        }
        if (ro) ro.disconnect();

        window.removeEventListener("orientationchange", recomputeScale);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keydown", preventScrollKeys);
    });

    $: px = x * cellSize;
    $: py = y * cellSize;

    let mazeReady = false;
    let mazeLoadError = "";

    async function loadCells() {
        mazeReady = false;
        mazeLoadError = "";

        if (fromImage && gridWidth && gridHeight) {
            try {
                cells = await buildCellsFromImage(fromImage, gridWidth, gridHeight, threshold, invert);
                mazeReady = true;
                resetPlayerToStart();
                recomputeScale();
                return;
            } catch (e) {
                console.error("Failed to build maze from image:", fromImage, e);
                mazeLoadError = "Image load failed: " + fromImage;
            }
        }

        cells = baseCells;
        mazeReady = !!cells?.length;
        resetPlayerToStart();
    }

</script>

{#if !gridWidth || !gridHeight || !stageW || !stageH}
    <div class="debug">
        <h3>Maze config missing</h3>
        <pre>{JSON.stringify(m, null, 2)}</pre>
    </div>
{:else}
    <div class="wrap" bind:this={wrapEl} style="background-image:url('{bg}')">
        {#if !mazeReady}
            <div class="banner">
                Loading maze… {mazeLoadError}
            </div>
        {/if}
        {#if showIntro}
            <div class="overlay">
                <div class="modal">
                    <p class="intro-text">{introText}</p>
                    <button class="ok-btn" on:click={closeIntro}>OK</button>
                </div>
            </div>
        {/if}


        <div class="stageHolder" style="width:{stageW * scale}px; height:{stageH * scale}px;">
            <div
                    class="stage"
                    style="
                    width:{stageW}px;
                    height:{stageH}px;
                    transform: scale({scale});
                    transform-origin: top left;
                "
            >
                {#if mazeImage}
                    <img
                            class="mazeOverlay"
                            src={mazeImage}
                            alt="maze"
                            draggable="false"
                    />
                {/if}

                <div class="walls">
                    {#each Array(gridHeight) as _, yy}
                        {#each Array(gridWidth) as _, xx}
                            {#if cellAt(xx, yy) === 1}
                                <div
                                        class="wall"
                                        style="
                                        left:{xx * cellSize}px;
                                        top:{yy * cellSize}px;
                                        width:{cellSize}px;
                                        height:{cellSize}px;
                                    "
                                />
                            {/if}
                        {/each}
                    {/each}
                </div>

                <div
                        class="finish"
                        style="
                        left:{finish.x * cellSize}px;
                        top:{finish.y * cellSize}px;
                        width:{cellSize}px;
                        height:{cellSize}px;
                    "
                />

                <div
                        class="player {direction}"
                        style="
                        left:{px}px;
                        top:{py}px;
                        width:{cellSize * 1.2}px;
                        height:{cellSize * 1.2}px;
                        --ps:{playerScale};
                    "
                >
                    {#if playerImg}
                        <img src={playerImg} alt="player" draggable="false" />
                    {:else}
                        <div class="fallback"></div>
                    {/if}
                </div>

                {#if showGrid}
                    <div class="grid">
                        {#each Array(gridHeight) as _, yy}
                            {#each Array(gridWidth) as _, xx}
                                <div
                                        class="cell {tintCells ? (cellAt(xx, yy) === 1 ? 'wallCell' : 'freeCell') : ''}"
                                        style="
                                        left:{xx * cellSize}px;
                                        top:{yy * cellSize}px;
                                        width:{cellSize}px;
                                        height:{cellSize}px;
                                    "
                                >
                                    {#if showCoords}
                                        <span>{xx},{yy}</span>
                                    {/if}
                                </div>
                            {/each}
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        {#if showMobile}
            <div class="controls" aria-label="Mobile controls">
                <button on:click={() => tryMove(0, -1)} aria-label="Up">▲</button>
                <div class="row">
                    <button on:click={() => tryMove(-1, 0)} aria-label="Left">◀</button>
                    <button on:click={() => tryMove(1, 0)} aria-label="Right">▶</button>
                </div>
                <button on:click={() => tryMove(0, 1)} aria-label="Down">▼</button>
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
            left: 0; right: 0;
            bottom: 18px;
            display: grid;
            gap: 10px;
            justify-items: center;
            z-index: 60;
            pointer-events: auto;
        }
        .controls .row { display: flex; gap: 12px; }
        .controls button {
            width: 64px; height: 64px;
            border-radius: 16px;
            border: 0;
            font-size: 22px;
            background: rgba(255,255,255,0.88);
            box-shadow: 0 8px 20px rgba(0,0,0,0.18);
        }
        .controls button:active { transform: scale(0.98); }
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