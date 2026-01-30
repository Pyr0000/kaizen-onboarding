// fileName: LoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 

function LoginPage() {
  const navigate = useNavigate(); 

  // State to hold form data
  const [companyId, setCompanyId] = useState(''); 
  const [icNumber, setIcNumber] = useState('');
  const [password, setPassword] = useState('');
  
  // ✅ NEW: Position State
  const [positions, setPositions] = useState([]); 
  const [selectedPosition, setSelectedPosition] = useState('');
  const [isFetchingPositions, setIsFetchingPositions] = useState(false);

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

  // --- Handler for IC Number Input ---
  const handleIcNumberChange = (e) => {
    const { value } = e.target;
    const cleanedValue = value.replace(/[^0-9-]/g, '');
    const maxLength = 12;
    if (cleanedValue.length <= maxLength) {
        setIcNumber(cleanedValue);
    }
  };

  // ✅ NEW: Verify Company & Fetch Positions on Blur
  const handleCompanyIdBlur = async () => {
    if (!companyId.trim()) return;

    setIsFetchingPositions(true);
    setPositions([]); // Reset positions while fetching
    setSelectedPosition(''); // Reset selection

    try {
      // 1. Fetch Positions filtered by this Company ID
      // Note: We use 'position_code' as the table name based on your backend mapping
      const response = await fetch(`/api/AdminUpdate/options/position_codes?companyId=${encodeURIComponent(companyId.trim())}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
            setPositions(data);
            // Optional: If validation of Company ID existence is needed separate from positions
            // you can keep your /api/company/ check here too.
        } else {
            showToast("Company found, but no positions are listed.", 'warning');
        }
      } else {
        // If the fetch fails (e.g. 404), it might imply the Company ID is invalid or server error
        console.warn("Failed to fetch positions");
        setPositions([]);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
    } finally {
      setIsFetchingPositions(false);
    }
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setToast({ message: null, type: null });

    // 1. Basic Validation
    const icPattern = /^\d{6}-?\d{2}-?\d{4}$/; 
    if (!icPattern.test(icNumber.replace(/-/g, ''))) {
        showToast("IC Number must be 12 digits (e.g., 900101015001).", 'error');
        return;
    }

    if (!companyId.trim()) {
        showToast("Please enter the Company Reference ID.", 'error');
        return;
    }

    setLoading(true);

    try {
      // ---------------------------------------------------------
      // ✅ STEP 1: Verify Company Reference ID with Database
      // ---------------------------------------------------------
      // We assume GET /api/company/:id checks if the company exists
      const companyCheckResponse = await fetch(`/api/company/${companyId.trim()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
      });

      if (!companyCheckResponse.ok) {
          if (companyCheckResponse.status === 404) {
              showToast("Invalid Company Reference ID. Please check and try again.", 'error');
          } else {
              showToast("Could not verify Company ID. Server error.", 'error');
          }
          setLoading(false);
          return; // 🛑 STOP HERE if company is invalid
      }

      // ---------------------------------------------------------
      // ✅ STEP 2: Proceed with Login if Company is Valid
      // ---------------------------------------------------------
      const payload = {
        companyId: companyId, 
        icNumber: icNumber,
        password: password,
        positionCode: selectedPosition // ✅ Pass the selected position to backend
      };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful:", data);
        showToast("Login successful!", 'success'); 

        // 1. SAVE USER ID
        const guid = data.userId || data.UserId || data.userID;
        if (guid) localStorage.setItem('userId', guid);

        // 2. SAVE CANDIDATE ID
        if (data.candidateId) {
             localStorage.setItem('candidateId', data.candidateId);
        } else if (data.user && data.user.candidateId) {
             localStorage.setItem('candidateId', data.user.candidateId);
        }

        // 3. SAVE COMPANY ID (Verified)
        localStorage.setItem('companyId', companyId);
        
        // 3b. ✅ SAVE SELECTED POSITION (Optional for later use)
        if (selectedPosition) {
            localStorage.setItem('userPositionCode', selectedPosition);
        }

        // 4. SAVE USER ROLE
        const rawRole = data.role || data.Role || "candidate";
        const userRole = rawRole.toLowerCase();
        localStorage.setItem('userRole', userRole);

        // 5. SAVE JWT TOKEN
        if (data.token) localStorage.setItem('authToken', data.token);

        // Clear form
        setCompanyId('');
        setIcNumber('');
        setPassword('');
        setPositions([]);
        
        // 6. NAVIGATION LOGIC
        const isFirstLogin = (data.isFirstLogin === true || data.IsFirstLogin === true);

        if (isFirstLogin && (userRole === 'admin' || userRole === 'superadmin')) {
            navigate('/change-password'); 
        } 
        else if (userRole === 'superadmin') {
            navigate('/create-admin'); 
        }
        else if (userRole === 'admin') {
            navigate('/employees'); 
        } 
        else {
            navigate('/employees/new'); // Candidate Dashboard - Start new profile
        }

      } else {
        showToast(data.message || "Invalid IC Number or password.", 'error');
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
      
      <div className="card login-card"> 
        <div className="card-header">
          <h2 className="card-title">Login</h2> 
          <p className="card-subtitle">Sign in to continue your candidate application.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-content-area">
            <div className="grid" style={{ gridTemplateColumns: '1fr' }}> 
              
              {/* ✅ Company ID Field with onBlur Fetch */}
              <div className="form-group field"> 
                <label htmlFor="companyId">Company Reference ID</label>
                <input
                  type="text" 
                  id="companyId"
                  name="companyId"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)} 
                  onBlur={handleCompanyIdBlur} // ✅ Trigger fetch on blur
                  required
                  disabled={loading}
                  className="form-input"
                  placeholder="e.g., COMP-001"
                />
              </div>

              {/* ✅ NEW: Position Dropdown (Dynamically loaded) */}
              <div className="form-group field">
                <label htmlFor="positionCode">Position Applied For</label>
                <div style={{ position: 'relative' }}>
                    <select
                        id="positionCode"
                        name="positionCode"
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                        className="form-input"
                        disabled={loading || isFetchingPositions || positions.length === 0}
                        style={{ appearance: 'auto' }} // Ensure arrow is visible
                    >
                        <option value="">
                            {isFetchingPositions 
                                ? "Loading positions..." 
                                : positions.length === 0 
                                    ? (companyId ? "No positions found" : "-- Enter Company ID first --")
                                    : "-- Select Position --"}
                        </option>
                        {positions.map((pos) => (
                            <option key={pos.code} value={pos.code}>
                                {pos.description || pos.name}
                            </option>
                        ))}
                    </select>
                </div>
              </div>

              <div className="form-group field"> 
                <label htmlFor="icNumber">IC Number</label>
                <input
                  type="text" 
                  id="icNumber"
                  name="icNumber"
                  value={icNumber}
                  onChange={handleIcNumberChange} 
                  required
                  disabled={loading}
                  className="form-input"
                  inputMode="numeric"
                  pattern="[0-9\-]*"
                  placeholder="e.g., 900101015001"
                />
              </div>

              <div className="form-group field"> 
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>
            
            {/* Forgot Password Link */}
            <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#7c3aed', textDecoration: 'none' }}>
                    Forgot Password?
                </Link>
            </div>
          </div>

          <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Login'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: '#7c3aed', fontWeight: '600', textDecoration: 'none' }}>
                  Sign Up
              </Link>
          </p>
      </div>
    </div>
  );
}

export default LoginPage;