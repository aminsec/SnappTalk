import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { faCog, faComment } from '@fortawesome/free-solid-svg-icons';

import Logo from '@/shared/assets/images/MiniLogo.png';
import { ProfileAvatar } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';
import { AUTH_STATUS } from '@/shared/state/userStateContext';
import { wallpapers, WALLPAPER_STORAGE_KEY } from '@/shared/utils/wallpapers';

import SidebarItem from './SidebarItem';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const navigate = useNavigate();
  const { user, status } = useAuth();

  const isAuthenticated = status === AUTH_STATUS.AUTHENTICATED;

  // Dynamic theme matching
  const [wallpaperId, setWallpaperId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'aurora';
    return localStorage.getItem(WALLPAPER_STORAGE_KEY) || 'aurora';
  });

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === WALLPAPER_STORAGE_KEY && event.newValue) {
        setWallpaperId(event.newValue);
      }
    };

    const handleCustomChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ wallpaperId: string }>;
      if (customEvent.detail?.wallpaperId) {
        setWallpaperId(customEvent.detail.wallpaperId);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('wallpaper-change', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('wallpaper-change', handleCustomChange);
    };
  }, []);

  const resolvedWallpaper = useMemo(() => {
    return (
      wallpapers.find((w) => w.id === wallpaperId) ||
      wallpapers.find((w) => w.id === 'aurora') ||
      wallpapers[0]
    );
  }, [wallpaperId]);

  const sidebarThemeStyle = useMemo(() => {
    const accent = resolvedWallpaper.accent || '#3390ec';
    return {
      '--icon-active-bg': accent,
      '--theme-accent': accent,
      '--btn-color': accent,
    } as React.CSSProperties;
  }, [resolvedWallpaper]);

  return (
    <aside
      className={`${styles.sidebar} ${className || ''}`.trim()}
      style={sidebarThemeStyle}
    >
      {/* Top Logo */}
      <div className={styles.logoWrapper}>
        <img src={Logo} alt="Logo" className={styles.logo} onClick={() => navigate('/chats')} />
      </div>

      {/* Main Nav Items */}
      <nav className={styles.navItems}>
        <SidebarItem to="/chats" icon={faComment} label="Chats" />
      </nav>

      {/* Bottom Section */}
      {isAuthenticated ? (
        <div className={styles.bottomSection}>
          <ProfileAvatar
            src={user?.profile_pic}
            size={50}
            borderColor="var(--primary-color)"
          />
          <SidebarItem to="/settings" icon={faCog} label="Settings" />
        </div>
      ) : (
        <div className={styles.bottomSection}>
          <SidebarItem to="/login" icon={faComment} label="Log in" />
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
