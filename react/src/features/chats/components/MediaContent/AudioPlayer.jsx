import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
} from '@fortawesome/free-solid-svg-icons';
import styles from './MediaContent.module.css';

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const WAVEFORM_BARS = [8, 14, 20, 11, 24, 17, 28, 13, 22, 31, 18, 10, 25, 16, 29, 21, 12, 26, 18, 32, 15, 23, 11, 27, 19, 30, 14, 22, 9, 17];

/**
 * Telegram-style audio player with a custom UI (no browser default controls).
 * Supports both voice messages (compact) and audio files (with file name).
 */
function AudioPlayer({ src, fileName, isVoice = false, accent = 'var(--btn-color)', footer }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const seekRef = useRef(null);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => setIsError(true));
    } else {
      audio.pause();
    }
  }, []);

  const handleSeek = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = seekRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setProgress(ratio);
    setCurrentTime(ratio * duration);
  }, [duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      if (!isSeeking && audio.duration) {
        setCurrentTime(audio.currentTime);
        setProgress(audio.currentTime / audio.duration);
      }
    };
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
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
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
    };
  }, [isSeeking]);

  const progressPercent = (progress * 100).toFixed(2);

  return (
    <div
      className={`${styles.audioPlayer} ${isVoice ? styles.audioPlayerVoice : ''} ${footer ? styles.audioPlayerWithFooter : ''}`}
      style={{ '--player-accent': accent }}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        style={{ display: 'none' }}
      />

      <button
        type="button"
        className={styles.audioPlayButton}
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading && !isPlaying ? (
          <span className={styles.audioSpinner} />
        ) : (
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
        )}
      </button>

      <div className={styles.audioBody}>
        {!isVoice && fileName && (
          <span className={styles.audioFileName} title={fileName}>
            {fileName}
          </span>
        )}
        <div className={styles.audioSeekRow}>
          <div
            className={styles.audioSeek}
            ref={seekRef}
            onClick={handleSeek}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressPercent)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' && audioRef.current) {
                audioRef.current.currentTime = Math.min(
                  audioRef.current.duration || 0,
                  (audioRef.current.currentTime || 0) + 5
                );
              } else if (e.key === 'ArrowLeft' && audioRef.current) {
                audioRef.current.currentTime = Math.max(
                  0,
                  (audioRef.current.currentTime || 0) - 5
                );
              }
            }}
          >
            <div className={styles.audioWaveform} aria-hidden="true">
              {WAVEFORM_BARS.map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className={index / (WAVEFORM_BARS.length - 1) <= progress ? styles.audioWaveformPlayed : ''}
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>
          </div>
          <span className={styles.audioTime}>
            {isError ? 'Unavailable' : formatTime(isPlaying || currentTime > 0 ? currentTime : duration)}
          </span>
        </div>
      </div>
      {footer && (
        <div className={styles.audioFooterOverlay} onClick={(e) => e.stopPropagation()}>
          {footer}
        </div>
      )}
    </div>
  );
}

export default AudioPlayer;
