import React, { useState } from 'react';
import { FiCpu, FiClock } from 'react-icons/fi';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';

import ModelRetrainingTab from './ModelRetrainingTab';
import TrainingHistoryTab from './TrainingHistoryTab';

const Management = () => {
  const [activeTab, setActiveTab] = useState('retraining');

  const tabs = [
    { id: 'retraining', label: 'Model Retraining', icon: FiCpu },
    { id: 'history', label: 'Training History', icon: FiClock }
  ];

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="AI Model Management" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6 pb-8">


            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">AI Model Management</h2>
                <p className="text-gray-400">Manage AI model retraining and monitor previous training sessions.</p>
              </div>
            </div>


            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-2 flex overflow-x-auto custom-scrollbar">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${isActive
                        ? 'bg-[#2A2A2A] text-white shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#BB86FC]' : ''}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>


            <div className="mt-6">
              {activeTab === 'retraining' && <ModelRetrainingTab />}
              {activeTab === 'history' && <TrainingHistoryTab />}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Management;
