import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

export const uploadDocument = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  });
  return data;
};

export const analyzeText = async ({ text, title, sourceType }) => {
  const { data } = await api.post('/analyze', { text, title, sourceType });
  return data;
};

export const getHistory = async (search = '') => {
  const { data } = await api.get('/history', { params: search ? { search } : {} });
  return data;
};

export const getAnalysis = async (id) => {
  const { data } = await api.get(`/history/${id}`);
  return data;
};

export const deleteAnalysis = async (id) => {
  const { data } = await api.delete(`/history/${id}`);
  return data;
};

export default api;
