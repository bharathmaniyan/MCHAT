import React from 'react';
import { SearchX } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = SearchX, 
  title = 'No results found', 
  message = "We couldn't find what you're looking for.",
  action 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
      <div className="bg-indigo-50 p-4 rounded-full mb-4">
        <Icon className="w-8 h-8 text-indigo-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-6">{message}</p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
