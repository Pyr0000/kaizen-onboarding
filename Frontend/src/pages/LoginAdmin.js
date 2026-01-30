// fileName: pages/LoginAdmin.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 

function LoginAdmin() {
  const navigate = useNavigate(); 

  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: null, type: null });
  
  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => { setToast({ message: null, type: null }); }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setToast({ message: null, type: null });

    if (!email.includes('@')) {
        showToast("Please enter a valid email address.", 'error');
        return;
    }

    setLoading(true);

    try {
      // 1. Clear old session data to prevent mixing accounts
      localStorage.removeItem('authToken');
      localStorage.removeItem('companyId');
      localStorage.removeItem('userRole');

      const payload = {
        email: email, 
        password: password
      };

      // ✅ Uses the dedicated Admin Login endpoint
      const response = await fetch('/api/auth/login-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Login successful!", 'success'); 

        // 2. Store Session Data
        localStorage.setItem('userId', data.userId || '');
        localStorage.setItem('authToken', data.token || '');
        
        // Normalize role to lowercase for consistent checking
        const role = (data.role || 'Admin').toLowerCase();
        localStorage.setItem('userRole', role);
        
        // ✅ CRITICAL: Store Company ID if present
        // This allows the frontend to know which company this Admin belongs to
        if (data.companyId) {
            localStorage.setItem('companyId', data.companyId);
        }

        // 3. Navigate
        if (data.isFirstLogin) {
            navigate('/change-password'); 
        } else if (role === 'superadmin') {
            navigate('/create-company'); 
        } else {
            navigate('/employees'); 
        }
      } else {
        showToast(data.message || "Invalid credentials.", 'error');
      }
    } catch (err) {
      console.error(err);
      showToast("Connection error. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-wrapper" style={{ maxWidth: '450px', margin: '50px auto' }}> 
      {toast.message && (
        <div style={{
            position: 'fixed', top: '20px', right: '20px', padding: '15px 25px', borderRadius: '5px', color: 'white', fontWeight: 'bold', zIndex: 1000,
            backgroundColor: toast.type === 'error' ? '#dc3545' : '#28a745'
        }}>
          {toast.message}
        </div>
      )}
      
      <div className="card login-card"> 
        <div className="card-header">
          <h2 className="card-title">Admin Login</h2> 
          <p className="card-subtitle">Sign in using your administrative email.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-content-area">
            <div className="grid" style={{ gridTemplateColumns: '1fr' }}> 
              <div className="form-group field"> 
                <label htmlFor="email">Email Address</label>
                <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input" placeholder="admin@company.com" disabled={loading} />
              </div>
              <div className="form-group field"> 
                <label htmlFor="password">Password</label>
                <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="form-input" disabled={loading} />
              </div>
            </div>
            <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#7c3aed', textDecoration: 'none' }}>Forgot Password?</Link>
            </div>
          </div>
          <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          </div>
        </form>
      </div>
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>Not an admin? <Link to="/login" style={{ color: '#7c3aed', fontWeight: '600', textDecoration: 'none' }}>Candidate Login</Link></p>
      </div>
    </div>
  );
}

export default LoginAdmin;