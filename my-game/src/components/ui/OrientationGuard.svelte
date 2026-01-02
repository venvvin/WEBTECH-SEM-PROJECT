<script>
    import { onMount, onDestroy } from 'svelte';
  
    let isPortrait = false;
  
    function checkOrientation() {
      // If height is greater than width
      isPortrait = window.innerHeight > window.innerWidth;
    }
  
    onMount(() => {
      checkOrientation();
      window.addEventListener('resize', checkOrientation);
    });
  
    onDestroy(() => {
      window.removeEventListener('resize', checkOrientation);
    });
  </script>
  
  {#if isPortrait}
    <div class="overlay">
      <div class="message">
        <h1>🔄</h1>
        <p>Please rotate your device horizontally</p>
      </div>
    </div>
  {/if}
  
  <style>
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #2c3e50;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999; 
    }
    .message {
      text-align: center;
    }
    h1 { font-size: 4rem; margin: 0; }
    p { font-size: 1.5rem; }
  </style>
  