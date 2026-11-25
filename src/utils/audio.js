// Web Audio API volume booster for HTML5 video

let audioCtx = null
let mediaSourceNode = null
let gainNode = null
let currentVideo = null

export function initAudioBooster(video) {
  if (!video) return null
  if (currentVideo === video && gainNode) return gainNode

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass()
    }

    if (audioCtx.state === 'suspended') {
      const resumeAudio = () => {
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume()
        }
        video.removeEventListener('play', resumeAudio)
        video.removeEventListener('click', resumeAudio)
      }
      video.addEventListener('play', resumeAudio)
      video.addEventListener('click', resumeAudio)
    }

    if (currentVideo !== video) {
      disconnectAudioBooster()
      currentVideo = video
      mediaSourceNode = audioCtx.createMediaElementSource(video)
      gainNode = audioCtx.createGain()
      gainNode.gain.value = 1.0
      mediaSourceNode.connect(gainNode)
      gainNode.connect(audioCtx.destination)
    }

    return gainNode
  } catch (e) {
    console.warn('Audio booster could not be initialized:', e)
    return null
  }
}

export function setAudioBoost(multiplier) {
  if (!gainNode) return
  const value = Math.max(0.5, Math.min(4.0, parseFloat(multiplier) || 1.0))
  gainNode.gain.setValueAtTime(value, audioCtx ? audioCtx.currentTime : 0)
}

export function disconnectAudioBooster() {
  try {
    if (gainNode) {
      gainNode.disconnect()
      gainNode = null
    }
    if (mediaSourceNode) {
      mediaSourceNode.disconnect()
      mediaSourceNode = null
    }
  } catch (e) {
    console.warn('Error disconnecting audio booster:', e)
  }
  currentVideo = null
}
