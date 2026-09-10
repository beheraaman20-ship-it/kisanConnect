import { env } from '../config/env.js';

const MSG91_API_URL = 'https://api.msg91.com/api/v5/flow';
const TWILIO_API_URL = 'https://api.twilio.com/2010-04-01/Accounts';

async function sendMsg91(mobile, message) {
  const { apiKey, senderId, templateId, authKey } = env.sms;

  if (!apiKey && !authKey) {
    throw new Error('MSG91 API key or auth key is required');
  }

  const payload = {
    sender_id: senderId,
    route: '4',
    country: '91',
    mobiles: mobile,
    flow_id: templateId,
    var1: message,
  };

  const authHeader = apiKey
    ? { authkey: apiKey }
    : { authkey: authKey };

  const response = await fetch(MSG91_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`MSG91 API error: ${data.message || response.statusText}`);
  }

  return { success: true, provider: 'msg91', messageId: data.request_id };
}

async function sendTwilio(mobile, message) {
  const { accountSid, authToken, from } = env.sms;

  if (!accountSid || !authToken) {
    throw new Error('Twilio Account SID and Auth Token are required');
  }

  const url = `${TWILIO_API_URL}/${accountSid}/Messages.json`;
  const params = new URLSearchParams({
    To: `+91${mobile}`,
    From: from,
    Body: message,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Twilio API error: ${data.message || response.statusText}`);
  }

  return { success: true, provider: 'twilio', messageId: data.sid };
}

async function sendTextlocal(mobile, message) {
  const { apiKey, senderId, username, password } = env.sms;

  if (!apiKey && (!username || !password)) {
    throw new Error('Textlocal API key or username/password is required');
  }

  const params = new URLSearchParams({
    apiKey: apiKey,
    sender: senderId || 'KISAN',
    numbers: mobile,
    message: message,
    test: '0',
  });

  if (username && password) {
    params.set('username', username);
    params.set('hash', password);
  }

  const response = await fetch('https://api.textlocal.in/send/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok || data.status !== 'success') {
    throw new Error(`Textlocal API error: ${data.message || response.statusText}`);
  }

  return { success: true, provider: 'textlocal', messageId: data.messages[0]?.id };
}

const providers = {
  msg91: sendMsg91,
  twilio: sendTwilio,
  textlocal: sendTextlocal,
};

export async function sendSms(mobile, message) {
  const provider = env.sms.provider;

  if (!providers[provider]) {
    throw new Error(`Unsupported SMS provider: ${provider}. Supported: ${Object.keys(providers).join(', ')}`);
  }

  return providers[provider](mobile, message);
}

export function getSmsStatus() {
  return {
    provider: env.sms.provider,
    configured: Boolean(env.sms.apiKey || env.sms.authKey || env.sms.accountSid),
  };
}
