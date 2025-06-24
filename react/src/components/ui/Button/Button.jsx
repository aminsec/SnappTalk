import styles from './Button.module.css';
import clsx from 'clsx';

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, outline, danger...
  size = 'md',         // sm, md, lg
  fullWidth = false,
  disabled = false
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        styles.btn,
        styles[`btn--${variant}`],
        styles[`btn--${size}`],
        fullWidth && styles.fullWidth
      )}
    >
      {children}
    </button>
  );
}

export default Button;