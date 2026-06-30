import { getOrCreateDeviceId } from './deviceIdentityService';
import { hmacSha256Hex } from './deviceSigningService';

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  process.env.EXPO_PUBLIC_BACKEND_URL ??
  '';

const DEVICE_AUTH_SECRET = process.env.EXPO_PUBLIC_PLUMP_DEVICE_AUTH_SECRET ?? '';

export function backendMirrorConfigured(): boolean {
  return API_BASE.length > 0 && DEVICE_AUTH_SECRET.length > 0;
}

export async function signedBackendPost(path: string, payload: unknown): Promise<boolean> {
  if (!backendMirrorConfigured()) return false;

  const body = JSON.stringify(payload);
  const deviceId = await getOrCreateDeviceId();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${timestamp}.${deviceId}.${body}`;
  const signature = hmacSha256Hex(DEVICE_AUTH_SECRET, message);

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 3000);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Plump-Device-Id': deviceId,
        'X-Plump-Timestamp': timestamp,
        'X-Plump-Signature': signature,
      },
      body,
      signal: ctrl.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
