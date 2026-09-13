const API_BASE = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = 'An unexpected network error occurred.';
    try {
      const errJson = await response.json();
      errorMsg = errJson.error || errorMsg;
    } catch (e) {
      // Fallback
    }
    const error = new Error(errorMsg);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export const api = {
  async createSession() {
    const res = await fetch(`${API_BASE}/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(res);
  },

  async joinSession(code) {
    const res = await fetch(`${API_BASE}/session/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    return handleResponse(res);
  },

  async getSession(sessionId) {
    const res = await fetch(`${API_BASE}/session/${sessionId}`);
    return handleResponse(res);
  },

  async createTransfer(transferData) {
    const res = await fetch(`${API_BASE}/transfer/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferData)
    });
    return handleResponse(res);
  },

  async uploadChunk(transferId, chunkIndex, chunkBuffer, chunkHash) {
    const res = await fetch(`${API_BASE}/transfer/${transferId}/chunk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'x-chunk-index': chunkIndex.toString(),
        'x-chunk-hash': chunkHash || ''
      },
      body: chunkBuffer
    });
    return handleResponse(res);
  },

  async getTransferStatus(transferId) {
    const res = await fetch(`${API_BASE}/transfer/${transferId}/status`);
    return handleResponse(res);
  },

  async finalizeTransfer(transferId, fileHash) {
    const res = await fetch(`${API_BASE}/transfer/${transferId}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileHash })
    });
    return handleResponse(res);
  },

  getDownloadUrl(transferId) {
    return `${API_BASE}/transfer/${transferId}/download`;
  },

  async cancelTransfer(transferId) {
    const res = await fetch(`${API_BASE}/transfer/${transferId}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  }
};
