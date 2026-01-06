<script>
    import { createEventDispatcher } from "svelte";

    export let intro;

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
        height: 100svh;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        padding: 16px;
        background: #f0f8ff;
        text-align: center;
        box-sizing: border-box;
        overflow-y: auto;
    }

    .actions {
        position: sticky;
        bottom: 0;
        width: 100%;
        padding: 12px 0;
        display: flex;
        gap: 12px;
        justify-content: center;
        background: linear-gradient(
                to top,
                #f0f8ff 70%,
                rgba(240, 248, 255, 0)
        );
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

    @media (min-width: 768px) {
        .wrap {
            gap: 18px;
            padding: 20px;
        }

        .title {
            font-size: 2rem;
        }

        .text p {
            margin: 8px 0;
            font-size: 1.25rem;
            line-height: 1.5;
        }

        .btn {
            padding: 12px 24px;
            font-size: 1.1rem;
        }
    }

    @media (min-width: 1200px) {
        .wrap {
            gap: 20px;
            padding: 24px;
        }

        .title {
            font-size: 2.2rem;
        }

        .text p {
            margin: 8px 0;
            font-size: 1.35rem;
            line-height: 1.5;
        }

        .btn {
            padding: 12px 26px;
            font-size: 1.15rem;
        }
    }
</style>
