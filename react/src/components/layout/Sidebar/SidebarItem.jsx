import { NavLink } from 'react-router-dom';
import styles from './SidebarItem.module.css';

function SidebarItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${styles.item} ${isActive ? styles.active : ''}`
      }
      title={label}
    >
      <img src={icon} alt={`${label} Icon`} className={styles.icon} />
    </NavLink>
  );
}

export default SidebarItem;
