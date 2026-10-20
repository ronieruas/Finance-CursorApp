import { NativeModule, requireNativeModule } from 'expo';

import { CapturedNotification, C6NotificationListenerModuleEvents } from './C6NotificationListener.types';

declare class C6NotificationListenerModule extends NativeModule<C6NotificationListenerModuleEvents> {
  getCapturedNotifications(): Promise<CapturedNotification[]>;
  syncActiveNotifications(): Promise<number>;
  clearCapturedNotifications(): Promise<void>;
  removeCapturedNotification(id: string): Promise<void>;
  isNotificationAccessGranted(): boolean;
  openNotificationAccessSettings(): Promise<void>;
}

export default requireNativeModule<C6NotificationListenerModule>('C6NotificationListener');
