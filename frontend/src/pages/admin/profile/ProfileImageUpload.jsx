import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiX, FiImage } from 'react-icons/fi';
import api from '../../../api/axios';

const ProfileImageUpload = ({ 
  isOpen, 
  onClose, 
  onUploadSuccess,
  uploadEndpoint = '/admins/upload-profile-image',
  updateEndpoint = null 
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, JPEG and PNG files are allowed.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Profile picture must not exceed 2 MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await api.post(uploadEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedImageUrl = uploadResponse?.data?.imageUrl;

      // If a specific update endpoint is provided, use it
      if (uploadedImageUrl && updateEndpoint) {
        await api.put(`${updateEndpoint}?image_url=${encodeURIComponent(uploadedImageUrl)}`);
      } else if (uploadedImageUrl) {
        // Fallback to legacy admin logic if updateEndpoint is missing
        const adminId = localStorage.getItem('adminId') || JSON.parse(localStorage.getItem('user') || '{}')?.admin_id;
        if (adminId) {
          await api.put(`/admins/update-profile-image/${adminId}?image_url=${encodeURIComponent(uploadedImageUrl)}`);
        }
      }

      onUploadSuccess(uploadedImageUrl || previewUrl);

      setSelectedFile(null);
      setPreviewUrl(null);
      setIsUploading(false);
      onClose();
    } catch (err) {
      setIsUploading(false);
      setError(err?.response?.data?.detail || 'Upload failed. Please try again.');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    setIsUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-[#1F1F1F] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-800">


        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FiImage className="text-[#BB86FC]" /> Upload Profile Picture
          </h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
            <FiX className="w-6 h-6" />
          </button>
        </div>


        <div className="p-8 text-center">

          {error && (
            <div className="mb-6 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}


          <div className="mb-8">
            <div className="w-32 h-32 mx-auto rounded-full border-4 border-gray-800 bg-[#111111] overflow-hidden flex items-center justify-center mb-4 relative group">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <FiImage className="w-10 h-10 text-gray-600" />
              )}


              <div
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <FiUploadCloud className="w-6 h-6 text-white" />
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
            />

            {!previewUrl && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[#BB86FC] hover:text-white text-sm font-medium transition-colors"
              >
                Select Image
              </button>
            )}
          </div>

          <div className="text-sm text-gray-400 space-y-1">
            <p>Allowed: PNG, JPG, JPEG</p>
            <p>Maximum: 2 MB</p>
          </div>
        </div>


        <div className="border-t border-gray-800 p-6 bg-black/20 flex items-center justify-end gap-4">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 text-sm font-semibold text-[#E1E1E1] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadClick}
            disabled={!selectedFile || isUploading}
            className="px-6 py-2.5 text-sm font-bold text-black bg-[#BB86FC] rounded-xl hover:bg-[#A370F0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileImageUpload;
