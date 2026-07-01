// Native share for the progress card. Captures the card view to an image and
// shares image + caption; falls back to text share if capture/sharing is
// unavailable. Watermark is always plump.app (baked into the card view).

import { Platform, Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { View } from 'react-native';

export function buildCaption(goalName: string, saved: string): string {
  return `My Plump is getting rounder 🐻💚 ${saved} saved toward ${goalName}. plump.app`;
}

export async function shareCard(
  cardRef: RefObject<View | null>,
  caption: string,
): Promise<boolean> {
  // Web: text share only
  if (Platform.OS === 'web') {
    try {
      await Share.share({ message: caption });
      return true;
    } catch {
      return false;
    }
  }
  try {
    if (cardRef.current) {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { dialogTitle: caption, mimeType: 'image/png' });
        return true;
      }
    }
    await Share.share({ message: caption });
    return true;
  } catch {
    try {
      await Share.share({ message: caption });
      return true;
    } catch {
      return false;
    }
  }
}
