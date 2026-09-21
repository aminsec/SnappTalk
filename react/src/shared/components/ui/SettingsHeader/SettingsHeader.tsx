import React from 'react';
import styles from './SettingsHeader.module.css';
import Button from '../Button/Button';

export interface SettingsHeaderProps {
  title?: string;
  editMode?: boolean;
  showEdit?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
}

export default function SettingsHeader({
  title = 'Settings',
  editMode = false,
  showEdit = false,
  onEdit = () => {},
  onCancel = () => {},
}: SettingsHeaderProps): React.ReactElement {
  return (
    <div className={styles.settingsHeader}>
      <h1 className={styles.title}>{title}</h1>

      {showEdit && (
        <div className={styles.actions}>
          {editMode && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button size="sm" onClick={onEdit}>
            {editMode ? 'Done' : 'Edit'}
          </Button>
        </div>
      )}
    </div>
  );
}

