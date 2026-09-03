import React from 'react';
import { Clock } from 'lucide-react';

const BusinessHoursEditor = ({ businessHours, onChange }) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Initialize if empty
  const defaultHours = days.map((_, index) => ({
    dayOfWeek: index,
    openTime: '09:00',
    closeTime: '17:00',
    isClosed: false
  }));
  
  const currentHours = businessHours?.length === 7 ? businessHours : defaultHours;

  const updateDay = (dayIndex, field, value) => {
    const updated = [...currentHours];
    updated[dayIndex] = { ...updated[dayIndex], [field]: value };
    onChange(updated);
  };

  const copyToAll = (sourceIndex) => {
    const sourceDay = currentHours[sourceIndex];
    const updated = currentHours.map(day => ({
      ...day,
      openTime: sourceDay.openTime,
      closeTime: sourceDay.closeTime,
      isClosed: sourceDay.isClosed
    }));
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-indigo-600" />
          Weekly Operating Hours
        </h3>
      </div>
      
      <div className="divide-y divide-gray-100">
        {currentHours.map((schedule) => (
          <div key={schedule.dayOfWeek} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-32 font-medium text-gray-900">
              {days[schedule.dayOfWeek]}
            </div>
            
            <div className="flex-1 flex flex-wrap items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  checked={schedule.isClosed}
                  onChange={(e) => updateDay(schedule.dayOfWeek, 'isClosed', e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700">Closed</span>
              </label>
              
              {!schedule.isClosed && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={schedule.openTime || '09:00'}
                    onChange={(e) => updateDay(schedule.dayOfWeek, 'openTime', e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={schedule.closeTime || '17:00'}
                    onChange={(e) => updateDay(schedule.dayOfWeek, 'closeTime', e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
            
            {schedule.dayOfWeek === 1 && ( // Show "Apply to all" on Monday
              <button
                type="button"
                onClick={() => copyToAll(1)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap"
              >
                Apply to all days
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusinessHoursEditor;
