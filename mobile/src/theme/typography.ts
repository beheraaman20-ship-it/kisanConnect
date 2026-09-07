import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    color: '#111827',
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    color: '#111827',
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: '#111827',
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#111827',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#111827',
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#6b7280',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#374151',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: '#6b7280',
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  token: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    color: '#16a34a',
  },
  queuePosition: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    color: '#f59e0b',
  },
  waitTime: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    color: '#3b82f6',
  },
};
