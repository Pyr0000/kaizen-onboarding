// fileName: ChangePassword.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ChangePassword() {
  const navigate = useNavigate();

  // State to hold form data
  const [formData, setFormData] = useState({
    currentPassword: '',
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
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast({ message: null, type: null });

    // --- Validation ---
    if (formData.newPassword !== formData.confirmNewPassword) {
      showToast("New passwords do not match.", 'error');
      return;
    }

    if (formData.newPassword.length < 8) {
      showToast("New password must be at least 8 characters long.", 'error');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      showToast("New password cannot be the same as the current password.", 'error');
      return;
    }

    setLoading(true);

    try {
      // ✅ FIX: Get the GUID 'userId' instead of 'candidateId'
      const userId = localStorage.getItem('userId');

      // Safety check
      if (!userId) {
          showToast("User ID not found. Please log out and log in again.", 'error');
          setLoading(false);
          return;
      }

      const payload = {
        userId: userId, 
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmNewPassword: formData.confirmNewPassword
      };

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include Authorization header if your backend uses JWT
          // 'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Password updated successfully! Redirecting...", 'success');
        
        // Redirect to Admin Dashboard after short delay
        setTimeout(() => {
          navigate('/employees');
        }, 2000);
      } else {
        showToast(data.message || "Failed to update password.", 'error');
      }
    } catch (err) {
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
          <h2 className="card-title">Security Update</h2> 
          <p className="card-subtitle">
            This is your first login. You must change your password to continue.
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-content-area">
            <div className="grid" style={{ gridTemplateColumns: '1fr' }}> 
              
              <div className="form-group field"> 
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="form-input"
                  placeholder="Enter your temporary password"
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
                  required
                  minLength="8"
                  disabled={loading}
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
                  required
                  disabled={loading}
                  className="form-input"
                  placeholder="Re-enter new password"
                />
              </div>

            </div>
          </div>

          <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;