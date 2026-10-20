import { requireNativeView } from 'expo';
import * as React from 'react';

import { C6NotificationListenerViewProps } from './C6NotificationListener.types';

const NativeView: React.ComponentType<C6NotificationListenerViewProps> =
  requireNativeView('C6NotificationListener');

export default function C6NotificationListenerView(props: C6NotificationListenerViewProps) {
  return <NativeView {...props} />;
}
