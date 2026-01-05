<script>
    import { hearts, currentLevelIndex, levels, gameTimer } from '../../stores/gameStore.js';
    import { formatTime } from '../../utils/timerManager.js';
  </script>
  
  <div class="hud">
    <div class="hearts">
      {#each Array($hearts) as _}
        <span class="heart">❤️</span>
      {/each}
    </div>
    <div class="center-section">
      <div class="timer">
        ⏱️ {formatTime($gameTimer)}
      </div>
    </div>
    <div class="progress">
      Level: {$currentLevelIndex + 1} / {$levels.length}
    </div>
  </div>
  
  <style>
    .hud {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      display: flex;
      justify-content: space-between; 
      align-items: center;
      gap: 20px;
      
      padding: 10px;
      border-radius: 10px;
      z-index: 100;
      font-size: 1.5rem;
      pointer-events: none;
      color: white;
      text-shadow: 1px 1px 2px black;
    }
    
    .hearts {
      display: flex;
    }

    .center-section {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
    }

    .timer {
      font-family: 'Courier New', monospace;
      font-weight: bold;
    }
  </style>