function shuffle(array) {
    // simple array shuffle
    return array.sort(() => Math.random() - 0.5);
  }
  
  export function generateGameQueue(fullJsonData) {
    // 1. Get raw levels array
    const allLevels = fullJsonData.levels;
  
    // 2. Filter by tiers
    const tier1 = allLevels.filter(l => l.tier === 1);
    const tier2 = allLevels.filter(l => l.tier === 2);
    const tier3 = allLevels.filter(l => l.tier === 3);
  
    // 3. Shuffle each tier independently
    const shuffledT1 = shuffle([...tier1]);
    const shuffledT2 = shuffle([...tier2]);
    const shuffledT3 = shuffle([...tier3]);
  
    // 4. Merge them in strict order: T1 -> T2 -> T3
    return [...shuffledT1, ...shuffledT2, ...shuffledT3];
  }  