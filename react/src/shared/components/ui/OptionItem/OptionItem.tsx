import React from 'react';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import styles from './OptionItem.module.css';

export interface OptionItemProps {
  icon?: IconDefinition | null;
  iconColor?: string;
  iconBg?: string;
  iconPosition?: 'left' | 'right';
  label: string;
  description?: string;
  active?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const OptionItem: React.FC<OptionItemProps> = ({
  icon,
  iconColor = '#ffffff',
  iconBg = 'rgba(255, 255, 255, 0.1)',
  iconPosition = 'left',
  label,
  description = '',
  active = false,
  onClick,
  fullWidth = false,
  size = 'md',
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={clsx(
        styles.optionItem,
        styles[size],
        active && styles.active,
        fullWidth && styles.fullWidth,
        className
      )}
      style={{ '--item-accent': iconBg } as React.CSSProperties}
    >
      {icon && iconPosition === 'left' && (
        <span className={styles.iconWrapper} style={{ backgroundColor: iconBg, color: iconColor }}>
          <FontAwesomeIcon icon={icon} />
        </span>
      )}

      <div className={styles.textContent}>
        <p className={styles.label}>{label}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>

      <span className={styles.chevronIcon} aria-hidden="true">
        <FontAwesomeIcon icon={faChevronRight} />
      </span>

      {icon && iconPosition === 'right' && (
        <span className={styles.iconWrapper} style={{ backgroundColor: iconBg, color: iconColor }}>
          <FontAwesomeIcon icon={icon} />
        </span>
      )}
    </div>
  );
};

export default OptionItem;
