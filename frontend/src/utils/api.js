import axios from '../api/axios';

console.log('API endpoints are set to use "api/summarizer/"');

export const uploadDocument = async (files) => {
  const formData = new FormData();
  if (Array.isArray(files)) {
    files.forEach((file) => {
      formData.append('documents', file);
    });
  } else {
    formData.append('documents', files);
  }

  const response = await axios.post('api/summarizer/summarize/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const sendChatMessage = async (sessionId, message) => {
  const response = await axios.post('api/summarizer/chat/', {
    session_id: sessionId,
    message: message,
  });
  return response.data;
};

export const getUserSessions = async () => {
  const response = await axios.get('api/summarizer/sessions/');
  return response.data;
};

export const getChatHistory = async (sessionId) => {
  const response = await axios.get(`api/summarizer/sessions/${sessionId}/`);
  return response.data;
};

export const deleteSession = async (sessionId) => {
  const response = await axios.delete(`api/summarizer/sessions/${sessionId}/`);
  return response.data;
};

export const updateSessionTags = async (sessionId, tags) => {
  const response = await axios.patch(`api/summarizer/sessions/${sessionId}/tags/`, { tags });
  return response.data;
};
