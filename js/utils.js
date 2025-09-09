/**
 * Utility functions for Suyash Tiwari's portfolio website
 */

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} - The debounced function
 */
const debounce = (func, wait = 100) => {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

/**
 * Throttle function to limit the rate at which a function can fire
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - The throttled function
 */
const throttle = (func, limit = 100) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Get a random number between min and max
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} - A random number between min and max
 */
const random = (min, max) => Math.random() * (max - min) + min;

/**
 * Map a value from one range to another
 * @param {number} value - The value to map
 * @param {number} inMin - The minimum of the input range
 * @param {number} inMax - The maximum of the input range
 * @param {number} outMin - The minimum of the output range
 * @param {number} outMax - The maximum of the output range
 * @returns {number} - The mapped value
 */
const map = (value, inMin, inMax, outMin, outMax) => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * Clamp a value between min and max
 * @param {number} value - The value to clamp
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} - The clamped value
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Lerp (linear interpolation) between two values
 * @param {number} start - The start value
 * @param {number} end - The end value
 * @param {number} t - The interpolation factor (0-1)
 * @returns {number} - The interpolated value
 */
const lerp = (start, end, t) => start * (1 - t) + end * t;

/**
 * Check if the device is a mobile device
 * @returns {boolean} - True if the device is mobile, false otherwise
 */
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

/**
 * Check if the device has reduced motion preference
 * @returns {boolean} - True if the device has reduced motion preference, false otherwise
 */
const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get the current theme (light or dark)
 * @returns {string} - The current theme ('light' or 'dark')
 */
const getCurrentTheme = () => {
  return document.documentElement.getAttribute('data-theme') || 'light';
};

/**
 * Set the theme (light or dark)
 * @param {string} theme - The theme to set ('light' or 'dark')
 */
const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

/**
 * Get the distance between two points
 * @param {number} x1 - The x coordinate of the first point
 * @param {number} y1 - The y coordinate of the first point
 * @param {number} x2 - The x coordinate of the second point
 * @param {number} y2 - The y coordinate of the second point
 * @returns {number} - The distance between the two points
 */
const getDistance = (x1, y1, x2, y2) => {
  const xDist = x2 - x1;
  const yDist = y2 - y1;
  return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
};

/**
 * Get the angle between two points
 * @param {number} x1 - The x coordinate of the first point
 * @param {number} y1 - The y coordinate of the first point
 * @param {number} x2 - The x coordinate of the second point
 * @param {number} y2 - The y coordinate of the second point
 * @returns {number} - The angle between the two points in radians
 */
const getAngle = (x1, y1, x2, y2) => {
  return Math.atan2(y2 - y1, x2 - x1);
};

/**
 * Convert radians to degrees
 * @param {number} radians - The angle in radians
 * @returns {number} - The angle in degrees
 */
const radiansToDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

/**
 * Convert degrees to radians
 * @param {number} degrees - The angle in degrees
 * @returns {number} - The angle in radians
 */
const degreesToRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Preload images
 * @param {Array} images - An array of image URLs to preload
 * @returns {Promise} - A promise that resolves when all images are loaded
 */
const preloadImages = (images) => {
  return Promise.all(images.map(src => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }));
};

/**
 * Wait for a specified amount of time
 * @param {number} ms - The time to wait in milliseconds
 * @returns {Promise} - A promise that resolves after the specified time
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Export all utility functions
export {
  debounce,
  throttle,
  random,
  map,
  clamp,
  lerp,
  isMobile,
  prefersReducedMotion,
  getCurrentTheme,
  setTheme,
  getDistance,
  getAngle,
  radiansToDegrees,
  degreesToRadians,
  preloadImages,
  wait
};