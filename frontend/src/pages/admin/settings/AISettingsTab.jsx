import React from 'react';
import { FiCpu } from 'react-icons/fi';

const AISettingsTab = ({ minScore, setMinScore }) => {
  return (
    <div className="space-y-8 animate-fade-in">

      <div>
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <FiCpu className="text-[#BB86FC]" /> Minimum AI Match Score
        </h3>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed max-w-2xl">
          Set the threshold for the AI screening engine. Candidates scoring below this percentage will automatically be flagged as <span className="font-bold text-[#EF4444]">Not Recommended</span>.
        </p>

        <div className="max-w-xl">
          <div className="flex items-center justify-between mb-4 text-sm font-medium text-gray-400">
            <span>0%</span>
            <span className="text-3xl font-bold text-[#BB86FC]">{minScore}%</span>
            <span>100%</span>
          </div>

          <div className="relative pt-2 pb-6">
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full h-2 bg-[#111111] rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #BB86FC 0%, #BB86FC ${minScore}%, #111111 ${minScore}%, #111111 100%)`
              }}
            />

            <style>{`
              input[type=range]::-webkit-slider-thumb {
                appearance: none;
                width: 24px;
                height: 24px;
                background: #fff;
                border: 4px solid #BB86FC;
                border-radius: 50%;
                cursor: pointer;
                transition: transform 0.1s;
              }
              input[type=range]::-webkit-slider-thumb:hover {
                transform: scale(1.1);
              }
            `}</style>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AISettingsTab;
