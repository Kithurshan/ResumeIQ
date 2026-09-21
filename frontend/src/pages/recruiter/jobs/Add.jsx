import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiX, FiCheck } from 'react-icons/fi';
import Sidebar from '../../../components/layout/Sidebar';
import Header from '../../../components/layout/Header';
import { jobService } from '../../../services/jobService';
import { useUI } from '../../../context/UIContext';

const TagInput = ({ tags, setTags, placeholder, error }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="w-full">
      <div className={`flex flex-wrap gap-2 p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00c853] focus-within:border-[#00c853] transition-colors min-h-[46px]`}>
        {tags.map((tag, index) => (
          <div key={index} className="flex items-center gap-1 bg-[#e8f5e9] text-[#00c853] px-3 py-1 rounded-full text-sm font-medium">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:text-red-500 focus:outline-none"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 min-w-[120px] text-sm text-gray-700"
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// ─── Main Add Component ───────────────────────────────────────────
const Add = () => {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { id } = useParams();
  const isEditing = Boolean(id);

  // ── Form State ──
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: '',
    salaryMin: '',
    salaryMax: '',
    deadline: '',
    description: '',
    responsibilities: '',
    requiredSkills: [],
    preferredSkills: [],
    experience: '',
    education: '',
    vacancies: '1',
    status: 'Draft',
  });

  const [errors, setErrors] = useState({});

  const getApiError = (requestError, fallbackMessage) => {
    const detail = requestError.response?.data?.detail;
    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg || 'Invalid value').join(' ');
    }
    return detail || fallbackMessage;
  };

  useEffect(() => {
    if (!isEditing) return;
    const loadJob = async () => {
      try {
        const response = await jobService.get(id);
        setFormData({ ...response.data, vacancies: String(response.data.vacancies || 1) });
      } catch (requestError) {
        setErrors({ form: getApiError(requestError, 'Unable to load this job.') });
      }
    };
    loadJob();
  }, [id, isEditing]);

  // ── Handlers ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleTagsChange = (name, newTags) => {
    setFormData({ ...formData, [name]: newTags });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Job title is required.';
    if (!formData.department) newErrors.department = 'Department is required.';
    if (!formData.type) newErrors.type = 'Please select employment type.';
    if (!formData.deadline) newErrors.deadline = 'Application deadline is required.';
    if (!formData.description.trim()) newErrors.description = 'Job description cannot be empty.';
    if (formData.requiredSkills.length === 0) newErrors.requiredSkills = 'Please add at least one required skill.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e, targetStatus) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const finalData = { ...formData, status: targetStatus, vacancies: Number(formData.vacancies) };
        if (isEditing) {
          await jobService.update(id, finalData);
          showToast('Job description updated successfully.', 'success');
        } else {
          await jobService.create(finalData);
          showToast('Job description created successfully.', 'success');
        }
        navigate('/recruiter/jobs');
      } catch (requestError) {
        const errMsg = getApiError(requestError, 'Unable to save the job.');
        setErrors({ form: errMsg });
        showToast(errMsg, 'error');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Header title="Add New Job" />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto pb-12">

            <div className="mb-6 flex items-center gap-4">
              <button
                onClick={() => navigate('/recruiter/jobs')}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 shadow-sm border border-gray-200 transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Job Description' : 'Create Job Description'}</h1>
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <p className="text-red-700 font-medium text-sm">{errors.form || 'Please fix the errors below before saving.'}</p>
              </div>
            )}

            <form className="space-y-8">

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">Basic Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Senior Software Engineer"
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.title ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm transition-colors`}
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.department ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm`}
                    >
                      <option value="">Select Department</option>
                      <option value="IT">IT</option>
                      <option value="HR">HR</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                      <option value="Design">Design</option>
                    </select>
                    {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type <span className="text-red-500">*</span></label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.type ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm`}
                    >
                      <option value="">Select Type</option>
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                    {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm"
                    >
                      <option value="">Select Location</option>
                      <option value="Colombo">Colombo</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.deadline ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm`}
                    />
                    {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
                  </div>


                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range (Optional)</label>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          name="salaryMin"
                          value={formData.salaryMin}
                          onChange={handleChange}
                          placeholder="Min"
                          className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm"
                        />
                      </div>
                      <span className="text-gray-400">to</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          name="salaryMax"
                          value={formData.salaryMax}
                          onChange={handleChange}
                          placeholder="Max"
                          className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">Job Details</h2>

                <div className="space-y-6">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Description <span className="text-red-500">*</span></label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Write a comprehensive job description..."
                      className={`w-full px-4 py-3 rounded-lg border ${errors.description ? 'border-red-500' : 'border-gray-300'} bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm resize-y`}
                    />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities</label>
                    <textarea
                      name="responsibilities"
                      value={formData.responsibilities}
                      onChange={handleChange}
                      rows={4}
                      placeholder="• Develop web applications&#10;• Fix software bugs&#10;• Participate in code reviews"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm resize-y"
                    />
                  </div>
                </div>
              </div>


              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">Requirements & Skills</h2>

                <div className="space-y-6">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills <span className="text-red-500">*</span></label>
                    <p className="text-xs text-gray-500 mb-2">Type a skill and press Enter to add.</p>
                    <TagInput
                      tags={formData.requiredSkills}
                      setTags={(newTags) => handleTagsChange('requiredSkills', newTags)}
                      placeholder="e.g. React, Python, AWS"
                      error={errors.requiredSkills}
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Skills</label>
                    <TagInput
                      tags={formData.preferredSkills}
                      setTags={(newTags) => handleTagsChange('preferredSkills', newTags)}
                      placeholder="e.g. Docker, TypeScript"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experience Required</label>
                      <select
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm"
                      >
                        <option value="">Select Experience</option>
                        <option value="Fresher">Fresher</option>
                        <option value="1-2 Years">1-2 Years</option>
                        <option value="3-5 Years">3-5 Years</option>
                        <option value="5+ Years">5+ Years</option>
                      </select>
                    </div>


                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                      <select
                        name="education"
                        value={formData.education}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm"
                      >
                        <option value="">Select Education</option>
                        <option value="Bachelor's Degree">Bachelor's Degree</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Master's">Master's</option>
                        <option value="Any Qualification">Any Qualification</option>
                      </select>
                    </div>


                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">No. of Vacancies</label>
                      <input
                        type="number"
                        name="vacancies"
                        min="1"
                        value={formData.vacancies}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>


              <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky bottom-0 z-20">


                <div className="flex items-center gap-6 mb-4 md:mb-0">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Active"
                      checked={formData.status === 'Active'}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#00c853] focus:ring-[#00c853] border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Closed"
                      checked={formData.status === 'Closed'}
                      onChange={handleChange}
                      className="w-4 h-4 text-gray-500 focus:ring-gray-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Closed</span>
                  </label>
                </div>


                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => navigate('/recruiter/jobs')}
                    className="flex-1 md:flex-none px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, 'Draft')}
                    className="flex-1 md:flex-none px-6 py-3 bg-amber-50 text-amber-600 rounded-xl font-medium hover:bg-amber-100 transition-colors"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, 'Active')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#00c853] hover:bg-[#00b048] text-white rounded-xl font-medium shadow-md shadow-green-500/20 transition-all hover:shadow-lg"
                  >
                    <FiCheck className="w-5 h-5" />
                    Publish Job
                  </button>
                </div>
              </div>

            </form>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Add;
