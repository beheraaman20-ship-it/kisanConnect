import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-secondary-500 text-white hover:bg-amber-600',
  outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50',
  danger: 'bg-error text-white hover:bg-red-600',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  small: 'px-3 py-2 text-sm',
  medium: 'px-4 py-3 text-sm',
  large: 'px-6 py-4 text-base',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'large',
  loading = false,
  fullWidth = true,
  className,
  children,
  disabled,
  ...props
}) => {
  const classes = [
    'inline-flex items-center justify-center rounded-lg font-semibold transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className ?? '',
  ].join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
    </button>
  );
};