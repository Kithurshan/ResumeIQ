import React, { useState } from 'react';
import { FiLock } from 'react-icons/fi';
import api from '../../../api/axios';

const PasswordField = ({ label, value, onChange }) => (
  <div className="mb-5">
    <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
    <input
      type="password"
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 bg-[#111111] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#BB86FC] transition-colors"
    />
  </div>
);

const ChangePassword = ({ onSaveSuccess }) => {
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSaveClick = () => {
    setError('');

    if (!passwords.current) {
      setError('Current password is required.');
      return;
    }
    if (passwords.newPass.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);

    try {
      const adminId = localStorage.getItem('adminId') || JSON.parse(localStorage.getItem('user') || '{}')?.admin_id;

      if (!adminId) {
        throw new Error('Admin session not found.');
      }

      await api.put(`/admins/change-password/${adminId}`, {
        current_password: passwords.current,
        new_password: passwords.newPass,
      });

      setPasswords({ current: '', newPass: '', confirm: '' });
      onSaveSuccess('Password updated successfully.');
    } catch (err) {
      const message = err?.response?.data?.detail || 'Unable to update password. Please try again.';
      setError(message);
    }
  };

  return (
    <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-8">
      <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-800 pb-4 flex items-center gap-2">
        <FiLock className="text-[#BB86FC]" /> Security Settings
      </h3>

      {error && (
        <div className="mb-6 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="max-w-md">
        <PasswordField
          label="Current Password"
          value={passwords.current}
          onChange={(e) => setPasswords({...passwords, current: e.target.value})}
        />
        <PasswordField
          label="New Password"
          value={passwords.newPass}
          onChange={(e) => setPasswords({...passwords, newPass: e.target.value})}
        />
        <PasswordField
          label="Confirm Password"
          value={passwords.confirm}
          onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
        />
      </div>

      <div className="mt-6 flex gap-4 border-t border-gray-800 pt-6">
        <button
          onClick={handleSaveClick}
          className="bg-[#BB86FC] text-black font-bold px-6 py-2.5 rounded-xl hover:bg-[#A370F0] transition-colors"
        >
          Update Password
        </button>
        <button
          onClick={() => {
            setPasswords({ current: '', newPass: '', confirm: '' });
            setError('');
          }}
          className="px-6 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-[#252525] transition-colors"
        >
          Cancel
        </button>
      </div>

      
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1F1F1F] border border-gray-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Update administrator password?</h3>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              You will need to use the new password the next time you log in.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-[#2A2A2A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-5 py-2.5 bg-[#BB86FC] text-black font-bold rounded-xl hover:bg-[#A370F0] transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChangePassword;
