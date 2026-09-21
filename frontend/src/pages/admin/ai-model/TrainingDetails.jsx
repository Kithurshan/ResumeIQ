import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiActivity, FiCalendar, FiClock, FiCheckCircle, FiDatabase, FiAlertCircle } from 'react-icons/fi';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';

const TrainingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = React.useState({
    id: id,
    date: '',
    duration: '',
    status: '',
    dataset: '',
    prevAccuracy: '',
    newAccuracy: ''
  });

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="Training Details" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6 pb-8">

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/ai-model')}
                className="w-10 h-10 bg-[#111111] hover:bg-[#1F1F1F] border border-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-3xl font-bold mb-1 flex items-center gap-3">
                  Training Session: {details.id}
                  {details.status === 'Completed' && <span className="text-xs font-medium px-2.5 py-1 bg-[#22C55E]/10 text-[#22C55E] rounded-lg">Completed</span>}
                  {details.status === 'Failed' && <span className="text-xs font-medium px-2.5 py-1 bg-[#EF4444]/10 text-[#EF4444] rounded-lg">Failed</span>}
                  {details.status === 'Cancelled' && <span className="text-xs font-medium px-2.5 py-1 bg-gray-800 text-gray-400 rounded-lg">Cancelled</span>}
                </h2>
                <p className="text-gray-400">Detailed view of the AI model retraining session.</p>
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">


              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <FiActivity className="text-[#BB86FC]" />
                  Session Details
                </h3>

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-400">
                      <FiActivity className="w-5 h-5" />
                      <span>Training ID</span>
                    </div>
                    <span className="font-medium text-white">{details.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-400">
                      <FiCalendar className="w-5 h-5" />
                      <span>Training Date</span>
                    </div>
                    <span className="font-medium text-white">{details.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-400">
                      <FiClock className="w-5 h-5" />
                      <span>Duration</span>
                    </div>
                    <span className="font-medium text-white">{details.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-400">
                      <FiDatabase className="w-5 h-5" />
                      <span>Dataset Size</span>
                    </div>
                    <span className="font-medium text-white">{details.dataset} Resumes</span>
                  </div>
                </div>
              </div>


              <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-500" />
                  Performance Summary
                </h3>

                <div className="space-y-5 mb-8">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Previous Accuracy</span>
                    <span className="font-medium text-gray-300">{details.prevAccuracy}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">New Accuracy</span>
                    <span className="font-medium text-white text-lg">{details.newAccuracy}</span>
                  </div>

                  {details.status === 'Completed' && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <span className="text-gray-400">Improvement</span>
                      <span className="font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg">
                        +{((parseFloat(details.newAccuracy) - parseFloat(details.prevAccuracy)) || 0).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                {details.status === 'Completed' ? (
                  <div className="bg-[#111111] p-4 rounded-xl border border-gray-800">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      The AI model was successfully retrained using the latest resume screening dataset. The updated model has been activated for future resume analysis.
                    </p>
                  </div>
                ) : details.status === 'Failed' ? (
                  <div className="bg-[#EF4444]/10 p-4 rounded-xl border border-[#EF4444]/20 flex items-start gap-3">
                    <FiAlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#EF4444] leading-relaxed">
                      The AI model retraining failed during the validation stage. The previous model version remains active.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800">
                    <p className="text-sm text-gray-400 leading-relaxed">
                      The AI model retraining was cancelled by the administrator. No changes were made to the active model.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default TrainingDetails;
