const STORAGE_KEY = 'school_journey_timer';
const BEST_TIME_KEY = 'school_journey_best_time';
const MAX_REASONABLE_TIME = 999999;

export function saveCurrentTime(timeInSeconds) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      time: timeInSeconds,
      timestamp: Date.now()
    }));
  } catch (e) {
  }
}

export function loadCurrentTime() {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
}

export function saveBestTime(timeInSeconds) {
  if (typeof window === 'undefined') return;
  
  try {
    const currentBest = getBestTime();
    if (currentBest === null || currentBest > MAX_REASONABLE_TIME || timeInSeconds < currentBest) {
      localStorage.setItem(BEST_TIME_KEY, JSON.stringify({
        time: timeInSeconds,
        timestamp: Date.now()
      }));
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export function getBestTime() {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(BEST_TIME_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    const time = data.time;
    if (time > MAX_REASONABLE_TIME) {
      return null;
    }
    return time;
  } catch (e) {
    return null;
  }
}

export function clearCurrentTime() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
  }
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

