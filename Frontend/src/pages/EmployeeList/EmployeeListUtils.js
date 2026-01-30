// fileName: EmployeeListUtils.js

export const getValue = (obj, key) => {
  if (!obj) return null;
  return obj[key] || obj[key.charAt(0).toUpperCase() + key.slice(1)];
};

// ✅ UPDATE: Key now includes PositionCode to distinguish multiple applications
export const getUniqueKey = (emp) => `${emp.candidateId}|${emp.companyId}|${emp.positionCode || 'NULL'}`;

export const parseUniqueKey = (key) => {
    const [candidateId, companyId, positionCode] = key.split('|');
    // Convert 'NULL' string back to actual null if needed, though usually code is present
    return { 
        candidateId, 
        companyId, 
        positionCode: positionCode === 'NULL' ? null : positionCode 
    };
};

export const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return dateStr; }
};

export const formatForExport = (dateStr) => {
    if (!dateStr) return "";
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split('T')[0];
    } catch { return ""; }
};