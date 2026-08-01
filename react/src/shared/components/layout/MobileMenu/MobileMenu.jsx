import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCog, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

import { UserCard } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';

import styles from './MobileMenu.module.css';

function MobileMenu({ open, onClose }) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleNavigate = useCallback(
    (path) => {
      onClose();
      navigate(path);
    },
    [navigate, onClose]
  );

  const handleLogout = useCallback(async () => {
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
  }, [isLoggingOut, navigate, refreshUser]);

  const handleConfirmLogout = useCallback(() => {
    if (!isLoggingOut) handleLogout();
  }, [handleLogout, isLoggingOut]);

  const handleOpenConfirm = useCallback(() => {
    if (!isLoggingOut) setShowLogoutConfirm(true);
  }, [isLoggingOut]);

  const handleCancelLogout = useCallback(() => {
    if (!isLoggingOut) setShowLogoutConfirm(false);
  }, [isLoggingOut]);

  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} />}

      <aside
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        aria-hidden={!open}
      >
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Menu</span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close menu"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
        </div>

        <UserCard fullWidth className="mb-4" />

        <nav className={styles.nav}>
          <button
            type="button"
            className={styles.navItem}
            onClick={() => handleNavigate('/settings/profile')}
          >
            <span className={styles.navIcon}>
              <FontAwesomeIcon icon={faCog} />
            </span>
            <span className={styles.navLabel}>Settings</span>
          </button>
        </nav>

        <div className={styles.drawerFooter}>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleOpenConfirm}
            disabled={isLoggingOut}
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
            <span>{isLoggingOut ? 'Logging out…' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {showLogoutConfirm && (
        <div className={styles.confirmOverlay} role="dialog" aria-modal="true">
          <div className={styles.confirmBox}>
            <p className={styles.confirmTitle}>Are you sure you want to logout?</p>
            <p className={styles.confirmText}>You will need to sign in again to continue.</p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancelLogout}
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out…' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MobileMenu;
