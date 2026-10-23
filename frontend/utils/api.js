/**
 * Frontend API Client for Backend Communication
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('brim_jwt_token');
  const isJsonBody = options.body && typeof options.body === 'string';
  const headers = {
    ...(isJsonBody ? { 'Content-Type': 'application/json' } : (options.isBlob ? {} : { 'Content-Type': 'application/json' })),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (options.isBlob) {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      let filename = '';
      if (disposition && disposition.includes('filename=')) {
        filename = disposition.split('filename=')[1].replace(/["']/g, '').trim();
      }
      if (filename) {
        blob.filename = filename;
      }
      blob.blob = blob;
      return blob;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error?.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    return data;
  } catch (error) {
    console.warn(`[API] ${endpoint} request failed:`, error.message);
    throw error;
  }
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (userData) =>
      request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    me: () => request('/api/auth/me'),
  },

  chat: {
    sendMessage: (params) =>
      request('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    createSession: (params) =>
      request('/api/chat/session', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    resetSession: (sessionId) =>
      request(`/api/chat/session/${sessionId}/reset`, {
        method: 'POST',
      }),
    getSession: (sessionId) =>
      request(`/api/chat/session/${sessionId}`),
    getMessages: (sessionId) =>
      request(`/api/chat/session/${sessionId}/messages`),
    getProjectSessions: (projectId) =>
      request(`/api/chat/project/${projectId}/sessions`),
  },

  leads: {
    createLead: (leadData) =>
      request('/api/leads', {
        method: 'POST',
        body: JSON.stringify(leadData),
      }),
    getProjectLeads: (projectId) =>
      request(`/api/projects/${projectId}/leads`),
  },

  knowledge: {
    getSources: (projectId) =>
      request(`/api/projects/${projectId}/knowledge`),
    addUrl: (projectId, data) =>
      request(`/api/projects/${projectId}/knowledge/url`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    reindex: (projectId) =>
      request(`/api/projects/${projectId}/knowledge/reindex`, {
        method: 'POST',
      }),
    deleteSource: (projectId, sourceId) =>
      request(`/api/projects/${projectId}/knowledge/${sourceId}`, {
        method: 'DELETE',
      }),
    getStatus: (projectId) =>
      request(`/api/projects/${projectId}/knowledge/status`),
  },

  analytics: {
    getStats: (projectId) =>
      request(`/api/projects/${projectId}/analytics`),
    trackEvent: (eventData) =>
      request('/api/analytics/event', {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),
  },

  visits: {
    createVisit: (visitData) =>
      request('/api/visits', {
        method: 'POST',
        body: JSON.stringify(visitData),
      }),
    getVisits: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/api/visits${qs ? `?${qs}` : ''}`);
    },
    exportExcel: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/api/visits/export${qs ? `?${qs}` : ''}`, { isBlob: true });
    },
  },

  brochures: {
    generatePdf: (propertyData) =>
      request('/api/brochures/generate', {
        method: 'POST',
        body: JSON.stringify(propertyData),
        isBlob: true,
      }),
  },
};

