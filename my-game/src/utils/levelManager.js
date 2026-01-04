function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }
  
  export function generateGameQueue(fullJsonData) {
    const allLevels = fullJsonData.levels;
  
    const tier1 = allLevels.filter(l => l.tier === 1);
    const tier2 = allLevels.filter(l => l.tier === 2);
    const tier3 = allLevels.filter(l => l.tier === 3);
  
    const tier1WithoutMaze = tier1.filter(l => l.type !== "maze");
    const mazeLevel = tier1.find(l => l.type === "maze");
  
    const shuffledT1 = shuffle([...tier1WithoutMaze]);
    const shuffledT2 = shuffle([...tier2]);
    const shuffledT3 = shuffle([...tier3]);
  
    if (!mazeLevel) {
        return [...shuffledT1, ...shuffledT2, ...shuffledT3];
    }
  
    return [...shuffledT1, mazeLevel, ...shuffledT2, ...shuffledT3];
  }  