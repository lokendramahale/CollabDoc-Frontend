const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const apiCall = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

// Auth Services
export const authService = {
  register: (name, email, password) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => apiCall('/auth/me'),
};

// Document Services
export const documentService = {
  getAllDocuments: () => apiCall('/documents'),

  getDocumentById: (docId) =>
    apiCall(`/documents/${docId}`),

  createDocument: (title, isPublic = false) =>
    apiCall('/documents', {
      method: 'POST',
      body: JSON.stringify({ title, isPublic }),
    }),

  updateDocument: (docId, content) =>
    apiCall(`/documents/${docId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),

  deleteDocument: (docId) =>
    apiCall(`/documents/${docId}`, {
      method: 'DELETE',
    }),

  saveVersion: (docId, content) =>
    apiCall(`/documents/${docId}/versions`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  restoreVersion: (docId, versionId) =>
    apiCall(`/documents/${docId}/restore`, {
      method: 'POST',
      body: JSON.stringify({ versionId }),
    }),

  addCollaborator: (docId, email) =>
    apiCall(`/documents/${docId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};