export async function processWithQueue(url, formData, onProgress, returnJson = false, returnUrlOnly = false) {
  const token = localStorage.getItem('pdfmaster_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  if (token && !formData.has('userId')) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.sub) formData.append('userId', payload.sub);
    } catch(e) {}
  }

  const response = await fetch(url, { method: 'POST', body: formData, headers });
  
  if (!response.ok) {
    let errStr = 'Backend API error';
    try {
      const json = await response.json();
      if (json.error) errStr = json.error;
    } catch(e){}
    throw new Error(errStr);
  }

  // If status is 202, job is queued
  if (response.status === 202) {
    const { jobId, position } = await response.json();
    if (onProgress) onProgress({ type: 'queued', position });
    
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2s
      const statRes = await fetch(`/api/job/${jobId}`, { headers });
      if (!statRes.ok) throw new Error('Failed to check job status');
      
      const stat = await statRes.json();
      if (stat.status === 'error') {
        throw new Error(stat.error || 'Processing failed');
      } else if (stat.status === 'processing') {
        if (onProgress) onProgress({ type: 'processing' });
      } else if (stat.status === 'queued') {
        if (onProgress) onProgress({ type: 'queued', position: stat.position });
      } else if (stat.status === 'done') {
        if (returnJson) return stat.data;
        const dlUrl = `/api/download/${jobId}`;
        if (returnUrlOnly) return { url: dlUrl };
        
        const dlRes = await fetch(dlUrl, { headers });
        if (!dlRes.ok) throw new Error('Failed to download result');
        return dlRes; // Return the full response object
      }
    }
  }

  // If status is 200, it returned the response directly
  if (returnJson) {
    const data = await response.json();
    return data;
  }
  return response; // Return the full response object
}
