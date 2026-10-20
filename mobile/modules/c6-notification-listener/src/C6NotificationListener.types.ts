export type CapturedNotification = {
  id: string;
  packageName: string;
  appLabel: string;
  title: string;
  text: string;
  subText?: string;
  postedAt: number;
  capturedAt: number;
};

export type C6NotificationListenerModuleEvents = Record<string, never>;
