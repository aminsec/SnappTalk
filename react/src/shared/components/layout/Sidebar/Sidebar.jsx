import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { faCog, faComment } from '@fortawesome/free-solid-svg-icons';

import Logo from '@/shared/assets/images/MiniLogo.png';
import { ProfileAvatar } from '@/shared/components';
import { useAuth } from '@/shared/state/useAuth';

import SidebarItem from './SidebarItem';
import styles from './Sidebar.module.css';

function Sidebar() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

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
    }
  }, [isLoggingOut, navigate, refreshUser]);

  return (
    <aside className={styles.sidebar}>
      {/* Top Logo */}
      <div className={styles.logoWrapper}>
        <img src={Logo} alt="Logo" className={styles.logo} onClick={() => navigate('/chats')} />
      </div>

      {/* Main Nav Items */}
      <nav className={styles.navItems}>
        <SidebarItem to="/chats" icon={faComment} label="Chats" />
      </nav>

      {/* Bottom Section */}
      <div className={styles.bottomSection}>
        <ProfileAvatar
          src={user?.profile_pic}
          size={50}
          borderColor="var(--primary-color)"
        />
        <SidebarItem to="/settings" icon={faCog} label="Settings" />
        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging out…' : 'Logout'}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
