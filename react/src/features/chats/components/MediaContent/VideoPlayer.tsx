import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faVolumeHigh,
  faVolumeXmark,
  faExpand,
  faCompress,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import styles from './MediaContent.module.css';

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export interface VideoPlayerProps {
  src?: string;
  mimeType?: string;
  poster?: string;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
  captioned?: boolean;
  reply?: boolean;
  className?: string;
  onOpenFullscreen?: () => void;
  hasReachedMaxSize?: boolean;
  onDimensionsLoaded?: (dims: { width: number; height: number }) => void;
}

/**
 * Telegram-style video player with a custom overlay UI (no browser default controls).
 * Shows a poster/thumbnail with a centered play button; on play, reveals a
 * custom control bar (play/pause, seek, time, volume, fullscreen).
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  footer,
  style,
  className,
  onOpenFullscreen,
  hasReachedMaxSize,
  onDimensionsLoaded,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [bufferedProgress, setBufferedProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekRef = useRef<HTMLDivElement | null>(null);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setControlsVisible(true);
    if (video.paused) {
      if (video.ended) {
        video.currentTime = 0;
        setCurrentTime(0);
        setProgress(0);
      }
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

  const handleVolume = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    video.volume = ratio;
    video.muted = ratio === 0;
    setVolume(ratio);
    setIsMuted(ratio === 0);
  }, []);

  const updateSeekPosition = useCallback(
    (clientX: number) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      const rect = seekRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      video.currentTime = ratio * duration;
      setProgress(ratio);
      setCurrentTime(ratio * duration);
    },
    [duration]
  );

  const handleSeek = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      updateSeekPosition(event.clientX);
    },
    [updateSeekPosition]
  );

  const handleSeekPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!duration) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setIsSeeking(true);
      setControlsVisible(true);
      updateSeekPosition(event.clientX);
    },
    [duration, updateSeekPosition]
  );

  const handleSeekPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isSeeking) updateSeekPosition(event.clientX);
    },
    [isSeeking, updateSeekPosition]
  );

  const handleSeekPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setIsSeeking(false);
  }, []);

  const handleSeekKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      let nextTime = video.currentTime;
      if (event.key === 'ArrowRight') nextTime += 5;
      else if (event.key === 'ArrowLeft') nextTime -= 5;
      else if (event.key === 'Home') nextTime = 0;
      else if (event.key === 'End') nextTime = duration;
      else return;
      event.preventDefault();
      const seekBounds = seekRef.current?.getBoundingClientRect();
      if (!seekBounds) return;
      updateSeekPosition((nextTime / duration) * seekBounds.width + seekBounds.left);
    },
    [duration, updateSeekPosition]
  );

  const toggleFullscreen = useCallback(() => {
    if (onOpenFullscreen) {
      onOpenFullscreen();
      return;
    }
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if ('webkitEnterFullscreen' in video && typeof (video as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen === 'function') {
        (video as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
      }
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [onOpenFullscreen]);

  const restartVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setCurrentTime(0);
    setProgress(0);
    setControlsVisible(true);
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
      if (video.duration && !isSeeking) {
        setCurrentTime(video.currentTime);
        setProgress(video.currentTime / video.duration);
      }
    };
    const onProgress = () => {
      if (!video.duration || !video.buffered.length) return;
      setBufferedProgress(video.buffered.end(video.buffered.length - 1) / video.duration);
    };
    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsLoading(false);
      if (video.videoWidth && video.videoHeight && onDimensionsLoaded) {
        onDimensionsLoaded({ width: video.videoWidth, height: video.videoHeight });
      }
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
      video.currentTime = 0;
      setControlsVisible(true);
    };
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('progress', onProgress);
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
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
      video.removeEventListener('ended', onEnded);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isSeeking]);

  const progressPercent = Number((progress * 100).toFixed(2));
  const bufferedPercent = Number((bufferedProgress * 100).toFixed(2));

  return (
    <div
      ref={containerRef}
      className={`${styles.videoPlayer} ${className || ''} ${isFullscreen ? styles.videoPlayerFullscreen : ''}`.trim()}
      style={style}
      onMouseMove={showControls}
      onPointerMove={showControls}
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
        onDoubleClick={toggleFullscreen}
      />

      {hasReachedMaxSize && onOpenFullscreen && (
        <button
          type="button"
          className={styles.videoTopFullscreenBtn}
          onClick={(e) => {
            e.stopPropagation();
            onOpenFullscreen();
          }}
          aria-label="Open fullscreen"
          title="Open fullscreen"
        >
          <FontAwesomeIcon icon={faExpand} />
        </button>
      )}

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

      {isLoading && isPlaying && !isError && (
        <div className={styles.videoBuffering} role="status" aria-label="Buffering">
          <span className={styles.videoSpinner} />
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
          onPointerDown={handleSeekPointerDown}
          onPointerMove={handleSeekPointerMove}
          onPointerUp={handleSeekPointerUp}
          onPointerCancel={handleSeekPointerUp}
          onKeyDown={handleSeekKeyDown}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
          tabIndex={0}
        >
          <div className={styles.videoSeekTrack}>
            <div className={styles.videoSeekBuffered} style={{ width: `${bufferedPercent}%` }} />
            <div className={styles.videoSeekFill} style={{ width: `${progressPercent}%` }} />
            <span className={styles.videoSeekThumb} style={{ left: `${progressPercent}%` }} />
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

          <button
            type="button"
            className={styles.videoControlButton}
            onClick={restartVideo}
            aria-label="Restart video"
          >
            <FontAwesomeIcon icon={faRotateRight} />
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

          <div
            className={styles.videoVolume}
            onClick={handleVolume}
            role="slider"
            aria-label="Volume"
          >
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
};

export default VideoPlayer;

