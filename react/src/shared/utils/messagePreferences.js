export const MESSAGE_SIZE_KEY = 'chat_message_size';

export const MESSAGE_SIZE_OPTIONS = [
  {
    value: 0,
    label: 'Tiny',
    description: 'Very compact',
    fontSize: '13px',
    lineHeight: '1.3',
    bubblePaddingY: '8px',
    bubblePaddingX: '11px',
    bubbleGap: '3px',
    bubbleRadius: '15px',
    captionFontSize: '11px',
  },
  {
    value: 1,
    label: 'Small',
    description: 'Compact',
    fontSize: '14px',
    lineHeight: '1.34',
    bubblePaddingY: '9px',
    bubblePaddingX: '12px',
    bubbleGap: '3px',
    bubbleRadius: '16px',
    captionFontSize: '12px',
  },
  {
    value: 2,
    label: 'Light',
    description: 'A little smaller',
    fontSize: '15px',
    lineHeight: '1.38',
    bubblePaddingY: '10px',
    bubblePaddingX: '14px',
    bubbleGap: '4px',
    bubbleRadius: '17px',
    captionFontSize: '13px',
  },
  {
    value: 3,
    label: 'Default',
    description: 'Balanced',
    fontSize: '16px',
    lineHeight: '1.4',
    bubblePaddingY: '12px',
    bubblePaddingX: '16px',
    bubbleGap: '4px',
    bubbleRadius: '18px',
    captionFontSize: '14px',
  },
  {
    value: 4,
    label: 'Comfortable',
    description: 'Easy to read',
    fontSize: '17px',
    lineHeight: '1.43',
    bubblePaddingY: '13px',
    bubblePaddingX: '17px',
    bubbleGap: '5px',
    bubbleRadius: '19px',
    captionFontSize: '15px',
  },
  {
    value: 5,
    label: 'Large',
    description: 'More spacious',
    fontSize: '18px',
    lineHeight: '1.46',
    bubblePaddingY: '14px',
    bubblePaddingX: '18px',
    bubbleGap: '5px',
    bubbleRadius: '20px',
    captionFontSize: '16px',
  },
  {
    value: 6,
    label: 'Huge',
    description: 'Maximum size',
    fontSize: '20px',
    lineHeight: '1.5',
    bubblePaddingY: '16px',
    bubblePaddingX: '20px',
    bubbleGap: '6px',
    bubbleRadius: '22px',
    captionFontSize: '18px',
  },
];

const validMessageSizes = new Set(MESSAGE_SIZE_OPTIONS.map(({ value }) => String(value)));

const normalizeMessageSize = (value) => {
  if (validMessageSizes.has(String(value))) return Number(value);
  if (value === 'small') return 1;
  if (value === 'medium') return 3;
  if (value === 'large') return 5;
  return 3;
};

export const getMessageSize = () => {
  if (typeof window === 'undefined') return 3;
  const storedValue = localStorage.getItem(MESSAGE_SIZE_KEY);
  return normalizeMessageSize(storedValue);
};

export const saveMessageSize = (value) => {
  const nextValue = normalizeMessageSize(value);
  localStorage.setItem(MESSAGE_SIZE_KEY, nextValue);
  window.dispatchEvent(new CustomEvent('message-preferences-change', {
    detail: { key: MESSAGE_SIZE_KEY, value: nextValue },
  }));
};

export const getMessageSizeOption = (value) => {
  const normalizedValue = normalizeMessageSize(value);
  return MESSAGE_SIZE_OPTIONS[normalizedValue];
};
