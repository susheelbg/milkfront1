import React from 'react';

export const Card = ({
  children,
  className = '',
  shadow = 'md',
  hover = false,
  padding = 'md',
  ...props
}) => {
  const shadows = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const paddings = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const shadowStyle = shadows[shadow] || shadows.md;
  const paddingStyle = paddings[padding] || paddings.md;
  const hoverStyle = hover ? 'hover:shadow-lg transition-shadow duration-300' : '';

  return (
    <div
      className={`bg-white rounded-xl ${shadowStyle} ${paddingStyle} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
