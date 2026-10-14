import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('careerforge_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('careerforge_token');
    }
    return Promise.reject(error);
  }
);

export const getHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const registerUser = async (registerData) => {
  const response = await api.post('/auth/register', registerData);
  return response.data;
};

export const loginUser = async (loginData) => {
  const response = await api.post('/auth/login', loginData);
  return response.data;
};

export const fetchCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Profile API Endpoints
export const getStudentProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const updateStudentProfile = async (profileData) => {
  const response = await api.put('/profile', profileData);
  return response.data;
};

export const getProfileCompletion = async () => {
  const response = await api.get('/profile/completion');
  return response.data;
};

// DSA Preparation Tracker API Endpoints
export const getDsaProblems = async (params = {}) => {
  const response = await api.get('/dsa/problems', { params });
  return response.data;
};

export const getDsaProblemById = async (id) => {
  const response = await api.get(`/dsa/problems/${id}`);
  return response.data;
};

export const createDsaProblem = async (problemData) => {
  const response = await api.post('/dsa/problems', problemData);
  return response.data;
};

export const updateDsaProblem = async (id, problemData) => {
  const response = await api.put(`/dsa/problems/${id}`, problemData);
  return response.data;
};

export const deleteDsaProblem = async (id) => {
  const response = await api.delete(`/dsa/problems/${id}`);
  return response.data;
};

export const getDsaStatistics = async () => {
  const response = await api.get('/dsa/statistics');
  return response.data;
};

export const getDsaTopics = async () => {
  const response = await api.get('/dsa/topics');
  return response.data;
};

// Aptitude Preparation Tracker API Endpoints
export const getAptitudeCategories = async () => {
  const response = await api.get('/aptitude/categories');
  return response.data;
};

export const getAptitudeTopics = async (category) => {
  const response = await api.get('/aptitude/topics', { params: { category } });
  return response.data;
};

export const getAptitudeQuestions = async (params = {}) => {
  const response = await api.get('/aptitude/questions', { params });
  return response.data;
};

export const createAptitudeSession = async (sessionData) => {
  const response = await api.post('/aptitude/sessions', sessionData);
  return response.data;
};

export const getAptitudeSessionQuestions = async (sessionId) => {
  const response = await api.get(`/aptitude/sessions/${sessionId}/questions`);
  return response.data;
};

export const submitAptitudeAnswer = async (sessionId, answerData) => {
  const response = await api.post(`/aptitude/sessions/${sessionId}/answers`, answerData);
  return response.data;
};

export const completeAptitudeSession = async (sessionId) => {
  const response = await api.post(`/aptitude/sessions/${sessionId}/complete`);
  return response.data;
};

export const getAptitudeSessionResults = async (sessionId) => {
  const response = await api.get(`/aptitude/sessions/${sessionId}/results`);
  return response.data;
};

export const getAptitudeHistory = async () => {
  const response = await api.get('/aptitude/sessions/history');
  return response.data;
};

export const getAptitudeStatistics = async () => {
  const response = await api.get('/aptitude/statistics');
  return response.data;
};

// ==================== Step 7: Resume Management APIs ====================
export const getResumes = async () => {
  const response = await api.get('/resumes');
  return response.data;
};

export const getResumeById = async (id) => {
  const response = await api.get(`/resumes/${id}`);
  return response.data;
};

export const uploadResume = async (formData) => {
  const response = await api.post('/resumes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const renameResume = async (id, data) => {
  const response = await api.put(`/resumes/${id}`, data);
  return response.data;
};

export const uploadResumeVersion = async (id, formData) => {
  const response = await api.post(`/resumes/${id}/versions`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getResumeVersions = async (id) => {
  const response = await api.get(`/resumes/${id}/versions`);
  return response.data;
};

export const setPrimaryResume = async (id) => {
  const response = await api.put(`/resumes/${id}/primary`);
  return response.data;
};

export const deleteResume = async (id) => {
  const response = await api.delete(`/resumes/${id}`);
  return response.data;
};

export const downloadResume = async (id, versionNumber = null) => {
  const params = versionNumber ? { version: versionNumber } : {};
  const response = await api.get(`/resumes/${id}/download`, {
    params,
    responseType: 'blob',
  });
  return response;
};

export const getResumeStats = async () => {
  const response = await api.get('/resumes/stats');
  return response.data;
};

// ==========================================
// CERTIFICATIONS API
// ==========================================

export const getCertifications = async () => {
  const response = await api.get('/certifications');
  return response.data;
};

export const getCertificationById = async (id) => {
  const response = await api.get(`/certifications/${id}`);
  return response.data;
};

export const createCertification = async (formData) => {
  const isMultipart = formData instanceof FormData;
  const config = isMultipart ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const response = await api.post('/certifications', formData, config);
  return response.data;
};

export const updateCertification = async (id, formData) => {
  const isMultipart = formData instanceof FormData;
  const config = isMultipart ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const response = await api.put(`/certifications/${id}`, formData, config);
  return response.data;
};

export const deleteCertification = async (id) => {
  const response = await api.delete(`/certifications/${id}`);
  return response.data;
};

export const downloadCertificateFile = async (id) => {
  const response = await api.get(`/certifications/${id}/file`, {
    responseType: 'blob',
  });
  return response;
};

export const getCertificationStats = async () => {
  const response = await api.get('/certifications/stats');
  return response.data;
};

// ==========================================
// JOB APPLICATIONS API
// ==========================================

export const getJobApplications = async (params = {}) => {
  const response = await api.get('/applications', { params });
  return response.data;
};

export const getJobApplicationById = async (id) => {
  const response = await api.get(`/applications/${id}`);
  return response.data;
};

export const createJobApplication = async (data) => {
  const response = await api.post('/applications', data);
  return response.data;
};

export const updateJobApplication = async (id, data) => {
  const response = await api.put(`/applications/${id}`, data);
  return response.data;
};

export const deleteJobApplication = async (id) => {
  const response = await api.delete(`/applications/${id}`);
  return response.data;
};

export const getJobApplicationStats = async () => {
  const response = await api.get('/applications/stats');
  return response.data;
};

// ==========================================
// MOCK INTERVIEWS API
// ==========================================

export const getMockInterviews = async (params = {}) => {
  const response = await api.get('/interviews', { params });
  return response.data;
};

export const getMockInterviewById = async (id) => {
  const response = await api.get(`/interviews/${id}`);
  return response.data;
};

export const createMockInterview = async (data) => {
  const response = await api.post('/interviews', data);
  return response.data;
};

export const updateMockInterview = async (id, data) => {
  const response = await api.put(`/interviews/${id}`, data);
  return response.data;
};

export const deleteMockInterview = async (id) => {
  const response = await api.delete(`/interviews/${id}`);
  return response.data;
};

export const getMockInterviewStats = async () => {
  const response = await api.get('/interviews/stats');
  return response.data;
};

// ==========================================
// ANALYTICS & REPORTS API
// ==========================================

export const getAnalyticsOverview = async () => {
  const response = await api.get('/analytics/overview');
  return response.data;
};

// ==========================================
// AI CAREER ASSISTANT API
// ==========================================

export const sendAiChat = async (prompt, category = 'GENERAL') => {
  const response = await api.post('/ai/chat', { prompt, category });
  return response.data;
};

export const getAiChatHistory = async () => {
  const response = await api.get('/ai/history');
  return response.data;
};

export const clearAiChatHistory = async () => {
  const response = await api.delete('/ai/history');
  return response.data;
};

export const getAiSuggestedPrompts = async () => {
  const response = await api.get('/ai/prompts');
  return response.data;
};

export default api;

