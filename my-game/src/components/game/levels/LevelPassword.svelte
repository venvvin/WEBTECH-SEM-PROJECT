<script>
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { hearts } from "../../../stores/gameStore.js";

    export let data;
    const dispatch = createEventDispatcher();
    
    $: data;

    const passwords = ["8XGHC4", "WO78QC", "LCXHG2"];
    let currentPasswordIndex = 0;
    let inputPassword = "";
    let timeLeft = 12;
    let timerInterval = null;
    let showError = false;

    let currentState = 'terminal';
    let text1 = "";
    let text1Full = "Need to pay the fare.";
    let text1TypingIndex = 0;
    let text1Complete = false;
    
    let text2 = "";
    let text2Full = "Lina takes out her card to pay and tries to tap it on the terminal";
    let text2TypingIndex = 0;
    let text2Complete = false;
    
    let text3 = "";
    let text3Full = "Oh no, it's asking for a password.";
    let text3TypingIndex = 0;
    let text3Complete = false;

    let ringtoneSound = null;
    let passwordMusicSound = null;

    // stop all audio and cleanup
    function stopAllSounds() {
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        if (passwordMusicSound) {
            try {
                passwordMusicSound.pause();
                passwordMusicSound.currentTime = 0;
            } catch (e) {}
            passwordMusicSound = null;
        }
        if (typeof window !== 'undefined' && window['_passwordMusicSound']) {
            try {
                window['_passwordMusicSound'].pause();
                window['_passwordMusicSound'].currentTime = 0;
            } catch (e) {}
            window['_passwordMusicSound'] = null;
        }
        if (ringtoneSound) {
            try {
                ringtoneSound.pause();
                ringtoneSound.currentTime = 0;
            } catch (e) {}
            ringtoneSound = null;
        }
    }

    function startTypingText1() {
        if (text1TypingIndex < text1Full.length) {
            text1 = text1Full.substring(0, text1TypingIndex + 1);
            text1TypingIndex++;
            setTimeout(startTypingText1, 30);
        } else {
            text1Complete = true;
            setTimeout(() => {
                currentState = 'text2';
                setTimeout(() => {
                    startTypingText2();
                }, 500);
            }, 5000);
        }
    }

    function startTypingText2() {
        if (text2TypingIndex < text2Full.length) {
            text2 = text2Full.substring(0, text2TypingIndex + 1);
            text2TypingIndex++;
            setTimeout(startTypingText2, 30);
        } else {
            text2Complete = true;
            setTimeout(() => {
                currentState = 'text3';
                setTimeout(() => {
                    startTypingText3();
                }, 500);
            }, 5000);
        }
    }

    function startTypingText3() {
        if (text3TypingIndex < text3Full.length) {
            text3 = text3Full.substring(0, text3TypingIndex + 1);
            text3TypingIndex++;
            setTimeout(startTypingText3, 30);
        } else {
            text3Complete = true;
            setTimeout(() => {
                currentState = 'incoming';
                ringtoneSound = new Audio("/game/sfx/ringtone.wav");
                ringtoneSound.play().catch(() => {});
                
                setTimeout(() => {
                    currentState = 'message1';
                    playSound("/game/sfx/msg.wav");
                    
                    setTimeout(() => {
                        currentState = 'message2';
                        playSound("/game/sfx/msg.wav");
                        passwordMusicSound = new Audio("/game/sfx/passwordmusic.wav");
                        passwordMusicSound.loop = true;
                        passwordMusicSound.volume = 0.7;
                        if (typeof window !== 'undefined') {
                            window['_passwordMusicSound'] = passwordMusicSound;
                        }
                        passwordMusicSound.play().catch(() => {});
                        setTimeout(() => {
                            currentState = 'password2';
                            startPasswordInput();
                        }, 6000);
                    }, 5000);
                }, 5500);
            }, 5000);
        }
    }

    function playSound(path) {
        if (!path) return;
        const audio = new Audio(path);
        audio.play().catch(() => {});
        return audio;
    }

    function resetLevel() {
        currentPasswordIndex = 0;
        inputPassword = "";
        timeLeft = 12;
        showError = false;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (passwordMusicSound) {
            passwordMusicSound.pause();
            passwordMusicSound = null;
        }
        if (ringtoneSound) {
            try {
                ringtoneSound.pause();
                ringtoneSound.currentTime = 0;
            } catch (e) {}
            ringtoneSound = null;
        }
        if (typeof window !== 'undefined' && window['_passwordMusicSound']) {
            try {
                window['_passwordMusicSound'].pause();
                window['_passwordMusicSound'].currentTime = 0;
            } catch (e) {}
            window['_passwordMusicSound'] = null;
        }
        currentState = 'message1';
        playSound("/game/sfx/msg.wav");
        setTimeout(() => {
            currentState = 'message2';
            playSound("/game/sfx/msg.wav");
            passwordMusicSound = new Audio("/game/sfx/passwordmusic.wav");
            passwordMusicSound.loop = true;
            passwordMusicSound.volume = 0.7;
            if (typeof window !== 'undefined') {
                window['_passwordMusicSound'] = passwordMusicSound;
            }
            passwordMusicSound.play().catch(() => {});
            setTimeout(() => {
                currentState = 'password2';
                startPasswordInput();
            }, 6000);
        }, 5000);
    }

    function handlePasswordError() {
        const heartsBeforeMistake = $hearts;
        playSound("/game/sfx/fail.wav");
        dispatch("mistake");
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (passwordMusicSound) {
            passwordMusicSound.pause();
            passwordMusicSound = null;
        }
        if (ringtoneSound) {
            try {
                ringtoneSound.pause();
                ringtoneSound.currentTime = 0;
            } catch (e) {}
            ringtoneSound = null;
        }
        
        if (heartsBeforeMistake > 1) {
            showError = true;
            setTimeout(() => {
                resetLevel();
            }, 3000);
        }
    }

    // start timer and reset password input
    function startPasswordInput() {
        inputPassword = "";
        timeLeft = 12;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                handlePasswordError();
            }
        }, 1000);
    }

    // masha will try to fix password validation
    function checkPassword() {
        if (inputPassword === passwords[currentPasswordIndex]) {
            playSound("/game/sfx/success.wav");
            currentPasswordIndex++;
            inputPassword = "";
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            
            if (currentPasswordIndex >= passwords.length) {
                playSound("/game/sfx/joy.wav");
                setTimeout(() => {
                    currentState = 'message5';
                    playSound("/game/sfx/msg.wav");
                    setTimeout(() => {
                        dispatch("complete");
                    }, 5000);
                }, 1000);
            } else {
                setTimeout(() => {
                    if (currentPasswordIndex === 1) {
                        currentState = 'message3';
                        playSound("/game/sfx/msg.wav");
                        setTimeout(() => {
                            currentState = 'password3';
                            startPasswordInput();
                        }, 6000);
                    } else if (currentPasswordIndex === 2) {
                        currentState = 'message4';
                        playSound("/game/sfx/msg.wav");
                        setTimeout(() => {
                            currentState = 'password4';
                            startPasswordInput();
                        }, 6000);
                    }
                }, 500);
            }
        } else if (inputPassword.length >= passwords[currentPasswordIndex].length) {
            handlePasswordError();
        }
    }

    // handle keyboard input
    function onKeyPress(key) {
        if (showError) return;
        if (key === 'BACKSPACE') {
            inputPassword = inputPassword.slice(0, -1);
        } else if (key === 'ENTER') {
            checkPassword();
        } else {
            inputPassword += key;
            if (inputPassword.length === passwords[currentPasswordIndex].length) {
                setTimeout(() => {
                    checkPassword();
                }, 200);
            }
        }
    }

    const keyboardKeys = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    $: emptyChars = passwords[currentPasswordIndex] ? Array.from({ length: passwords[currentPasswordIndex].length - inputPassword.length }) : [];

    onMount(() => {
        stopAllSounds();
        
        setTimeout(() => {
            currentState = 'text1';
            startTypingText1();
        }, 1000);
    });

    onDestroy(() => {
        stopAllSounds();
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    });
</script>

<div class="level-container">
    <!-- terminal scene: lina tries to pay, discovers password needed -->
    {#if currentState === 'terminal' || currentState === 'text1' || currentState === 'text2' || currentState === 'text3'}
        <div class="terminal-screen">
            <img src="/game/backgrounds/terminal_in_bus.png" class="bg" alt="Terminal" />
            
            {#if currentState === 'text1' || text1Complete}
                <div class="text-overlay">
                    <div class="text-bubble">
                        <p>{text1}</p>
                    </div>
                </div>
            {/if}
            
            {#if currentState === 'text2' || text2Complete}
                <div class="text-overlay">
                    <div class="text-bubble">
                        <p>{text2}</p>
                    </div>
                </div>
            {/if}
            
            {#if currentState === 'text3' || text3Complete}
                <div class="text-overlay">
                    <div class="text-bubble">
                        <p>{text3}</p>
                    </div>
                </div>
            {/if}
        </div>
    <!-- incoming call scene: phone rings -->
    {:else if currentState === 'incoming'}
        <div class="incoming-screen">
            <img src="/game/backgrounds/incoming.png" class="bg" alt="Incoming Call" />
        </div>
    <!-- message scenes: showing password hints via messages -->
    {:else if currentState === 'message1'}
        <div class="message-screen">
            <img src="/game/backgrounds/message1.png" class="bg" alt="Message 1" />
        </div>
    {:else if currentState === 'message2'}
        <div class="message-screen">
            <img src="/game/backgrounds/message2.png" class="bg" alt="Message 2" />
        </div>
    {:else if currentState === 'message3'}
        <div class="message-screen">
            <img src="/game/backgrounds/message3.png" class="bg" alt="Message 3" />
        </div>
    {:else if currentState === 'message4'}
        <div class="message-screen">
            <img src="/game/backgrounds/message4.png" class="bg" alt="Message 4" />
        </div>
    {:else if currentState === 'message5'}
        <div class="message-screen">
            <img src="/game/backgrounds/message5.png" class="bg" alt="Message 5" />
        </div>
    <!-- password input scene: typing minigame with timer -->
    {:else if currentState === 'password2' || currentState === 'password3' || currentState === 'password4'}
        <div class="password-screen">
            <div class="password-content">
                <div class="password-display">
                    <div class="password-input-field">
                        {#each inputPassword.split('') as char}
                            <span class="password-char">{char}</span>
                        {/each}
                        {#each emptyChars as _}
                            <span class="password-char empty">_</span>
                        {/each}
                    </div>
                    <div class="timer">Time: {timeLeft}s</div>
                </div>
                <div class="keyboard-container">
                    <div class="keyboard">
                        {#each keyboardKeys as row}
                            <div class="keyboard-row">
                                {#each row as key}
                                    <button class="key" on:click={() => onKeyPress(key)}>{key}</button>
                                {/each}
                            </div>
                        {/each}
                        <div class="keyboard-row">
                            <button class="key key-wide" on:click={() => onKeyPress('BACKSPACE')}>⌫</button>
                            <button class="key key-wide" on:click={() => onKeyPress('ENTER')}>ENTER</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    {#if showError}
        <div class="error-overlay">
            <div class="error-message">
                <p>Wrong password!</p>
                <p>Let's start the level again</p>
            </div>
        </div>
    {/if}
</div>

<style>
    .level-container {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        background: #fdfdfd;
    }

    .bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        background-color: #ffeef2;
        z-index: 0;
    }

    .terminal-screen,
    .incoming-screen,
    .message-screen {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .text-overlay {
        position: absolute;
        bottom: 15%;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        width: 80%;
        max-width: 600px;
    }

    .text-bubble {
        background: rgba(255, 255, 255, 0.95);
        padding: 20px 30px;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        border: 4px solid #ff90b3;
        text-align: center;
        animation: popIn 0.3s ease-out;
    }

    .text-bubble p {
        font-size: 1.3rem;
        color: #333;
        margin: 0;
        font-family: sans-serif;
        line-height: 1.5;
    }

    .password-screen {
        width: 100%;
        height: 100%;
        background: #2c3e50;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }

    .password-content {
        width: 100%;
        max-width: 800px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .password-display {
        width: 100%;
        margin-bottom: 40px;
    }

    .password-input-field {
        background: white;
        padding: 30px;
        border-radius: 15px;
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-bottom: 20px;
        min-height: 80px;
        align-items: center;
    }

    .password-char {
        font-size: 2.5rem;
        font-weight: bold;
        color: #2c3e50;
        min-width: 40px;
        text-align: center;
    }

    .password-char.empty {
        color: #bdc3c7;
    }

    .timer {
        text-align: center;
        color: white;
        font-size: 1.5rem;
        font-weight: bold;
    }

    .keyboard-container {
        width: 100%;
        display: flex;
        justify-content: center;
    }

    .keyboard {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .keyboard-row {
        display: flex;
        justify-content: center;
        gap: 8px;
    }

    .key {
        background: white;
        border: 2px solid #34495e;
        border-radius: 8px;
        padding: 15px 20px;
        font-size: 1.2rem;
        font-weight: bold;
        cursor: pointer;
        min-width: 50px;
        transition: all 0.1s;
    }

    .key:hover {
        background: #ecf0f1;
        transform: scale(1.05);
    }

    .key:active {
        background: #bdc3c7;
        transform: scale(0.95);
    }

    .key-wide {
        min-width: 120px;
    }

    .error-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }

    .error-message {
        background: white;
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        border: 4px solid #e74c3c;
    }

    .error-message p {
        font-size: 1.5rem;
        color: #e74c3c;
        margin: 10px 0;
        font-weight: bold;
    }

    @keyframes popIn {
        from {
            transform: translateX(-50%) scale(0.8);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) scale(1);
            opacity: 1;
        }
    }

    @media (max-width: 768px) {
        .password-screen {
            padding: 10px;
        }

        .password-content {
            width: 85%;
            max-width: 500px;
        }

        .password-display {
            margin-bottom: 20px;
        }

        .password-input-field {
            padding: 15px;
            gap: 8px;
            min-height: 60px;
        }

        .password-char {
            font-size: 1.5rem;
            min-width: 28px;
        }

        .timer {
            font-size: 1.1rem;
        }

        .keyboard-container {
            width: 100%;
        }

        .keyboard {
            gap: 4px;
        }

        .key {
            padding: 6px 8px;
            font-size: 0.8rem;
            min-width: 30px;
        }

        .key-wide {
            min-width: 80px;
        }

        .keyboard-row {
            gap: 3px;
        }
    }
</style>

