import { faUser, faCog, faPalette } from '@fortawesome/free-solid-svg-icons';

export const settingsOptions = [
  {
    label: "Profile",
    icon: faUser,
    iconBg: "#fd295b",
    path: "/settings/profile",
  },
  {
    label: "General",
    icon: faCog,
    iconBg: "#898a8c",
    path: "/settings/general",
  },
  {
    label: "Appearance",
    icon: faPalette,
    iconBg: "#2D90E4",
    path: "/settings/appearance",
  },
];
