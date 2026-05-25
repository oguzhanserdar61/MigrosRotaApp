import { Platform } from 'react-native';

type PressAction = () => void;

export function pressHandlers(onPress: PressAction) {
  if (Platform.OS !== 'web') {
    return { onPress };
  }

  let lastPressAt = 0;
  const runOnce = () => {
    const now = Date.now();
    if (now - lastPressAt < 80) return;
    lastPressAt = now;
    onPress();
  };

  return {
    onPress: runOnce,
    onClick: (event: any) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      runOnce();
    },
  } as any;
}
