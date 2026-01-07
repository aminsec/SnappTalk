import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

import { Sidebar, Button, ProfileAvatar } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';

import styles from './ProfilePage.module.css';

function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const profileId = profile?._id || profile?.id;
  const isMe = user?.id && profileId && user.id.toString() === profileId.toString();
  const memberSince = useMemo(() => {
    const raw = profile?.joined_at;
    if (!raw) return '—';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [profile?.joined_at]);

  const handleSendMessage = () => {
    if (!profileId) return;
    const params = new URLSearchParams();
    params.set('startUser', profileId);
    navigate(`/chats?${params.toString()}`);
  };

  return (
    <div className={styles.profilePage}>
      <Sidebar className={styles.sidebar} />
      <main className={styles.profileContent}>
        <div className={styles.profileCard}>
          {isLoading ? (
            <div className={styles.loadingState}>Loading profile…</div>
          ) : profile ? (
            <>
              <div className={styles.header}>
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
                {!isMe && (
                  <Button size="md" onClick={handleSendMessage} className={styles.messageButton}>
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
            </>
          ) : (
            <div className={styles.emptyState}>
              <h2>Profile not found</h2>
              <p>We couldn’t load this user.</p>
              <Button size="md" onClick={() => navigate('/chats')}>
                Back to chats
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
