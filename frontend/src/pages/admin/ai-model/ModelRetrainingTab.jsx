import React, { useState, useEffect } from 'react';
import { FiPlay, FiCheckCircle, FiLoader, FiAlertCircle, FiClock, FiActivity, FiCpu } from 'react-icons/fi';

const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <div className="bg-[#1F1F1F] p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
    <div>
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-[#E1E1E1]">{value}</p>
    </div>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgClass} ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

const STAGES = [
  "Preparing Dataset",
  "Training AI Model",
  "Validating Model",
  "Saving Updated Model",
  "Completed"
];

const ModelRetrainingTab = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState('ready'); // ready, training, success, failed, cancelled
  
  // Backend stats
  const [lastRetrained, setLastRetrained] = useState('Never');
  const [lastDuration, setLastDuration] = useState('-');
  const [backendMessage, setBackendMessage] = useState('');

  // Fetch initial status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ml/retrain/status');
      const data = await res.json();
      
      if (data.status === 'success' && data.data) {
        const record = data.data;
        
        // Update stats
        if (record.ended_at) {
            const date = new Date(record.ended_at);
            setLastRetrained(date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
        }
        if (record.duration) {
            setLastDuration(record.duration);
        }
        
        // Resume training state if backend says it's training
        if (record.status === 'Training' && !isTraining) {
            setIsTraining(true);
            setTrainingStatus('training');
            if (progress === 0) setProgress(10);
        }
      }
    } catch (error) {
      console.error("Failed to fetch training status:", error);
    }
  };

  // Poll backend while training
  useEffect(() => {
    let pollInterval;
    if (isTraining) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch('http://localhost:5000/api/ml/retrain/status');
          const data = await res.json();
          if (data.status === 'success' && data.data) {
            const status = data.data.status;
            
            if (status === 'Completed') {
                setTrainingStatus('success');
                setIsTraining(false);
                setProgress(100);
                setCurrentStageIndex(4);
                setLastRetrained('Just now');
                setLastDuration(data.data.duration || '-');
                clearInterval(pollInterval);
            } else if (status === 'Failed') {
                setTrainingStatus('failed');
                setBackendMessage(data.data.error_message || 'Training failed unexpectedly.');
                setIsTraining(false);
                setProgress(0);
                clearInterval(pollInterval);
            } else if (status === 'Cancelled') {
                setTrainingStatus('failed');
                setBackendMessage(data.data.error_message || 'Training cancelled.');
                setIsTraining(false);
                setProgress(0);
                clearInterval(pollInterval);
            }
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 3000); // poll every 3 seconds
    }
    return () => clearInterval(pollInterval);
  }, [isTraining]);

  // Smooth fake progress animation (capped at 95% until backend finishes)
  useEffect(() => {
    let interval;
    if (isTraining && progress < 95) {
      interval = setInterval(() => {
        setProgress(p => {
          const newProgress = p + (Math.random() * 3);
          const cappedProgress = Math.min(newProgress, 95);
          
          if (cappedProgress < 20) setCurrentStageIndex(0);
          else if (cappedProgress < 60) setCurrentStageIndex(1);
          else if (cappedProgress < 85) setCurrentStageIndex(2);
          else setCurrentStageIndex(3);

          return cappedProgress;
        });
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isTraining, progress]);

  const handleStartTraining = async () => {
    setShowConfirm(false);
    setIsTraining(true);
    setProgress(5);
    setCurrentStageIndex(0);
    setTrainingStatus('training');
    setBackendMessage('');

    try {
        const adminId = localStorage.getItem('adminId') || '1';
        const res = await fetch('http://localhost:5000/api/ml/retrain/start', {
            method: 'POST',
            headers: { 'x-admin-id': adminId }
        });
        const data = await res.json();
        if (data.status !== 'success') {
            setTrainingStatus('failed');
            setBackendMessage(data.detail || data.message || 'Failed to start training');
            setIsTraining(false);
        }
    } catch (error) {
        setTrainingStatus('failed');
        setBackendMessage('Network error connecting to backend.');
        setIsTraining(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Current Status"
          value={trainingStatus === 'training' ? 'Training...' : trainingStatus === 'success' ? 'Updated' : 'Ready'}
          icon={trainingStatus === 'training' ? FiLoader : FiActivity}
          colorClass={trainingStatus === 'training' ? "text-[#F59E0B]" : "text-[#22C55E]"}
          bgClass={trainingStatus === 'training' ? "bg-[#F59E0B]/10" : "bg-[#22C55E]/10"}
        />
        <StatCard
          title="Last Retrained"
          value={lastRetrained}
          icon={FiCheckCircle}
          colorClass="text-[#BB86FC]"
          bgClass="bg-[#BB86FC]/10"
        />
        <StatCard
          title="Last Training Duration"
          value={lastDuration}
          icon={FiClock}
          colorClass="text-blue-500"
          bgClass="bg-blue-500/10"
        />
      </div>

      <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#BB86FC] to-[#3B82F6] opacity-50"></div>

        {!isTraining && trainingStatus !== 'success' && trainingStatus !== 'failed' && (
          <div className="max-w-md mx-auto py-8">
            <div className="w-16 h-16 bg-[#BB86FC]/10 text-[#BB86FC] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FiCpu className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Model Retraining</h3>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Initiate a manual retraining of the ResumeIQ AI screening model using the latest recruitment dataset. This process runs in the background.
            </p>

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="bg-[#BB86FC] hover:bg-[#A370F0] text-black font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(187,134,252,0.3)] hover:shadow-[0_0_30px_rgba(187,134,252,0.5)] flex items-center gap-3 mx-auto w-full max-w-sm justify-center"
              >
                <FiPlay className="w-5 h-5 fill-current" />
                Start AI Model Retraining
              </button>
            ) : (
              <div className="bg-[#111111] p-6 rounded-xl border border-gray-800 animate-fade-in">
                <h4 className="text-lg font-bold text-white mb-2">Start AI model retraining?</h4>
                <p className="text-sm text-gray-400 mb-6">The system will begin retraining using the latest recruitment dataset.</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-5 py-2.5 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-[#252525] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartTraining}
                    className="px-5 py-2.5 bg-[#BB86FC] text-black font-bold rounded-lg hover:bg-[#A370F0] transition-colors"
                  >
                    Start Training
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isTraining && (
          <div className="max-w-xl mx-auto py-8">
            <h3 className="text-2xl font-bold mb-2 text-white">Training Progress</h3>
            <p className="text-[#BB86FC] font-medium mb-8 flex items-center justify-center gap-2">
              <FiLoader className="w-4 h-4 animate-spin" />
              {STAGES[currentStageIndex]}
            </p>

            <div className="mb-4 flex justify-between items-end">
              <span className="text-sm font-medium text-gray-400">Progress</span>
              <span className="text-3xl font-bold text-white">{Math.floor(progress)}%</span>
            </div>

            <div className="h-4 bg-[#111111] rounded-full overflow-hidden border border-gray-800 relative mb-8">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#BB86FC] to-[#3B82F6] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>

            <div className="flex justify-between relative mt-12 px-2">
              <div className="absolute top-2.5 left-6 right-6 h-0.5 bg-gray-800 -z-10"></div>
              {STAGES.slice(0, 4).map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                return (
                  <div key={idx} className="flex flex-col items-center gap-3 w-24">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-[#22C55E]' : isCurrent ? 'bg-[#BB86FC] ring-4 ring-[#BB86FC]/20' : 'bg-gray-800'
                      }`}>
                      {isCompleted && <FiCheckCircle className="w-3 h-3 text-black" />}
                    </div>
                    <span className={`text-[10px] text-center font-medium ${isCurrent ? 'text-white' : isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {trainingStatus === 'success' && (
          <div className="max-w-md mx-auto py-10 animate-fade-in">
            <div className="w-20 h-20 bg-[#22C55E]/10 text-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Training Complete</h3>
            <p className="text-gray-400 mb-8 leading-relaxed">
              AI model retraining completed successfully. The new model version has been activated.
            </p>
            <button
              onClick={() => {
                setTrainingStatus('ready');
                setProgress(0);
              }}
              className="px-6 py-3 bg-[#111111] border border-gray-800 text-white font-medium rounded-xl hover:bg-[#252525] transition-colors"
            >
              Acknowledge
            </button>
          </div>
        )}

        {trainingStatus === 'failed' && (
          <div className="max-w-md mx-auto py-10 animate-fade-in">
            <div className="w-20 h-20 bg-[#EF4444]/10 text-[#EF4444] rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Training Interrupted</h3>
            <p className="text-gray-400 mb-4 leading-relaxed">
              {backendMessage || "AI model retraining failed due to an unexpected error."}
            </p>
            <button
              onClick={() => setTrainingStatus('ready')}
              className="px-6 py-3 bg-[#111111] border border-gray-800 text-white font-medium rounded-xl hover:bg-[#252525] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ModelRetrainingTab;
