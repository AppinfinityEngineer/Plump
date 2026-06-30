import { storage } from '@/src/utils/storage';

const DEVICE_ID_KEY = 'plump.device.id';

function randomPart(): string {
  return Math.random().toString(36).slice(2, 10);
}

function makeDeviceId(): string {
  return `plump-device-${Date.now().toString(36)}-${randomPart()}-${randomPart()}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await storage.secureGet(DEVICE_ID_KEY, '');
  if (typeof existing === 'string' && existing.length > 0) return existing;

  const next = makeDeviceId();
  await storage.secureSet(DEVICE_ID_KEY, next);
  return next;
}
