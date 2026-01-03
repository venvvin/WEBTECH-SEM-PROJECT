<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { hearts, characterOutfit } from '../../../stores/gameStore.js';
  
    const dispatch = createEventDispatcher();
    
    const images = {
        pajamas: '/game/characters/Lina/pajamas/thinking.png',
        school_uniform: '/game/characters/Lina/suit/thinking.png'
    };

    $: currentCharacterImage = images[$characterOutfit] || images.pajamas;
    
    const config = {
        fabric: '/game/items/fabric.png',
        character: {
          pajamas: '/game/characters/Lina/pajamas/thinking.png' 
      },
        backgrounds: {
            intro: '/game/backgrounds/wardrobeempty.png', 
            closed: '/game/backgrounds/wardrobeclosed.png',
            opened: '/game/backgrounds/wardrobeopened.png'
        },
        dialogs: {
            intro: "Hi! I need to get ready.",
            closed: "Let's choose an outfit!",
            opened: "Which one should I wear?",
            ironing: "It's wrinkled! Let's iron it."
        },
        outfits: [
            {
                id: 'dress',
                name: 'Evening Dress',
                thumb: '/game/items/dirty_dress.png',       
                fabricTexture: '/game/items/dirty_dress.png',
                isCorrect: false
            },
            {
                id: 'sport',
                name: 'Sporty Style',
                thumb: '/game/items/sport_suit.png',
                fabricTexture: '/game/items/sport_suit.png',
                isCorrect: false
            },
            {
                id: 'school',
                name: 'School Uniform',
                thumb: '/game/items/school_suit.png',
                fabricTexture: '/game/items/school_suit.png',
                isCorrect: true
            }
        ]
    };
    
    let state = 'intro'; 
    let selectedOutfit = null;
  
    let canvas;
    let ctx;
    let isDrawing = false;
    let ironingProgress = 0;
    let ironingAudio = null;

    function playSound(path) {
        if (!path) return;
        const audio = new Audio(path);
        audio.play().catch(e => console.log('Audio play error:', e));
        return audio;
    }

    function stopSound(audio) {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }

        $: if (state === 'ironing') {
        setTimeout(initCanvas, 100);
    }

    function initCanvas() {
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(100, 100, 100, 0.8)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.globalCompositeOperation = 'destination-out';
        
        console.log("Canvas initialized for ironing");
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function startIron(e) {
        isDrawing = true;
        iron(e);
    }

    function stopIron() {
        isDrawing = false;
        checkWinCondition();
    }

    function iron(e) {
        if (!isDrawing) return;
        e.preventDefault();
        
        const pos = getPos(e);
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 40, 0, Math.PI * 2);
        ctx.fill();
    }

    let isFinishing = false;

    function checkWinCondition() {
        if (!ctx || isFinishing) return;
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let clearedPixels = 0;
        
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] === 0) clearedPixels++;
        }
        
        const totalPixels = canvas.width * canvas.height;
        const percent = (clearedPixels / totalPixels) * 100;
        
        if (percent > 92) { 
            isFinishing = true;
            isDrawing = false;
            
            console.log("Ironing complete! Waiting...");
            
            stopSound(ironingAudio);
            ironingAudio = null;
            playSound('/game/sfx/joy.wav');
            playSound('/game/sfx/success.wav');

            setTimeout(() => {
                finishIroning();
            }, 1500);
        }
    }

    function nextState() {
      if (state === 'intro') {
          state = 'closed';
      } else if (state === 'closed') {
          playSound('/game/sfx/dooropened.wav');
          state = 'opened';
      } else if (state === 'opened') {
          state = 'selection';
      }
    }

    function chooseOutfit(outfit) {
        if (outfit.isCorrect) {
            console.log('Correct outfit!');
            playSound('/game/sfx/correctdress.wav');
            playSound('/game/sfx/joy.wav');
            selectedOutfit = outfit;
            state = 'ironing';
            setTimeout(() => {
                ironingAudio = playSound('/game/sfx/ironing.wav');
            }, 500);
        } else {
            console.log('Wrong outfit!');
            playSound('/game/sfx/fail.wav');
            hearts.update(n => Math.max(0, n - 1));
            state = 'wrong_choice';
        }
    }

    function retrySelection() {
        stopSound(ironingAudio);
        ironingAudio = null;
        state = 'opened';
    }
    
    onMount(() => {
        return () => {
            stopSound(ironingAudio);
        };
    });
    
    function finishIroning() {
    console.log("Setting outfit to: school_uniform");
    
    characterOutfit.set('school_uniform'); 
    
    dispatch('complete');
}
  </script>
  
  <div class="level-container">
  
    {#if state === 'intro'}
    <div class="intro-screen">
       <img src={config.backgrounds.intro} class="bg" alt="Room" />
       <img src={currentCharacterImage} class="lina-big" alt="Lina" />
       
       <div class="bubble-center">
          <p>{config.dialogs.intro}</p>
          <button on:click={nextState} class="btn-ok">OK</button>
       </div>
    </div>

       {:else if state === 'closed'}
       <div class="full-screen-click" on:click={nextState}>
           <img src={config.backgrounds.closed} class="bg" />
           <div class="message-box-bottom">
              <p>{config.dialogs.closed}</p>
              <small>(Tap anywhere)</small>
           </div>
       </div>
  
       {:else if state === 'opened'}
       <div class="full-screen-relative">
           <img src={config.backgrounds.opened} class="bg" alt="Wardrobe Open" />
           <div class="clothes-container">
               <h2 class="instruction-text">{config.dialogs.opened}</h2>
               
               <div class="outfits-grid">
                   {#each config.outfits as outfit}
                       <button class="outfit-card" on:click={() => chooseOutfit(outfit)}>
                           <div class="icon-box">
                               {#if outfit.thumb}
                                   <img src={outfit.thumb} alt="Outfit" />
                               {:else}
                                   <span style="font-size: 2rem;">👗</span>
                               {/if}
                           </div>
                           <span class="outfit-name">{outfit.name}</span>
                       </button>
                   {/each}
               </div>
           </div>
       </div>   
  
    {:else if state === 'selection'}
       <img src={config.backgrounds.empty} class="bg" />
       <div class="outfits-row">
          {#each config.outfits as outfit}
             <img 
               src={outfit.image} 
               class="outfit-item" 
               on:click={() => chooseOutfit(outfit)} 
             />
          {/each}
       </div>
       <div class="instruction">{config.dialogs.choice}</div>
       
       {:else if state === 'wrong_choice'}
       <div class="error-screen">
           <img src={config.backgrounds.opened} class="bg bg-dimmed" />
           
           <div class="error-modal">
               <span style="font-size: 3rem;">❌</span>
               <h3>Not suitable!</h3>
               <p>I can't wear this right now.</p>
               <button class="btn-retry" on:click={retrySelection}>Try Again</button>
           </div>
       </div>
       
       {:else if state === 'ironing'}
       <div class="ironing-screen">
           <img src={config.backgrounds.opened} class="bg bg-dimmed" alt="Background" />

           <div class="z-index-wrapper">
               <div class="ironing-instruction">
                   <h3>Smooth it out!</h3>
               </div>
               
               <div class="fabric-container">
                   <img src="/game/items/fabric.png" class="fabric-base" alt="Fabric" />
                   
                   <canvas 
                       bind:this={canvas}
                       on:mousedown={startIron}
                       on:mousemove={iron}
                       on:mouseup={stopIron}
                       on:mouseleave={stopIron}
                       on:touchstart={startIron}
                       on:touchmove={iron}
                       on:touchend={stopIron}
                   ></canvas>
               </div>
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
        top: 0; left: 0;
        width: 100%; height: 100%;
        object-fit: contain;
        background-color: #ffeef2;
        z-index: 0;
    }

    .bg-dimmed {
        filter: brightness(0.4);
    }

    .intro-screen {
        width: 100%; height: 100%;
        position: relative;
    }

    .lina-big {
        position: absolute;
        bottom: 0; 
        left: 50%;
        transform: translateX(-50%);
        height: 75%;
        z-index: 1;
        object-fit: contain;
        pointer-events: none;
    }

    .bubble-center {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px 40px;
        border-radius: 25px;
        width: 80%;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 100;
        text-align: center;
        border: 4px solid #ff90b3;
        animation: popIn 0.3s ease-out;
    }

    .bubble-center p {
        font-size: 1.2rem;
        color: #333;
        margin-bottom: 20px;
        font-family: sans-serif;
    }
    
    .btn-ok {
        background: #ff69b4;
        border: none;
        color: white;
        padding: 10px 30px;
        border-radius: 20px;
        font-size: 1.2rem;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 0 #d14785;
        transition: transform 0.1s;
    }
    
    .btn-ok:active {
        transform: translateY(4px);
        box-shadow: none;
    }

    .full-screen-click, .full-screen-relative {
        width: 100%; height: 100%;
        position: relative;
        cursor: pointer;
    }

    .message-box-bottom {
        position: absolute;
        bottom: 10%; left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 15px 30px;
        border-radius: 20px;
        text-align: center;
        z-index: 10;
        min-width: 200px;
        border: 2px solid #ffb7d2;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .clothes-container {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5); 
        z-index: 5;
    }

    .instruction-text {
        color: white;
        background: #ff69b4;
        padding: 10px 25px;
        border-radius: 20px;
        margin-bottom: 30px;
        font-size: 1.2rem;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }

    .outfits-grid {
        display: flex;
        gap: 20px;
        justify-content: center;
        flex-wrap: wrap;
    }

    .outfit-card {
        background: white;
        border: 4px solid #fff;
        border-radius: 20px;
        padding: 10px;
        width: 130px;
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: transform 0.2s;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    .z-index-wrapper {
        position: relative;
        z-index: 5;
        width: 100%; height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    
    .outfit-card:active {
        transform: scale(0.95);
    }

    .icon-box {
        width: 100px; height: 100px;
        background: #f0f0f0;
        border-radius: 15px;
        margin-bottom: 10px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .icon-box img {
        width: 90%; height: 90%;
        object-fit: contain;
    }

    .outfit-name {
        font-weight: bold;
        color: #555;
        font-size: 0.9rem;
        text-align: center;
    }

    @keyframes popIn {
        from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    .ironing-screen {
        width: 100%; height: 100%;
        position: relative;
    }

    .ironing-instruction {
        color: white;
        margin-bottom: 20px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }

    .fabric-container {
        position: relative;
        width: 80vw; 
        height: 80vw; 
        max-width: 450px;
        max-height: 450px;
        
        border: 4px solid #fff;
        border-radius: 15px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        cursor: crosshair; 
        background: white;
    }


    .fabric-base {
        width: 100%; height: 100%;
        object-fit: cover;
        position: absolute;
        top: 0; left: 0;
        z-index: 1;
    }

    canvas {
        width: 100%; height: 100%;
        position: absolute;
        top: 0; left: 0;
        z-index: 2;
        touch-action: none; 
    }

        .error-screen {
        width: 100%; height: 100%;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .error-modal {
        position: relative;
        z-index: 10;
        background: white;
        padding: 30px;
        border-radius: 20px;
        text-align: center;
        border: 4px solid #ff6b6b;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        width: 80%;
        max-width: 300px;
        animation: shake 0.4s ease-in-out;
    }

    .error-modal h3 {
        color: #d63031;
        margin: 10px 0;
    }

    .btn-retry {
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 10px 25px;
        border-radius: 15px;
        font-size: 1.1rem;
        cursor: pointer;
        margin-top: 15px;
        box-shadow: 0 4px 0 #c0392b;
    }
    
    .btn-retry:active {
        transform: translateY(4px);
        box-shadow: none;
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }

</style> 