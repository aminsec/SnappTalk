import styles from './SettingsHeader.module.css';
import { Button } from '@/shared/components';

export default function SettingsHeader({
  title = "Settings",
  editMode = false,
  showEdit = false,
  onEdit = () => {},
  onCancel = () => {},
}) {
  return (
    <div className={styles.settingsHeader}>
      <h1 className={styles.title}>{title}</h1>

      {showEdit && (
        <div className={styles.actions}>
          {editMode && (
            <Button variant="outline" size="sm" onClick={onCancel}>
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
