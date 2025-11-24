import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './OptionItem.module.css';

function OptionItem({
  icon,
  iconColor = 'var(--icon-color)',
  iconBg = 'var(--bg-cart)',
  iconPosition = 'left',
  label,
  description = '',
  active = false,
  onClick,
  fullWidth = false,
  size = 'md',
  className = '',
}) {
  const iconStyles = {
    backgroundColor: iconBg,
    color: iconColor,
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        styles.optionItem,
        styles[size],
        active && styles.active,
        fullWidth && styles.fullWidth,
        className
      )}
    >
      {icon && iconPosition === 'left' && (
        <span className={styles.iconWrapper} style={iconStyles}>
          <FontAwesomeIcon icon={icon} />
        </span>
      )}

      <div className={styles.textContent}>
        <p className={styles.label}>{label}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>

      {icon && iconPosition === 'right' && (
        <span className={styles.iconWrapper} style={iconStyles}>
          <FontAwesomeIcon icon={icon} />
        </span>
      )}
    </div>
  );
}

export default OptionItem;