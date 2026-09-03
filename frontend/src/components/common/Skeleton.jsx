import React from 'react';

const Skeleton = ({ className = '', variant = 'rectangular', animation = 'pulse' }) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const animationClasses = {
    pulse: 'animate-pulse',
    none: '',
  };
  
  const variantClasses = {
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    text: 'rounded h-4 w-3/4',
  };

  return (
    <div 
      className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
    ></div>
  );
};

export default Skeleton;
