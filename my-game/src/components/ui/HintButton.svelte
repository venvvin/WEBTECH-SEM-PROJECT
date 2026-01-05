<script>
  export let hintText = "Text will be here.";
  
  let isOpen = false;
  
  function toggleHint() {
    isOpen = !isOpen;
  }
  
  function closeHint() {
    isOpen = false;
  }
</script>

<button class="hint-button" on:click={toggleHint} aria-label="Show hint">
  ?
</button>

{#if isOpen}
  <div class="hint-overlay" on:click={closeHint}>
    <div class="hint-window" on:click|stopPropagation>
      <button class="close-button" on:click={closeHint} aria-label="Close hint">
        ×
      </button>
      <div class="hint-content">
        {hintText}
      </div>
    </div>
  </div>
{/if}

<style>
  .hint-button {
    position: fixed;
    bottom: 20px;
    left: 20px;
    width: 50px;
    height: 50px;
    border-radius: 8px;
    background-color: #8B4513;
    color: white;
    font-size: 28px;
    font-weight: bold;
    border: 2px solid #654321;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.2s;
  }

  .hint-button:hover {
    background-color: #A0522D;
    transform: scale(1.05);
  }

  .hint-button:active {
    transform: scale(0.95);
  }

  .hint-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s;
  }

  .hint-window {
    position: relative;
    background-color: #FFE4E1;
    border: 4px solid #8B4513;
    border-radius: 16px;
    padding: 30px 40px;
    max-width: 80%;
    max-height: 80%;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    animation: slideIn 0.3s;
    overflow-y: auto;
  }

  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #8B4513;
    color: white;
    font-size: 32px;
    font-weight: bold;
    border: 2px solid #654321;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: all 0.2s;
  }

  .close-button:hover {
    background-color: #A0522D;
    transform: scale(1.1);
  }

  .close-button:active {
    transform: scale(0.9);
  }

  .hint-content {
    color: #000000;
    font-size: 18px;
    line-height: 1.6;
    padding-right: 20px;
    margin-top: 10px;
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
    .hint-button {
      width: 45px;
      height: 45px;
      font-size: 24px;
      bottom: 15px;
      left: 15px;
    }

    .hint-window {
      padding: 20px 30px;
      max-width: 90%;
      max-height: 85%;
    }

    .hint-content {
      font-size: 16px;
      padding-right: 15px;
    }

    .close-button {
      width: 35px;
      height: 35px;
      font-size: 28px;
    }
  }
</style>

