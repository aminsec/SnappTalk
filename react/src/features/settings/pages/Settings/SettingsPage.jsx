import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import { Sidebar, Input, UserCard, OptionItem } from '@/shared/components';

import { settingsOptions } from './data/options';
import styles from './Settings.module.css';

function SettingsPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className={styles.settingsContainer}>
      <Sidebar className={styles.sidebar}/>

      <aside className={styles.settingsSidebar}>
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
