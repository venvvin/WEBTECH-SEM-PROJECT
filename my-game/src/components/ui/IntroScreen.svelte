<script>
    import { createEventDispatcher } from "svelte";

    export let intro; // { title, slides:[{image, lines:[] }], startButton }

    const dispatch = createEventDispatcher();
    let i = 0;

    $: slides = intro?.slides ?? [];
    $: cur = slides[i];

    function next() {
        if (i < slides.length - 1) i += 1;
        else dispatch("done");
    }

    function back() {
        if (i > 0) i -= 1;
    }
</script>

<div class="wrap">
    <h1 class="title">{intro?.title ?? "Intro"}</h1>

    {#if cur?.image}
        <img class="img" src={cur.image} alt="" draggable="false" />
    {/if}

    <div class="text">
        {#each (cur?.lines ?? []) as line}
            <p>{line}</p>
        {/each}
    </div>

    <div class="actions">
        {#if i > 0}
            <button class="btn ghost" on:click={back}>Back</button>
        {/if}

        <button class="btn" on:click={next}>
            {i < slides.length - 1 ? "Next" : (intro?.startButton ?? "Start")}
        </button>
    </div>
</div>

<style>
    .wrap {
        width: 100vw;
        height: 100vh;
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        place-items: center;
        gap: 14px;
        padding: 24px;
        background: #f0f8ff;
        text-align: center;
        box-sizing: border-box;
    }

    .title {
        margin: 0;
    }

    .img {
        max-width: min(820px, 92vw);
        max-height: 50vh;
        object-fit: contain;
        border-radius: 16px;
        user-select: none;
        pointer-events: none;
    }

    .text {
        max-width: 820px;
    }

    .text p {
        margin: 6px 0;
        font-size: 1.1rem;
    }

    .actions {
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: center;
    }

    .btn {
        padding: 12px 22px;
        font-size: 1.05rem;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        background: #3498db;
        color: white;
    }

    .ghost {
        background: transparent;
        color: #3498db;
        border: 2px solid #3498db;
    }
</style>
