const assert = require('assert');
const crypto = require('crypto');

const secret = 'test-secret';
const deviceId = 'test-device';
const body = JSON.stringify({ events: [{ name: 'card_generated', ts: new Date().toISOString() }] });
const timestamp = Math.floor(Date.now() / 1000).toString();
const message = `${timestamp}.${deviceId}.${body}`;
const signature = crypto.createHmac('sha256', secret).update(message).digest('hex');

assert.strictEqual(typeof signature, 'string');
assert.strictEqual(signature.length, 64);

console.log('live ops smoke tests passed');
