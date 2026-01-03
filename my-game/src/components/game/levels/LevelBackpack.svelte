<script>
    import { onMount } from 'svelte';
    import { hearts } from '../../../stores/gameStore.js';
    export let data;
    import { createEventDispatcher } from 'svelte';
    import { characterOutfit } from '../../../stores/gameStore.js'
  
    let { config } = data;
    let items = config.items.map(item => ({ ...item }));
    let backpack = config.backpack;
    let background = config.background;
    let backpackEl;
    let draggedItem = null;
    let startX = 0; 
    let startY = 0;
    let offsetX = 0;
    let offsetY = 0;
  
    const dispatch = createEventDispatcher();

  $: remainingRequired = items.filter(i => i.isCorrect && !i.message).length;

  $: if (remainingRequired === 0) {
     playSound(config.sounds.joy);
     setTimeout(() => {
        playSound(config.sounds.clap);
        
        dispatch('complete');
        
     }, 1000);
  }

    function startDrag(event, item) {
    event.preventDefault();
    draggedItem = item;
    
    startX = parseFloat(item.x);
    startY = parseFloat(item.y);
  }

  function onMove(event) {
    if (!draggedItem) return;

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const xPercent = (clientX / window.innerWidth) * 100;
    const yPercent = (clientY / window.innerHeight) * 100;

    items = items.map(i => {
      if (i.id === draggedItem.id) {
        return { ...i, x: xPercent, y: yPercent };
      }
      return i;
    });
  }
  
function checkDrop(item) {
    if (!backpackEl) return false;
    const backpackRect = backpackEl.getBoundingClientRect();
    const itemXpx = (item.x / 100) * window.innerWidth;
    const itemYpx = (item.y / 100) * window.innerHeight;
    
    const bpX = backpackRect.left + backpackRect.width / 2;
    const bpY = backpackRect.top + backpackRect.height / 2;
    
    const dist = Math.sqrt(Math.pow(itemXpx - bpX, 2) + Math.pow(itemYpx - bpY, 2));
    
    return dist < 150; 
}

function playSound(path) {
    if (!path) return;
    const audio = new Audio(path);
    audio.play().catch(e => console.log('Audio play error:', e));
  }

  let showMessage = null;

  function endDrag() {
    if (!draggedItem) return;

    const currentItemState = items.find(i => i.id === draggedItem.id);
    const isInside = checkDrop(currentItemState);

    if (isInside) {
      if (draggedItem.message) {
         playSound(config.sounds.success);
         showMessage = draggedItem.message;
         items = items.filter(i => i.id !== draggedItem.id);
         
      } else if (draggedItem.isCorrect) {
        items = items.filter(i => i.id !== draggedItem.id);
        playSound(config.sounds.drop);
        
      } else {
        hearts.update(h => h - 1);
        playSound(config.sounds.fail);
        
        items = items.map(i => {
          if (i.id === draggedItem.id) {
            return { ...i, x: startX, y: startY };
          }
          return i;
        });
        
        if (navigator.vibrate) navigator.vibrate(200);
      }
    }

    draggedItem = null;
  }

</script>
  
  <svelte:window 
    on:mousemove={onMove} 
    on:mouseup={endDrag} 
    on:touchmove={onMove} 
    on:touchend={endDrag} 
  />

  <div class="level-container" style="background-image: url('{background}')">
  
    <div 
      class="backpack-zone"
      bind:this={backpackEl} 
      style="left: {backpack.position.x}%; top: {backpack.position.y}%;"
    >
      <img src={backpack.image} alt="Backpack" />
    </div>
  
  {#each items as item}
    <div 
      class="item" 
      role="button"
      tabindex="0"
      style="left: {item.x}%; top: {item.y}%; z-index: {draggedItem?.id === item.id ? 100 : 20};"
      on:mousedown={(e) => startDrag(e, item)}
      on:touchstart={(e) => startDrag(e, item)}
    >
      <img src={item.image} alt={item.name} draggable="false" />
    </div>
  {/each}
  
    <div class="checklist">
      <h3>{config.checklist.title}</h3>
      <ul>
        {#each config.checklist.requirements as req}
          <li>⬜ {req.label} (Need: {req.minCorrect})</li>
        {/each}
      </ul>
    </div>
    
    {#if showMessage}
      <div 
        class="message-overlay" 
        on:click={() => showMessage = null} 
        on:keydown={(e) => e.key === 'Enter' || e.key === ' ' ? showMessage = null : null}
        role="button" 
        tabindex="0"
      >
        <div class="message-box">
          <p>{showMessage}</p>
          <button on:click|stopPropagation={() => showMessage = null}>OK</button>
        </div>
      </div>
    {/if}

  </div>
  
  <style>

    .level-container {
      width: 100vw;
      height: 100vh;
      background-size: cover;      
      background-position: center; 
      position: relative;          
      overflow: hidden;            
    }
  
    .backpack-zone {
      position: absolute;
      transform: translate(-50%, -50%); 
      width: 550px;
      z-index: 10;
    }
    .backpack-zone img {
      width: 100%;
      height: auto;
      filter: drop-shadow(0 0 15px rgba(0,0,0,0.3)); 
    }
  
    .item {
      position: absolute;
      width: 150px;
      cursor: grab;
      z-index: 20;
      transform: translate(-50%, -50%);
    }
    .item img {
      width: 100%;
      height: auto;
      filter: drop-shadow(0 5px 8px rgba(0,0,0,0.4)); 
      transition: transform 0.1s;
    }
    
    .item:hover {
      transform: translate(-50%, -50%) scale(1.1);
      z-index: 30;
    }
  
    .checklist {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      padding: 20px;
      border-radius: 16px;
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
      z-index: 100;
      min-width: 220px;
      border: 2px solid #fff;
    }
    .checklist h3 {
      margin: 0 0 15px 0;
      font-size: 1.4rem;
      color: #2c3e50;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 8px;
      font-weight: bold;
      text-align: center;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    li {
      font-size: 1.1rem;
      margin-bottom: 10px;
      color: #34495e;
      display: flex;
      align-items: center;
      gap: 8px;
    }

  .message-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 200;
  }
  .message-box {
    background: white;
    padding: 20px;
    border-radius: 15px;
    text-align: center;
    max-width: 300px;
    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
    border: 3px solid #FFD700;
  }
  .message-box p {
    font-size: 1.2rem;
    margin-bottom: 15px;
  }
  .message-box button {
    background: #3498db;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    font-size: 1rem;
    cursor: pointer;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

    @media (max-height: 500px), (max-width: 900px) {
    .backpack-zone {
      width: 300px;
    }
    .item {
      width: 110px;
    }
    .checklist {
      transform: scale(0.7);
      transform-origin: top right;
      top: 10px;
      right: 10px;
    }
  }
  </style>  