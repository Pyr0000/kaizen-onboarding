// fileName: ForgotPasswordPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function ForgotPasswordPage() {
  const navigate = useNavigate();

  // State to hold form data
  const [formData, setFormData] = useState({
    icNumber: '',
    email: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // Toast/Popup State
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: null, type: null });

  // Helper function to show and auto-hide the toast
  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: null, type: null });
    }, 5000);
  };

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Specific logic for IC Number (only digits and dashes)
    if (name === 'icNumber') {
        const cleanedValue = value.replace(/[^0-9-]/g, '');
        const maxLength = 12;
        if (cleanedValue.length <= maxLength) {
            setFormData(prevState => ({ ...prevState, [name]: cleanedValue }));
        }
        return;
    }

    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast({ message: null, type: null });

    // --- 1. Validate Empty Fields First ---
    if (!formData.icNumber || !formData.email || !formData.newPassword || !formData.confirmNewPassword) {
        showToast("All fields are required.", 'error');
        return;
    }

    // --- 2. Validate IC Format ---
    const icPattern = /^\d{6}-?\d{2}-?\d{4}$/; 
    if (!icPattern.test(formData.icNumber.replace(/-/g, ''))) {
        showToast("IC Number must be 12 digits.", 'error');
        return;
    }

    // --- 3. Validate Password Match ---
    if (formData.newPassword !== formData.confirmNewPassword) {
      showToast("New passwords do not match.", 'error');
      return;
    }

    // --- 4. Validate Password Length ---
    if (formData.newPassword.length < 8) {
      showToast("New password must be at least 8 characters long.", 'error');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        icNumber: formData.icNumber,
        email: formData.email,
        newPassword: formData.newPassword,
        confirmNewPassword: formData.confirmNewPassword
      };

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Password reset successfully! Redirecting to login...", 'success');
        
        // Redirect to Login Page after short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // --- IMPROVED ERROR HANDLING ---
        // ASP.NET often returns errors in 'data.errors' (object) or 'data.message' (string)
        let errorMsg = data.message || "Failed to reset password.";
        
        if (data.errors) {
            // Extract the first error message from the validation object
            const errorValues = Object.values(data.errors).flat();
            if (errorValues.length > 0) {
                errorMsg = errorValues[0];
            }
        }
        
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred. Please check your connection.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-wrapper" style={{ maxWidth: '450px', margin: '50px auto' }}>
      
      {/* Toast Component */}
      {toast.message && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 25px',
            borderRadius: '5px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            backgroundColor: toast.type === 'error' ? '#dc3545' : '#28a745'
          }}
        >
          {toast.message}
        </div>
      )}

      <div className="card"> 
        <div className="card-header">
          <h2 className="card-title">Reset Password</h2> 
          <p className="card-subtitle">
            Verify your identity to set a new password.
          </p>
        </div>
        
        {/* ✅ Added noValidate to prevent browser popups interfering with Toasts */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-content-area">
            <div className="grid" style={{ gridTemplateColumns: '1fr' }}> 
              
              <div className="form-group field"> 
                <label htmlFor="icNumber">IC Number</label>
                <input
                  type="text"
                  id="icNumber"
                  name="icNumber"
                  value={formData.icNumber}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., 900101015001"
                />
              </div>

              <div className="form-group field"> 
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., name@example.com"
                />
              </div>

              <div className="form-group field"> 
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="form-group field"> 
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Re-enter new password"
                />
              </div>

            </div>
          </div>

          <div className="form-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/login" style={{ fontSize: '0.9rem', color: '#6b7280', textDecoration: 'none' }}>
                &larr; Back to Login
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;