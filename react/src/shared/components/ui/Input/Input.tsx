import React from 'react';
import styles from './Input.module.css';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  icon?: IconDefinition | null;
  size?: InputSize;
  fullWidth?: boolean;
  error?: string;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  icon = null,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  error = '',
  name,
  id,
  className = '',
  ...rest
}) => {
  return (
    <div className={clsx(styles.inputWrapper, fullWidth && styles.fullWidth, className)}>
      <div
        className={clsx(
          styles.inputContainer,
          styles[`input--${size}`],
          error && styles.error
        )}
      >
        {icon && (
          <span className={styles.icon}>
            <FontAwesomeIcon icon={icon} />
          </span>
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={clsx(styles.input, icon && styles.inputWithIcon)}
          {...rest}
        />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default Input;
