import 'dotenv/config';

const int = (v, d) => (v === undefined || v === '' ? d : parseInt(v, 10));
const bool = (v, d) => (v === undefined || v === '' ? d : v === 'true' || v === '1');

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') !== 'production',
  port: int(process.env.PORT, 4000),
  db: {
    driver: process.env.DB_DRIVER || 'sqlite',
    path: process.env.DB_PATH || './data/kisanconnect.db',
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '1d',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
  },
  otp: {
    digits: int(process.env.OTP_DIGITS, 4),
    ttlMinutes: int(process.env.OTP_TTL_MINUTES, 5),
    maxAttempts: int(process.env.OTP_MAX_ATTEMPTS, 3),
    rateLimitWindowMs: int(process.env.OTP_RATE_LIMIT_WINDOW_MS, 60000),
    rateLimitMax: int(process.env.OTP_RATE_LIMIT_MAX, 3),
    devMode: bool(process.env.OTP_DEV_MODE, true),
  },
  sms: {
    provider: process.env.SMS_PROVIDER || 'msg91',
    apiKey: process.env.SMS_API_KEY || '',
    senderId: process.env.SMS_SENDER_ID || 'KISAN',
    templateId: process.env.SMS_TEMPLATE_ID || '',
    authKey: process.env.SMS_AUTH_KEY || '',
    username: process.env.SMS_USERNAME || '',
    password: process.env.SMS_PASSWORD || '',
    accountSid: process.env.SMS_ACCOUNT_SID || '',
    authToken: process.env.SMS_AUTH_TOKEN || '',
    from: process.env.SMS_FROM || '',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  },
  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@kisanconnect.local',
  },
  service: {
    avgProcessMinutes: int(process.env.DEFAULT_AVG_PROCESS_MINUTES, 10),
    activeCounters: int(process.env.DEFAULT_ACTIVE_COUNTERS, 1),
    mlServiceUrl: process.env.ML_SERVICE_URL || '',
  },
};