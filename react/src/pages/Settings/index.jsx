import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Sidebar, Input, UserCard, OptionItem } from "@/components";
import styles from './Settings.module.css';
import { faUser, faCog, faSearch } from '@fortawesome/free-solid-svg-icons';

function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const settingsOptions = [
    {
      label: "Profile",
      icon: faUser,
      iconBg: "#fd295b",
      path: "/settings/profile"
    },
    {
      label: "General",
      icon: faCog,
      iconBg: "#898a8c",
      path: "/settings/general"
    },
  ];

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
            active={location.pathname.endsWith(path)}
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

export default Settings;
