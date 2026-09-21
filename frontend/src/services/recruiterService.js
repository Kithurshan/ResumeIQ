/**
 * Recruiter Service
 * 
 * This file handles all API calls related to recruiter management.
 * It communicates with the backend API.
 * 
 * Beginner-friendly explanation:
 * - We use axios to make HTTP requests
 * - Each function corresponds to one API endpoint
 * - Try/catch handles errors gracefully
 */

import api from '../api/axios';

export const recruiterService = {
  /**
   * Create a new recruiter
   * 
   * @param {Object} recruiterData - The recruiter information
   * @returns {Promise} - The response from the backend
   * 
   * Example usage:
   * const result = await recruiterService.addRecruiter({
   *   fullName: 'John Doe',
   *   email: 'john@example.com',
   *   phone: '+94 77 000 0000',
   *   password: 'securePassword123',
   *   position: 'Senior Recruiter',
   *   location: 'Colombo HQ',
   *   department: 'Human Resources',
   *   status: 'Active'
   * });
   */
  addRecruiter: async (recruiterData) => {
    try {
      const response = await api.post('/recruiters/new', recruiterData);
      return response.data;
    } catch (error) {
      // Handle different types of errors
      if (error.response?.status === 400) {
        // Bad request - validation error or duplicate email
        throw new Error(error.response.data.detail || 'Invalid recruiter data');
      } else if (error.response?.status === 500) {
        // Server error
        throw new Error(error.response.data.detail || 'Server error. Please try again.');
      } else {
        // Network error or other issues
        throw new Error(error.message || 'Failed to add recruiter');
      }
    }
  },

  /**
   * Get all recruiters (for listing/management)
   * You can add this later when you create the recruiter list page
   */
  getAllRecruiters: async () => {
    try {
      const response = await api.get('/recruiters/list');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch recruiters');
    }
  },

  /**
   * Get a specific recruiter by ID
   * You can add this later for the recruiter details/edit page
   */
  getRecruiterById: async (recruiterId) => {
    try {
      const response = await api.get(`/recruiters/${recruiterId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch recruiter');
    }
  },

  getMyProfile: async (recruiterId) => {
    try {
      const response = await api.get(`/recruiters/profile/${recruiterId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch recruiter profile');
    }
  },

  /**
   * Update a recruiter
   * You can add this later for the edit page
   */
  updateRecruiter: async (recruiterId, recruiterData) => {
    try {
      const response = await api.put(`/recruiters/${recruiterId}`, recruiterData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update recruiter');
    }
  },

  /**
   * Delete a recruiter
   * You can add this later for the list page
   */
  deleteRecruiter: async (recruiterId) => {
    try {
      const response = await api.delete(`/recruiters/${recruiterId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete recruiter');
    }
  },
};
