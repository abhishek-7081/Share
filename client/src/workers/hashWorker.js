self.onmessage = async (e) => {
  const { id, buffer } = e.data;
  try {
    const hashBuffer = await self.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    self.postMessage({ id, hash: hashHex });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};
