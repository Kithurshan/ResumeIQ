import React from 'react';
import { FiFile, FiUploadCloud, FiShield } from 'react-icons/fi';

const ResumeSettingsTab = ({
  maxFileSize, setMaxFileSize,
  allowedTypes, setAllowedTypes,
  maxBulkUpload, setMaxBulkUpload,
  duplicateDetection, setDuplicateDetection
}) => {
  return (
    <div className="space-y-8 animate-fade-in">


      <div>
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <FiFile className="text-[#BB86FC]" /> Maximum Resume File Size
        </h3>
        <p className="text-sm text-gray-400 mb-4">Set the maximum allowed file size for individual resume uploads.</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            value={maxFileSize}
            onChange={(e) => setMaxFileSize(Number(e.target.value))}
            className="w-24 px-4 py-2 bg-[#111111] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#BB86FC]"
          />
          <span className="text-gray-400 font-medium">MB</span>
        </div>
      </div>

      <hr className="border-gray-800" />


      <div>
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <FiFile className="text-[#BB86FC]" /> Allowed File Types
        </h3>
        <p className="text-sm text-gray-400 mb-4">Select the file formats accepted by the AI screening engine.</p>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={allowedTypes.pdf}
                onChange={(e) => setAllowedTypes({ ...allowedTypes, pdf: e.target.checked })}
                className="peer sr-only"
              />
              <div className="w-5 h-5 border-2 border-gray-600 rounded bg-[#111111] peer-checked:bg-[#BB86FC] peer-checked:border-[#BB86FC] transition-colors"></div>
              <svg className="absolute w-3.5 h-3.5 text-black left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-300 font-medium group-hover:text-white transition-colors">PDF</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={allowedTypes.docx}
                onChange={(e) => setAllowedTypes({ ...allowedTypes, docx: e.target.checked })}
                className="peer sr-only"
              />
              <div className="w-5 h-5 border-2 border-gray-600 rounded bg-[#111111] peer-checked:bg-[#BB86FC] peer-checked:border-[#BB86FC] transition-colors"></div>
              <svg className="absolute w-3.5 h-3.5 text-black left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-300 font-medium group-hover:text-white transition-colors">DOCX</span>
          </label>
        </div>
      </div>

      <hr className="border-gray-800" />


      <div>
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <FiUploadCloud className="text-[#BB86FC]" /> Maximum Bulk Upload Count
        </h3>
        <p className="text-sm text-gray-400 mb-4">Limit the number of resumes a recruiter can upload in a single batch.</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            value={maxBulkUpload}
            onChange={(e) => setMaxBulkUpload(Number(e.target.value))}
            className="w-32 px-4 py-2 bg-[#111111] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-[#BB86FC]"
          />
          <span className="text-gray-400 font-medium">Resumes</span>
        </div>
      </div>

      <hr className="border-gray-800" />


      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <FiShield className="text-[#BB86FC]" /> Duplicate Resume Detection
            </h3>
            <p className="text-sm text-gray-400">Automatically detect and prevent identical resumes from being uploaded.</p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={duplicateDetection}
              onChange={(e) => setDuplicateDetection(e.target.checked)}
            />
            <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#BB86FC]"></div>
            <span className="ml-3 text-sm font-bold text-white w-8">
              {duplicateDetection ? 'ON' : 'OFF'}
            </span>
          </label>
        </div>
      </div>

    </div>
  );
};

export default ResumeSettingsTab;
