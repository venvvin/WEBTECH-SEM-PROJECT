import LevelBackpack from "../components/game/levels/LevelBackpack.svelte";
import LevelCooking from "../components/game/levels/LevelCooking.svelte";
import LevelDressUp from "../components/game/levels/LevelDressUp.svelte";
import LevelMaze from "../components/game/levels/LevelMaze.svelte";
import LevelFixWires from "../components/game/levels/LevelFixWires.svelte";
import LevelPassword from "../components/game/levels/LevelPassword.svelte";
import LevelCrossRoad from "../components/game/levels/LevelCrossRoad.svelte";
import LevelMemory from "../components/game/levels/LevelMemory.svelte";

export const levelComponentsMap = {
  "drag-drop-sort": LevelBackpack,
  "cooking": LevelCooking,
  "dress-up-iron": LevelDressUp,
  "maze": LevelMaze,
  "wires-connect": LevelFixWires,
  "password": LevelPassword,
  "traffic-light": LevelCrossRoad,
  "memory": LevelMemory,
};

export function getLevelComponent(type) {
  return levelComponentsMap[type] || null;
}

export function isLevelTypeSupported(type) {
  return type in levelComponentsMap;
}

