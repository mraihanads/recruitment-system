import api from './api';

export const chatService = {
  async getConversations() {
    const res = await api.get('/chat/conversations');
    return res.data;
  },

  async startConversation(applicationId) {
    const res = await api.post(`/chat/applications/${applicationId}/conversation`);
    return res.data;
  },

  async getMessages(conversationId, afterId = 0) {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: afterId > 0 ? { after_id: afterId } : {},
    });
    return res.data;
  },

  async sendMessage(conversationId, { body, attachment }) {
    const formData = new FormData();
    if (body) formData.append('body', body);
    if (attachment) formData.append('attachment', attachment);
    const res = await api.post(`/chat/conversations/${conversationId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export default chatService;
