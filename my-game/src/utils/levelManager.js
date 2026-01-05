function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }
  
  export function generateGameQueue(fullJsonData) {
    const allLevels = fullJsonData.levels;
  
    // Разделяем уровни по tier
    const tier1 = allLevels.filter(l => l.tier === 1);
    const tier2 = allLevels.filter(l => l.tier === 2);
    const tier3 = allLevels.filter(l => l.tier === 3);
  
    // Tier 1: отделяем maze от остальных (backpack, cooking, dress-up)
    const tier1GameLevels = tier1.filter(l => l.type !== "maze");
    const mazeLevel = tier1.find(l => l.type === "maze");
  
    // Tier 2: отделяем cross_road от остальных (password, fix-wires)
    const tier2GameLevels = tier2.filter(l => l.type !== "traffic-light");
    const crossRoadLevel = tier2.find(l => l.type === "traffic-light");
  
    // Tier 3: memory - финальный уровень
    const memoryLevel = tier3.find(l => l.type === "memory");
  
    // Перемешиваем игровые уровни внутри каждого tier
    const shuffledT1Games = shuffle([...tier1GameLevels]);
    const shuffledT2Games = shuffle([...tier2GameLevels]);
  
    // Собираем очередь в правильном порядке:
    // 1-3: Tier 1 игры (перемешанные)
    // 4: Maze (всегда на 4-м месте)
    // 5-6: Tier 2 игры (перемешанные)
    // 7: CrossRoad (всегда на 7-м месте)
    // 8: Memory (всегда на 8-м месте)
    let queue = [];
    
    // Позиции 1-3: Tier 1 игры (backpack, cooking, dress-up)
    queue.push(...shuffledT1Games);
    
    // Позиция 4: Maze
    if (mazeLevel) {
        queue.push(mazeLevel);
    }
    
    // Позиции 5-6: Tier 2 игры (password, fix-wires)
    queue.push(...shuffledT2Games);
    
    // Позиция 7: CrossRoad
    if (crossRoadLevel) {
        queue.push(crossRoadLevel);
    }
    
    // Позиция 8: Memory
    if (memoryLevel) {
        queue.push(memoryLevel);
    }
  
    return queue;
  }  