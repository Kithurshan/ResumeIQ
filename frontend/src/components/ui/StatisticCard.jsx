import React from 'react';

const StatisticCard = ({ title, value, icon: Icon, colorClass, bgClass }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
      
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass} ${colorClass}`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>

      
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 leading-none">{value}</h3>
      </div>
    </div>
  );
};

export default StatisticCard;
