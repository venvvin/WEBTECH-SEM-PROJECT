<!-- src/lib/game/levels/LevelCooking.svelte -->
<script>
    import { createEventDispatcher } from "svelte";

    export let data; // one level from levels.json
    const dispatch = createEventDispatcher();

    const cfg = data?.config ?? {};
    const ui = cfg?.ui ?? {};
    const rules = cfg?.rules ?? {};
    const layout = cfg?.layout ?? {};

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
    let hearts = maxMistakes + 1;

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
        hearts = maxMistakes + 1;
        stepIndex = 0;
        taps = 0;
        items = normalizeIngredients(cfg?.ingredients ?? []);
        showRetryPopup = false;
        showStartPopup = !!ui?.showStepPopupAtStart;
    }

    function failAction() {
        playSound("fail");
        hearts = Math.max(0, hearts - penalty);
        if (hearts <= 0) showRetryPopup = true;
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

    function onDragStart(e, itemId) {
        e.dataTransfer.setData("text/plain", itemId);
    }
    function allowDrop(e) {
        e.preventDefault();
    }

    function handleDrop(e, zoneId) {
        e.preventDefault();
        const itemId = e.dataTransfer.getData("text/plain");
        if (!itemId) return;

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
                    // show slice
                    showItem(tr.showIngredientId);
                    // IMPORTANT: spawn slice in SAME zone as whole (board)
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

    function itemStyle(item) {
        const s = slotFor(item) ?? { x: 0, y: 0, w: 72, h: 72 };
        const z = s.z ?? 10;
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

<div class="scene">
    <img class="bg" src={cfg.background} alt="kitchen" draggable="false" />

    {#each actors as a (a.id)}
        <img class="actor" src={a.image} alt={a.id} style={actorStyle(a)} draggable="false" />
    {/each}

    <div
            class="zone-overlay fridge"
            style={rectStyle(zoneRects[Z.fridge])}
            on:dragover={allowDrop}
            on:drop={(e) => handleDrop(e, Z.fridge)}
    ></div>

    <div
            class="zone-overlay board"
            style={rectStyle(zoneRects[Z.board])}
            on:dragover={allowDrop}
            on:drop={(e) => handleDrop(e, Z.board)}
    >
        {#if currentStep?.action === "tap" && currentStep?.tapsRequired}
            <div class="tapbar-overlay">
                <div class="taptext">{taps}/{currentStep.tapsRequired}</div>
                <div class="bar">
                    <div class="fill" style={`width:${Math.min(100, (taps / currentStep.tapsRequired) * 100)}%`}></div>
                </div>
            </div>
        {/if}
    </div>

    <div
            class="zone-overlay plate"
            style={rectStyle(zoneRects[Z.plate])}
            on:dragover={allowDrop}
            on:drop={(e) => handleDrop(e, Z.plate)}
    ></div>

    {#each visibleItems as it (it.id)}
        <img
                class="item-abs"
                style={itemStyle(it)}
                src={it.image}
                alt={it.name}
                draggable="true"
                on:dragstart={(e) => onDragStart(e, it.id)}
                on:click={() => it.zone === Z.board && handleTapOnBoard(it.id)}
        />
    {/each}
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
    .scene { position: relative; width: 100%; height: 100%; overflow: hidden; }
    .bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

    .actor {
        position: absolute;
        object-fit: contain;
        z-index: 3;
        pointer-events: none;
    }

    .zone-overlay {
        position: absolute;
        z-index: 2;
        border-radius: 18px;
        background: rgba(255,255,255,0.12);
        border: 2px solid rgba(0,0,0,0.10);
    }

    .item-abs {
        position: absolute;
        object-fit: contain;
        cursor: grab;
        user-select: none;
    }

    .tapbar-overlay {
        position: absolute;
        left: 10px;
        bottom: 10px;
        width: 220px;
        background: rgba(0,0,0,0.25);
        color: white;
        border-radius: 12px;
        padding: 10px;
        z-index: 50;
    }
    .taptext { font-weight: 800; margin-bottom: 6px; }
    .bar { height: 10px; background: rgba(255,255,255,0.18); border-radius: 999px; overflow: hidden; }
    .fill { height: 100%; background: rgba(255,255,255,0.55); width: 0%; }

    .hud {
        position: absolute;
        top: 12px; left: 12px; right: 12px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        z-index: 100;
        pointer-events: none;
    }



    .checklist {
        background: rgba(0,0,0,0.35);
        color: white;
        border-radius: 12px;
        padding: 8px 12px;
        max-width: 520px;
        margin-left: auto;
    }
    .checklist .title { font-weight: 800; margin-bottom: 6px; }
    .checklist ol { margin: 0; padding-left: 18px; }
    .checklist li { display: flex; gap: 8px; margin: 4px 0; }
    .checklist li.done .txt { text-decoration: line-through; opacity: 0.85; }
    .checklist .mark { width: 18px; display: inline-block; }

    .modal {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
    }
    .card {
        width: min(520px, 92vw);
        background: white;
        border-radius: 18px;
        padding: 18px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
    }
    .card .h { font-size: 18px; font-weight: 900; margin-bottom: 8px; }
    .card .p { margin-bottom: 14px; line-height: 1.35; }
    .card button { border: 0; border-radius: 12px; padding: 10px 14px; cursor: pointer; }
    .char { width: 120px; height: 120px; object-fit: contain; display: block; margin-bottom: 10px; }
</style>
