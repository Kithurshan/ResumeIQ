import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiPlus,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiXCircle,
  FiAlertCircle
} from 'react-icons/fi';
import Sidebar from '../../../components/layout/Sidebar';
import Header from '../../../components/layout/Header';
import StatisticCard from '../../../components/ui/StatisticCard';
import { jobService } from '../../../services/jobService';
import { useUI } from '../../../context/UIContext';

const List = () => {
  const navigate = useNavigate();
  const { confirm, showToast } = useUI();

  const [jobs, setJobs] = useState([]);
  const [listTotal, setListTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [jobStats, setJobStats] = useState({ total: 0, active: 0, draft: 0, closed: 0 });
  const totalJobs = jobStats.total;
  const activeJobs = jobStats.active;
  const draftJobs = jobStats.draft;
  const closedJobs = jobStats.closed;

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');

  const [jobToDelete, setJobToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await jobService.list({
          search: searchTerm || undefined,
          department: departmentFilter === 'All Departments' ? undefined : departmentFilter,
          type: typeFilter === 'All' ? undefined : typeFilter,
          status: statusFilter === 'All' ? undefined : statusFilter,
          page: currentPage,
          page_size: itemsPerPage,
          sort: { Newest: 'newest', Oldest: 'oldest', 'Application Deadline': 'deadline', 'Job Title': 'title' }[sortBy],
        });
        setJobs(response.data.items || []);
        setListTotal(response.data.total || 0);
        const statsResponse = await jobService.stats();
        setJobStats(statsResponse.data);
      } catch (requestError) {
        setError(requestError.response?.data?.detail || 'Unable to load jobs. Check that the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, [searchTerm, departmentFilter, typeFilter, statusFilter, sortBy, currentPage]);

  const handleDeleteClick = async (job) => {
    const isConfirmed = await confirm({
      title: 'Delete Job Description?',
      message: `Are you sure you want to delete "${job.title}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (isConfirmed) {
      try {
        await jobService.remove(job.id);
        setJobs((currentJobs) => currentJobs.filter((j) => j.id !== job.id));
        setJobStats((current) => ({ ...current, total: Math.max(0, current.total - 1), [job.status.toLowerCase()]: Math.max(0, current[job.status.toLowerCase()] - 1) }));
        setListTotal((current) => Math.max(0, current - 1));
        showToast('Job description deleted successfully.', 'success');
      } catch (requestError) {
        showToast(requestError.response?.data?.detail || 'Unable to delete this job.', 'error');
      }
    }
  };

  const totalPages = Math.ceil(listTotal / itemsPerPage);
  const startIndex = listTotal === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, listTotal);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
      
      <Sidebar />

      
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        
        <Header title="Job Description Management" />

        
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-8 pb-8">

            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatisticCard
                title="Total List"
                value={totalJobs}
                icon={FiBriefcase}
                colorClass="text-blue-600"
                bgClass="bg-blue-50"
              />
              <StatisticCard
                title="Active List"
                value={activeJobs}
                icon={FiCheckCircle}
                colorClass="text-[#00c853]"
                bgClass="bg-[#e8f5e9]"
              />
              <StatisticCard
                title="Draft List"
                value={draftJobs}
                icon={FiFileText}
                colorClass="text-amber-500"
                bgClass="bg-amber-50"
              />
              <StatisticCard
                title="Closed List"
                value={closedJobs}
                icon={FiXCircle}
                colorClass="text-gray-500"
                bgClass="bg-gray-100"
              />
            </div>

            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 justify-between items-center">

              <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1">
                
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by job title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm transition-colors"
                  />
                </div>

                
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full md:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm text-gray-700 bg-white cursor-pointer"
                >
                  <option>All Departments</option>
                  <option>IT</option>
                  <option>HR</option>
                  <option>Finance</option>
                  <option>Marketing</option>
                  <option>Operations</option>
                  <option>Design</option>
                  <option>QA</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full md:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm text-gray-700 bg-white cursor-pointer"
                >
                  <option>All Types</option>
                  <option>Full-Time</option>
                  <option>Part-Time</option>
                  <option>Internship</option>
                  <option>Contract</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full md:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm text-gray-700 bg-white cursor-pointer"
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Draft</option>
                  <option>Closed</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full md:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm text-gray-700 bg-white cursor-pointer"
                >
                  <option>Newest</option>
                  <option>Oldest</option>
                  <option>Application Deadline</option>
                  <option>Job Title</option>
                </select>
              </div>

              
              <button
                onClick={() => navigate('/recruiter/jobs/new')}
                className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#00c853] hover:bg-[#00b048] text-white rounded-lg shadow-sm transition-colors font-medium text-sm flex-shrink-0"
              >
                <FiPlus className="w-4 h-4" />
                Add New Job
              </button>
            </div>

            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-4">Job Title</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Deadline</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {loading ? (
                      <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">Loading jobs...</td></tr>
                    ) : jobs.length === 0 ? (
                      <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">No jobs found.</td></tr>
                    ) : jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900">{job.title}</td>
                        <td className="px-6 py-4">{job.department}</td>
                        <td className="px-6 py-4">{job.type}</td>
                        <td className="px-6 py-4 text-gray-500">{job.deadline}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${
                              job.status === 'Active'
                                ? 'bg-[#e8f5e9] text-[#00c853]'
                                : job.status === 'Draft'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            
                            <button
                              onClick={() => navigate(`/recruiter/jobs/${job.id}`)}
                              className="text-gray-400 hover:text-blue-500 transition-colors"
                              title="View Details"
                            >
                              <FiEye className="w-5 h-5" />
                            </button>
                            
                            <button
                              onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)}
                              className="text-gray-400 hover:text-amber-500 transition-colors"
                              title="Edit Job"
                            >
                              <FiEdit2 className="w-5 h-5" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteClick(job)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete Job"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Showing {startIndex} to {endIndex} of {listTotal} results</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >Previous</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border border-gray-200 rounded font-medium ${currentPage === page ? 'bg-[#00c853] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                      >{page}</button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >Next</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default List;
