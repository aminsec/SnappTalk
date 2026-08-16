import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import { Sidebar, Button, ProfileAvatar } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';
import { AUTH_STATUS } from '@/shared/state/userStateContext';
import { useSocket } from '@/shared/state/useSocket';

import styles from './ProfilePage.module.css';

function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const { socket } = useSocket();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const statusOfflineTimerRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isActive = true;
    setIsLoading(true);

    const loadProfile = async () => {
      try {
        const cacheBuster = `cb=${Date.now()}`;
        const response = await fetch(`/api/v1/members/${userId}/info?${cacheBuster}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.message || 'Unable to load profile.');
        }
        const payload = await response.json();
        if (isActive) {
          setProfile(payload?.member_info || null);
        }
      } catch (error) {
        toast.error(error?.message || 'Unable to load profile.');
        if (isActive) {
          setProfile(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!socket || !userId) {
      return;
    }

    const viewedUserId = userId.toString();

    const handleStatusOnline = (payload) => {
      const eventUserId = payload?.user_id?.toString();
      if (!eventUserId || eventUserId !== viewedUserId) {
        return;
      }
      if (statusOfflineTimerRef.current) {
        clearTimeout(statusOfflineTimerRef.current);
        statusOfflineTimerRef.current = null;
      }
      setProfile((prev) => {
        if (!prev || prev.status === 'online') {
          return prev;
        }
        return { ...prev, status: 'online' };
      });
    };

    const handleStatusOffline = (payload) => {
      const eventUserId = payload?.user_id?.toString();
      if (!eventUserId || eventUserId !== viewedUserId) {
        return;
      }
      if (statusOfflineTimerRef.current) {
        clearTimeout(statusOfflineTimerRef.current);
      }
      statusOfflineTimerRef.current = setTimeout(() => {
        setProfile((prev) => {
          if (!prev || prev.status === 'offline') {
            return prev;
          }
          return { ...prev, status: 'offline' };
        });
        statusOfflineTimerRef.current = null;
      }, 5000);
    };

    socket.on('status:online', handleStatusOnline);
    socket.on('status:offline', handleStatusOffline);

    return () => {
      socket.off('status:online', handleStatusOnline);
      socket.off('status:offline', handleStatusOffline);
      if (statusOfflineTimerRef.current) {
        clearTimeout(statusOfflineTimerRef.current);
        statusOfflineTimerRef.current = null;
      }
    };
  }, [socket, userId]);

  const profileId = profile?._id || profile?.id;
  const currentUserId = (user?._id || user?.id)?.toString();
  const isMe = currentUserId && profileId && currentUserId === profileId.toString();
  const memberSince = useMemo(() => {
    const raw = profile?.joined_at;
    if (!raw) return '—';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [profile?.joined_at]);

  const handleSendMessage = () => {
    if (!profileId) return;

    // Unauthenticated users must log in before starting a conversation
    if (status !== AUTH_STATUS.AUTHENTICATED) {
      navigate('/login', { replace: true });
      return;
    }

    const params = new URLSearchParams();
    params.set('startUser', profileId);
    navigate(`/chats?${params.toString()}`);
  };

  return (
    <div className={styles.profilePage}>
      {status === AUTH_STATUS.AUTHENTICATED && <Sidebar className={styles.sidebar} />}
      <main className={styles.profileContent}>
        <div className={styles.profileCard}>
          {isLoading ? (
            <div className={styles.loadingState}>Loading profile…</div>
          ) : profile ? (
            <>
              <div className={styles.header}>
                <button
                  type="button"
                  className={styles.mobileBackButton}
                  onClick={() => navigate(-1)}
                  aria-label="Back"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <ProfileAvatar size={96} src={profile.profile_pic} className={styles.avatar} />
                <div className={styles.titleBlock}>
                  <h1>@{profile.username || 'unknown'}</h1>
                  <div className={styles.statusRow}>
                    <span
                      className={`${styles.statusDot} ${
                        profile.status === 'online' ? styles.statusOnline : styles.statusOffline
                      }`}
                    />
                    <span className={styles.statusText}>
                      {profile.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                {status === AUTH_STATUS.AUTHENTICATED ? (
                  !isMe && (
                    <Button size="md" onClick={handleSendMessage} className={styles.messageButton}>
                      <FontAwesomeIcon icon={faPaperPlane} />
                      <span>Send message</span>
                    </Button>
                  )
                ) : (
                  <Button size="md" className={styles.messageButton} onClick={() => navigate('/login')}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                    <span>Send message</span>
                  </Button>
                )}
              </div>

              <div className={styles.bioCard}>
                <h2>Bio</h2>
                <p>{profile.bio || 'No bio yet.'}</p>
              </div>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <FontAwesomeIcon icon={faCalendarDays} />
                  <div>
                    <p className={styles.metaLabel}>Member since</p>
                    <p className={styles.metaValue}>{memberSince}</p>
                  </div>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaBadge}>
                    {profile.status === 'online' ? 'Available now' : 'Last seen recently'}
                  </span>
                </div>
              </div>

              {status !== AUTH_STATUS.AUTHENTICATED && (
                <div className={styles.signupLink}>
                  <a href="/login">Create account to start chatting</a>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <h2>Profile not found</h2>
              <p>We couldn’t load this user.</p>
              <Button
                size="md"
                onClick={() =>
                  navigate(status === AUTH_STATUS.AUTHENTICATED ? '/chats' : '/')
                }
              >
                {status === AUTH_STATUS.AUTHENTICATED ? 'Back to chats' : 'Go home'}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
