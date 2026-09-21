import React from 'react';

const getInitials = (name) => {
  if (!name) return 'A';

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

const ProfileCard = ({ profileData, onImageUploadClick }) => {
  const initials = getInitials(profileData.fullName || 'Admin');
  const fallbackImage = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#111111"/>
      <circle cx="100" cy="100" r="100" fill="#111111"/>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#BB86FC" font-size="78" font-family="Arial, sans-serif" font-weight="700">${initials}</text>
    </svg>
  `)}`;

  return (
    <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-8 flex flex-col items-center text-center">
      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#BB86FC]/20 bg-[#111111]">
          <img
            src={profileData.imageUrl || fallbackImage}
            alt="Profile"
            onError={(event) => {
              event.currentTarget.src = fallbackImage;
            }}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-white mb-1">{profileData.fullName}</h3>
      <p className="text-[#BB86FC] font-medium mb-1">{profileData.role}</p>
      <p className="text-gray-400 text-sm mb-6">{profileData.email}</p>

      <button
        onClick={onImageUploadClick}
        className="w-full py-2.5 bg-[#111111] border border-gray-800 text-gray-300 hover:text-white hover:bg-[#252525] font-medium rounded-xl transition-colors"
      >
        Change Profile Picture
      </button>
    </div>
  );
};

export default ProfileCard;
