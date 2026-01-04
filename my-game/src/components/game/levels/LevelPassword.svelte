<script>
    import { createEventDispatcher, onMount, onDestroy } from "svelte";

    export let data;
    const dispatch = createEventDispatcher();

    let currentState = 'terminal';
    let showTerminal = true;
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

    function stopAllSounds() {
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
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
                showTerminal = false;
                ringtoneSound = new Audio("/game/sfx/ringtone.wav");
                ringtoneSound.play().catch(() => {});
                
                setTimeout(() => {
                    currentState = 'message1';
                    playSound("/game/sfx/msg.wav");
                    passwordMusicSound = new Audio("/game/sfx/passwordmusic.wav");
                    passwordMusicSound.loop = true;
                    passwordMusicSound.play().catch(() => {});
                    
                    setTimeout(() => {
                        currentState = 'message2';
                        playSound("/game/sfx/msg.wav");
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

    onMount(() => {
        stopAllSounds();
        
        setTimeout(() => {
            currentState = 'text1';
            startTypingText1();
        }, 1000);
    });

    onDestroy(() => {
        if (ringtoneSound) {
            ringtoneSound.pause();
            ringtoneSound = null;
        }
        if (passwordMusicSound) {
            passwordMusicSound.pause();
            passwordMusicSound = null;
        }
    });
</script>

<div class="level-container">
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
    {:else if currentState === 'incoming'}
        <div class="incoming-screen">
            <img src="/game/backgrounds/incoming.png" class="bg" alt="Incoming Call" />
        </div>
    {:else if currentState === 'message1'}
        <div class="message-screen">
            <img src="/game/backgrounds/message1.png" class="bg" alt="Message 1" />
        </div>
    {:else if currentState === 'message2'}
        <div class="message-screen">
            <img src="/game/backgrounds/message2.png" class="bg" alt="Message 2" />
            <div class="password-input-placeholder">
                <p>Password input screen will be here</p>
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

    .password-input-placeholder {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.9);
        padding: 30px;
        border-radius: 15px;
        z-index: 200;
        text-align: center;
        border: 3px solid #3498db;
    }

    .password-input-placeholder p {
        font-size: 1.2rem;
        color: #555;
        margin: 0;
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
</style>

