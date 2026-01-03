<script>
    import { levels, currentLevelIndex } from '../../stores/gameStore.js';
    
    import LevelBackpack from './levels/LevelBackpack.svelte';
    import LevelCooking from './levels/LevelCooking.svelte';
    import LevelTransition from './levels/LevelTransition.svelte';
    import UnknownLevel from './levels/UnknownLevel.svelte';
    
    $: currentLevelData = $levels[$currentLevelIndex];

    function handleLevelComplete() {
    currentLevelIndex.update(n => n + 1);
  }
    /**
     * @param {string} type
     * @returns {typeof LevelBackpack | typeof LevelCooking | typeof LevelTransition | typeof UnknownLevel}
     */
    function getComponent(type) {
      switch (type) {
        case 'drag-drop-sort': return LevelBackpack;
        case 'cooking': return LevelCooking;
        case 'maze-transition': return LevelTransition; 
        default: return UnknownLevel;
      }
    }
    
    /** @type {any} */
    $: CurrentComponent = currentLevelData ? getComponent(currentLevelData.type) : null;
  </script>
  
  <div class="game-container">
    {#if currentLevelData && CurrentComponent}
      <svelte:component 
        this={CurrentComponent} 
        data={currentLevelData} 
        on:complete={handleLevelComplete}
      />
      {:else}
      <p>Game Finished or Error!</p>
    {/if}
  </div>
  
  <style>
    .game-container {
      width: 100%;
      height: 100%;
    }
  </style>  