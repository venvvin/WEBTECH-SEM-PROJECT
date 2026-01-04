<script>
    import { createEventDispatcher, onMount, onDestroy } from "svelte";

    export let data;
    const dispatch = createEventDispatcher();

    // ====== ТЮНИНГ ======
    const WIRE_WIDTH = 3.0;
    const END_DOT_R = 1.6;

    // ХИТБОКСЫ (МЕНЬШЕ, чтобы совпадало)
    const LEFT_HIT_R = 3.2;   // было 10 (огромно)
    const RIGHT_HIT_R = 3.6;  // было 6-8 (тоже многовато)

    // Сдвиг старта и финиша к кончику провода (в SVG процентах)
    const TIP_PUSH_LEFT = 2.3;   // двигаем старт правее (к кончику провода)
    const TIP_PUSH_RIGHT = -2.0; // двигаем цель левее (к кончику справа)

    const DEBUG = false; // true покажет кружки

    $: cfg = data?.config ?? {};
    $: bg = cfg?.background ?? "";

    $: rules = cfg?.rules ?? {};
    $: mistakePenaltyHearts = Number(rules?.mistakePenaltyHearts ?? 1);
    $: sounds = cfg?.sounds ?? {};

    function play(name) {
        const src = sounds?.[name];
        if (!src) return;
        try {
            const a = new Audio(src);
            a.volume = 0.9;
            const p = a.play();
            if (p && typeof p.catch === "function") p.catch(() => {});
        } catch (_) {}
    }

    // ====== rects for contain mapping ======
    let stageEl, imgEl;
    let stageRect = { left: 0, top: 0, width: 1, height: 1 };
    let imgBox = { left: 0, top: 0, width: 1, height: 1 };

    function updateRects() {
        if (!stageEl) return;
        const s = stageEl.getBoundingClientRect();
        stageRect = { left: s.left, top: s.top, width: s.width || 1, height: s.height || 1 };

        if (!imgEl) {
            imgBox = { left: stageRect.left, top: stageRect.top, width: stageRect.width, height: stageRect.height };
            return;
        }

        const iw = imgEl.naturalWidth || 1;
        const ih = imgEl.naturalHeight || 1;

        const sw = stageRect.width;
        const sh = stageRect.height;

        const scale = Math.min(sw / iw, sh / ih); // contain
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
    }

    function onBgLoad() { updateRects(); }

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function pointerToSvg(e) {
        updateRects();
        const px = (e.clientX - imgBox.left) / imgBox.width;
        const py = (e.clientY - imgBox.top) / imgBox.height;
        return { x: clamp(px * 100, 0, 100), y: clamp(py * 100, 0, 100) };
    }

    function dist2(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx*dx + dy*dy;
    }

    // ====== ПОЗИЦИИ (под твой арт) ======
    // Эти 5 чисел подгоняют совпадение
    const baseXL = 22.0;       // база слева
    const baseXR = 78.0;       // база справа
    const yLevels = [12, 20, 28];
    // уровни (yellow/red/blue слева)

    const leftOrder  = ["yellow", "red", "blue"];
    const rightOrder = ["red", "blue", "yellow"]; // как ты хочешь

    // точки с учётом "push" к наконечникам
    const leftPoints = leftOrder.map((color, i) => ({
        color,
        x: baseXL + TIP_PUSH_LEFT,
        y: yLevels[i]
    }));

    const rightPoints = rightOrder.map((color, i) => ({
        color,
        x: baseXR + TIP_PUSH_RIGHT,
        y: yLevels[i]
    }));

    function getLeft(color)  { return leftPoints.find(p => p.color === color); }
    function getRight(color) { return rightPoints.find(p => p.color === color); }

    // ====== state ======
    let connected = new Set();
    let active = null;

    function startWire(color, e) {
        if (connected.has(color)) return;
        const L = getLeft(color);
        if (!L) return;

        const end = pointerToSvg(e);
        active = { color, x1: L.x, y1: L.y, x2: end.x, y2: end.y };

        try { e.currentTarget?.setPointerCapture?.(e.pointerId); } catch (_) {}
    }

    function onMove(e) {
        if (!active) return;
        const end = pointerToSvg(e);
        active = { ...active, x2: end.x, y2: end.y };
    }

    function finishWire(e) {
        if (!active) return;

        const end = pointerToSvg(e);
        const R = getRight(active.color);
        if (!R) { active = null; return; }

        const ok = dist2(end, R) <= RIGHT_HIT_R * RIGHT_HIT_R;

        if (ok) {
            connected.add(active.color);
            connected = new Set(connected);
            play("connect");
            active = null;

            if (connected.size === leftOrder.length) {
                play("success");
                dispatch("complete");
            }
        } else {
            active = null;
            play("fail");
            dispatch("mistake", { penalty: mistakePenaltyHearts });
        }
    }

    $: if (data?.id) {
        connected = new Set();
        active = null;
    }

    onMount(() => {
        updateRects();
        window.addEventListener("resize", updateRects);
    });

    onDestroy(() => {
        window.removeEventListener("resize", updateRects);
    });
</script>

<div class="stage" bind:this={stageEl} on:pointermove={onMove} on:pointerup={finishWire}>
    {#if bg}
        <img class="bg" bind:this={imgEl} src={bg} alt="" on:load={onBgLoad} draggable="false" />
    {/if}

    <svg class="wires" viewBox="0 0 100 100" preserveAspectRatio="none">
        <!-- connected -->
        {#each leftOrder as color (color)}
            {#if connected.has(color)}
                {@const L = getLeft(color)}
                {@const R = getRight(color)}
                {#if L && R}
                    <line class="wire"
                          x1={L.x} y1={L.y}
                          x2={R.x} y2={R.y}
                          stroke={color}
                          stroke-width={WIRE_WIDTH}
                          stroke-linecap="round"
                          opacity="0.95"
                    />
                {/if}
            {/if}
        {/each}

        <!-- active -->
        {#if active}
            <line class="wire"
                  x1={active.x1} y1={active.y1}
                  x2={active.x2} y2={active.y2}
                  stroke={active.color}
                  stroke-width={WIRE_WIDTH}
                  stroke-linecap="round"
                  opacity="0.95"
            />
            <circle class="wire"
                    cx={active.x2} cy={active.y2}
                    r={END_DOT_R}
                    fill={active.color}
                    opacity="0.95"
            />
        {/if}

        <!-- LEFT hitboxes (маленькие и точные) -->
        {#each leftPoints as p (p.color)}
            <circle
                    class="hit"
                    cx={p.x} cy={p.y}
                    r={LEFT_HIT_R}
                    fill={DEBUG ? "rgba(0,255,0,0.35)" : "transparent"}
                    on:pointerdown={(e) => startWire(p.color, e)}
            />
        {/each}

        <!-- RIGHT targets -->
        {#each rightPoints as p (p.color)}
            <circle
                    class="target"
                    cx={p.x} cy={p.y}
                    r={RIGHT_HIT_R}
                    fill={DEBUG ? "rgba(255,0,0,0.35)" : "transparent"}
            />
        {/each}
    </svg>
</div>

<style>
    .stage{
        position: relative;
        width: 100%;
        height: 100%;
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
</style>
