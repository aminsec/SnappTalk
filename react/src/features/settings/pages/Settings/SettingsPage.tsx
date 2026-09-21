import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBars, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

import { Sidebar, UserCard, OptionItem } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';
import { wallpapers, WALLPAPER_STORAGE_KEY } from '@/shared/utils/wallpapers';

import { settingsOptions } from './data/options';
import styles from './Settings.module.css';

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { refreshUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

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

  const settingsThemeStyle = useMemo(() => {
    const accent = resolvedWallpaper.accent || '#3390ec';
    const accentHover = resolvedWallpaper.accentHover || '#2678c7';
    return {
      '--theme-accent': accent,
      '--theme-accent-hover': accentHover,
      '--theme-accent-soft': hexToRgba(accent, 0.12),
      '--theme-accent-border': hexToRgba(accent, 0.28),
      '--theme-accent-glow': hexToRgba(accent, 0.25),
      '--icon-active-bg': accent,
      '--btn-color': accent,
      '--btn-hover': accentHover,
    } as React.CSSProperties;
  }, [resolvedWallpaper]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to log out:', error);
    } finally {
      await refreshUser();
      navigate('/login', { replace: true });
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      {/* Mobile top bar: back to chats + open settings menu */}
      <div className={styles.mobileTopBar}>
        <button
          type="button"
          className={styles.mobileNavButton}
          onClick={() => navigate('/chats')}
          aria-label="Back to chats"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <span className={styles.mobileTopBarTitle}>Settings</span>
        <button
          type="button"
          className={styles.mobileMenuButton}
          onClick={() => setMenuOpen(true)}
          aria-label="Open settings menu"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>

      <div className={styles.settingsBody}>
        <Sidebar className={styles.sidebar} />

        {/* Mobile drawer overlay */}
        {menuOpen && (
          <div className={styles.drawerOverlay} onClick={() => setMenuOpen(false)} />
        )}

        <aside
          className={`${styles.settingsSidebar} ${menuOpen ? styles.settingsSidebarOpen : ''}`}
          style={settingsThemeStyle}
        >
          <div className={styles.drawerHeader}>
            <span>Settings</span>
            <button
              type="button"
              className={styles.drawerCloseButton}
              onClick={() => setMenuOpen(false)}
              aria-label="Close settings menu"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          </div>

          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>Settings</span>
          </div>

          <UserCard
            fullWidth
            avatarSize={46}
            className={styles.sidebarUserCard}
            onClick={() => handleNavigate('/settings/profile')}
          />

          <div className={styles.menuGroup}>
            <span className={styles.menuGroupTitle}>Navigation</span>
            {settingsOptions.map(({ label, icon, iconBg, path }) => (
              <OptionItem
                key={path}
                icon={icon}
                iconBg={iconBg}
                label={label}
                size="sm"
                fullWidth
                active={pathname.startsWith(path)}
                onClick={() => handleNavigate(path)}
              />
            ))}
          </div>

          {menuOpen && (
            <button
              type="button"
              className={styles.drawerLogoutButton}
              onClick={() => setShowLogoutConfirm(true)}
              disabled={isLoggingOut}
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span>{isLoggingOut ? 'Logging out…' : 'Logout'}</span>
            </button>
          )}
        </aside>

        <div className={styles.settingsContent}>
          <div className={styles.settingsContents}>
            {pathname === '/settings' ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>Choose an option from the menu</p>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className={styles.confirmOverlay} role="dialog" aria-modal="true">
          <div className={styles.confirmBox}>
            <p className={styles.confirmTitle}>Are you sure you want to logout?</p>
            <p className={styles.confirmText}>You will need to sign in again to continue.</p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out…' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

