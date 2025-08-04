import { useEffect, useState } from "react";
import { Sidebar, Input, ProfileAvatar, UserCard } from "@/components";
import styles from './Settings.module.css'
import { ICONS } from '@/icons';

function Settings() {
  return (
    <div className={styles.settingsContainer}>
      <Sidebar />
      <div className={styles.settingsSidebar}>
        <Input type="text" name="text" id="search" placeholder="Search..." icon={ICONS.search} size="lg" fullWidth />
        <UserCard fullWidth />
      </div>
    </div>
  );
}

export default Settings;