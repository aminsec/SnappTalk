import styles from './Input.module.css';
import clsx from 'clsx';

function Input({
  icon = null,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  size = 'md',         // sm, md, lg
  fullWidth = false,
  error = '',
  name,
  id,
  className = '',
  ...rest
}) {
  return (
    <div className={clsx(styles.inputWrapper, fullWidth && styles.fullWidth, className)}>
      <div className={clsx(
        styles.inputContainer,
        styles[`input--${size}`],
        error && styles.error
      )}>
        {icon && (
          <span className={styles.icon}>
            <img src={icon} alt="icon" />
          </span>
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={clsx(
            styles.input,
            icon && styles.inputWithIcon
          )}
          {...rest}
        />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}

export default Input;