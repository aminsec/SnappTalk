import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBars } from '@fortawesome/free-solid-svg-icons';

import { Sidebar, UserCard, OptionItem } from '@/shared/components';

import { settingsOptions } from './data/options';
import styles from './Settings.module.css';

function SettingsPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
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
        </aside>

        <div className={styles.settingsContent}>
          <div className={styles.settingsContents}>
          <Outlet/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
