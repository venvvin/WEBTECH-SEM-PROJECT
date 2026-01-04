<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { hearts, currentLevelIndex } from "../../../stores/gameStore.js";

    export let data;
    const dispatch = createEventDispatcher();

    const cfg = data?.config ?? {};
    const ui = cfg?.ui ?? {};
    const rules = cfg?.rules ?? {};
    const layout = cfg?.layout ?? {};

    const BASE_W = layout?.baseSize?.w ?? 1920;
    const BASE_H = layout?.baseSize?.h ?? 1080;

    let viewportEl;
    let vw = 1;
    let vh = 1;
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    function recalc() {
        if (!viewportEl) return;
        const r = viewportEl.getBoundingClientRect();
        vw = r.width || 1;
        vh = r.height || 1;

        const sx = vw / BASE_W;
        const sy = vh / BASE_H;
        scale = Math.max(sx, sy);

        offsetX = (vw - BASE_W * scale) / 2;
        offsetY = (vh - BASE_H * scale) / 2;
    }

    onMount(() => {
        recalc();
        const ro = new ResizeObserver(recalc);
        ro.observe(viewportEl);
        return () => ro.disconnect();
    });

    function toStagePoint(clientX, clientY) {
        const r = viewportEl.getBoundingClientRect();
        const x = (clientX - r.left - offsetX) / scale;
        const y = (clientY - r.top - offsetY) / scale;
        return { x, y };
    }

    const stations = cfg?.stations ?? {};
    const Z = {
        fridge: stations.fridgeZoneId ?? "fridge_zone",
        board: stations.boardZoneId ?? "board_zone",
        plate: stations.plateZoneId ?? "plate_zone",
    };

    const strictOrder = cfg?.recipe?.strictOrder ?? true;
    const steps = cfg?.recipe?.steps ?? [];
    let stepIndex = 0;
    $: currentStep = steps[stepIndex];

    let showStartPopup = !!ui?.showStepPopupAtStart;
    let showRetryPopup = false;

    const maxMistakes = rules?.maxMistakesBeforeFail ?? 2;
    const penalty = rules?.mistakePenaltyHearts ?? 1;
    let heartsLocal = maxMistakes + 1;

    $: if (heartsLocal <= 0 && rules?.restartOnFail && ($currentLevelIndex === 0 || $hearts > 0)) {
        showRetryPopup = true;
    }

    let taps = 0;

    const soundMap = cfg?.sounds ?? {};
    const audioCache = new Map();
    function playSound(keyOrPath) {
        if (!keyOrPath) return;
        const path = soundMap[keyOrPath] ?? keyOrPath;
        if (!path) return;

        let a = audioCache.get(path);
        if (!a) {
            a = new Audio(path);
            audioCache.set(path, a);
        }
        try {
            a.currentTime = 0;
            a.play();
        } catch {}
    }

    function normalizeIngredients(list = []) {
        return list.map((ing) => ({
            id: ing.id,
            name: ing.name,
            image: ing.image,
            zone: ing.initialZone ?? Z.fridge,
            initiallyVisible: ing.initiallyVisible ?? true,
            transformOnCompleteStepId: ing.transformOnCompleteStepId ?? null,
            transformTo: ing.transformTo ?? null,
        }));
    }

    let items = normalizeIngredients(cfg?.ingredients ?? []);
    $: visibleItems = items.filter((i) => i.initiallyVisible !== false);

    function resetLevel() {
        if ($hearts <= 0 && $currentLevelIndex === 0) {
            dispatch("restartGame");
            return;
        }
        heartsLocal = maxMistakes + 1;
        stepIndex = 0;
        taps = 0;
        items = normalizeIngredients(cfg?.ingredients ?? []);
        showRetryPopup = false;
        showStartPopup = !!ui?.showStepPopupAtStart;
    }

    function failAction() {
        playSound("fail");
        heartsLocal = Math.max(0, heartsLocal - penalty);
        dispatch("mistake");
    }

    function moveItem(itemId, toZone) {
        items = items.map((it) => (it.id === itemId ? { ...it, zone: toZone } : it));
    }
    function hideItem(itemId) {
        items = items.map((it) => (it.id === itemId ? { ...it, initiallyVisible: false } : it));
    }
    function showItem(itemId) {
        items = items.map((it) => (it.id === itemId ? { ...it, initiallyVisible: true } : it));
    }

    function completeStep() {
        playSound("success");
        taps = 0;

        if (stepIndex >= steps.length - 1) {
            playSound("joy");
            setTimeout(() => playSound("clap"), 250);
            dispatch("complete");
            return;
        }
        stepIndex += 1;
    }

    function handleTapOnBoard(itemId) {
        if (strictOrder && currentStep?.action !== "tap") return failAction();
        if (strictOrder && itemId !== currentStep?.itemId) return failAction();

        const required = currentStep?.tapsRequired ?? 15;
        const tapSound = currentStep?.tapSound ?? "cut";
        playSound(tapSound);

        taps += 1;

        if (taps >= required) {
            const ing = items.find((i) => i.id === itemId);

            if (ing?.transformOnCompleteStepId && currentStep?.id === ing.transformOnCompleteStepId) {
                const tr = ing.transformTo;

                if (tr?.hideSelf) hideItem(itemId);

                if (tr?.showIngredientId) {
                    showItem(tr.showIngredientId);
                    // появится на той же зоне (board), где был целый
                    moveItem(tr.showIngredientId, ing.zone);
                }
            }

            completeStep();
        }
    }

    const zoneRects = layout?.zones ?? {};
    const fridgeSlots = layout?.fridgeSlots ?? {};
    const boardSlots = layout?.boardSlots ?? {};
    const plateSlots = layout?.plateSlots ?? {};
    const actors = layout?.actors ?? [];

    function rectStyle(r) {
        if (!r) return "";
        return `left:${r.x}px; top:${r.y}px; width:${r.w}px; height:${r.h}px;`;
    }

    function slotFor(item) {
        const id = item.id;
        if (item.zone === Z.fridge) return fridgeSlots[id];
        if (item.zone === Z.board) return boardSlots[id];
        if (item.zone === Z.plate) return plateSlots[id];
        return null;
    }

    let draggingId = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let dragStageX = 0;
    let dragStageY = 0;

    function onPointerDown(e, itemId) {
        if (
            currentStep?.action === "tap" &&
            itemId === currentStep?.itemId &&
            items.find((x) => x.id === itemId)?.zone === Z.board
        ) {
            e.preventDefault();
            handleTapOnBoard(itemId);
            return;
        }

        if (e.pointerType === "mouse" && e.button !== 0) return;

        const it = items.find((x) => x.id === itemId);
        if (!it) return;

        draggingId = itemId;

        const s = slotFor(it) ?? { x: 0, y: 0, w: 72, h: 72 };
        const p = toStagePoint(e.clientX, e.clientY);

        dragOffsetX = p.x - s.x;
        dragOffsetY = p.y - s.y;

        dragStageX = s.x;
        dragStageY = s.y;

        e.currentTarget.setPointerCapture?.(e.pointerId);
    }

    function onPointerMove(e) {
        if (!draggingId) return;

        const p = toStagePoint(e.clientX, e.clientY);
        dragStageX = p.x - dragOffsetX;
        dragStageY = p.y - dragOffsetY;
    }

    function inside(r, x, y) {
        return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    }

    function hitTestZone(stageX, stageY) {
        if (inside(zoneRects[Z.fridge], stageX, stageY)) return Z.fridge;
        if (inside(zoneRects[Z.board], stageX, stageY)) return Z.board;
        if (inside(zoneRects[Z.plate], stageX, stageY)) return Z.plate;
        return null;
    }

    function logicalDrop(itemId, zoneId) {
        if (strictOrder && currentStep?.action !== "drag") return failAction();

        const expectedItem = currentStep?.itemId;
        const expectedFrom = currentStep?.from;
        const expectedTo = currentStep?.to;

        const dragged = items.find((i) => i.id === itemId);
        const actualFrom = dragged?.zone;

        const okItem = !strictOrder || itemId === expectedItem;
        const okTo = !strictOrder || zoneId === expectedTo;
        const okFrom = !strictOrder || !expectedFrom || actualFrom === expectedFrom;

        if (!okItem || !okFrom || !okTo) return failAction();

        playSound("drop");
        moveItem(itemId, zoneId);
        completeStep();
    }

    function onPointerUp(e) {
        if (!draggingId) return;

        const p = toStagePoint(e.clientX, e.clientY);
        const zoneId = hitTestZone(p.x, p.y);

        const itemId = draggingId;
        draggingId = null;

        if (!zoneId) return failAction();
        logicalDrop(itemId, zoneId);
    }

    function itemStyle(item) {
        const s = slotFor(item) ?? { x: 0, y: 0, w: 72, h: 72 };
        const z = s.z ?? 10;

        if (draggingId === item.id) {
            return `left:${dragStageX}px; top:${dragStageY}px; width:${s.w}px; height:${s.h}px; z-index:9999;`;
        }

        return `left:${s.x}px; top:${s.y}px; width:${s.w}px; height:${s.h}px; z-index:${z};`;
    }

    function actorStyle(a) {
        if (a.anchor === "bottom") {
            return `left:${a.x}px; top:${a.y - a.h}px; width:${a.w}px; height:${a.h}px;`;
        }
        return `left:${a.x}px; top:${a.y}px; width:${a.w}px; height:${a.h}px;`;
    }
</script>

<div class="hud">
    <div class="checklist">
        <div class="title">{cfg?.checklist?.title ?? "Steps"}</div>
        <ol>
            {#each steps as s, i}
                <li class:done={i < stepIndex}>
                    <span class="mark">{i < stepIndex ? "✓" : "○"}</span>
                    <span class="txt">{s.text}</span>
                </li>
            {/each}
        </ol>
    </div>
</div>

<div
        class="viewport"
        bind:this={viewportEl}
        on:pointermove={onPointerMove}
        on:pointerup={onPointerUp}
>
    <div
            class="stage"
            style={`width:${BASE_W}px; height:${BASE_H}px; transform: translate(-50%, -50%) scale(${scale});`}
    >
        <img class="bg" src={cfg.background} alt="kitchen" draggable="false" />

        {#each actors as a (a.id)}
            <img class="actor" src={a.image} alt={a.id} style={actorStyle(a)} draggable="false" />
        {/each}

        <div class="zone-overlay fridge" style={rectStyle(zoneRects[Z.fridge])}></div>
        <div class="zone-overlay board" style={rectStyle(zoneRects[Z.board])}>
            {#if currentStep?.action === "tap" && currentStep?.tapsRequired}
                <div class="tapbar-overlay">
                    <div class="taptext">{taps}/{currentStep.tapsRequired}</div>
                    <div class="bar">
                        <div
                                class="fill"
                                style={`width:${Math.min(100, (taps / currentStep.tapsRequired) * 100)}%`}
                        ></div>
                    </div>
                </div>
            {/if}
        </div>
        <div class="zone-overlay plate" style={rectStyle(zoneRects[Z.plate])}></div>

        {#each visibleItems as it (it.id)}
            <img
                    class="item-abs"
                    style={itemStyle(it)}
                    src={it.image}
                    alt={it.name}
                    on:pointerdown={(e) => onPointerDown(e, it.id)}
                    draggable="false"
            />
        {/each}
    </div>
</div>

{#if showStartPopup}
    <div class="modal">
        <div class="card">
            {#if ui?.stepPopup?.characterImage}
                <img class="char" src={ui.stepPopup.characterImage} alt="Lina" />
            {/if}
            <div class="h">{ui?.stepPopup?.title ?? "Tip"}</div>
            <div class="p">
                {#each (ui?.stepPopup?.lines ?? [data?.instruction ?? ""]) as line}
                    <div>{line}</div>
                {/each}
            </div>
            <button on:click={() => (showStartPopup = false)}>OK</button>
        </div>
    </div>
{/if}

{#if showRetryPopup}
    <div class="modal">
        <div class="card">
            <div class="h">{ui?.retryPopup?.title ?? "Try again"}</div>
            <div class="p">{ui?.retryPopup?.text ?? "Mistake. Try again."}</div>
            <button on:click={resetLevel}>Restart</button>
        </div>
    </div>
{/if}

<style>
    .viewport {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: transparent;
        touch-action: none;
    }

    .stage {
        position: absolute;
        left: 50%;
        top: 50%;
        transform-origin: center center;
    }

    .bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        user-select: none;
        pointer-events: none;
    }

    .actor {
        position: absolute;
        object-fit: contain;
        z-index: 3;
        pointer-events: none;
        user-select: none;
    }

    .zone-overlay {
        position: absolute;
        z-index: 2;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.10);
        border: 2px solid rgba(0, 0, 0, 0.08);
    }

    .item-abs {
        position: absolute;
        object-fit: contain;
        cursor: grab;
        user-select: none;
        touch-action: none;
    }

    .tapbar-overlay {
        position: absolute;
        left: 10px;
        bottom: 10px;
        width: 220px;
        background: rgba(0, 0, 0, 0.25);
        color: white;
        border-radius: 12px;
        padding: 10px;
        z-index: 50;
        pointer-events: none;
    }
    .taptext {
        font-weight: 800;
        margin-bottom: 6px;
    }
    .bar {
        height: 10px;
        background: rgba(255, 255, 255, 0.18);
        border-radius: 999px;
        overflow: hidden;
    }
    .fill {
        height: 100%;
        background: rgba(255, 255, 255, 0.55);
        width: 0%;
    }

    .hud {
        position: absolute;
        top: 12px;
        left: 12px;
        right: 12px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        z-index: 1000;
        pointer-events: none;
    }

    .checklist {
        background: rgba(0, 0, 0, 0.35);
        color: white;
        border-radius: 12px;
        padding: 8px 12px;
        max-width: 520px;
        margin-left: auto;
    }
    .checklist .title {
        font-weight: 800;
        margin-bottom: 6px;
    }
    .checklist ol {
        margin: 0;
        padding-left: 18px;
    }
    .checklist li {
        display: flex;
        gap: 8px;
        margin: 4px 0;
    }
    .checklist li.done .txt {
        text-decoration: line-through;
        opacity: 0.85;
    }
    .checklist .mark {
        width: 18px;
        display: inline-block;
    }

    .modal {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    }
    .card {
        width: min(520px, 92vw);
        background: white;
        border-radius: 18px;
        padding: 18px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }
    .card .h {
        font-size: 18px;
        font-weight: 900;
        margin-bottom: 8px;
    }
    .card .p {
        margin-bottom: 14px;
        line-height: 1.35;
    }
    .card button {
        border: 0;
        border-radius: 12px;
        padding: 10px 14px;
        cursor: pointer;
    }
    .char {
        width: 120px;
        height: 120px;
        object-fit: contain;
        display: block;
        margin-bottom: 10px;
    }

    @media (max-width: 900px) and (orientation: landscape) {
        .checklist {
            max-width: 320px;
            font-size: 12px;
        }
    }
</style>
