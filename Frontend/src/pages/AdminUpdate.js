// fileName: AdminUpdate.js
import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText, Database, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// Configuration defining forms and their fields
const FORM_FIELDS_CONFIG = {
  // ✅ Position Form at the top
  'Position Form': {
    fields: [
      { name: 'positionCode', label: 'Position Code' } 
    ]
  },
  'Personal Form': {
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'maritalStatus', label: 'Marital Status' },
      { name: 'race', label: 'Race' },
      { name: 'religion', label: 'Religion' },
      { name: 'nationality', label: 'Nationality' },
      { name: 'countryOfOrigin', label: 'Country of Origin' },
    ]
  },
  'Qualification Form': {
    fields: [
      { name: 'qualificationCode', label: 'Qualification Code' },
      { name: 'qualificationGradeCode', label: 'Grade Code' }
    ]
  },
  'Employment History Form': {
    fields: [
      { name: 'industryCode', label: 'Industry Code' },
      { name: 'jobCode', label: 'Job Code' },
      { name: 'cessationReason', label: 'Cessation Reason' }
    ]
  },
  'Hobby & Language Form': {
    fields: [
      { name: 'hobbyCode', label: 'Hobby Code' },
      { name: 'languageCode', label: 'Language Code' }
    ]
  },
  'Field Experience Form': {
    fields: [
      { name: 'fieldAreaCode', label: 'Field Area Code' }
    ]
  }
};

// Map frontend field names to backend database table names
const tableNameMap = {
    'salutation': 'salutation_code',
    'maritalStatus': 'marital_status_codes',
    'race': 'race_codes',
    'religion': 'religion_codes',
    'nationality': 'nationality_codes',
    'countryOfOrigin': 'country_origin_codes',
    'qualificationCode': 'qualification_codes', 
    'qualificationGradeCode': 'qualification_grades',
    'industryCode': 'industry_codes',
    'jobCode': 'job_codes',
    'positionCode': 'position_codes',
    'cessationReason': 'cessation_reasons',
    'hobbyCode': 'hobby_codes',
    'languageCode': 'language_codes',
    'fieldAreaCode': 'field_area_codes',
};

const AdminUpdate = () => {
  const [selectedForm, setSelectedForm] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [uploadStatus, setUploadStatus] = useState({});
  const [uploading, setUploading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Save status to localStorage whenever it changes
  useEffect(() => {
    // Only save if we have data or if we have finished initial loading
    if (!loadingStatus) {
      if (Object.keys(uploadStatus).length > 0) {
        localStorage.setItem('dropdownUploadStatus', JSON.stringify(uploadStatus));
      } else {
        // Optional: clear if empty, or keep previous state safely
        // localStorage.removeItem('dropdownUploadStatus'); 
      }
    }
  }, [uploadStatus, loadingStatus]);

  /**
   * Fetches the current status from the backend for all fields.
   */
  const refreshUploadStatus = async (uploadedFileName = null, statusKeyForUpdate = null) => {
    setRefreshing(true);
    const isInitialLoad = loadingStatus; 
    const toastId = isInitialLoad ? null : 'refreshToast';
    
    if (toastId) toast.loading('Checking database status...', { id: toastId });
    console.log("--- Refresh Status Started ---");

    const companyId = localStorage.getItem('companyId');

    // 1. Load current status from state or localStorage to preserve existing filenames
    let currentStatus = { ...uploadStatus };
    if (Object.keys(currentStatus).length === 0) {
        try {
            const saved = localStorage.getItem('dropdownUploadStatus');
            if (saved) currentStatus = JSON.parse(saved);
        } catch { /* ignore */ }
    }

    let newStatus = { ...currentStatus }; // Start with existing status to keep filenames
    let totalFields = 0;
    const statusPromises = [];

    for (const formName in FORM_FIELDS_CONFIG) {
      for (const field of FORM_FIELDS_CONFIG[formName].fields) {
        totalFields++;
        const statusKey = `${formName}|${field.name}`;
        const tableName = tableNameMap[field.name];

        if (!tableName) continue;

        statusPromises.push(
            fetch(`/api/AdminUpdate/status/${tableName}`, {
                headers: { 'Company-Id': companyId || '' }
            })
            .then(res => {
                if (!res.ok) throw new Error('Status check failed');
                return res.json();
            })
            .then(metadata => {
                // Logic to determine the filename to display:
                // 1. If this specific field was just uploaded, use the new filename passed in args.
                // 2. Otherwise, keep the existing filename from state/storage.
                // 3. If neither exists, default to 'DB Verified'.
                
                let finalFileName = 'DB Verified';
                
                if (statusKey === statusKeyForUpdate && uploadedFileName) {
                    finalFileName = uploadedFileName;
                } else if (currentStatus[statusKey]?.fileName && currentStatus[statusKey].fileName !== 'DB Verified') {
                     finalFileName = currentStatus[statusKey].fileName;
                }

                if (metadata.hasData && metadata.lastUpdated) {
                    return {
                        key: statusKey,
                        isUpdated: true, 
                        status: {
                            uploaded: true,
                            timestamp: metadata.lastUpdated,
                            fileName: finalFileName // ✅ Persist the filename correctly
                        }
                    };
                } else {
                    return { key: statusKey, isUpdated: false, status: { uploaded: false } };
                }
            })
            .catch(err => {
                console.warn(`Check failed for ${tableName}`, err);
                return { key: statusKey, isUpdated: false, status: { uploaded: false } };
            })
        );
      }
    }

    const results = await Promise.allSettled(statusPromises);
    let fieldsWithDataCount = 0;

    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
            newStatus[result.value.key] = result.value.status;
            if (result.value.isUpdated) fieldsWithDataCount++;
        }
    });

    setUploadStatus(newStatus);
    setRefreshing(false);
    setLoadingStatus(false);

    if (toastId) {
        const message = fieldsWithDataCount > 0
            ? `Refresh complete. Found data for ${fieldsWithDataCount} / ${totalFields} fields.`
            : `Refresh complete. No data found.`;
        toast.success(message, { id: toastId, duration: 3000 });
    }
  };

  // Load initial status
  useEffect(() => {
    // Optimistic load
    const savedStatus = localStorage.getItem('dropdownUploadStatus');
    if (savedStatus) {
      try { setUploadStatus(JSON.parse(savedStatus)); } catch (e) { }
    }
    // Network refresh
    refreshUploadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handles the file upload process
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedForm || !selectedField) {
      toast.error('Please select both a form and a field.');
      e.target.value = null;
      return;
    }

    const field = FORM_FIELDS_CONFIG[selectedForm]?.fields.find(f => f.name === selectedField);
    setUploading(true);

    const companyId = localStorage.getItem('companyId');
    const tableName = tableNameMap[field.name];
    const targetUrl = `/api/AdminUpdate/upload/${tableName}`;
    const toastId = `upload-${tableName}-${Date.now()}`;
    
    toast.loading('Uploading CSV file...', { id: toastId });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Company-Id': companyId || '' },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Upload failed: ${response.status}`);
      }

      // --- Success: Trigger Refresh with Filename ---
      const statusKey = `${selectedForm}|${selectedField}`;
      
      // ✅ Pass file.name explicitly so it gets saved in the state
      await refreshUploadStatus(file.name, statusKey); 

      toast.success(data.message || 'Upload successful!', { id: toastId });

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message, { id: toastId });
    } finally {
      e.target.value = null;
      setUploading(false);
    }
  };

  // Helpers
  const getFieldStatus = (formName, fieldName) => uploadStatus[`${formName}|${fieldName}`];
  
  const getFormCompletionStats = (formName) => {
    const fields = FORM_FIELDS_CONFIG[formName]?.fields || [];
    const uploadedCount = fields.filter(field => getFieldStatus(formName, field.name)?.uploaded).length;
    return { total: fields.length, uploaded: uploadedCount };
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleString('en-MY', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch (e) { return "Invalid Date"; }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div className="card">
        {/* Header */}
        <div className="card-header" style={{ background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))' }}>
          <h2 className="card-title" style={{ color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={24} /> Admin Dropdown Options Manager
          </h2>
          <p className="card-subtitle" style={{ color: '#e0e7ff', margin: '6px 0 0' }}>
            Upload CSV files to update dropdown options across all forms.
          </p>
        </div>

        {/* Upload Section */}
        <div className="form-section" style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
            Upload New CSV File
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label className="form-label">1. Select Form</label>
              <select
                value={selectedForm}
                onChange={(e) => { setSelectedForm(e.target.value); setSelectedField(''); }}
                className="form-input"
                disabled={uploading || refreshing}
              >
                <option value="">-- Choose Form --</option>
                {Object.keys(FORM_FIELDS_CONFIG).map(form => (
                  <option key={form} value={form}>{form}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">2. Select Field to Update</label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="form-input"
                disabled={!selectedForm || uploading || refreshing}
              >
                <option value="">-- Choose Field --</option>
                {selectedForm && FORM_FIELDS_CONFIG[selectedForm]?.fields.map(field => (
                  <option key={field.name} value={field.name}>{field.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ border: '2px dashed #d1d5db', borderRadius: '12px', padding: '32px', textAlign: 'center', background: selectedForm && selectedField ? '#f9fafb' : '#f3f4f6', transition: 'all 0.3s ease' }}>
            <Upload size={48} style={{ color: 'var(--theme-primary)', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
              {selectedForm && selectedField
                ? `3. Choose CSV for: ${FORM_FIELDS_CONFIG[selectedForm]?.fields.find(f => f.name === selectedField)?.label}`
                : 'Select Form and Field first'}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '16px' }}>
              Required headers: **'code'** and **'name'**.
            </p>
            <label htmlFor="csv-upload" className={`btn btn-primary ${!(selectedForm && selectedField) || uploading || refreshing ? 'disabled' : ''}`} style={{ cursor: (selectedForm && selectedField && !uploading && !refreshing) ? 'pointer' : 'not-allowed' }}>
              Choose CSV File
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={!selectedForm || !selectedField || uploading || refreshing}
              style={{ display: 'none' }} 
            />
          </div>
        </div>

        {/* Status Section */}
        <div className="form-section" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: 0 }}>
              Current Upload Status
            </h3>
            <button
              onClick={() => refreshUploadStatus()} 
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.875rem' }}
              disabled={refreshing || uploading}
            >
              <RefreshCw size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {loadingStatus ? (
              <p>Loading status...</p>
            ) : Object.keys(FORM_FIELDS_CONFIG).length > 0 ? (
                 Object.keys(FORM_FIELDS_CONFIG).map(formName => {
                    const stats = getFormCompletionStats(formName);
                    const percentage = stats.total > 0 ? Math.round((stats.uploaded / stats.total) * 100) : 0;
                    return (
                        <div key={formName} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: '#ffffff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', margin: 0 }}>{formName}</h4>
                                <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: '600', background: percentage === 100 ? '#d1fae5' : percentage > 0 ? '#fef3c7' : '#fee2e2', color: percentage === 100 ? '#065f46' : percentage > 0 ? '#92400e' : '#991b1b' }}>
                                {stats.uploaded}/{stats.total} Updated ({percentage}%)
                                </span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                                <div style={{ width: `${percentage}%`, height: '100%', background: percentage === 100 ? '#10b981' : 'var(--theme-primary)', transition: 'width 0.3s ease' }} />
                            </div>
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {FORM_FIELDS_CONFIG[formName]?.fields.map(field => {
                                    const status = getFieldStatus(formName, field.name);
                                    const isUploaded = status?.uploaded; 
                                    return (
                                        <div key={field.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: isUploaded ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${isUploaded ? '#bbf7d0' : '#fecaca'}` }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                {isUploaded ? <CheckCircle size={20} style={{ color: '#10b981' }} /> : <AlertCircle size={20} style={{ color: '#ef4444' }} />}
                                                <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: '600', color: '#374151', margin: 0, fontSize: '0.875rem' }}>{field.label}</p>
                                                
                                                {/* ✅ FIX: Display Filename for Position Code and others */}
                                                {isUploaded && status.fileName && status.fileName !== 'DB Verified' && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                    <FileText size={14} style={{ color: '#6b7280' }} />
                                                    <span style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                                                        Last file: {status.fileName}
                                                    </span>
                                                    </div>
                                                )}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: '0.75rem', color: isUploaded ? '#059669' : '#dc2626', fontWeight: '600' }}>
                                                    {isUploaded ? 'Updated' : 'Not Updated'} 
                                                </span>
                                                {isUploaded && status.timestamp && (
                                                <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: '4px 0 0' }}>
                                                    Last Update: {formatTimestamp(status.timestamp)}
                                                </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            ) : <p>No forms configured.</p>}
          </div>
        </div>
      </div>
      <style>{`
        .form-input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; transition: all 0.2s ease; }
        .form-input:focus { border-color: var(--theme-primary); box-shadow: 0 0 0 2px var(--theme-primary); outline: none; }
        .form-input:disabled { background-color: #f3f4f6; cursor: not-allowed; opacity: 0.6; }
        .form-label { display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .btn { padding: 10px 20px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; justify-content: center; }
        .btn-primary { background: linear-gradient(to right, var(--theme-primary), var(--theme-secondary)); color: #ffffff; }
        .btn-primary:hover:not(.disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn.disabled { background: #9ca3af; cursor: not-allowed; opacity: 0.7; }
        label[for="csv-upload"].btn.disabled { background: #9ca3af; }
        label[for="csv-upload"]:hover:not(.disabled) { transform: translateY(-2px); }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); margin-bottom: 2rem; overflow: hidden; }
        .card-header { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
        .card-title { font-size: 1.25rem; font-weight: 600; }
        .card-subtitle { font-size: 0.875rem; }
      `}</style>
    </div>
  );
};

export default AdminUpdate;