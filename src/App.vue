<template>
  <div class="spotlight-app" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading beautiful images...</p>
    </div>

    <!-- Main Content -->
    <div
      v-else
      class="main-container"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    >
      <!-- Background Image -->
      <div class="image-container">
        <img
          :src="currentImageUrl"
          :alt="imageData?.title || 'Spotlight Image'"
          class="spotlight-image"
          @load="onImageLoad"
        />
        <div class="image-overlay"></div>
      </div>

      <!-- Controls Container -->
      <div
        class="controls-container"
        :class="{ 'controls-hidden': isFullscreen && controlsHidden }"
      >
        <!-- Top Controls -->
        <div class="top-controls">
          <!-- Title -->
          <div class="title-container">
            <h1 class="image-title">
              {{ imageData?.title || 'Beautiful Spotlight' }}
            </h1>
          </div>

          <!-- Fullscreen Button -->
          <button
            @click="toggleFullscreen"
            class="control-button fullscreen-button"
            :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
          >
            <svg
              v-if="!isFullscreen"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
              />
            </svg>
            <svg
              v-else
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
              />
            </svg>
          </button>
        </div>

        <!-- Bottom Controls -->
        <div class="bottom-controls">
          <!-- Autoplay Button -->
          <button
            @click="toggleAutoplay"
            class="control-button autoplay-button"
            :title="autoplayEnabled ? 'Stop Autoplay' : 'Start Autoplay'"
          >
            <svg
              v-if="!autoplayEnabled"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polygon points="5,3 19,12 5,21" />
            </svg>
            <svg
              v-else
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>

          <!-- Refresh Button -->
          <button
            @click="fetchNewImage"
            class="control-button refresh-button"
            :disabled="loading"
            title="Get New Image"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Progress Bar for Autoplay -->
      <div
        v-if="autoplayEnabled && !loading"
        class="progress-container"
        :class="{ 'progress-hidden': isFullscreen && controlsHidden }"
      >
        <div class="progress-bar" :style="{ width: progressWidth + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

// Reactive state
const imageData = ref(null)
const loading = ref(true)
const autoplayEnabled = ref(false)
const autoplayTimer = ref(null)
const progressTimer = ref(null)
const progressWidth = ref(0)
const isFullscreen = ref(false)
const isMobile = ref(false)
const controlsHidden = ref(false)
const hideControlsTimer = ref(null)

// Constants
const API_URL = '/api/spotlight'
const AUTOPLAY_INTERVAL = 10000 // 10 seconds
const PROGRESS_UPDATE_INTERVAL = 100 // Update progress every 100ms
const CONTROLS_HIDE_DELAY = 3000 // 3 seconds

// Computed properties
const currentImageUrl = computed(() => {
  if (!imageData.value) return ''
  return isMobile.value
    ? imageData.value.portraitImage.asset
    : imageData.value.landscapeImage.asset
})

// Watch for title changes to update browser title
watch(
  imageData,
  (newData) => {
    if (newData?.title) {
      document.title = newData.title
    }
  },
  { immediate: true }
)

// Methods
const fetchSpotlightData = async () => {
  try {
    loading.value = true
    const response = await fetch(API_URL)
    const data = await response.json()
    imageData.value = data.ad
  } catch (error) {
    console.error('Error fetching spotlight data:', error)
  } finally {
    loading.value = false
  }
}

const fetchNewImage = () => {
  resetProgress()
  fetchSpotlightData()
}

const onImageLoad = () => {
  // Image loaded successfully
}

const toggleAutoplay = () => {
  autoplayEnabled.value = !autoplayEnabled.value

  if (autoplayEnabled.value) {
    startAutoplay()
  } else {
    stopAutoplay()
  }
}

const startAutoplay = () => {
  stopAutoplay() // Clear any existing timers

  // Start progress animation
  progressWidth.value = 0
  const startTime = Date.now()

  progressTimer.value = setInterval(() => {
    const elapsed = Date.now() - startTime
    const progress = (elapsed / AUTOPLAY_INTERVAL) * 100

    if (progress >= 100) {
      progressWidth.value = 100
      clearInterval(progressTimer.value)
      progressTimer.value = null
    } else {
      progressWidth.value = progress
    }
  }, PROGRESS_UPDATE_INTERVAL)

  // Set autoplay timer
  autoplayTimer.value = setTimeout(() => {
    if (autoplayEnabled.value) {
      fetchNewImage()
      startAutoplay() // Restart for next cycle
    }
  }, AUTOPLAY_INTERVAL)
}

const stopAutoplay = () => {
  if (autoplayTimer.value) {
    clearTimeout(autoplayTimer.value)
    autoplayTimer.value = null
  }

  if (progressTimer.value) {
    clearInterval(progressTimer.value)
    progressTimer.value = null
  }

  progressWidth.value = 0
}

const resetProgress = () => {
  if (autoplayEnabled.value) {
    stopAutoplay()
    startAutoplay()
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
  if (!isFullscreen.value) {
    controlsHidden.value = false
    clearHideControlsTimer()
  } else {
    startHideControlsTimer(0)
  }
}

const onMouseMove = () => {
  if (isFullscreen.value) {
    controlsHidden.value = false
    startHideControlsTimer()
  }
}

const onMouseLeave = () => {
  if (isFullscreen.value) {
    clearHideControlsTimer()
    controlsHidden.value = true
  }
}

const startHideControlsTimer = (delay = CONTROLS_HIDE_DELAY) => {
  clearHideControlsTimer()
  hideControlsTimer.value = setTimeout(() => {
    if (isFullscreen.value) {
      controlsHidden.value = true
    }
  }, delay)
}

const clearHideControlsTimer = () => {
  if (hideControlsTimer.value) {
    clearTimeout(hideControlsTimer.value)
    hideControlsTimer.value = null
  }
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

// Lifecycle
onMounted(() => {
  // Initial setup
  handleResize()
  fetchSpotlightData()

  // Event listeners
  window.addEventListener('resize', handleResize)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  // Cleanup
  stopAutoplay()
  clearHideControlsTimer()
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
.spotlight-app {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
  cursor: default;
}

.fullscreen-mode {
  cursor: none;
}

.fullscreen-mode:hover {
  cursor: default;
}

.loading-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 16px;
  opacity: 0.8;
  margin: 0;
}

.main-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.image-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.spotlight-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.2) 0%,
    transparent 20%,
    transparent 80%,
    rgba(0, 0, 0, 0.2) 100%
  );
  pointer-events: none;
}

.controls-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 10;
}

.controls-hidden {
  opacity: 0;
}

.top-controls {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  pointer-events: none;
}

.title-container {
  flex: 1;
  margin-right: 16px;
  pointer-events: none;
}

.image-title {
  color: white;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  line-height: 1.2;
}

.bottom-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  pointer-events: none;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  pointer-events: auto;
}

.control-button:hover {
  background: rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.control-button:active {
  transform: scale(0.95);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-button:disabled:hover {
  transform: none;
}

.progress-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  z-index: 9;
  transition: opacity 0.3s ease;
}

.progress-hidden {
  opacity: 0;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #81c784);
  transition: width 0.1s ease;
}

/* Mobile Responsive Design */
@media (max-width: 767px) {
  .top-controls {
    padding: 16px;
  }

  .image-title {
    font-size: 22px;
  }

  .bottom-controls {
    padding: 16px;
  }
}

/* Tablet adjustments */
@media (min-width: 768px) and (max-width: 1024px) {
  .image-title {
    font-size: 26px;
  }
}

/* Large desktop adjustments */
@media (min-width: 1200px) {
  .image-title {
    font-size: 32px;
  }
}
</style>
