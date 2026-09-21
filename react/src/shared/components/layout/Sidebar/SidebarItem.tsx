import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import styles from './SidebarItem.module.css';

export interface SidebarItemProps {
  to: string;
  icon: IconDefinition;
  label: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label }) => {
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
};

export default SidebarItem;

