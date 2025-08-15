import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
      <FontAwesomeIcon icon={icon} className={styles.icon} />
    </NavLink>
  );
}

export default SidebarItem;
