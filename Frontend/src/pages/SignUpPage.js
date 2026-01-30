// fileName: SignUpPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // ✅ Import Link

function SignUpPage() {
  // State to hold form data
  const [formData, setFormData] = useState({
    icNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // --- MODIFIED STATE: Toast/Popup State ---
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: null, type: null });

  // Helper function to show and auto-hide the toast
  const showToast = (message, type) => {
    setToast({ message, type });
    // Hide the toast after 5 seconds
    setTimeout(() => {
      setToast({ message: null, type: null });
    }, 5000);
  };
  // ------------------------------------------

  // Generic handler to update state as user types
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // --- IC Number Validation Logic ---
    if (name === 'icNumber') {
      // Allow only digits and dashes, and limit total length
      const cleanedValue = value.replace(/[^0-9-]/g, '');
      
      const maxLength = 12; 
      if (cleanedValue.length <= maxLength) {
          setFormData(prevState => ({
            ...prevState,
            [name]: cleanedValue
          }));
      }
      return; 
    }
    // ----------------------------------------
    
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default page reload
    
    // Clear previous toasts
    setToast({ message: null, type: null });
    
    // --- Client-side IC Number Format Validation ---
    const icPattern = /^\d{6}-?\d{2}-?\d{4}$/; 
    if (!icPattern.test(formData.icNumber.replace(/-/g, ''))) {
        showToast("IC Number must be 12 digits (e.g., 900101015001).", 'error'); 
        return;
    }
    
    // --- Client-side Email Format Validation ---
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
        showToast("Please enter a valid email address (e.g., example@domain.com).", 'error');
        return;
    }
    // ----------------------------------------------------

    // --- Client-side Password Validation ---
    if (formData.password !== formData.confirmPassword) {
      showToast("Passwords do not match.", 'error');
      return;
    }

    if (formData.password.length < 8) {
      showToast("Password must be at least 8 characters long.", 'error');
      return;
    }

    setLoading(true);

    try {
      // Create the payload matching RegisterRequestDto.cs
      const payload = {
        icNumber: formData.icNumber,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      };

      // Send request to the API (path from AuthController.cs)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Get the JSON response from the server
      const data = await response.json();

      if (response.ok) {
        // Success (HTTP 200-299)
        showToast(data.message || "User registered successfully! You can now log in.", 'success');
        // Clear the form
        setFormData({
          icNumber: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        // Error (HTTP 400, 500, etc.)
        showToast(data.message || "Registration failed. Please try again.", 'error');
      }
    } catch (err) {
      // Network error or other unexpected issue
      showToast("An error occurred. Please check your connection and try again.", 'error'); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-wrapper" style={{ maxWidth: '450px', margin: '50px auto' }}> 
      {/* --- NEW TOAST POPUP COMPONENT (with inline styles for demo) --- */}
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
            // Conditional background color
            backgroundColor: toast.type === 'error' ? '#dc3545' : '#28a745'
          }}
        >
          {toast.message}
        </div>
      )}
      {/* -------------------------------------------------------------- */}
      
      <div className="card signup-card"> 
        <div className="card-header">
          <h2 className="card-title">Create Account</h2> 
          <p className="card-subtitle">Register a new user profile using your IC number and email.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
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
                  required
                  disabled={loading}
                  className="form-input"
                  inputMode="numeric" 
                  pattern="[0-9-]*" 
                  placeholder="e.g., 900101015001"
                />
              </div>

              <div className="form-group field"> 
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="form-input"
                  maxLength={254} 
                  placeholder="e.g., name@example.com"
                />
              </div>

              <div className="form-group field"> 
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                  disabled={loading}
                  className="form-input"
                />
              </div>

              <div className="form-group field"> 
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>

      {/* ✅ ADDED: Navigation to Login Page */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#7c3aed', fontWeight: '600', textDecoration: 'none' }}>
                  Login
              </Link>
          </p>
      </div>
    </div>
  );
}

export default SignUpPage;