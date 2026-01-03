import { writable } from 'svelte/store';

export const currentScreen = writable('menu');
export const currentLevelIndex = writable(0);
export const hearts = writable(3);
export const levels = writable([]);
export const characterOutfit = writable('pajamas'); 

export const gameConfig = writable({}); 