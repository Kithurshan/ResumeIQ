import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiPlus,
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiPause,
  FiPlay,
  FiChevronLeft,
  FiChevronRight,
  FiAlertTriangle,
  FiX
} from 'react-icons/fi';

import AdminSidebar from '../../../components/layout/AdminSidebar';
import AdminHeader from '../../../components/layout/AdminHeader';

const ITEMS_PER_PAGE = 8;

const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <div className="bg-[#1F1F1F] p-5 rounded-2xl border border-gray-800 flex items-center justify-between shadow-sm">
    <div>
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-[#E1E1E1]">{value}</p>
    </div>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgClass} ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

const List = () => {
  const navigate = useNavigate();

  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [currentPage, setCurrentPage] = useState(1);

  const [modalType, setModalType] = useState(null);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecruiters = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/recruiters/all`);
      if (res.data.success) {
        setRecruiters(res.data.data);
      }
    } catch (err) {
      setError('Failed to fetch recruiters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const totalRecruiters = recruiters.length;
  const activeRecruiters = recruiters.filter(r => r.status === 'Active').length;
  const inactiveRecruiters = recruiters.filter(r => r.status === 'Inactive').length;

  const filteredRecruiters = useMemo(() => {
    let result = [...recruiters];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        (r.full_name && r.full_name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(r => r.status === statusFilter);
    }

    if (sortBy === 'Newest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'Oldest') {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'Name (A–Z)') {
      result.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    } else if (sortBy === 'Name (Z–A)') {
      result.sort((a, b) => (b.full_name || '').localeCompare(a.full_name || ''));
    }

    return result;
  }, [recruiters, searchQuery, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredRecruiters.length / ITEMS_PER_PAGE);
  const paginatedRecruiters = filteredRecruiters.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openModal = (type, recruiter) => {
    setModalType(type);
    setSelectedRecruiter(recruiter);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedRecruiter(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedRecruiter) return;
    setActionLoading(true);

    try {
      if (modalType === 'deactivate') {
        await axios.put(`${import.meta.env.VITE_API_URL || \`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}\`}/api/recruiters/${selectedRecruiter.recruiter_id}/status`, { status: 'Inactive' });
      } else if (modalType === 'activate') {
        await axios.put(`${import.meta.env.VITE_API_URL || \`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}\`}/api/recruiters/${selectedRecruiter.recruiter_id}/status`, { status: 'Active' });
      } else if (modalType === 'delete') {
        await axios.delete(`${import.meta.env.VITE_API_URL || \`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}\`}/api/recruiters/${selectedRecruiter.recruiter_id}`);
      }
      // Refresh list
      fetchRecruiters();
    } catch (err) {
      alert('Failed to perform action. Please try again.');
    } finally {
      setActionLoading(false);
      closeModal();
    }
  };

  const modalConfig = {
    deactivate: {
      title: 'Deactivate Recruiter?',
      message: 'This recruiter will no longer be able to log in.',
      confirmText: 'Deactivate',
      confirmClass: 'bg-[#F59E0B] border-[#F59E0B] hover:bg-[#D97706] text-black',
      iconColor: 'text-[#F59E0B]',
      iconBg: 'bg-[#F59E0B]/10'
    },
    activate: {
      title: 'Activate Recruiter?',
      message: 'This recruiter will be able to log in and access the system.',
      confirmText: 'Activate',
      confirmClass: 'bg-[#22C55E] border-[#22C55E] hover:bg-[#16A34A] text-white',
      iconColor: 'text-[#22C55E]',
      iconBg: 'bg-[#22C55E]/10'
    },
    delete: {
      title: 'Delete Recruiter?',
      message: 'This action cannot be undone. All recruiter data will be permanently removed.',
      confirmText: 'Delete',
      confirmClass: 'bg-[#EF4444] border-[#EF4444] hover:bg-[#DC2626] text-white',
      iconColor: 'text-[#EF4444]',
      iconBg: 'bg-[#EF4444]/10'
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden font-inter text-[#E1E1E1]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <AdminHeader title="Recruiter Management" />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6 pb-8">

            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Recruiter Management</h2>
                <p className="text-gray-400">Manage recruiter accounts and monitor recruiter information.</p>
              </div>
              <button
                onClick={() => navigate('/admin/recruiters/new')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] text-white font-semibold rounded-xl hover:bg-[#2563EB] transition-colors shadow-lg shadow-blue-500/20"
              >
                <FiPlus className="w-5 h-5" />
                Add Recruiter
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <StatCard title="Total Recruiters" value={totalRecruiters} icon={FiUsers} colorClass="text-blue-500" bgClass="bg-blue-500/10" />
              <StatCard title="Active Recruiters" value={activeRecruiters} icon={FiUserCheck} colorClass="text-[#22C55E]" bgClass="bg-[#22C55E]/10" />
              <StatCard title="Inactive Recruiters" value={inactiveRecruiters} icon={FiUserX} colorClass="text-[#EF4444]" bgClass="bg-[#EF4444]/10" />
            </div>

            {/* Filters */}
            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[240px]">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search recruiter..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm text-[#E1E1E1] placeholder-gray-500 focus:outline-none focus:border-[#BB86FC] focus:ring-1 focus:ring-[#BB86FC] transition-all"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm text-[#E1E1E1] focus:outline-none focus:border-[#BB86FC] cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-xl text-sm text-[#E1E1E1] focus:outline-none focus:border-[#BB86FC] cursor-pointer"
                >
                  <option value="Newest">Newest</option>
                  <option value="Oldest">Oldest</option>
                  <option value="Name (A–Z)">Name (A–Z)</option>
                  <option value="Name (Z–A)">Name (Z–A)</option>
                </select>
              </div>
            </div>

            {/* Recruiters Table */}
            <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 overflow-hidden">
              {loading ? (
                <div className="p-10 text-center text-gray-400">Loading recruiters...</div>
              ) : error ? (
                <div className="p-10 text-center text-red-400">{error}</div>
              ) : paginatedRecruiters.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#111111] text-gray-400 font-medium border-b border-gray-800">
                      <tr>
                        <th className="px-6 py-4">Recruiter</th>
                        <th className="px-6 py-4">Position</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Phone</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {paginatedRecruiters.map((recruiter) => (
                        <tr key={recruiter.recruiter_id} className="hover:bg-[#252525] transition-colors text-gray-300">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#BB86FC]/20 flex items-center justify-center text-[#BB86FC] font-bold text-sm flex-shrink-0 overflow-hidden">
                                {recruiter.profile_image && !recruiter.profile_image.startsWith('blob:') ? (
                                    <img src={recruiter.profile_image} alt={recruiter.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    recruiter.full_name ? recruiter.full_name.charAt(0).toUpperCase() : 'R'
                                )}
                              </div>
                              <span className="font-medium text-[#E1E1E1]">{recruiter.full_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#E1E1E1]">{recruiter.position || 'Recruiter'}</td>
                          <td className="px-6 py-4 text-gray-400">{recruiter.email}</td>
                          <td className="px-6 py-4">{recruiter.phone || 'N/A'}</td>
                          <td className="px-6 py-4">
                            {recruiter.status === 'Active' ? (
                              <span className="text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg text-xs font-medium">Active</span>
                            ) : (
                              <span className="text-gray-400 bg-gray-700/30 px-2.5 py-1 rounded-lg text-xs font-medium">Inactive</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => navigate(`/admin/recruiters/${recruiter.recruiter_id}`)}
                                className="p-2 text-gray-400 hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-lg transition-colors"
                                title="View"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                              {/* Future: Edit feature can go here */}
                              {/* <button className="p-2 text-gray-400 hover:text-[#BB86FC] hover:bg-[#BB86FC]/10 rounded-lg transition-colors" title="Edit"><FiEdit2 className="w-4 h-4" /></button> */}
                              {recruiter.status === 'Active' ? (
                                <button
                                  onClick={() => openModal('deactivate', recruiter)}
                                  className="p-2 text-gray-400 hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-lg transition-colors"
                                  title="Deactivate"
                                >
                                  <FiPause className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => openModal('activate', recruiter)}
                                  className="p-2 text-gray-400 hover:text-[#22C55E] hover:bg-[#22C55E]/10 rounded-lg transition-colors"
                                  title="Activate"
                                >
                                  <FiPlay className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => openModal('delete', recruiter)}
                                className="p-2 text-gray-400 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-800">
                    <FiUsers className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#E1E1E1] mb-2">No Recruiters Found</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    {searchQuery || statusFilter !== 'All' 
                      ? 'No recruiters match your current filters. Try adjusting your search.'
                      : 'There are no recruiters in the system yet. Click "Add Recruiter" to create one.'}
                  </p>
                </div>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-5 border-t border-gray-800 flex items-center justify-between bg-[#1F1F1F]">
                  <p className="text-sm text-gray-400">
                    Showing <span className="text-[#E1E1E1] font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                    <span className="text-[#E1E1E1] font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredRecruiters.length)}</span> of{' '}
                    <span className="text-[#E1E1E1] font-medium">{filteredRecruiters.length}</span> results
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-[#E1E1E1] hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-[#E1E1E1] hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] rounded-2xl border border-gray-800 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${modalConfig[modalType].iconBg}`}>
                  <FiAlertTriangle className={`w-6 h-6 ${modalConfig[modalType].iconColor}`} />
                </div>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-300 transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-[#E1E1E1] mb-2">{modalConfig[modalType].title}</h3>
              <p className="text-gray-400">
                {modalConfig[modalType].message}
                <br /><br />
                Target Recruiter: <span className="font-semibold text-white">{selectedRecruiter?.full_name}</span>
              </p>
            </div>
            <div className="p-6 bg-[#111111] border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`px-5 py-2.5 rounded-xl font-medium transition-colors border ${modalConfig[modalType].confirmClass} disabled:opacity-50 flex items-center`}
              >
                {actionLoading ? 'Processing...' : modalConfig[modalType].confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default List;
