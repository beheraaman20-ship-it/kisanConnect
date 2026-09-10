import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  const classes = [
    'rounded-xl border border-neutral-200 bg-white p-4 shadow-sm',
    onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : '',
    className ?? '',
  ].join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};