// fileName: pages/CreateAdminPage.js
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

function CreateAdminPage() {
  // State for form fields
  const [formData, setFormData] = useState({
    companyId: '', 
    email: '',
    password: ''
  });

  // State for UI/UX
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Helper: Input Change Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Allow alphanumeric for Company ID
    if (name === 'companyId') {
      if (value.length <= 20) {
          setFormData(prevState => ({ ...prevState, [name]: value }));
      }
      return; 
    }
    
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    // --- 1. Client-Side Validation ---
    if (!formData.companyId || formData.companyId.length < 3) {
        toast.error("Company ID must be at least 3 characters."); 
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
        toast.error("Please enter a valid email address.");
        return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      // --- 2. Optional: Verify Company Exists ---
      // We check if the company is registered in the Company Table
      // This confirms the ID is valid before creating the user.
      const checkResponse = await fetch(`/api/company/${formData.companyId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
      });

      if (!checkResponse.ok) {
        if (checkResponse.status === 404) {
             toast.error(`Company ID "${formData.companyId}" not found. Please register the company first.`);
             setLoading(false);
             return;
        }
      }

      // --- 3. Create Admin ---
      const payload = {
        companyId: formData.companyId, 
        email: formData.email,
        password: formData.password
      };

      const response = await fetch('/api/auth/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Admin created successfully!");
        
        // ✅ UX UPDATE: MULTIPLE ADMINS FLOW
        // We DO NOT clear companyId. We only clear email/password.
        // This lets you immediately add a second admin for the same company.
        setFormData(prev => ({ 
            ...prev, 
            email: '', 
            password: '' 
        }));
      } else {
        const errorMsg = data.message || (data.errors ? Object.values(data.errors).flat().join(", ") : "Failed to create Admin.");
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Inline SVG Icons
  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const EyeSlashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );

  const toggleBtnStyle = {
    background: 'none',
    border: 'none',
    position: 'absolute',
    right: '10px',
    top: '38px',
    cursor: 'pointer',
    color: '#6b7280'
  };

  return (
    <div className="auth-form-wrapper" style={{ maxWidth: '500px', margin: '50px auto' }}>
      
      <div className="card">
        <div className="card-header">
            <h2 className="card-title">Create Admin</h2>
            <p className="card-subtitle">Register a new administrator with Email login.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-content-area">
            <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '15px' }}>
            
              {/* Company ID */}
              <div className="form-group field">
                <label htmlFor="companyId">Company ID</label>
                <input
                  type="text"
                  id="companyId"
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter the Company ID to link"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  The Admin will manage employees under this Company ID.
                </small>
              </div>

              {/* Email */}
              <div className="form-group field">
                <label htmlFor="email">Email Address (Login Username)</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="admin@company.com"
                />
              </div>

              {/* Password */}
              <div className="form-group field" style={{ position: 'relative' }}>
                <label htmlFor="password">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Min. 8 characters"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={toggleBtnStyle}
                    tabIndex="-1"
                >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>

            </div>
          </div>

          {/* Actions */}
          <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Processing...' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAdminPage;