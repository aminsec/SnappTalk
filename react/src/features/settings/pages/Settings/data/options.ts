import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faUser, faCog, faPalette, faShieldHalved } from '@fortawesome/free-solid-svg-icons';

export interface SettingOption {
  label: string;
  icon: IconDefinition;
  iconBg: string;
  path: string;
}

export const settingsOptions: SettingOption[] = [
  {
    label: 'Profile',
    icon: faUser,
    iconBg: '#fd295b',
    path: '/settings/profile',
  },
  {
    label: 'General',
    icon: faCog,
    iconBg: '#898a8c',
    path: '/settings/general',
  },
  {
    label: 'Appearance',
    icon: faPalette,
    iconBg: '#2D90E4',
    path: '/settings/appearance',
  },
  {
    label: 'Account',
    icon: faShieldHalved,
    iconBg: '#8B5CF6',
    path: '/settings/account',
  },
];

