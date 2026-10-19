const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('readify_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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

  // Authentication & Profile
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  register: (payload) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  getMe: () => request('/auth/me'),

  updateProfile: (payload) => request('/auth/profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  logout: () => request('/auth/logout', {
    method: 'POST',
  }),

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

  // Module 5: Grammar Practice
  getPracticeCategories: () => request('/practice/categories'),

  getPracticeExercises: (category = 'all', difficulty = 'all', count = 5) => 
    request(`/practice/exercises?category=${category}&difficulty=${difficulty}&count=${count}`),

  submitPractice: (payload) => request('/practice/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Module 5: Personalized Learning Coach
  getCoachDiagnostic: () => request('/coach/diagnostic'),

  // Module 6: Reading Comprehension
  getComprehensionPassages: (topic = 'all', difficulty = 'all') =>
    request(`/comprehension/passages?topic=${topic}&difficulty=${difficulty}`),

  submitComprehension: (payload) => request('/comprehension/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Module 3 & 12: Model Information & Empirical Evaluation
  getModelInfo: () => request('/model/info'),

  getModelEvaluations: () => request('/model/evaluations'),

  // Module 13: Readify AI Conversational Tutor
  sendTutorMessage: (payload) => request('/tutor/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Module 14: Multi-Tone Writing Studio
  rewriteTone: (text, tone) => request('/tone/rewrite', {
    method: 'POST',
    body: JSON.stringify({ text, tone }),
  }),

  // Module 15: Audio Pronunciation Coach (CMUDict Phonetics + WPM + CEFR)
  getPronunciationExercises: (level = '') => 
    request(`/audio/exercises${level ? `?level=${encodeURIComponent(level)}` : ''}`),
  evaluatePronunciation: (payload) => request('/audio/evaluate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Module 16: Intelligent Document & PDF Extraction
  extractDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('readify_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/document/extract`, {
      method: 'POST',
      body: formData,
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }
    return data;
  },
};

export default api;
