import React from 'react';

interface CheckIconProps {
  seen?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SentCheckIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className,
  style,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path
      d="M5.305 11.235a1 1 0 0 1 1.414.024l3.206 3.319L17.3 7.289a1 1 0 0 1 1.4 1.422l-8.091 8a1 1 0 0 1-.7.289H9.9a1 1 0 0 1-.708-.3L5.281 12.649a1 1 0 0 1 .024-1.414Z"
      fill="currentColor"
    />
  </svg>
);

export const SeenCheckIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className,
  style,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path
      d="M2.305 11.235a1 1 0 0 1 1.414.024l3.206 3.319L14.3 7.289a1 1 0 0 1 1.4 1.422l-8.091 8a1 1 0 0 1-.7.289H6.9a1 1 0 0 1-.708-.3L2.281 12.649a1 1 0 0 1 .024-1.414ZM20.3 7.289l-7.372 7.289-.263-.273a1 1 0 1 0-1.438 1.39l.966 1a1 1 0 0 0 .708.3h.011a1 1 0 0 0 .7-.289l8.091-8a1 1 0 0 0-.7-1.422Z"
      fill="currentColor"
    />
  </svg>
);

export const CheckIcon: React.FC<CheckIconProps> = ({ seen, className, style }) => {
  if (seen) {
    return <SeenCheckIcon className={className} style={style} />;
  }
  return <SentCheckIcon className={className} style={style} />;
};

export default CheckIcon;
