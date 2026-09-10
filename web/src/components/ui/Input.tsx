import React from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  className,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label ? (
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          {label}
        </label>
      ) : null}
      <input
        className={[
          'w-full rounded-lg border bg-white px-4 py-3 text-base text-neutral-900',
          'placeholder:text-neutral-400 focus:outline-none focus:ring-2',
          error
            ? 'border-error focus:border-error focus:ring-error/30'
            : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/30',
          className ?? '',
        ].join(' ')}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
};