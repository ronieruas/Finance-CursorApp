import * as React from 'react';

import { C6NotificationListenerViewProps } from './C6NotificationListener.types';

export default function C6NotificationListenerView(props: C6NotificationListenerViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
