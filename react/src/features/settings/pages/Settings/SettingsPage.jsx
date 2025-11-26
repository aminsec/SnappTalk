import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { faSearch, faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Sidebar, Input, UserCard, OptionItem } from '@/shared/components';

import { settingsOptions } from './data/options';
import styles from './Settings.module.css';

function SettingsPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsSidebarOpen, setIsSettingsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false);
        setIsSettingsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.settingsContainer}>
      {(isSidebarOpen || isSettingsSidebarOpen) && (
        <div
          className={`${styles.mobileBackdrop} ${(isSidebarOpen || isSettingsSidebarOpen) ? styles.open : ''}`}
          onClick={() => {
            setIsSidebarOpen(false);
            setIsSettingsSidebarOpen(false);
          }}
        />
      )}
      <button
        type="button"
        className={styles.mobileMenuToggle}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle menu"
      >
        <FontAwesomeIcon icon={faBars} />
      </button>
      <div className={`${styles.sidebarWrapper} ${isSidebarOpen ? styles.open : ''}`}>
        <Sidebar />
      </div>

      <button
        type="button"
        className={styles.mobileSettingsToggle}
        onClick={() => setIsSettingsSidebarOpen(!isSettingsSidebarOpen)}
        aria-label="Toggle settings menu"
      >
        <FontAwesomeIcon icon={faBars} />
      </button>
      <aside className={`${styles.settingsSidebar} ${isSettingsSidebarOpen ? styles.open : ''}`}>
        <Input type="text" name="text" id="search" placeholder="Search..." icon={faSearch} size="lg" fullWidth className="mb-3"/>

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
            onClick={() => navigate(path)}
          />
        ))}
      </aside>

      <div className={styles.settingsContent}>
        <h1 className={styles.settingsTitle}>Settings</h1>
        <div className={styles.settingsContents}>
        <Outlet/>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
