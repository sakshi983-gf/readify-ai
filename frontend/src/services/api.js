const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Analysis & Grammar & Quiz
  analyzePassage: (payload) => request('/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  checkGrammar: (text) => request('/grammar-check', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }),

  generateQuestions: (text, count = 5) => request('/generate-questions', {
    method: 'POST',
    body: JSON.stringify({ text, count }),
  }),

  submitAnswers: (payload) => request('/submit-answers', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // History & Dashboard
  getHistory: (limit = 50, offset = 0) => request(`/history?limit=${limit}&offset=${offset}`),

  getHistoryById: (id) => request(`/history/${id}`),

  deleteHistory: (id) => request(`/history/${id}`, {
    method: 'DELETE',
  }),

  clearAllHistory: () => request('/history', {
    method: 'DELETE',
  }),

  getDashboard: () => request('/dashboard'),
};

export default api;
