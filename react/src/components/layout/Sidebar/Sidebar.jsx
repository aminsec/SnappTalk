import styles from './Sidebar.module.css';
import { NavLink } from 'react-router-dom';
import Logo from '@/assets/images/MiniLogo.png';
import { ProfileAvatar } from '@/components/';
import SidebarItem from './SidebarItem';
import { ICONS } from '@/icons';

function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      {/* Top Logo */}
      <div className={styles.logoWrapper}>
        <img src={Logo} alt="Logo" className={styles.logo} />
      </div>

      {/* Main Nav Items */}
      <nav className={styles.navItems}>
        <SidebarItem to="/chats" icon={ICONS.chat} label="Chats" />
      </nav>

      {/* Bottom Section */}
      <div className={styles.bottomSection}>
        <ProfileAvatar
          size={50}
          borderColor="var(--primary-color)"
        />
        <SidebarItem to="/settings" icon={ICONS.setting} label="Settings" />
      </div>
    </aside>
  );
}

export default Sidebar;
