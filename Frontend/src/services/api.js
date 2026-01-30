// fileName: services/api.js

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

async function http(method, path, body) {
  // ✅ UPDATE: Retrieve token for every request
  const token = localStorage.getItem('authToken');
  
  const headers = { 
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = 'Request failed';
    try {
      const err = await res.json();
      message = err?.message || message;
    } catch (_) {}
    throw new Error(message);
  }
  return res.json();
}

export const employeeAPI = {
  async getEmployees() {
    // Optional: Filter by company if logged in (Admin View)
    const companyId = localStorage.getItem('companyId');
    const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    return http('GET', `/employees${query}`);
  },

  // ✅ UPDATED: Accepts positionCode to fetch the specific application
  async getEmployeeById(id, companyId, positionCode) {
    let query = `?companyId=${encodeURIComponent(companyId || '')}`;
    if (positionCode) {
        query += `&positionCode=${encodeURIComponent(positionCode)}`;
    }
    return http('GET', `/employees/${id}${query}`);
  },

  async createEmployee(payload) {
    return http('POST', '/employees', payload);
  },

  async updateEmployee(id, payload) {
    // The backend checks payload.CompanyId and payload.PositionCode from the body
    return http('PUT', `/employees/${id}`, payload);
  },

  // ✅ UPDATED: Accepts positionCode to ensure we update the correct row
  async updateStatus(id, status, companyId, positionCode) {
    let query = `?companyId=${encodeURIComponent(companyId || '')}`;
    if (positionCode) {
        query += `&positionCode=${encodeURIComponent(positionCode)}`;
    }
    return http('PATCH', `/employees/${id}/status${query}`, { status: status });
  },

  // ✅ UPDATED: Accepts positionCode to delete the specific position application
  async deleteEmployee(id, companyId, positionCode) {
    let query = `?companyId=${encodeURIComponent(companyId || '')}`;
    if (positionCode) {
        query += `&positionCode=${encodeURIComponent(positionCode)}`;
    }
    return http('DELETE', `/employees/${id}${query}`);
  },
};