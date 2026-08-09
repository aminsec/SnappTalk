import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faVolumeHigh,
  faVolumeXmark,
  faExpand,
  faCompress,
} from '@fortawesome/free-solid-svg-icons';
import styles from './MediaContent.module.css';

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Telegram-style video player with a custom overlay UI (no browser default controls).
 * Shows a poster/thumbnail with a centered play button; on play, reveals a
 * custom control bar (play/pause, seek, time, volume, fullscreen).
 */
function VideoPlayer({ src, mimeType = 'video/mp4', poster, footer, fullscreenOnDoubleClick = true }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef(null);
  const seekRef = useRef(null);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setIsError(true));
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleVolume = useCallback((e) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    video.volume = ratio;
    video.muted = ratio === 0;
    setVolume(ratio);
    setIsMuted(ratio === 0);
  }, []);

  const handleSeek = useCallback((e) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = seekRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * duration;
    setProgress(ratio);
    setCurrentTime(ratio * duration);
  }, [duration]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false);
      }
    }, 2500);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      if (video.duration) {
        setCurrentTime(video.currentTime);
        setProgress(video.currentTime / video.duration);
      }
    };
    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsLoading(false);
    };
    const onCanPlay = () => setIsLoading(false);
    const onWaiting = () => setIsLoading(true);
    const onError = () => {
      setIsLoading(false);
      setIsError(true);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setControlsVisible(true);
    };
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);
    video.addEventListener('ended', onEnded);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
      video.removeEventListener('ended', onEnded);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const progressPercent = (progress * 100).toFixed(2);

  return (
    <div
      ref={containerRef}
      className={`${styles.videoPlayer} ${isFullscreen ? styles.videoPlayerFullscreen : ''}`}
      onMouseMove={showControls}
      onMouseLeave={() => {
        if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
      }}
    >
      <video
        ref={videoRef}
        className={styles.videoPlayerVideo}
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
        onClick={togglePlay}
        onDoubleClick={fullscreenOnDoubleClick ? toggleFullscreen : undefined}
      />

      {/* Sent/received time + seen overlay (Telegram-style) */}
      {footer && (
        <div className={styles.videoFooterOverlay} onClick={(e) => e.stopPropagation()}>
          {footer}
        </div>
      )}

      {/* Big center play button (shown when paused) */}
      {!isPlaying && !isError && (
        <button
          type="button"
          className={styles.videoBigPlay}
          onClick={togglePlay}
          aria-label="Play"
        >
          {isLoading ? (
            <span className={styles.videoSpinner} />
          ) : (
            <FontAwesomeIcon icon={faPlay} />
          )}
        </button>
      )}

      {isError && (
        <div className={styles.videoError}>
          <span>Video could not be loaded</span>
        </div>
      )}

      {/* Custom control bar */}
      <div
        className={`${styles.videoControls} ${controlsVisible ? styles.videoControlsVisible : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={styles.videoSeek}
          ref={seekRef}
          onClick={handleSeek}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
          tabIndex={0}
        >
          <div className={styles.videoSeekTrack}>
            <div className={styles.videoSeekFill} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className={styles.videoControlsRow}>
          <button
            type="button"
            className={styles.videoControlButton}
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
          </button>

          <span className={styles.videoTime}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className={styles.videoSpacer} />

          <button
            type="button"
            className={styles.videoControlButton}
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <FontAwesomeIcon icon={isMuted ? faVolumeXmark : faVolumeHigh} />
          </button>

          <div className={styles.videoVolume} onClick={handleVolume} role="slider" aria-label="Volume">
            <div className={styles.videoVolumeTrack}>
              <div
                className={styles.videoVolumeFill}
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            className={styles.videoControlButton}
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
