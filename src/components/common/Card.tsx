import React, { useState } from 'react';

/**
 * Sample Card Component
 * Demonstrates Tailwind CSS styling and TypeScript types
 * Use this as a template for creating new components
 */

interface CardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  title,
  description,
  children,
  variant = 'default',
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseClasses = 'rounded-lg p-6 transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white',
    bordered: 'bg-white border-2 border-gray-200',
    elevated: 'bg-white shadow-lg hover:shadow-xl',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${
    onClick ? 'cursor-pointer' : ''
  }`;

  return (
    <div
      className={classes}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        {isHovered && onClick && (
          <span className="text-indigo-600 text-sm">→</span>
        )}
      </div>
      
      {description && (
        <p className="text-gray-600 mb-4 text-sm">{description}</p>
      )}
      
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default Card;
