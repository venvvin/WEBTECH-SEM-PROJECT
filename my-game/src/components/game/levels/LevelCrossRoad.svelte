<script>
    import { createEventDispatcher, onDestroy } from "svelte";

    export let data;
    const dispatch = createEventDispatcher();

    let cfg, lights, sounds, visuals, rules, button, background;

    $: {
        cfg = data?.config ?? {};
        lights = cfg?.lights ?? [
            { state: "red", durationMs: 2200 },
            { state: "yellow", durationMs: 900 },
            { state: "green", durationMs: 1600 }
        ];
        sounds = cfg?.sounds ?? {};
        visuals = cfg?.visuals ?? {};
        rules = cfg?.rules ?? {};
        button = cfg?.button ?? { label: "GO" };
        background = cfg?.background ?? "";
    }

    const steps = [
        {
            type: "scene",
            image: "/game/story/cross_road_1.png",
            speaker: "Lina",
            text: "Yay! I finally arrived at school!"
        },
        {
            type: "scene",
            image: "/game/story/cross_road_2.png",
            speaker: "Lina",
            text: "Can you help me cross the road safely?"
        },
        { type: "task" },
        {
            type: "scene",
            image: "/game/story/cross_road_4.png",
            speaker: "Lina",
            text: "Thank you! Thanks to you, I got to school safely."
        }
    ];

    let stepIndex = 0;
    let phase = "story";
    let gameFinished = false;

    let lightIndex = 0;
    let currentState = "red";
    let warningText = "";
    let timer = null;
    let canPress = true;

    function nextScene() {
        if (phase === "task" || gameFinished) return;

        stepIndex++;

        if (stepIndex >= steps.length) {
            finishLevel();
            return;
        }

        const step = steps[stepIndex];
        if (step.type === "task") {
            phase = "task";
            startTrafficLight();
        }
    }

    function skipToTask() {
        if (phase === "story") {
            stepIndex = steps.findIndex((s) => s.type === "task");
            if (stepIndex >= 0) {
                phase = "task";
                startTrafficLight();
            }
        }
    }

    function finishLevel() {
        if (gameFinished) return;
        gameFinished = true;
        stopTrafficLight();
        dispatch("complete");
    }

    function startTrafficLight() {
        stopTrafficLight();
        lightIndex = 0;
        currentState = lights[0]?.state || "red";
        canPress = true;
        scheduleNextLight();
    }

    function stopTrafficLight() {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }

    function scheduleNextLight() {
        if (timer) clearTimeout(timer);

        const light = lights[lightIndex] || lights[0];
        currentState = light.state || "red";

        const duration = Math.max(300, light.durationMs || 1000);

        timer = setTimeout(() => {
            lightIndex = (lightIndex + 1) % lights.length;
            scheduleNextLight();
        }, duration);
    }

    function playSound(soundName) {
        const src = sounds[soundName];
        if (!src) return;

        try {
            const audio = new Audio(src);
            audio.volume = 0.8;
            audio.play().catch(() => {});
        } catch (e) {
            console.log("Audio error:", e);
        }
    }

    function showWarning(msg) {
        warningText = msg || "Wait!";
        playSound("warning");

        setTimeout(() => {
            warningText = "";
        }, 800);
    }

    function handleMistake() {
        canPress = false;
        playSound("fail");

        dispatch("mistake", { penalty: 1 });

        setTimeout(() => {
            canPress = true;
        }, 1000);
    }

    function handleButtonClick() {
        if (!canPress) return;

        if (currentState === "green") {
            playSound("success");
            canPress = false;
            stopTrafficLight();

            phase = "after";
            stepIndex = steps.findIndex((s) => s.image === "/game/story/cross_road_4.png");
            if (stepIndex < 0) stepIndex = steps.length - 1;

            return;
        }

        if (currentState === "yellow") {
            showWarning(rules?.warningText || "Wait!");
            return;
        }

        handleMistake();
        showWarning("Wrong! -1 Heart");
    }

    let lastLevelId = null;
    $: if (data?.id && data.id !== lastLevelId) {
        lastLevelId = data.id;
        stepIndex = 0;
        phase = "story";
        gameFinished = false;
        warningText = "";
        canPress = true;
        stopTrafficLight();
    }

    onDestroy(() => {
        stopTrafficLight();
    });
</script>

<div class="game-container">
    {#if phase === "story" || phase === "after"}
        {@const step = steps[stepIndex]}
        {@const imgSrc = step?.image || background}

        <div class="novel-screen">
            {#if imgSrc}
                <img class="novel-image" src={imgSrc} alt="" draggable="false" />
            {/if}

            <div class="dialogue-box">
                {#if step?.speaker}
                    <div class="speaker-name">{step.speaker}</div>
                {/if}
                <div class="dialogue-text">{step?.text || ""}</div>

                <div class="dialogue-actions">
                    <button class="action-btn skip-btn" on:click={skipToTask}>
                        Skip
                    </button>
                    <button class="action-btn next-btn" on:click={nextScene}>
                        {stepIndex < steps.length - 1 ? "Next" : "Finish"}
                    </button>
                </div>
            </div>
        </div>
    {:else}
        <div class="game-screen">
            {#if background}
                <img class="game-background" src={background} alt="" draggable="false" />
            {/if}

            <div class="game-content">
                <div class="traffic-light-container">
                    <div class="traffic-light">
                        <div class="light red {currentState === 'red' ? 'active' : ''}"></div>
                        <div class="light yellow {currentState === 'yellow' ? 'active' : ''}"></div>
                        <div class="light green {currentState === 'green' ? 'active' : ''}"></div>
                    </div>
                </div>

                {#if warningText}
                    <div class="warning-message">{warningText}</div>
                {/if}

                <button class="action-button" on:click={handleButtonClick} disabled={!canPress}>
                    {#if button?.image}
                        <img src={button.image} alt={button.label} draggable="false" />
                    {:else}
                        {button.label}
                    {/if}
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .game-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000;
        -webkit-tap-highlight-color: transparent;
    }

    .novel-screen {
        position: absolute;
        inset: 0;
        background: #000;
    }

    .novel-image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        user-select: none;
        pointer-events: none;
        -webkit-user-drag: none;
    }

    .dialogue-box {
        position: absolute;
        left: 10px;
        right: 10px;
        bottom: 10px;
        max-width: 100%;
        z-index: 999999;
        padding: 12px 14px;
        color: #fff;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-radius: 16px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .speaker-name {
        font-weight: 800;
        font-size: 14px;
        margin-bottom: 4px;
        opacity: 0.95;
    }

    .dialogue-text {
        font-size: 16px;
        line-height: 1.3;
        opacity: 0.98;
        margin-bottom: 8px;
    }

    .dialogue-actions {
        margin-top: 8px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    }

    .action-btn {
        border: 0;
        padding: 8px 12px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        cursor: pointer;
        font-weight: 700;
        font-family: inherit;
        font-size: 14px;
        min-height: 36px;
        touch-action: manipulation;
    }

    .skip-btn {
        background: rgba(255, 255, 255, 0.1);
    }

    .next-btn {
        background: #4CAF50;
        color: white;
    }

    .action-btn:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    .game-screen {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    .game-background {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .game-content {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 22px;
        padding: 20px;
        box-sizing: border-box;
    }

    .traffic-light-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 420px;
    }

    .traffic-light {
        background: rgba(0, 0, 0, 0.7);
        border-radius: 24px;
        width: clamp(90px, 18vmin, 150px);
        padding: clamp(12px, 2.2vmin, 22px);
        gap: clamp(10px, 2vmin, 18px);
        display: flex;
        flex-direction: column;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 2px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    }

    .light {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 50%;
        opacity: 0.3;
        transition: all 0.25s ease;
        position: relative;
    }

    .light::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 50%;
        box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.5);
    }

    .light.active {
        opacity: 1;
        box-shadow: 0 0 30px currentColor;
    }

    .light.red {
        background: linear-gradient(145deg, #ff3333, #cc0000);
    }

    .light.yellow {
        background: linear-gradient(145deg, #ffff33, #cccc00);
    }

    .light.green {
        background: linear-gradient(145deg, #33ff33, #00cc00);
    }

    .warning-message {
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        padding: 10px 18px;
        border-radius: 20px;
        font-size: clamp(16px, 4.2vw, 22px);
        font-weight: 900;
        text-align: center;
        max-width: 80%;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);
    }

    .action-button {
        background: linear-gradient(145deg, #4CAF50, #2E7D32);
        color: white;
        border: none;
        border-radius: 16px;
        padding: clamp(8px, 1.8vmin, 14px);
        font-size: clamp(14px, 3.5vmin, 18px);
        font-weight: 900;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 120px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .action-button:active {
        transform: scale(0.95);
        background: linear-gradient(145deg, #3d8b40, #1b5e20);
    }

    .action-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    .action-button img {
        width: clamp(120px, 30vmin, 180px);
        height: auto;
    }

    @media (max-width: 480px) {
        .traffic-light-container {
            max-width: 260px;
        }

        .traffic-light {
            width: 110px;
            padding: 14px;
            gap: 12px;
            border-radius: 18px;
        }

        .light.active {
            box-shadow: 0 0 16px currentColor;
        }

        .dialogue-box {
            padding: 10px 12px;
            bottom: 8px;
            left: 8px;
            right: 8px;
        }

        .speaker-name {
            font-size: 13px;
        }

        .dialogue-text {
            font-size: 15px;
        }

        .action-btn {
            padding: 6px 10px;
            font-size: 13px;
            min-height: 32px;
        }
    }

    @media (max-width: 360px) {
        .traffic-light {
            transform: scale(0.9);
        }
    }

    @media (max-height: 600px) {
        .game-content {
            gap: 20px;
        }

        .traffic-light {
            padding: 15px;
            gap: 10px;
        }

        .action-button {
            padding: 10px 20px;
            min-height: 45px;
        }
    }
</style>