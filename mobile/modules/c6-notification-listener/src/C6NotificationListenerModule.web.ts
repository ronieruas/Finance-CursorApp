import { registerWebModule, NativeModule } from 'expo';

import { CapturedNotification, C6NotificationListenerModuleEvents } from './C6NotificationListener.types';

class C6NotificationListenerModule extends NativeModule<C6NotificationListenerModuleEvents> {
  async getCapturedNotifications(): Promise<CapturedNotification[]> {
    return [];
  }

  async syncActiveNotifications(): Promise<number> {
    return 0;
  }

  async clearCapturedNotifications(): Promise<void> {
    return;
  }

  async removeCapturedNotification(): Promise<void> {
    return;
  }

  isNotificationAccessGranted(): boolean {
    return false;
  }

  async openNotificationAccessSettings(): Promise<void> {
    return;
  }
}

export default registerWebModule(C6NotificationListenerModule, 'C6NotificationListener');
