function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }
  
  export function generateGameQueue(allLevels) {
    // filter by tiers
    const tier1 = allLevels.filter(l => l.tier === 1);
    const tier2 = allLevels.filter(l => l.tier === 2);
    const tier3 = allLevels.filter(l => l.tier === 3);
  
    // randomize within tiers and merge
    return [
      ...shuffle(tier1),
      ...shuffle(tier2),
      ...shuffle(tier3)
    ];
  }
  