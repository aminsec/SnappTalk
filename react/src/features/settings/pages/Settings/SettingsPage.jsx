import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBars, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

import { Sidebar, UserCard, OptionItem } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';

import { settingsOptions } from './data/options';
import styles from './Settings.module.css';

function SettingsPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { refreshUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleNavigate = (path) => {
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
        <Sidebar className={styles.sidebar}/>

        {/* Mobile drawer overlay */}
        {menuOpen && (
          <div className={styles.drawerOverlay} onClick={() => setMenuOpen(false)} />
        )}

        <aside
          className={`${styles.settingsSidebar} ${menuOpen ? styles.settingsSidebarOpen : ''}`}
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

          <UserCard fullWidth className="mb-4"/>

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

          <button
            type="button"
            className={styles.drawerLogoutButton}
            onClick={() => setShowLogoutConfirm(true)}
            disabled={isLoggingOut}
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
            <span>{isLoggingOut ? 'Logging out…' : 'Logout'}</span>
          </button>
        </aside>

        <div className={styles.settingsContent}>
          <div className={styles.settingsContents}>
            {pathname === '/settings' ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>Choose an option from the menu</p>
              </div>
            ) : (
              <Outlet/>
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
}

export default SettingsPage;
