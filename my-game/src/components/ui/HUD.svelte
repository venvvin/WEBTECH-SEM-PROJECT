<script>
    import { hearts, currentLevelIndex, levels } from '../../stores/gameStore.js';
  </script>
  
  <div class="hud">
    <div class="hearts">
      {#each Array($hearts) as _}
        <span class="heart">❤️</span>
      {/each}
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
      padding: 10px;
      background: rgba(255,255,255,0.8);
      border-radius: 10px;
      z-index: 100;
      font-size: 1.5rem;
      pointer-events: none;
    }
  </style>  