<script>
    import { createEventDispatcher, onMount, onDestroy } from "svelte";

    export let data;
    const dispatch = createEventDispatcher();

    const WIRE_WIDTH = 3.0;
    const END_DOT_R = 1.6;
    const LEFT_HIT_R = 5.0;
    const RIGHT_HIT_R = 5.0;
    const TIP_PUSH_LEFT = 2.3;
    const TIP_PUSH_RIGHT = -2.0;
    const DEBUG = false;

    const VISIBLE_START_POINTS = true;
    const VISIBLE_END_POINTS = true;
    const POINT_R = 4.0;
    const POINT_OPACITY = 0.4;

    $: cfg = data?.config ?? {};
    $: taskBg = cfg?.background ?? "";
    $: sounds = cfg?.sounds ?? {};
    $: rules = cfg?.rules ?? {};
    $: mistakePenaltyHearts = Number(rules?.mistakePenaltyHearts ?? 1);

    const steps = [
        {
            type: "scene",
            image: "/game/story/enter_bus.png",
            speaker: "Driver",
            text: "Sorry, kid… the bus is stuck. The wires are fried and I can’t get it running. Everyone will have to walk today."
        },
        {
            type: "scene",
            image: "/game/story/driver_sad.png",
            speaker: "",
            text: "The driver slumps in the cabin, staring at the dashboard like it personally betrayed him."
        },
        {
            type: "scene",
            image: "/game/story/lina_help.png",
            speaker: "Lina",
            text: "Don't worry. I can fix it. Just tell me which wires go together."
        },
        {
            type: "scene",
            image: "/game/story/broken_wires.png",
            speaker: "",
            text: "The wiring panel is open. Connect the matching colors to restore power.",
            sound: "broken"
        },
        { type: "task" },
        {
            type: "scene",
            image: "/game/story/fixed_wires.png",
            speaker: "",
            text: "Click. Click. The connections hold. The bus hums back to life."
        },
        {
            type: "scene",
            image: "/game/story/driver_happy.png",
            speaker: "Driver",
            text: "You actually did it! Alright everyone, back on the bus. Next stop: school!"
        }
    ];

    let stepIndex = 0;
    let phase = "story";
    let levelFinished = false;

    let backgroundMusic = null;
    let userInteracted = false;
    let musicStarted = false;
    let brokenSoundPlayed = false;

    function goNext() {
        if (phase === "task") return;
        brokenSoundPlayed = false;

        if (stepIndex < steps.length - 1) {
            stepIndex++;
        }

        const s = steps[stepIndex];
        if (s?.type === "task") {
            phase = "task";
            updateRects();
            return;
        }

        if (phase === "after" && stepIndex === steps.length - 1) {
            finishLevel();
        }
    }

    function skip() {
        if (phase === "story") {
            const idx = steps.findIndex((s) => s.type === "task");
            if (idx >= 0) {
                stepIndex = idx;
                phase = "task";
                updateRects();
            }
            return;
        }

        if (phase === "after") {
            stepIndex = steps.length - 1;
            finishLevel();
        }
    }

    function finishLevel() {
        if (levelFinished) return;
        levelFinished = true;

        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic = null;
        }
        dispatch("complete");
    }

    function play(name) {
        const src = sounds?.[name];

        if (!src) {
            return null;
        }

        try {
            const audio = new Audio(src);

            if (name === "music") {
                audio.loop = true;
                audio.volume = 0.5;

                if (backgroundMusic) {
                    backgroundMusic.pause();
                }
                backgroundMusic = audio;
            } else {
                audio.volume = 0.7;
            }

            const playPromise = audio.play();

            if (playPromise) {
                playPromise.catch(() => {});
            }

            return audio;
        } catch (error) {
            return null;
        }
    }

    function startBackgroundMusic() {
        if (!musicStarted && sounds?.music) {
            musicStarted = true;
            play("music");
        }
    }

    function handleUserInteraction() {
        if (!userInteracted) {
            userInteracted = true;
            startBackgroundMusic();
        }
    }

    $: if (phase === "story" && stepIndex === 3 && !brokenSoundPlayed) {
        const currentStep = steps[stepIndex];
        if (currentStep?.sound === "broken") {
            setTimeout(() => {
                play("broken");
                brokenSoundPlayed = true;
            }, 300);
        }
    }

    let stageEl, imgEl;
    let stageRect = { left: 0, top: 0, width: 1, height: 1 };
    let imgBox = { left: 0, top: 0, width: 1, height: 1 };

    const leftOrder = ["yellow", "red", "blue"];
    const rightOrder = ["red", "blue", "yellow"];

    let leftPoints = [];
    let rightPoints = [];

    const BASE_XL = 22.0;
    const BASE_XR = 78.0;
    const Y_LEVELS = [12, 20, 28];

    const BASE_SCREEN_WIDTH = 1920;

    function updatePointsForScreen() {
        if (!stageEl) return;

        const screenWidth = stageRect.width;

        let baseXL = BASE_XL;
        let baseXR = BASE_XR;

        if (screenWidth > BASE_SCREEN_WIDTH) {
            const extraWidth = screenWidth - BASE_SCREEN_WIDTH;
            const adjustment = Math.min(10, extraWidth / 100);

            baseXL = BASE_XL - adjustment;
            baseXR = BASE_XR + adjustment;
        }

        leftPoints = leftOrder.map((color, i) => ({
            color,
            x: baseXL + TIP_PUSH_LEFT,
            y: Y_LEVELS[i]
        }));

        rightPoints = rightOrder.map((color, i) => ({
            color,
            x: baseXR + TIP_PUSH_RIGHT,
            y: Y_LEVELS[i]
        }));
    }

    function updateRects() {
        if (!stageEl) return;
        const s = stageEl.getBoundingClientRect();
        stageRect = { left: s.left, top: s.top, width: s.width || 1, height: s.height || 1 };

        if (!imgEl) {
            imgBox = { left: stageRect.left, top: stageRect.top, width: stageRect.width, height: stageRect.height };
            updatePointsForScreen();
            return;
        }

        const iw = imgEl.naturalWidth || 1;
        const ih = imgEl.naturalHeight || 1;

        const sw = stageRect.width;
        const sh = stageRect.height;

        const scale = Math.min(sw / iw, sh / ih);
        const drawnW = iw * scale;
        const drawnH = ih * scale;

        const offsetX = (sw - drawnW) / 2;
        const offsetY = (sh - drawnH) / 2;

        imgBox = {
            left: stageRect.left + offsetX,
            top: stageRect.top + offsetY,
            width: drawnW,
            height: drawnH
        };

        updatePointsForScreen();
    }

    function onTaskBgLoad() {
        updateRects();
    }

    function clamp(v, a, b) {
        return Math.max(a, Math.min(b, v));
    }

    function pointerToSvg(e) {
        updateRects();
        const px = (e.clientX - imgBox.left) / imgBox.width;
        const py = (e.clientY - imgBox.top) / imgBox.height;
        return { x: clamp(px * 100, 0, 100), y: clamp(py * 100, 0, 100) };
    }

    function dist2(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
    }

    function getLeft(color) {
        return leftPoints.find((p) => p.color === color);
    }

    function getRight(color) {
        return rightPoints.find((p) => p.color === color);
    }

    let connected = new Set();
    let active = null;

    function resetTask() {
        connected = new Set();
        active = null;
    }

    function startWire(color, e) {
        if (phase !== "task") return;
        if (connected.has(color)) return;

        const L = getLeft(color);
        if (!L) return;

        const end = pointerToSvg(e);
        active = { color, x1: L.x, y1: L.y, x2: end.x, y2: end.y };

        handleUserInteraction();

        try {
            e.currentTarget?.setPointerCapture?.(e.pointerId);
        } catch (_) {}
    }

    function onMove(e) {
        if (phase !== "task") return;
        if (!active) return;
        const end = pointerToSvg(e);
        active = { ...active, x2: end.x, y2: end.y };
    }

    function finishWire(e) {
        if (phase !== "task") return;
        if (!active) return;

        const end = pointerToSvg(e);
        const R = getRight(active.color);
        if (!R) {
            active = null;
            return;
        }

        const ok = dist2(end, R) <= RIGHT_HIT_R * RIGHT_HIT_R;

        if (ok) {
            connected.add(active.color);
            connected = new Set(connected);
            play("connect");
            active = null;

            if (connected.size === leftOrder.length) {
                play("success");
                phase = "after";
                stepIndex = Math.min(stepIndex + 1, steps.length - 1);
            }
        } else {
            active = null;
            play("fail");
            dispatch("mistake", { penalty: mistakePenaltyHearts });
        }
    }

    let lastId = null;
    $: if (data?.id && data.id !== lastId) {
        lastId = data.id;
        stepIndex = 0;
        phase = "story";
        levelFinished = false;
        resetTask();
        brokenSoundPlayed = false;
        userInteracted = false;
        musicStarted = false;

        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic = null;
        }
    }

    onMount(() => {
        updateRects();
        window.addEventListener("resize", updateRects);

        const startMusicOnInteraction = () => {
            handleUserInteraction();
        };

        document.addEventListener('click', startMusicOnInteraction, { once: true });
        document.addEventListener('touchstart', startMusicOnInteraction, { once: true });
        document.addEventListener('keydown', startMusicOnInteraction, { once: true });
    });

    onDestroy(() => {
        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic = null;
        }
        window.removeEventListener("resize", updateRects);
    });
</script>

<div class="root">
    {#if phase !== "task"}
        {@const s = steps[stepIndex]}
        {@const sceneSrc = s?.image || taskBg}

        <div class="novel" on:click={handleUserInteraction}>
            {#if sceneSrc}
                <img class="sceneImg" src={sceneSrc} alt="" draggable="false" />
            {:else}
                <div class="sceneFallback"></div>
            {/if}

            <div class="bubble">
                {#if s?.speaker}
                    <div class="speaker">{s.speaker}</div>
                {/if}
                <div class="text">{s?.text ?? ""}</div>

                <div class="actions">
                    <button class="btn ghost" on:click={skip}>Skip</button>
                    <button class="btn" on:click={goNext}>
                        {stepIndex < steps.length - 1 ? "Next" : "Finish"}
                    </button>
                </div>
            </div>
        </div>
    {:else}
        <div class="stage" bind:this={stageEl} on:pointermove={onMove} on:pointerup={finishWire}>
            {#if taskBg}
                <img class="bg" bind:this={imgEl} src={taskBg} alt="" on:load={onTaskBgLoad} draggable="false" />
            {/if}

            <svg class="wires" viewBox="0 0 100 100" preserveAspectRatio="none">
                {#each leftOrder as color (color)}
                    {#if connected.has(color)}
                        {@const L = getLeft(color)}
                        {@const R = getRight(color)}
                        {#if L && R}
                            <line class="wire" x1={L.x} y1={L.y} x2={R.x} y2={R.y} stroke={color} stroke-width={WIRE_WIDTH} stroke-linecap="round" opacity="0.95" />
                        {/if}
                    {/if}
                {/each}

                {#if active}
                    <line class="wire" x1={active.x1} y1={active.y1} x2={active.x2} y2={active.y2} stroke={active.color} stroke-width={WIRE_WIDTH} stroke-linecap="round" opacity="0.95" />
                    <circle class="wire" cx={active.x2} cy={active.y2} r={END_DOT_R} fill={active.color} opacity="0.95" />
                {/if}

                {#if VISIBLE_START_POINTS}
                    {#each leftPoints as p (p.color)}
                        <circle class="point left-point" cx={p.x} cy={p.y} r={POINT_R} fill={p.color} opacity={POINT_OPACITY} stroke="rgba(255,255,255,0.5)" stroke-width="0.5" />
                    {/each}
                {/if}

                {#if VISIBLE_END_POINTS}
                    {#each rightPoints as p (p.color)}
                        <circle class="point right-point" cx={p.x} cy={p.y} r={POINT_R} fill={p.color} opacity={POINT_OPACITY} stroke="rgba(255,255,255,0.5)" stroke-width="0.5" />
                    {/each}
                {/if}

                {#each leftPoints as p (p.color)}
                    <circle class="hit" cx={p.x} cy={p.y} r={LEFT_HIT_R} fill={DEBUG ? "rgba(0,255,0,0.35)" : "transparent"} on:pointerdown={(e) => startWire(p.color, e)} />
                {/each}

                {#each rightPoints as p (p.color)}
                    <circle class="target" cx={p.x} cy={p.y} r={RIGHT_HIT_R} fill={DEBUG ? "rgba(255,0,0,0.35)" : "transparent"} />
                {/each}
            </svg>
        </div>
    {/if}
</div>

<style>
    .root{
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000;
    }

    .novel{
        position: absolute;
        inset: 0;
        background: #000;
    }

    .sceneImg{
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        user-select: none;
        pointer-events: none;
    }

    .bubble{
        position: absolute;
        left: 18px;
        right: 18px;
        bottom: 18px;
        max-width: 980px;
        z-index: 999999;
        padding: 14px 16px;
        color: #fff;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(10px);
        border-radius: 18px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    }

    .speaker{
        font-weight: 800;
        font-size: 16px;
        margin-bottom: 6px;
        opacity: 0.95;
    }

    .text{
        font-size: 18px;
        line-height: 1.25;
        opacity: 0.98;
    }

    .actions{
        margin-top: 10px;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }

    .btn{
        border: 0;
        padding: 9px 14px;
        border-radius: 12px;
        background: rgba(255,255,255,0.18);
        color: #fff;
        cursor: pointer;
        font-weight: 700;
    }

    .btn:hover{ background: rgba(255,255,255,0.26); }
    .btn.ghost{ background: rgba(255,255,255,0.10); }

    .stage{
        position: absolute;
        inset: 0;
        overflow: hidden;
        touch-action: none;
        background: #000;
    }

    .bg{
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        user-select: none;
        pointer-events: none;
    }

    .wires{
        position: absolute;
        inset: 0;
        pointer-events: auto;
    }

    .wire{ pointer-events: none; }
    .hit{ pointer-events: all; cursor: pointer; }
    .target{ pointer-events: none; }
    .point { pointer-events: none; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); }

    .sceneFallback{
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, #222, #000);
    }
</style>