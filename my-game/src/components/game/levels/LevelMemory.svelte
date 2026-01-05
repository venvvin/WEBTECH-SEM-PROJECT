<script>
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import { gameTimer, forceMenuOpen } from '../../../stores/gameStore.js';
    import { saveBestTime, getBestTime } from '../../../utils/timerManager.js';

    export let data = {};
    const dispatch = createEventDispatcher();

    const cardIcons = [
        '/game/items/cardbanana.png',
        '/game/items/cardtennis.png',
        '/game/items/cardball.png'
    ];

    const cardBack = '/game/items/cardback.png';

    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let isChecking = false;

    let currentState = 'intro';
    let birdnatureSound = null;
    let cardgamemusicSound = null;

    let dialogText1 = "";
    let dialogFullText1 = "Hi! My name is Michael. You're late. The lesson is about to start. And I already know where we need to go";
    let dialogTypingIndex1 = 0;
    let dialogTypingComplete1 = false;

    let dialogText2 = "";
    let dialogFullText2 = "If you win the game against me, I'll show you where the classroom is.";
    let dialogTypingIndex2 = 0;
    let dialogTypingComplete2 = false;

    let michaelEndingText = "";
    let michaelEndingFullText = "You did great. You handled it quickly. Oh, and here's the bell. Let's hurry up";
    let michaelEndingTypingIndex = 0;
    let michaelEndingTypingComplete = false;

    let linaEndingText = "";
    let linaEndingFullText = "Hooray! I'll finally get to class. And Michael is a nice boy. Maybe we'll become friends...";
    let linaEndingTypingIndex = 0;
    let linaEndingTypingComplete = false;

    let finalNovelScene = 1;
    let finalNovelImages = [
        '/game/end/scene_1.png',
        '/game/end/scene_2.png',
        '/game/end/scene_3.png',
        '/game/end/scene_4.png',
        '/game/end/scene_5.png',
        '/game/end/scene_6.png'
    ];

    let finalNovelTexts = [
        {
            character: 'girl',
            text: "So, where do we go now?"
        },
        {
            character: 'boy',
            text: "It's right here, very close."
        },
        {
            character: 'boy',
            text: "Look, everyone is already waiting for us."
        },
        {
            character: 'girl',
            text: "Oh no, I'm scared. Why don't you go in first and I'll catch up with you?"
        },
        {
            character: 'teacher',
            text: "Hello! We've been waiting for you. Come to the board and introduce yourself to your classmates."
        },
        {
            character: 'girl',
            text: "Hi everyone! My name is Lina, I'm 8 years old. I'm very happy to meet all of you and I hope we can become good friends."
        },
        {
            character: 'classmates',
            text: "Lina, you're awesome! Of course we'll be friends with you!"
        },
        {
            character: 'girl',
            text: "Well, thank you for helping me get ready and get to school ."
        }
    ];

    let currentNovelText = "";
    let currentNovelTypingIndex = 0;
    let currentNovelTypingComplete = false;
    let currentNovelDialogIndex = 0;

    let joySound = null;
    let bellSound = null;
    let classroomSound = null;

    function stopAllSounds() {
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        if (birdnatureSound) {
            try {
                birdnatureSound.pause();
                birdnatureSound.currentTime = 0;
            } catch (e) {}
            birdnatureSound = null;
        }
        if (joySound) {
            try {
                joySound.pause();
                joySound.currentTime = 0;
            } catch (e) {}
            joySound = null;
        }
        if (cardgamemusicSound) {
            try {
                cardgamemusicSound.pause();
                cardgamemusicSound.currentTime = 0;
            } catch (e) {}
            cardgamemusicSound = null;
        }
        if (bellSound) {
            try {
                bellSound.pause();
                bellSound.currentTime = 0;
            } catch (e) {}
            bellSound = null;
        }
        if (classroomSound) {
            try {
                classroomSound.pause();
                classroomSound.currentTime = 0;
            } catch (e) {}
            classroomSound = null;
        }
        if (typeof window !== 'undefined' && window['_passwordMusicSound']) {
            try {
                window['_passwordMusicSound'].pause();
                window['_passwordMusicSound'].currentTime = 0;
                window['_passwordMusicSound'] = null;
            } catch (e) {}
        }
    }

    onMount(() => {
        stopAllSounds();
        startIntro();
    });

    onDestroy(() => {
        stopAllSounds();
    });

    function startIntro() {
        birdnatureSound = new Audio('/game/sfx/birdnature.wav');
        birdnatureSound.loop = true;
        birdnatureSound.play().catch(e => console.log('Audio play error:', e));

        setTimeout(() => {
            startTypingDialog1();
        }, 500);
    }

    function startTypingDialog1() {
        if (dialogTypingIndex1 < dialogFullText1.length) {
            dialogText1 = dialogFullText1.substring(0, dialogTypingIndex1 + 1);
            dialogTypingIndex1++;
            setTimeout(startTypingDialog1, 30);
        } else {
            dialogTypingComplete1 = true;
        }
    }

    function startTypingDialog2() {
        if (dialogTypingIndex2 < dialogFullText2.length) {
            dialogText2 = dialogFullText2.substring(0, dialogTypingIndex2 + 1);
            dialogTypingIndex2++;
            setTimeout(startTypingDialog2, 30);
        } else {
            dialogTypingComplete2 = true;
        }
    }

    function nextDialog() {
        if (currentState === 'intro') {
            currentState = 'dialog2';
            dialogText1 = "";
            dialogTypingIndex1 = 0;
            dialogTypingComplete1 = false;
            setTimeout(() => {
                startTypingDialog2();
            }, 500);
        } else if (currentState === 'dialog2') {
            currentState = 'game';
            initGame();
            startCardGameMusic();
        }
    }

    function startCardGameMusic() {
        cardgamemusicSound = new Audio('/game/sfx/cardgamemusic.wav');
        cardgamemusicSound.loop = true;
        cardgamemusicSound.play().catch(e => console.log('Audio play error:', e));
    }

    function startEnding() {
        if (birdnatureSound) {
            birdnatureSound.pause();
        }
        if (cardgamemusicSound) {
            cardgamemusicSound.pause();
            cardgamemusicSound = null;
        }
        currentState = 'michaelEnding';

        bellSound = new Audio('/game/sfx/bell.wav');
        bellSound.play().catch(e => console.log('Audio play error:', e));

        setTimeout(() => {
            startTypingMichaelEnding();
        }, 500);
    }

    function startTypingMichaelEnding() {
        if (michaelEndingTypingIndex < michaelEndingFullText.length) {
            michaelEndingText = michaelEndingFullText.substring(0, michaelEndingTypingIndex + 1);
            michaelEndingTypingIndex++;
            setTimeout(startTypingMichaelEnding, 30);
        } else {
            michaelEndingTypingComplete = true;
        }
    }

    function nextToLinaEnding() {
        currentState = 'linaEnding';
        michaelEndingText = "";
        michaelEndingTypingIndex = 0;
        michaelEndingTypingComplete = false;

        joySound = new Audio('/game/sfx/joy.wav');
        joySound.play().catch(e => console.log('Audio play error:', e));

        setTimeout(() => {
            startTypingLinaEnding();
        }, 500);
    }

    function startTypingLinaEnding() {
        if (linaEndingTypingIndex < linaEndingFullText.length) {
            linaEndingText = linaEndingFullText.substring(0, linaEndingTypingIndex + 1);
            linaEndingTypingIndex++;
            setTimeout(startTypingLinaEnding, 30);
        } else {
            linaEndingTypingComplete = true;
        }
    }

    function goToSchool() {
        currentState = 'finalNovel';
        finalNovelScene = 1;
        currentNovelDialogIndex = 0;
        currentNovelText = "";
        currentNovelTypingIndex = 0;
        currentNovelTypingComplete = false;


        classroomSound = new Audio('/game/sfx/classroom.wav');
        classroomSound.loop = true;
        classroomSound.play().catch(e => console.log('Audio play error:', e));

        startTypingNovelText();
    }

    function startTypingNovelText() {
        if (currentNovelTypingIndex < finalNovelTexts[currentNovelDialogIndex].text.length) {
            currentNovelText = finalNovelTexts[currentNovelDialogIndex].text.substring(0, currentNovelTypingIndex + 1);
            currentNovelTypingIndex++;
            setTimeout(startTypingNovelText, 30);
        } else {
            currentNovelTypingComplete = true;
        }
    }

    function nextNovelScene() {
        if (currentNovelDialogIndex < finalNovelTexts.length - 1) {
            currentNovelDialogIndex++;
            currentNovelText = "";
            currentNovelTypingIndex = 0;
            currentNovelTypingComplete = false;

            if (currentNovelDialogIndex === 2) finalNovelScene = 2;
            else if (currentNovelDialogIndex === 4) finalNovelScene = 3;
            else if (currentNovelDialogIndex === 5) finalNovelScene = 4;
            else if (currentNovelDialogIndex === 6) finalNovelScene = 5;
            else if (currentNovelDialogIndex === 7) finalNovelScene = 6;

            startTypingNovelText();
        } else {
            saveBestTime($gameTimer);
            dispatch('complete');
            setTimeout(() => {
                forceMenuOpen.set(true);
            }, 100);
        }
    }

    function initGame() {
        let items = [...cardIcons, ...cardIcons];
        items.sort(() => Math.random() - 0.5);

        cards = items.map((icon, index) => ({
            id: index,
            icon: icon,
            isFlipped: false,
            isMatched: false
        }));
    }

    function handleCardClick(card) {
        if (isChecking || card.isFlipped || card.isMatched) return;

        const flipSound = new Audio('/game/sfx/cardflip.wav');
        flipSound.play().catch(e => console.log('Audio play error:', e));

        card.isFlipped = true;
        cards = cards;
        flippedCards.push(card);

        if (flippedCards.length === 2) {
            checkForMatch();
        }
    }

    function checkForMatch() {
        isChecking = true;
        const [card1, card2] = flippedCards;

        if (card1.icon === card2.icon) {
            setTimeout(() => {
                card1.isMatched = true;
                card2.isMatched = true;
                flippedCards = [];
                isChecking = false;
                cards = cards;

                matchedPairs++;
                if (matchedPairs === cardIcons.length) {
                    setTimeout(() => {
                        startEnding();
                    }, 1000);
                }
            }, 500);
        } else {
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                flippedCards = [];
                isChecking = false;
                cards = cards;
            }, 1000);
        }
    }
</script>

{#if currentState === 'intro' || currentState === 'dialog2'}
    <div class="intro-scene">
        <img src="/game/backgrounds/school.png" class="intro-bg" alt="School" />
        <img src="/game/characters/Michael/base.png" class="michael-character" alt="Michael" />

        {#if currentState === 'intro'}
            <div class="dialog-box">
                <p class="dialog-text">{dialogText1}<span class="cursor">|</span></p>
                {#if dialogTypingComplete1}
                    <button class="continue-btn" on:click={nextDialog}>Continue</button>
                {/if}
            </div>
        {:else if currentState === 'dialog2'}
            <div class="dialog-box">
                <p class="dialog-text">{dialogText2}<span class="cursor">|</span></p>
                {#if dialogTypingComplete2}
                    <button class="continue-btn" on:click={nextDialog}>Continue</button>
                {/if}
            </div>
        {/if}
    </div>
{:else if currentState === 'michaelEnding'}
    <div class="intro-scene">
        <img src="/game/backgrounds/school.png" class="intro-bg" alt="School" />
        <img src="/game/characters/Michael/happy.png" class="michael-character" alt="Michael" />
        <div class="dialog-box">
            <p class="dialog-text">{michaelEndingText}<span class="cursor">|</span></p>
            {#if michaelEndingTypingComplete}
                <button class="continue-btn" on:click={nextToLinaEnding}>OK</button>
            {/if}
        </div>
    </div>
{:else if currentState === 'linaEnding'}
    <div class="intro-scene">
        <img src="/game/backgrounds/school.png" class="intro-bg" alt="School" />
        <img src="/game/characters/Lina/suit/happy.png" class="lina-character" alt="Lina" />
        <div class="dialog-box dialog-box-pink">
            <p class="dialog-text">{linaEndingText}<span class="cursor">|</span></p>
            {#if linaEndingTypingComplete}
                <button class="continue-btn continue-btn-pink" on:click={goToSchool}>Go to school</button>
            {/if}
        </div>
    </div>
{:else if currentState === 'finalNovel'}
    <div class="final-novel-scene">
        <img src={finalNovelImages[finalNovelScene - 1]} class="novel-bg" alt="Novel Scene {finalNovelScene}" />

        {#if finalNovelTexts[currentNovelDialogIndex].character === 'girl'}
            <div class="dialog-box dialog-box-pink">
                <p class="dialog-text">{currentNovelText}<span class="cursor">|</span></p>
                {#if currentNovelTypingComplete}
                    <button class="continue-btn continue-btn-pink" on:click={nextNovelScene}>
                        {currentNovelDialogIndex < finalNovelTexts.length - 1 ? 'Continue' : 'Finish'}
                    </button>
                {/if}
            </div>
        {:else if finalNovelTexts[currentNovelDialogIndex].character === 'boy'}
            <div class="dialog-box">
                <p class="dialog-text">{currentNovelText}<span class="cursor">|</span></p>
                {#if currentNovelTypingComplete}
                    <button class="continue-btn" on:click={nextNovelScene}>
                        {currentNovelDialogIndex < finalNovelTexts.length - 1 ? 'Continue' : 'Finish'}
                    </button>
                {/if}
            </div>
        {:else if finalNovelTexts[currentNovelDialogIndex].character === 'teacher'}
            <div class="dialog-box dialog-box-teacher">
                <p class="dialog-text">{currentNovelText}<span class="cursor">|</span></p>
                {#if currentNovelTypingComplete}
                    <button class="continue-btn continue-btn-teacher" on:click={nextNovelScene}>
                        {currentNovelDialogIndex < finalNovelTexts.length - 1 ? 'Continue' : 'Finish'}
                    </button>
                {/if}
            </div>
        {:else if finalNovelTexts[currentNovelDialogIndex].character === 'classmates'}
            <div class="dialog-box dialog-box-classmates">
                <p class="dialog-text">{currentNovelText}<span class="cursor">|</span></p>
                {#if currentNovelTypingComplete}
                    <button class="continue-btn continue-btn-classmates" on:click={nextNovelScene}>
                        {currentNovelDialogIndex < finalNovelTexts.length - 1 ? 'Continue' : 'Finish'}
                    </button>
                {/if}
            </div>
        {/if}
    </div>
{:else}
    <div class="memory-level">
        <div class="grid-container">
            {#each cards as card}
                <button
                        class="card"
                        class:flipped={card.isFlipped}
                        class:matched={card.isMatched}
                        on:click={() => handleCardClick(card)}
                >
                    <div class="card-inner">
                        <div class="card-front">
                            <img src={card.icon} alt="item" />
                        </div>
                        <div class="card-back">
                            <img src={cardBack} alt="card back" />
                        </div>
                    </div>
                </button>
            {/each}
        </div>
    </div>
{/if}

<style>
    .memory-level {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-image: url('/game/backgrounds/gameboard.png');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
    }

    .grid-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 26px;
        width: 80%;
        max-width: 650px;
    }

    .card {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        perspective: 1000px;
        aspect-ratio: 1 / 1;
    }

    .card-inner {
        position: relative;
        width: 100%;
        height: 100%;
        text-align: center;
        transition: transform 0.6s;
        transform-style: preserve-3d;
    }

    .card.flipped .card-inner,
    .card.matched .card-inner {
        transform: rotateY(180deg);
    }

    .card.matched .card-front img {
        border: 4px solid #4cd137;
        opacity: 0.7;
        border-radius: 10px;
    }

    .card-front, .card-back {
        position: absolute;
        width: 100%;
        height: 100%;
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .card-front {
        background: transparent;
        transform: rotateY(180deg);
    }

    .card-front img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .card-back {
        background: transparent;
    }

    .card-back img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .intro-scene, .final-novel-scene {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }

    .intro-bg, .novel-bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 1;
    }

    .michael-character {
        position: absolute;
        bottom: 15%;
        right: 5%;
        height: 50vh;
        width: auto;
        z-index: 2;
        animation: fadeInChar 0.5s ease-in;
    }

    .lina-character {
        position: absolute;
        bottom: 15%;
        right: 5%;
        height: 50vh;
        width: auto;
        z-index: 2;
        animation: fadeInChar 0.5s ease-in;
    }

    .dialog-box {
        position: absolute;
        bottom: 10%;
        left: 5%;
        right: 5%;
        background: white;
        padding: 16px 20px;
        border-radius: 15px;
        border: 3px solid #3498db;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
        z-index: 3;
        max-width: 450px;
    }

    .dialog-text {
        margin: 0 0 12px;
        font-size: 16px;
        line-height: 1.5;
        color: #333;
        min-height: 60px;
    }

    @media (max-width: 767px) {
        .dialog-box {
            bottom: 5%;
            left: 3%;
            right: 3%;
            padding: 12px 16px;
            max-width: 90%;
            border-width: 2px;
        }

        .dialog-text {
            font-size: 14px;
            min-height: 50px;
            margin: 0 0 10px;
        }

        .michael-character {
            bottom: 25%;
            height: 40vh;
        }
    }

    .cursor {
        animation: blink 1s infinite;
        color: #3498db;
    }

    .continue-btn {
        padding: 8px 20px;
        border: none;
        border-radius: 10px;
        background: linear-gradient(180deg, #5dade2, #3498db);
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 3px 0 #2980b9;
    }

    @media (max-width: 767px) {
        .continue-btn {
            padding: 6px 16px;
            font-size: 12px;
        }
    }

    .continue-btn:active {
        transform: translateY(2px);
        box-shadow: 0 2px 0 #2980b9;
    }

    .dialog-box-pink {
        border: 3px solid #ff8fb8;
    }

    .dialog-box-pink .cursor {
        color: #ff8fb8;
    }

    .continue-btn-pink {
        background: linear-gradient(180deg, #ff7fb3, #ff5fa2);
        box-shadow: 0 3px 0 #e94c8f;
    }

    .continue-btn-pink:active {
        box-shadow: 0 2px 0 #e94c8f;
    }

    .dialog-box-teacher {
        border: 3px solid #8e44ad;
    }

    .dialog-box-teacher .cursor {
        color: #8e44ad;
    }

    .continue-btn-teacher {
        background: linear-gradient(180deg, #9b59b6, #8e44ad);
        box-shadow: 0 3px 0 #732d91;
    }

    .continue-btn-teacher:active {
        box-shadow: 0 2px 0 #732d91;
    }

    .dialog-box-classmates {
        border: 3px solid #27ae60;
    }

    .dialog-box-classmates .cursor {
        color: #27ae60;
    }

    .continue-btn-classmates {
        background: linear-gradient(180deg, #2ecc71, #27ae60);
        box-shadow: 0 3px 0 #219653;
    }

    .continue-btn-classmates:active {
        box-shadow: 0 2px 0 #219653;
    }

    @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
    }

    @keyframes fadeInChar {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
</style>