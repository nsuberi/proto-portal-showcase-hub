// Debug script to run in browser console
// This will clear localStorage and show what image paths are being loaded

console.log('🧹 Clearing localStorage...');
localStorage.removeItem('ffx-skill-map-employees');
localStorage.removeItem('tech-skill-map-employees');

console.log('🔄 Refreshing page to load fresh employee data...');
window.location.reload();