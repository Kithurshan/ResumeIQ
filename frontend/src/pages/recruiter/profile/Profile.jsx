import React, { useState, useRef, useEffect } from 'react';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiMapPin,
  FiShield,
  FiCalendar,
  FiUpload,
  FiX,
  FiClock
} from 'react-icons/fi';
import Sidebar from '../../../components/layout/Sidebar';
import Header from '../../../components/layout/Header';
import { recruiterService } from '../../../services/recruiterService';
import { useUI } from '../../../context/UIContext';

const INITIAL_PROFILE = {
  personal: {
    fullName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    location: '',
    avatar: ''
  },
  account: {
    recruiterId: '',
    status: '',
    role: '',
    lastLogin: '',
    joinedDate: ''
  },
  activity: {
    jobsCreated: 0,
    resumesUploaded: 0,
    shortlisted: 0
  }
};

const formatDateTime = (value) => {
  if (!value) return 'Not available';

  try {
    const cleanValue = /(Z|[+-]\d{2}:?\d{2})$/.test(value)
      ? value
      : `${value}Z`;

    const date = new Date(cleanValue);
    if (Number.isNaN(date.getTime())) return value;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${year}-${month}-${day}    ${hours}:${minutes}${ampm}`;
  } catch (error) {
    return value;
  }
};

const getProfileImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return '';

  const cleanPath = imagePath.trim();
  if (!cleanPath) return '';

  if (cleanPath.startsWith('blob:')) return '';

  if (
    cleanPath.startsWith('data:image') ||
    cleanPath.startsWith('http://') ||
    cleanPath.startsWith('https://')
  ) {
    return cleanPath;
  }

  const backendBaseUrl = 'http://localhost:5000';
  return `${backendBaseUrl}/${cleanPath.replace(/^\/+/, '')}`;
};

const getInitial = (name) => {
  if (!name || typeof name !== 'string') return 'R';
  return name.trim().charAt(0).toUpperCase() || 'R';
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// ─── Main Component ────────────────────────────────────────────────────────
const Profile = () => {
  const { showToast } = useUI();
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const recruiterId = localStorage.getItem('recruiterId');

    if (!recruiterId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const result = await recruiterService.getMyProfile(recruiterId);
        const data = result?.data || {};

        const avatar = getProfileImageUrl(data.profile_image);

        setProfile({
          personal: {
            fullName: data.full_name || '',
            email: data.email || '',
            phone: data.phone || 'Not added',
            department: data.department || 'Not added',
            position: data.position || 'Recruiter',
            location: data.office_location || 'Not added',
            avatar,
          },
          account: {
            recruiterId: data.recruiter_id || recruiterId,
            status: data.status || 'Active',
            role: 'Recruiter',
            lastLogin: formatDateTime(data.last_login),
            joinedDate: data.created_at ? formatDateTime(data.created_at) : 'Not available',
          },
          activity: {
            jobsCreated: data.activity?.jobs_created ?? 0,
            resumesUploaded: data.activity?.resumes_uploaded ?? 0,
            shortlisted: data.activity?.shortlisted_candidates ?? 0,
          },
        });
      } catch (error) {
        console.error('Failed to fetch recruiter profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ─── Image Upload Logic ──────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadError('');

    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only JPG, JPEG and PNG files are allowed.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size must not exceed 2 MB.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please choose an image first.');
      return;
    }

    const recruiterId = localStorage.getItem('recruiterId');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await fetch(`${API_BASE_URL}/recruiters/upload-profile-image`, {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.detail || 'Image upload failed.');
      }

      const imageUrl = uploadData.imageUrl;

      setProfile({
        ...profile,
        personal: {
          ...profile.personal,
          avatar: imageUrl,
        },
      });

      if (recruiterId) {
        await fetch(`${API_BASE_URL}/recruiters/update-profile-image/${recruiterId}?image_url=${encodeURIComponent(imageUrl)}`, {
          method: 'PUT',
        });
      }

      setIsModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadError('');
      showToast('Profile picture updated successfully.', 'success');
    } catch (error) {
      setUploadError(error.message || 'Something went wrong while uploading the image.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError('');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Header title="My Profile" />

        <main className="flex-1 overflow-y-auto p-8 relative">
          {loading ? (
            <div className="max-w-6xl mx-auto py-10 text-gray-600">Loading profile...</div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8 pb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recruiter Profile</h1>
                <p className="text-gray-500 mt-1">View your profile information and recruitment activity.</p>
              </div>

              <div className="flex flex-col xl:flex-row gap-8">
                <div className="w-full xl:w-80 flex-shrink-0">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center border-4 border-white shadow-lg mb-4">
                      {profile.personal.avatar ? (
                        <img
                          src={profile.personal.avatar}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            event.target.style.display = 'none';
                            event.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}

                      <span
                        className="text-4xl font-bold text-blue-600 hidden w-full h-full items-center justify-center"
                        style={{ display: profile.personal.avatar ? 'none' : 'flex' }}
                      >
                        {getInitial(profile.personal.fullName)}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900">{profile.personal.fullName}</h2>
                    <p className="text-sm font-medium text-blue-600 mt-1">{profile.personal.position}</p>

                    <div className="w-full mt-6 space-y-3 text-sm">
                      <div className="flex items-center gap-3 text-gray-600">
                        <FiMail className="text-gray-400 w-4 h-4" />
                        <span>{profile.personal.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <FiShield className="text-gray-400 w-4 h-4" />
                        <span>Recruiter ID : {profile.account.recruiterId}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <FiBriefcase className="text-gray-400 w-4 h-4" />
                        <span>Department : {profile.personal.department}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <FiCalendar className="text-gray-400 w-4 h-4" />
                        <span>Joined : {profile.account.joinedDate}</span>
                      </div>
                    </div>

                    <hr className="w-full my-6 border-gray-100" />

                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm"
                    >
                      Change Profile Picture
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1 block">Full Name</span>
                        <p className="text-gray-900 font-medium">{profile.personal.fullName}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1 block">Email Address</span>
                        <p className="text-gray-900 font-medium">{profile.personal.email}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1 block">Phone Number</span>
                        <p className="text-gray-900 font-medium">{profile.personal.phone}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1 block">Department</span>
                        <p className="text-gray-900 font-medium">{profile.personal.department}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1 block">Position</span>
                        <p className="text-gray-900 font-medium">{profile.personal.position}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1 block">Office Location</span>
                        <p className="text-gray-900 font-medium flex items-center gap-2">
                          <FiMapPin className="text-gray-400" /> {profile.personal.location}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1 block">Recruiter ID</span>
                        <p className="text-gray-900 font-medium">{profile.account.recruiterId}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1 block">Account Status</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e8f5e9] text-[#00c853]">
                          {profile.account.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1 block">Role</span>
                        <p className="text-gray-900 font-medium">{profile.account.role}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1 block">Joined Date</span>
                        <p className="text-gray-900 font-medium">{profile.account.joinedDate}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1 block">Last Login</span>
                        <p className="text-gray-900 font-medium flex items-center gap-2">
                          <FiClock className="text-gray-400" /> {profile.account.lastLogin}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 ml-1">Recruitment Activity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                        <span className="text-4xl font-bold text-blue-600 mb-1">{profile.activity.jobsCreated}</span>
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">List Created</span>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                        <span className="text-4xl font-bold text-purple-600 mb-1">{profile.activity.resumesUploaded}</span>
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Resumes Uploaded</span>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                        <span className="text-4xl font-bold text-[#00c853] mb-1">{profile.activity.shortlisted}</span>
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Shortlisted Candidates</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>


      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Change Profile Picture</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">


              <div
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden mb-4 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                      <FiUpload className="w-5 h-5 text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Click to upload image</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                  </>
                )}


                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
              </div>


              {uploadError && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg font-medium mb-4">
                  {uploadError}
                </div>
              )}


              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  Upload New Picture
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
