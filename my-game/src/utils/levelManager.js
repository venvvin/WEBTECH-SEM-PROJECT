function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }
  
  export function generateGameQueue(fullJsonData) {
    const allLevels = fullJsonData.levels;
  
    const tier1 = allLevels.filter(l => l.tier === 1);
    const tier2 = allLevels.filter(l => l.tier === 2);
    const tier3 = allLevels.filter(l => l.tier === 3);
  
    const tier1GameLevels = tier1.filter(l => l.type !== "maze");
    const mazeLevel = tier1.find(l => l.type === "maze");
  
    const tier2GameLevels = tier2.filter(l => l.type !== "traffic-light");
    const crossRoadLevel = tier2.find(l => l.type === "traffic-light");
  
    const memoryLevel = tier3.find(l => l.type === "memory");
  
    const shuffledT1Games = shuffle([...tier1GameLevels]);
    const shuffledT2Games = shuffle([...tier2GameLevels]);
  
    let queue = [];
    
    queue.push(...shuffledT1Games);
    
    if (mazeLevel) {
        queue.push(mazeLevel);
    }
    
    queue.push(...shuffledT2Games);
    
    if (crossRoadLevel) {
        queue.push(crossRoadLevel);
    }
    
    if (memoryLevel) {
        queue.push(memoryLevel);
    }
  
    return queue;
  }  