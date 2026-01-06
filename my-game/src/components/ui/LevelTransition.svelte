<script>
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let instruction = "";
  
  const dispatch = createEventDispatcher();
  
  let showVideo = true;
  let showInstruction = false;
  let videoElement = null;
  
  function handleVideoEnded() {
    showVideo = false;
    showInstruction = true;
    
    setTimeout(() => {
      showInstruction = false;
      dispatch('complete');
    }, 4000);
  }
  
  onMount(() => {
    if (videoElement) {
      videoElement.addEventListener('error', () => {
        handleVideoEnded();
      });
      
      videoElement.play().catch(() => {
        handleVideoEnded();
      });
    }
  });
  
  onDestroy(() => {
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  });
</script>

{#if showVideo}
  <div class="video-container">
    <video
      bind:this={videoElement}
      src="/game/backgrounds/scene.mp4"
      class="transition-video"
      on:ended={handleVideoEnded}
      muted
      playsinline
    ></video>
  </div>
{/if}

{#if showInstruction}
  <div class="instruction-overlay">
    <div class="instruction-window">
      <div class="instruction-content">
        {instruction}
      </div>
    </div>
  </div>
{/if}

<style>
  .video-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10001;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .transition-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .instruction-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10002;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s;
  }

  .instruction-window {
    background-color: #FFE4E1;
    border: 4px solid #8B4513;
    border-radius: 16px;
    padding: 40px 50px;
    max-width: 80%;
    max-height: 80%;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    animation: slideIn 0.3s;
    overflow-y: auto;
  }

  .instruction-content {
    color: #000000;
    font-size: 20px;
    line-height: 1.6;
    text-align: center;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    .instruction-window {
      padding: 25px 35px;
      max-width: 90%;
      max-height: 85%;
    }

    .instruction-content {
      font-size: 18px;
    }
  }
</style>

