import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
    FiUploadCloud,
    FiFileText,
    FiCheckCircle,
    FiXCircle,
    FiRefreshCw,
    FiTrash2,
    FiEye,
    FiSearch,
    FiDownload,
    FiX,
} from "react-icons/fi";

import Sidebar from "../../../components/layout/Sidebar";
import Header from "../../../components/layout/Header";
import StatisticCard from "../../../components/ui/StatisticCard";
import { resumeService } from "../../../services/resumeService";
import { useUI } from "../../../context/UIContext";

const getRecruiterId = () => {
    const storageUser = localStorage.getItem("user");
    const storedRecruiterId = localStorage.getItem("recruiterId");

    if (storageUser) {
        try {
            const parsedUser = JSON.parse(storageUser);
            const userId = parsedUser?.recruiter_id ?? parsedUser?.recruiterId;
            if (userId != null && userId !== "") return String(userId);
        } catch {
            // Ignore malformed local storage data and continue below.
        }
    }

    if (storedRecruiterId != null && storedRecruiterId !== "") {
        return String(storedRecruiterId);
    }

    throw new Error("No recruiter is logged in. Please sign in again.");
};

const PROCESSING_STEPS = [
    { id: "upload", label: "File Uploaded" },
    { id: "store", label: "Resume Stored" },
    { id: "extract", label: "Text Extracted" },
    { id: "nlp", label: "Natural Language Processing (NLP) Completed" },
    { id: "urls", label: "URLs Detected" },
    { id: "sbert", label: "Semantic Matching (SBERT)" },
    { id: "xgboost", label: "AI Evaluation (XGBoost)" },
    { id: "rank", label: "Ranking Generated" },
];

const ResumeUpload = () => {
    const { confirm, showToast } = useUI();
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    // File Upload State
    const [uploadingFiles, setUploadingFiles] = useState([]);

    // Database Table State (Session only)
    const [resumes, setResumes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");

    // Modal State
    const [viewedResume, setViewedResume] = useState(null);

    // Refs
    const fileInputRef = useRef(null);

    // --------------------------------------------------
    // Fetch List on Mount
    // --------------------------------------------------
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const recruiterId = getRecruiterId();
                const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs`, {
                    headers: { "X-Recruiter-ID": recruiterId }
                });
                setJobs(response.data.items || []);
            } catch (error) {
                console.error("Failed to fetch jobs:", error);
                showToast("Please sign in with a valid recruiter account before uploading resumes.", "error");
            }
        };

        fetchJobs();
    }, []);

    // --------------------------------------------------
    // Handlers
    // --------------------------------------------------

    const handleDownload = (resume) => {
        const url = resumeService.getDownloadUrl(resume.id);
        window.open(url, '_blank');
    };

    const handleDelete = async (resumeId) => {
        const isConfirmed = await confirm({
            title: 'Delete Resume?',
            message: 'Are you sure you want to delete this resume?',
            confirmText: 'Yes, Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (isConfirmed) {
            try {
                await resumeService.deleteResume(resumeId);
                setResumes((prev) => prev.filter(r => r.id !== resumeId));
            } catch (error) {
                showToast("Failed to delete resume: " + (error.response?.data?.detail || error.message), "error");
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processSelectedFiles(e.dataTransfer.files);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processSelectedFiles(e.target.files);
        }

        // Reset input so the same file can be selected again
        e.target.value = null;
    };

    // --------------------------------------------------
    // Process Selected Files
    // --------------------------------------------------

    const processSelectedFiles = (fileList) => {
        if (!selectedJob) {
            showToast("Please select a job position first.", "error");
            return;
        }

        const jobTitle =
            jobs.find((j) => String(j.id) === String(selectedJob))?.title || "Unknown Job";

        const newUploads = [];

        Array.from(fileList).forEach((file) => {
            const validExtensions = [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ];

            if (!validExtensions.includes(file.type)) {
                showToast(
                    `${file.name} is not supported. Only PDF and DOCX are allowed.`,
                    "error"
                );
                return;
            }

            const maxSize = 5 * 1024 * 1024;

            if (file.size > maxSize) {
                showToast(`${file.name} exceeds the maximum size of 5 MB.`, "error");
                return;
            }

            const fileSizeMB =
                (file.size / (1024 * 1024)).toFixed(1) + " MB";

            const newUpload = {
                id: "temp_" + Date.now() + Math.random(),
                file: file,
                name: file.name,
                size: fileSizeMB,
                job: jobTitle,
                progress: 0,
                status: "uploading",
            };

            newUploads.push(newUpload);
        });

        if (newUploads.length > 0) {
            setUploadingFiles((prev) => [...prev, ...newUploads]);

            newUploads.forEach((upload) => {
                uploadFileToServer(upload);
            });
        }
    };

    // --------------------------------------------------
    // Upload File to Server
    // --------------------------------------------------

    const uploadFileToServer = async (uploadObj) => {
        try {
            const data = await resumeService.uploadResume(uploadObj.file, selectedJob, (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadingFiles((prev) =>
                    prev.map((f) =>
                        f.id === uploadObj.id
                            ? { ...f, progress: percentCompleted }
                            : f
                    )
                );
            });

            // Remove from uploading list
            setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadObj.id));

            const resumeId = data.data.resume_id;
            const newDbRecord = {
                id: resumeId,
                name: uploadObj.name,
                candidate: data.data.candidate_name || "Unknown Candidate",
                job: uploadObj.job,
                date: "Just Now",
                size: uploadObj.size,
                status: data.data.processing_status || "Processing",
            };

            setResumes((prev) => [newDbRecord, ...prev]);

            // Start polling if not completed/failed
            if (newDbRecord.status !== "Completed" && newDbRecord.status !== "Failed") {
                pollResumeStatus(resumeId);
            }

        } catch (error) {
            const serverError = error.response?.data?.detail || error.message;
            console.error("Upload failed from backend:", serverError);
            showToast(`Upload failed: ${serverError}`, "error");

            // Handle Failure
            setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadObj.id));

            const newDbRecord = {
                id: Date.now(),
                name: uploadObj.name,
                candidate: "Upload Failed",
                job: uploadObj.job,
                date: "Just Now",
                size: uploadObj.size,
                status: "Failed",
            };

            setResumes((prev) => [newDbRecord, ...prev]);
        }
    };

    const pollResumeStatus = async (resumeId) => {
        try {
            const res = await resumeService.getResumeStatus(resumeId);
            const status = res.data?.processing_status;

            setResumes((prev) =>
                prev.map((r) => (r.id === resumeId ? { ...r, status: status || r.status } : r))
            );

            if (status && status !== "Completed" && status !== "Failed") {
                setTimeout(() => pollResumeStatus(resumeId), 3000);
            }
        } catch (error) {
            console.error(`Failed to poll status for ${resumeId}:`, error);
        }
    };

    // --------------------------------------------------
    // Timeline Modal
    // --------------------------------------------------

    const openTimelineModal = (resume) => {
        setViewedResume(resume);
    };

    const closeTimelineModal = () => {
        setViewedResume(null);
    };

    // --------------------------------------------------
    // Status Badge
    // --------------------------------------------------

    const getStatusBadge = (status) => {
        switch (status) {
            case "Completed":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#e8f5e9] text-[#00c853]">
                        <FiCheckCircle />
                        Completed
                    </span>
                );

            case "Processing":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-600">
                        <FiRefreshCw className="animate-spin" />
                        Processing
                    </span>
                );

            case "Failed":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-600">
                        <FiXCircle />
                        Failed
                    </span>
                );

            case "Queued":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">
                        <FiClock />
                        Queued
                    </span>
                );

            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-600">
                        <FiUploadCloud className="animate-pulse" />
                        Uploading
                    </span>
                );
        }
    };

    // --------------------------------------------------
    // Custom Clock Icon
    // --------------------------------------------------

    const FiClock = ({ className }) => (
        <svg
            className={className || "w-3 h-3"}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    );

    // --------------------------------------------------
    // KPI Calculations
    // --------------------------------------------------
    const totalUploaded = resumes.length;
    const completedCount = resumes.filter(r => r.status === "Completed").length;
    const failedCount = resumes.filter(r => r.status === "Failed" || r.status === "Upload Failed").length;
    const processingCount = totalUploaded - completedCount - failedCount;

    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
            <Sidebar />

            <div className="flex-1 flex flex-col ml-64 overflow-hidden">
                <Header title="Resume Upload Management" />

                <main className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-7xl mx-auto space-y-8 pb-8">

                        {/* Page Header */}
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Upload & Process Resumes
                                </h1>

                                <p className="text-gray-500 mt-1">
                                    Upload candidate resumes and process them using ResumeIQ AI.
                                </p>
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                            <StatisticCard
                                title="Total Uploaded"
                                value={totalUploaded}
                                icon={FiFileText}
                                colorClass="text-blue-600"
                                bgClass="bg-blue-50"
                            />

                            <StatisticCard
                                title="Processing"
                                value={processingCount}
                                icon={FiRefreshCw}
                                colorClass="text-orange-500"
                                bgClass="bg-orange-50"
                            />

                            <StatisticCard
                                title="Completed"
                                value={completedCount}
                                icon={FiCheckCircle}
                                colorClass="text-[#00c853]"
                                bgClass="bg-[#e8f5e9]"
                            />

                            <StatisticCard
                                title="Failed"
                                value={failedCount}
                                icon={FiXCircle}
                                colorClass="text-red-500"
                                bgClass="bg-red-50"
                            />

                        </div>

                        {/* Upload Section */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">

                            <div className="flex flex-col lg:flex-row gap-8">

                                <div className="flex-1 space-y-6">

                                    {/* Select Job */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            1. Select Job Position{" "}
                                            <span className="text-red-500">*</span>
                                        </label>

                                        <select
                                            value={selectedJob}
                                            onChange={(e) =>
                                                setSelectedJob(e.target.value)
                                            }
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#00c853] focus:border-[#00c853] outline-none text-sm transition-colors cursor-pointer"
                                        >
                                            <option value="" disabled>
                                                -- Select Job Position --
                                            </option>

                                            {jobs.map((job) => (
                                                <option key={job.id} value={job.id}>
                                                    {job.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Upload Resumes */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            2. Upload Resumes
                                        </label>

                                        <div
                                            className={`relative w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${!selectedJob
                                                ? "opacity-50 pointer-events-none bg-gray-50 border-gray-200"
                                                : isDragging
                                                    ? "border-[#00c853] bg-[#e8f5e9]"
                                                    : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                                                }`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                        >

                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                multiple
                                                accept=".pdf,.docx"
                                            />

                                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-500 mb-3 pointer-events-none">
                                                <FiUploadCloud className="w-6 h-6" />
                                            </div>

                                            <p className="text-gray-900 font-semibold pointer-events-none">
                                                Drag & Drop Resume(s)
                                            </p>

                                            <p className="text-gray-500 text-sm mt-1 pointer-events-none">
                                                OR{" "}
                                                <span className="text-[#00c853] font-medium">
                                                    Browse Files
                                                </span>
                                            </p>

                                            <p className="text-xs text-gray-400 mt-4 font-medium pointer-events-none">
                                                PDF, DOCX • Maximum 5 MB per file
                                            </p>

                                        </div>
                                    </div>

                                </div>

                                {/* Upload Progress */}
                                {uploadingFiles.length > 0 && (
                                    <div className="w-full lg:w-96 bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col max-h-[300px]">

                                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <FiUploadCloud className="text-[#00c853]" />
                                            Uploading Files ({uploadingFiles.length})
                                        </h3>

                                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">

                                            {uploadingFiles.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                                                >

                                                    <div className="flex justify-between items-center mb-2">

                                                        <span className="text-sm font-medium text-gray-900 truncate pr-4">
                                                            {file.name}
                                                        </span>

                                                        <span className="text-xs font-bold text-[#00c853]">
                                                            {file.progress}%
                                                        </span>

                                                    </div>

                                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#00c853] transition-all duration-300 ease-out"
                                                            style={{
                                                                width: `${file.progress}%`,
                                                            }}
                                                        ></div>
                                                    </div>

                                                    <div className="flex justify-between items-center mt-2">

                                                        <span className="text-xs text-gray-500">
                                                            {file.size}
                                                        </span>

                                                        <span className="text-xs text-gray-400">
                                                            Uploading...
                                                        </span>

                                                    </div>

                                                </div>
                                            ))}

                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* Resume Processing Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                            {/* Table Filters */}
                            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">

                                <div className="relative w-full md:w-64">

                                    <FiSearch className="absolute left-3 top-3 text-gray-400" />

                                    <input
                                        type="text"
                                        placeholder="Search Resumes..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00c853] focus:outline-none"
                                    />

                                </div>

                                <div className="flex gap-3 w-full md:w-auto">

                                    <select 
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none"
                                    >
                                        <option value="All Status">All Status</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Failed">Failed</option>
                                    </select>

                                </div>

                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">

                                <table className="w-full text-left text-sm">

                                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">

                                        <tr>
                                            <th className="px-6 py-4">
                                                Resume Name
                                            </th>

                                            <th className="px-6 py-4">
                                                Candidate
                                            </th>

                                            <th className="px-6 py-4">
                                                Job Position
                                            </th>

                                            <th className="px-6 py-4">
                                                Upload Date
                                            </th>

                                            <th className="px-6 py-4">
                                                File Size
                                            </th>

                                            <th className="px-6 py-4">
                                                Status
                                            </th>

                                            <th className="px-6 py-4 text-center">
                                                Actions
                                            </th>
                                        </tr>

                                    </thead>

                                    <tbody className="divide-y divide-gray-100 text-gray-700">

                                        {(() => {
                                            // Binary Search Implementation
                                            const sortedResumes = [...resumes].sort((a, b) => a.name.localeCompare(b.name));

                                            const performBinarySearch = (array, target) => {
                                                if (!target) return array;
                                                const lowerTarget = target.toLowerCase();
                                                let left = 0;
                                                let right = array.length - 1;
                                                let foundIndex = -1;

                                                while (left <= right) {
                                                    const mid = Math.floor((left + right) / 2);
                                                    const midName = array[mid].name.toLowerCase();

                                                    if (midName.startsWith(lowerTarget)) {
                                                        foundIndex = mid;
                                                        right = mid - 1; // Find first occurrence
                                                    } else if (midName < lowerTarget) {
                                                        left = mid + 1;
                                                    } else {
                                                        right = mid - 1;
                                                    }
                                                }

                                                if (foundIndex !== -1) {
                                                    const results = [];
                                                    for (let i = foundIndex; i < array.length; i++) {
                                                        if (array[i].name.toLowerCase().startsWith(lowerTarget)) {
                                                            results.push(array[i]);
                                                        } else {
                                                            break;
                                                        }
                                                    }
                                                    return results;
                                                }
                                                return []; // If not a prefix, it might be a substring, but binary search expects sorted prefix matching.
                                            };

                                            let filteredResumes = performBinarySearch(sortedResumes, searchTerm);
                                            
                                            if (statusFilter !== "All Status") {
                                                filteredResumes = filteredResumes.filter(r => {
                                                    if (statusFilter === "Completed") return r.status === "Completed";
                                                    if (statusFilter === "Failed") return r.status === "Failed" || r.status === "Upload Failed";
                                                    if (statusFilter === "Processing") return r.status !== "Completed" && r.status !== "Failed" && r.status !== "Upload Failed";
                                                    return true;
                                                });
                                            }

                                            return filteredResumes.map((resume) => (
                                                <tr
                                                    key={resume.id}
                                                    className="hover:bg-gray-50/80 transition-colors"
                                                >

                                                    {/* Resume Name */}
                                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">

                                                        <FiFileText className="text-gray-400" />

                                                        {resume.name}

                                                    </td>

                                                    {/* Candidate */}
                                                    <td className="px-6 py-4">

                                                        {resume.candidate === "Parsing..." ? (
                                                            <span className="text-gray-400 italic animate-pulse">
                                                                {resume.candidate}
                                                            </span>
                                                        ) : (
                                                            <span className="font-medium text-gray-900">
                                                                {resume.candidate}
                                                            </span>
                                                        )}

                                                    </td>

                                                    {/* Job */}
                                                    <td className="px-6 py-4 text-gray-600">
                                                        {resume.job}
                                                    </td>

                                                    {/* Date */}
                                                    <td className="px-6 py-4 text-gray-500">
                                                        {resume.date}
                                                    </td>

                                                    {/* File Size */}
                                                    <td className="px-6 py-4 text-gray-500">
                                                        {resume.size}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-6 py-4">
                                                        {getStatusBadge(resume.status)}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-6 py-4">

                                                        <div className="flex items-center justify-center gap-3">

                                                            {/* Processing Details */}
                                                            <button
                                                                onClick={() =>
                                                                    openTimelineModal(resume)
                                                                }
                                                                className="text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1"
                                                                title="Processing Details"
                                                            >
                                                                <FiEye className="w-4 h-4" />
                                                            </button>

                                                            {/* Download */}
                                                            <button
                                                                onClick={() => handleDownload(resume)}
                                                                className="text-gray-400 hover:text-gray-900 transition-colors"
                                                                title="Download"
                                                            >
                                                                <FiDownload className="w-4 h-4" />
                                                            </button>

                                                            {/* Retry */}
                                                            {resume.status === "Failed" && (
                                                                <button
                                                                    className="text-gray-400 hover:text-orange-500 transition-colors"
                                                                    title="Retry"
                                                                >
                                                                    <FiRefreshCw className="w-4 h-4" />
                                                                </button>
                                                            )}

                                                            {/* Delete */}
                                                            <button
                                                                onClick={() => handleDelete(resume.id)}
                                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <FiTrash2 className="w-4 h-4" />
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>
                                            ));
                                        })()}

                                    </tbody>

                                </table>

                            </div>

                        </div>

                    </div>
                </main>
            </div>

            {/* --------------------------------------------------
          Processing Timeline Modal
      -------------------------------------------------- */}

            {viewedResume && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">

                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">

                            <div>

                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <FiFileText className="text-blue-500" />
                                    {viewedResume.name}
                                </h3>

                                <p className="text-sm text-gray-500 mt-1">
                                    Candidate: {viewedResume.candidate} • Job:{" "}
                                    {viewedResume.job}
                                </p>

                            </div>

                            <button
                                onClick={closeTimelineModal}
                                className="text-gray-400 hover:text-gray-900 bg-white rounded-full p-1 border border-gray-200"
                            >
                                <FiX className="w-5 h-5" />
                            </button>

                        </div>

                        {/* Processing Pipeline */}
                        <div className="p-8 overflow-y-auto bg-white flex-1 relative">

                            <div className="absolute top-8 bottom-8 left-[43px] w-0.5 bg-gray-100"></div>

                            <div className="space-y-6 relative z-10">

                                <h4 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider text-center">
                                    AI Processing Pipeline
                                </h4>

                                {PROCESSING_STEPS.map((step, index) => {

                                    const status = viewedResume.status;

                                    // Determine current step index based on status string
                                    let currentStepIndex = 1; // By default Processing -> Upload & Store done
                                    if (status === "Text Extracted") currentStepIndex = 2;
                                    if (status === "Natural Language Processing (NLP) Completed") currentStepIndex = 3;
                                    if (status === "URLs Detected" || status === "LinkedIn Analysis" || status === "Portfolio Analysis") currentStepIndex = 4;
                                    if (status === "Semantic Matching (SBERT)") currentStepIndex = 5;
                                    if (status === "AI Evaluation (XGBoost)") currentStepIndex = 6;
                                    if (status === "Ranking Generated") currentStepIndex = 7;
                                    if (status === "Completed") currentStepIndex = 8;

                                    // Handle failure case to freeze timeline
                                    if (status === "Failed" || status === "Upload Failed") {
                                        // Assume failure happened at current index, but we don't have perfect history if we just refreshed. 
                                        // We fallback to checking if it's the last step that was processing.
                                        // For simplicity, we just red-out the 3rd step if text extraction failed, but we don't know where it failed.
                                        // We will just show the first uncompleted step as failed.
                                    }

                                    let isCompleted = index < currentStepIndex;
                                    let isCurrent = index === currentStepIndex && status !== "Completed" && status !== "Failed" && status !== "Upload Failed";

                                    let isFailedStep = (status === "Failed" || status === "Upload Failed") && index === currentStepIndex;

                                    return (
                                        <div
                                            key={step.id}
                                            className={`flex items-center gap-4 ${isCompleted || isCurrent
                                                ? "opacity-100"
                                                : "opacity-40"
                                                }`}
                                        >

                                            {/* Step Circle */}
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white flex-shrink-0 z-10 ${isCompleted
                                                    ? "border-[#00c853] text-[#00c853]"
                                                    : isFailedStep
                                                        ? "border-red-500 text-red-500"
                                                        : isCurrent
                                                            ? "border-orange-500 text-orange-500"
                                                            : "border-gray-300 text-transparent"
                                                    }`}
                                            >

                                                {isCompleted ? (
                                                    <FiCheckCircle className="w-4 h-4" />
                                                ) : isFailedStep ? (
                                                    <FiXCircle className="w-4 h-4" />
                                                ) : isCurrent ? (
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                                ) : null}

                                            </div>

                                            {/* Step Text */}
                                            <div className="flex-1">

                                                <p
                                                    className={`text-sm font-semibold ${isFailedStep
                                                        ? "text-red-600"
                                                        : isCompleted || isCurrent
                                                            ? "text-gray-900"
                                                            : "text-gray-500"
                                                        }`}
                                                >
                                                    {step.label}
                                                </p>

                                                {isCurrent && !isFailedStep && (
                                                    <p className="text-xs text-orange-500 mt-0.5">
                                                        In Progress...
                                                    </p>
                                                )}

                                                {isFailedStep && (
                                                    <p className="text-xs text-red-500 mt-0.5">
                                                        Error: Failed to extract text from document.
                                                    </p>
                                                )}

                                            </div>

                                        </div>
                                    );
                                })}

                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">

                            <button
                                onClick={closeTimelineModal}
                                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};

export default ResumeUpload;