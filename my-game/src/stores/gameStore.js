import { writable } from 'svelte/store';

// Game status
// ‘orientation’ - “rotate phone” screen
// ‘menu’ - main menu
// ‘game’ - the game itself
// ‘results’ - victory/defeat screen
export const currentScreen = writable('menu'); //start w menu

// Current level (index in the levels array)
export const currentLevelIndex = writable(0);

// Player's lives (hearts)
export const hearts = writable(3);

// List of levels
export const levels = writable([]);
