// fileName: src/pages/EmployeeList/EmployeeList.js

import React, { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { employeeAPI } from "../../services/api";
import { 
  Users, Search, Eye, Trash2, Activity, Calendar, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle 
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// --- Imported Components & Helpers ---
import { dashboardStyles, getStatusStyle } from "./EmployeeListStyles";
import { getValue, getUniqueKey, parseUniqueKey, formatDate, formatForExport } from "./EmployeeListUtils";
import { StatusDropdown, ExportDropdown, getStatusIcon } from "./EmployeeListComponents";
import EmployeeDetailsModal from "./EmployeeDetailsModal";

// --- SUB-COMPONENT: Custom Confirmation Modal ---
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText, type = 'danger' }) => {
    if (!isOpen) return null;

    const colors = {
        danger: { bg: '#fee2e2', text: '#ef4444', btn: '#ef4444' },
        warning: { bg: '#ffedd5', text: '#f97316', btn: '#f97316' },
        success: { bg: '#dcfce7', text: '#16a34a', btn: '#16a34a' }
    };
    const theme = colors[type] || colors.danger;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(2px)', animation: 'fadeIn 0.2s ease-out'
        }} onClick={onCancel}>
            <div style={{
                backgroundColor: 'white', borderRadius: '12px', padding: '24px',
                width: '100%', maxWidth: '400px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        backgroundColor: theme.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <AlertTriangle size={20} color={theme.text} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>
                            {title}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
                            {message}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                        onClick={onCancel}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                            backgroundColor: 'white', border: '1px solid #d1d5db', color: '#374151', cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                            backgroundColor: theme.btn, border: 'none', color: 'white', cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const exportDropdownRef = useRef(null);
  
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // ✅ CONFIRMATION MODAL STATE
  const [modalConfig, setModalConfig] = useState({
      isOpen: false,
      title: '',
      message: '',
      confirmText: 'Confirm',
      type: 'danger',
      onConfirm: () => {}
  });

  // --- 1. FETCH & FILTER DATA ---
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await employeeAPI.getEmployees();
      
      const processedData = data.map(emp => ({
        ...emp,
        candidateId: getValue(emp, 'candidateId'),
        companyId: getValue(emp, 'companyId'),
        fullName: getValue(emp, 'fullName'),
        status: getValue(emp, 'status') || "Pending",
        entryDate: getValue(emp, 'entryDate') || getValue(emp, 'createdAt'),
        oldIcNumber: getValue(emp, 'oldIcNumber'),
        newIcNumber: getValue(emp, 'newIcNumber'),
        passport: getValue(emp, 'passport'),
        gender: getValue(emp, 'gender'),
        salutation: getValue(emp, 'salutationDescription') || getValue(emp, 'salutationCode') || "-",
        positionCode: getValue(emp, 'positionCode'),
        positionName: getValue(emp, 'positionName') || "-"
      }));

      const userRole = localStorage.getItem('userRole'); 
      const userCompanyId = localStorage.getItem('companyId'); 

      let filteredData = processedData;
      if (userRole === 'admin' && userCompanyId) {
          filteredData = processedData.filter(emp => emp.companyId === userCompanyId);
      }
      
      setEmployees(filteredData);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch employees");
      toast.error("Failed to load employee list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fetchEmployees]);

  const getEntryDate = (emp) => emp.entryDate || emp.createdAt;
  const normalizedIncludes = (value = "", query = "") => String(value).toLowerCase().includes(String(query).toLowerCase());

  const getProcessedEmployees = () => {
    let result = employees.filter((emp) => {
      const fullName = emp.fullName || ""; 
      const matchesSearch = !searchQuery || (
        normalizedIncludes(fullName, searchQuery) ||
        normalizedIncludes(emp.candidateId, searchQuery) ||
        normalizedIncludes(emp.oldIcNumber, searchQuery) ||
        normalizedIncludes(emp.newIcNumber, searchQuery) ||
        normalizedIncludes(emp.passport, searchQuery) ||
        normalizedIncludes(emp.salutation, searchQuery) ||
        normalizedIncludes(emp.gender, searchQuery) ||
        normalizedIncludes(emp.positionName, searchQuery)
      );
      const matchesStatus = statusFilter === "All Status" || String(emp.status).toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key] || "";
        let bValue = b[sortConfig.key] || "";
        
        if (sortConfig.key === 'entryDate') {
          aValue = new Date(getEntryDate(a) || 0).getTime();
          bValue = new Date(getEntryDate(b) || 0).getTime();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  };

  const filteredEmployees = getProcessedEmployees();
  const pendingCount = employees.filter(e => String(e.status).toLowerCase() === 'pending').length;
  const thisMonthCount = employees.filter(e => {
    const d = new Date(getEntryDate(e));
    const now = new Date();
    return !isNaN(d) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const markCandidatesAsDownloaded = async (keysToUpdate) => {
    if (!keysToUpdate || keysToUpdate.length === 0) return;

    try {
      const updatePromises = keysToUpdate.map(key => {
        const { candidateId, companyId, positionCode } = parseUniqueKey(key);
        return employeeAPI.updateStatus(candidateId, "Downloaded", companyId, positionCode);
      });
      await Promise.all(updatePromises);

      setEmployees(prev => prev.map(emp => 
        keysToUpdate.includes(getUniqueKey(emp))
        ? { ...emp, status: "Downloaded" } 
        : emp
      ));

      toast.success("Candidates marked as Downloaded");
    } catch (error) {
      console.error("Failed to update status after export", error);
      toast.error("File exported, but failed to update status.");
    }
  };

  const handleDownloadResume = async (e, candidateId, companyId) => {
    if (e) e.stopPropagation(); 
    const toastId = toast.loading("Checking for resume...");

    try {
        const endpoint = `/api/HobbyLanguage/resume/${candidateId}?companyId=${encodeURIComponent(companyId)}`;
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            if (response.status === 404) throw new Error("Resume file not found.");
            throw new Error("Failed to download resume.");
        }

        const blob = await response.blob();
        
        const contentDisposition = response.headers.get('Content-Disposition');
        let fileName = `Resume_${candidateId}.pdf`;
        if (contentDisposition && contentDisposition.includes('filename=')) {
            fileName = contentDisposition.split('filename=')[1].replace(/['"]/g, '');
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("Resume downloading...", { id: toastId });

    } catch (err) {
        console.error("Download error:", err);
        toast.error(err.message || "Error downloading file", { id: toastId });
    }
  };

  // ✅ ADDED: Preview Resume Handler
  const handlePreviewResume = async (e, candidateId, companyId) => {
    if (e) e.stopPropagation();
    const toastId = toast.loading("Opening resume preview...");

    try {
        const endpoint = `/api/HobbyLanguage/resume/${candidateId}?companyId=${encodeURIComponent(companyId)}`;
        const response = await fetch(endpoint);

        if (!response.ok) {
            if (response.status === 404) throw new Error("Resume file not found.");
            throw new Error("Failed to open resume.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Open the Blob URL in a new tab
        window.open(url, '_blank');
        
        toast.dismiss(toastId);
    } catch (err) {
        console.error("Preview error:", err);
        toast.error(err.message || "Error opening preview", { id: toastId });
    }
  };

  const fetchFullCandidateDetails = async (candidateId, companyId, positionCode) => {
    let queryParam = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '?';
    if (positionCode) queryParam += `&positionCode=${encodeURIComponent(positionCode)}`;

    const safeFetch = async (endpoint) => {
        try {
            const res = await fetch(`${endpoint}${queryParam}`);
            if (!res.ok) {
                if (res.status === 404) return null;
                throw new Error(`Error ${res.status}`);
            }
            return await res.json();
        } catch (err) {
            console.warn(`Failed to fetch ${endpoint} for ${candidateId}`, err);
            return null;
        }
    };
    const safeFetchList = async (endpoint) => {
        const res = await safeFetch(endpoint);
        return Array.isArray(res) ? res : [];
    };

    try {
        const [
            basic,
            contact,
            quals,
            jobs,
            skills,
            hobbyLangData,
            fieldExps
        ] = await Promise.all([
            safeFetch(`/api/employees/${candidateId}`),
            safeFetch(`/api/contact/${candidateId}`),
            safeFetchList(`/api/Qualification/${candidateId}`),
            safeFetchList(`/api/EmploymentHistory/${candidateId}`),
            safeFetch(`/api/Skill/${candidateId}`),
            safeFetch(`/api/HobbyLanguage/${candidateId}`),
            safeFetchList(`/api/FieldExperience/${candidateId}`)
        ]);

        return { basic, contact, quals, jobs, skills, hobbyLangData, fieldExps };
    } catch (e) {
        console.error("Error fetching full details for CSV", e);
        return null;
    }
  };

  const handleExportCSV = async () => {
    if (selectedKeys.size === 0) {
      toast.error("Please select at least one candidate to export.");
      return;
    }

    const toastId = toast.loading("Fetching full candidate data...");
    const selectedBasicEmployees = employees.filter(emp => selectedKeys.has(getUniqueKey(emp)));

    try {
        const fullDataPromises = selectedBasicEmployees.map(emp => 
            fetchFullCandidateDetails(emp.candidateId, emp.companyId, emp.positionCode)
        );
        
        const fullDataResults = await Promise.all(fullDataPromises);

        const headers = [
            "Candidate ID", "Company ID", "Position Code", "Position Name", "Status", "Entry Date", "Salutation", "Full Name",
            "Gender", "Marital Status", "Birth Date", "Race", "Religion", "Nationality",
            "Country of Origin", "Native Status", "Old IC", "New IC", "Passport",
            "Rec. Type", "Rec. Details", "Disability", 
            "Referee 1", "Referee 2",
            "Email", "Mobile Phone", "Office Phone", "Other Phone",
            "Corresp. Address", "Corresp. City", "Corresp. State", "Corresp. Postcode",
            "Permanent Address", "Permanent Phone",
            "Emergency Contact Name/No", "Emergency Address",
            "Office Skills", "Other Skills", "Skill Notes",
            "Qualifications (Formatted)", "Employment History (Formatted)", "Hobbies (Formatted)",
            "Languages (Formatted)", "Field Experiences (Formatted)"
        ];

        const rows = fullDataResults.map((data, index) => {
            if (!data) return [];
            const { basic, contact, quals, jobs, skills, hobbyLangData, fieldExps } = data;
            const val = (obj, key) => obj ? (obj[key] || obj[key.charAt(0).toUpperCase() + key.slice(1)] || "") : "";
            
            const qualString = quals.map(q => `[${val(q, 'qualificationCode')}] ${val(q, 'qualificationName')} @ ${val(q, 'schoolName')} (${formatForExport(val(q, 'sinceWhenDate'))}) - CGPA: ${val(q, 'cgpa')}`).join(" | ");
            const jobString = jobs.map(j => `${val(j, 'employerName')} - ${val(j, 'jobName')} (${formatForExport(val(j, 'fromDate'))} to ${val(j, 'toDate') || 'Present'})`).join(" | ");
            const hobbyString = (val(hobbyLangData, 'hobbies') || []).map(h => `${val(h, 'hobbyCode') || val(h, 'hobbyName')} (${val(h, 'abilityLevel')})`).join(" | ");
            const langString = (val(hobbyLangData, 'languages') || []).map(l => `${val(l, 'languageCode') || val(l, 'languageName')} (R:${val(l, 'readLevel')} W:${val(l, 'writtenLevel')} S:${val(l, 'spokenLevel')})`).join(" | ");
            const fieldString = fieldExps.map(f => `${val(f, 'fieldName') || val(f, 'fieldAreaCode')} (${val(f, 'yearsOfExperience')} yrs)`).join(" | ");

            return [
                val(basic, 'candidateId'), val(basic, 'companyId'), 
                val(basic, 'positionCode'), val(basic, 'positionName'),
                val(basic, 'status') || "Pending", formatForExport(val(basic, 'entryDate')),
                val(basic, 'salutationDescription') || val(basic, 'salutationCode'), `"${val(basic, 'fullName')}"`, val(basic, 'genderDescription') || val(basic, 'gender'),
                val(basic, 'maritalStatusDescription') || val(basic, 'maritalStatusCode'), formatForExport(val(basic, 'birthDate')),
                val(basic, 'raceDescription') || val(basic, 'raceCode'), val(basic, 'religionDescription') || val(basic, 'religionCode'),
                val(basic, 'nationalityDescription') || val(basic, 'nationalityCode'), val(basic, 'countryOfOriginDescription') || val(basic, 'countryOfOriginCode'),
                val(basic, 'nativeStatus'), val(basic, 'oldIcNumber'), val(basic, 'newIcNumber'), val(basic, 'passport'),
                val(basic, 'recommendationType'), `"${val(basic, 'recommendationDetails')}"`, val(basic, 'disability'),
                val(basic, 'referee1'), val(basic, 'referee2'),
                val(contact, 'email'), val(contact, 'phoneNumber'), val(contact, 'officeNumber'), val(contact, 'otherNumber'),
                `"${val(contact, 'correspondenceAddress')}"`, val(contact, 'correspondenceCity'), val(contact, 'correspondenceState'), val(contact, 'correspondenceArea'),
                `"${val(contact, 'permanentAddress')}"`, val(contact, 'permanentPhone'), `${val(contact, 'emergencyNumber')} / ${val(contact, 'emergencyPhone')}`, `"${val(contact, 'emergencyAddress')}"`,
                `"${val(skills, 'officeSkills')}"`, `"${val(skills, 'otherRelevantSkills')}"`, `"${val(skills, 'otherSkillInformation')}"`,
                `"${qualString}"`, `"${jobString}"`, `"${hobbyString}"`, `"${langString}"`, `"${fieldString}"`
            ];
        });

        const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Full_Candidate_Data_Export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Successfully exported full data for ${rows.length} candidates!`, { id: toastId });

        const keys = selectedBasicEmployees.map(e => getUniqueKey(e));
        await markCandidatesAsDownloaded(keys);
        setSelectedKeys(new Set()); 
        setIsExportDropdownOpen(false);
    } catch (error) {
        console.error("Export failed", error);
        toast.error("Failed to export full data.", { id: toastId });
    }
  };

  const handleExportPDF = async () => {
    if (selectedKeys.size === 0) {
      toast.error("Please select at least one candidate to export.");
      return;
    }
    const candidatesToExport = employees.filter(emp => selectedKeys.has(getUniqueKey(emp)));
    const doc = new jsPDF({ orientation: "portrait" });
    
    doc.setFontSize(18);
    doc.text("Candidate Profiles Export", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);
    
    let finalY = 35;

    candidatesToExport.forEach((emp) => {
        if (finalY > 240) { doc.addPage(); finalY = 20; }

        doc.setFontSize(14); doc.setTextColor(37, 99, 235); doc.setFont(undefined, 'bold');
        doc.text(`${emp.salutation} ${emp.fullName}`, 14, finalY);
        doc.setFontSize(10); doc.setTextColor(107, 114, 128); doc.setFont(undefined, 'normal');
        doc.text(`Position: ${emp.positionName} (${emp.positionCode})`, 14, finalY + 6);
        doc.text(`ID: ${emp.candidateId}  |  Company: ${emp.companyId}  |  Status: ${emp.status}`, 14, finalY + 11);

        const bodyData = [
            [{ content: 'Personal Information', colSpan: 2, styles: { fillColor: [243, 244, 246], fontStyle: 'bold', textColor: [17, 24, 39] } }],
            ['Gender', emp.gender || '-'], ['Birth Date', formatDate(emp.birthDate)],
            ['Marital Status', emp.maritalStatusDescription || emp.maritalStatusCode || '-'], ['Race', emp.raceDescription || emp.raceCode || '-'],
            ['Religion', emp.religionDescription || emp.religionCode || '-'],
            [{ content: 'Identity & Contact', colSpan: 2, styles: { fillColor: [243, 244, 246], fontStyle: 'bold', textColor: [17, 24, 39] } }],
            ['IC Number', emp.newIcNumber || emp.oldIcNumber || '-'], ['Passport', emp.passport || '-'],
            ['Nationality', emp.nationalityDescription || emp.nationalityCode || '-'], ['Email', emp.email || '-'], ['Phone', emp.phone || '-'],
            [{ content: 'Employment Details', colSpan: 2, styles: { fillColor: [243, 244, 246], fontStyle: 'bold', textColor: [17, 24, 39] } }],
            ['Entry Date', formatDate(getEntryDate(emp))], ['Rec. Type', emp.recommendationType || '-'],
            ['Rec. Details', emp.recommendationDetails || '-'], ['Disability', emp.disability || '-'],
            ['Referee 1', emp.referee1 || '-'], ['Referee 2', emp.referee2 || '-']
        ];

        autoTable(doc, {
            startY: finalY + 16, body: bodyData, theme: 'grid',
            styles: { fontSize: 9, cellPadding: 4, lineColor: [229, 231, 235] },
            columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold', textColor: [75, 85, 99], fillColor: [255, 255, 255] }, 1: { cellWidth: 'auto', textColor: [31, 41, 55] } },
            margin: { left: 14, right: 14 }
        });
        finalY = doc.lastAutoTable.finalY + 20; 
    });

    doc.save(`candidates_profiles_${new Date().toISOString().slice(0,10)}.pdf`);
    setIsExportDropdownOpen(false);
    toast.success(`Successfully exported ${candidatesToExport.length} profiles to PDF!`);
    const keys = candidatesToExport.map(e => getUniqueKey(e));
    await markCandidatesAsDownloaded(keys);
    setSelectedKeys(new Set()); 
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allKeys = filteredEmployees.map(emp => getUniqueKey(emp));
      setSelectedKeys(new Set(allKeys));
    } else {
      setSelectedKeys(new Set());
    }
  };

  const handleSelectOne = (key) => {
    const newSelected = new Set(selectedKeys);
    if (newSelected.has(key)) newSelected.delete(key);
    else newSelected.add(key);
    setSelectedKeys(newSelected);
  };

  // ✅ 1. TRIGGER SINGLE DELETE
  const initiateDelete = (candidateId, name, companyId, positionCode) => {
    setModalConfig({
        isOpen: true,
        title: 'Delete Candidate?',
        message: `Are you sure you want to delete ${name}? This will remove their application for position ${positionCode || 'Unknown'}.`,
        confirmText: 'Delete',
        type: 'danger',
        onConfirm: () => performDelete(candidateId, name, companyId, positionCode)
    });
  };

  // ✅ 2. EXECUTE SINGLE DELETE
  const performDelete = async (candidateId, name, companyId, positionCode) => {
      setModalConfig(prev => ({ ...prev, isOpen: false })); // Close Modal
      try {
        await employeeAPI.deleteEmployee(candidateId, companyId, positionCode);
        setEmployees(employees.filter((emp) => getUniqueKey(emp) !== `${candidateId}|${companyId}|${positionCode || 'NULL'}`));
        toast.success("Employee deleted successfully");
        
        // Close details modal if open
        if (selectedEmployee?.candidateId === candidateId && selectedEmployee?.companyId === companyId && selectedEmployee?.positionCode === positionCode) {
             setIsModalOpen(false);
        }
      } catch (err) {
        toast.error("Failed to delete employee");
      }
  };

  const handleSingleStatusUpdate = async (newStatus) => {
    if (!selectedEmployee) return;
    const loadingToast = toast.loading(`Updating status to ${newStatus}...`);
    try {
        await employeeAPI.updateStatus(selectedEmployee.candidateId, newStatus, selectedEmployee.companyId, selectedEmployee.positionCode);
        setEmployees(prev => prev.map(emp => 
            (emp.candidateId === selectedEmployee.candidateId && emp.companyId === selectedEmployee.companyId && emp.positionCode === selectedEmployee.positionCode)
            ? { ...emp, status: newStatus } 
            : emp
        ));
        setSelectedEmployee(prev => ({ ...prev, status: newStatus }));
        toast.success("Status updated!", { id: loadingToast });
    } catch (err) {
        console.error("Failed to update status", err);
        toast.error("Failed to update status", { id: loadingToast });
    }
  };

  // ✅ 3. TRIGGER BULK DELETE
  const initiateBulkDelete = () => {
    setModalConfig({
        isOpen: true,
        title: 'Delete Selected Candidates?',
        message: `Are you sure you want to delete ${selectedKeys.size} selected candidates? This action cannot be undone.`,
        confirmText: `Delete ${selectedKeys.size} Candidates`,
        type: 'danger',
        onConfirm: () => performBulkDelete()
    });
  };

  // ✅ 4. EXECUTE BULK DELETE
  const performBulkDelete = async () => {
      setModalConfig(prev => ({ ...prev, isOpen: false }));
      try {
          const deletePromises = Array.from(selectedKeys).map(key => {
             const { candidateId, companyId, positionCode } = parseUniqueKey(key);
             return employeeAPI.deleteEmployee(candidateId, companyId, positionCode);
          });
          await Promise.all(deletePromises);
          toast.success(`Deleted ${selectedKeys.size} candidates`);
          setEmployees(employees.filter(e => !selectedKeys.has(getUniqueKey(e))));
          setSelectedKeys(new Set());
      } catch (error) {
          toast.error("Failed to delete some candidates");
      }
  };

  const handleBulkAction = async (actionType) => {
    if (selectedKeys.size === 0) return;
    
    // ✅ Replaced window.confirm with Custom Modal Trigger
    if (actionType === 'delete') {
      initiateBulkDelete();
    } else {
      const newStatus = actionType === 'accept' ? 'Accepted' : actionType === 'reject' ? 'Rejected' : 'KIV';
      const toastId = toast.loading("Updating statuses...");
      try {
        const updatePromises = Array.from(selectedKeys).map(key => {
           const { candidateId, companyId, positionCode } = parseUniqueKey(key);
           return employeeAPI.updateStatus(candidateId, newStatus, companyId, positionCode);
        });
        await Promise.all(updatePromises);
        setEmployees(employees.map(emp => 
          selectedKeys.has(getUniqueKey(emp)) ? { ...emp, status: newStatus } : emp
        ));
        toast.success(`Updated ${selectedKeys.size} candidates to ${newStatus}`, { id: toastId });
        setSelectedKeys(new Set());
      } catch (error) {
        console.error("Bulk Update Error:", error);
        toast.error("Failed to update status.", { id: toastId });
      }
    }
  };

  const handleView = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner"></div></div>;

  return (
    <div> 
      <div style={dashboardStyles.statsGrid}>
        <div style={dashboardStyles.statCard}><div><p style={{color: "#6b7280", fontSize: "14px", fontWeight: "500"}}>Total Candidates</p><h2 style={{fontSize: "30px", fontWeight: "700", color: "#111827"}}>{employees.length}</h2></div><div style={{ ...dashboardStyles.iconCircle, backgroundColor: "#eff6ff" }}><Users size={24} color="#3b82f6" /></div></div>
        <div style={dashboardStyles.statCard}><div><p style={{color: "#6b7280", fontSize: "14px", fontWeight: "500"}}>Pending Review</p><h2 style={{fontSize: "30px", fontWeight: "700", color: "#111827"}}>{pendingCount}</h2></div><div style={{ ...dashboardStyles.iconCircle, backgroundColor: "#fff7ed" }}><Activity size={24} color="#f97316" /></div></div>
        <div style={dashboardStyles.statCard}><div><p style={{color: "#6b7280", fontSize: "14px", fontWeight: "500"}}>This Month</p><h2 style={{fontSize: "30px", fontWeight: "700", color: "#111827"}}>{thisMonthCount}</h2></div><div style={{ ...dashboardStyles.iconCircle, backgroundColor: "#f0fdf4" }}><Calendar size={24} color="#16a34a" /></div></div>
      </div>

      {selectedKeys.size > 0 && (
        <div style={dashboardStyles.bulkActionCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontWeight: "700", fontSize: "15px", color: "#172554" }}>{selectedKeys.size} selected</span></div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => handleBulkAction('accept')} className="btn" style={{backgroundColor: "#dcfce7", color: "#166534", border: 'none', padding: '8px 16px', whiteSpace: 'nowrap'}}>Accept</button>
            <button onClick={() => handleBulkAction('reject')} className="btn" style={{backgroundColor: "#fee2e2", color: "#991b1b", border: 'none', padding: '8px 16px', whiteSpace: 'nowrap'}}>Reject</button>
            <button onClick={() => handleBulkAction('kiv')} className="btn" style={{backgroundColor: "#fef9c3", color: "#854d0e", border: 'none', padding: '8px 16px', whiteSpace: 'nowrap'}}>KIV</button>
            <div style={{ width: '1px', backgroundColor: '#93c5fd', margin: '0 4px', height: '24px', display: 'inline-block' }}></div>
            {/* Bulk Delete triggers Modal */}
            <button onClick={() => handleBulkAction('delete')} className="btn" style={{backgroundColor: "white", color: "#ef4444", border: "1px solid #fca5a5", whiteSpace: 'nowrap'}}>Delete</button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: "visible" }}> 
        <div className="card-header" style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "20px 24px", backgroundColor: "#6366f1", borderRadius: "12px 12px 0 0", color: "white" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}><h2 className="card-title" style={{ margin: 0, fontSize: "18px", color: "white", whiteSpace: "nowrap" }}>All Candidates</h2><span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)', whiteSpace: "nowrap" }}>{filteredEmployees.length} records</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-end", flexWrap: "nowrap" }}>
            <div style={{ position: "relative", width: "240px" }}><Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", width: "16px" }} /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="form-input" style={{ paddingLeft: "38px", width: "100%", height: "40px", fontSize: "14px", backgroundColor: "white", border: "none", borderRadius: "8px", color: "#374151", boxSizing: "border-box" }} /></div>
            <div style={{ width: "150px", height: "40px" }}><StatusDropdown statusFilter={statusFilter} setStatusFilter={setStatusFilter} isOpen={isStatusDropdownOpen} setIsOpen={setIsStatusDropdownOpen} dropdownRef={dropdownRef} /></div>
            <ExportDropdown onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} isOpen={isExportDropdownOpen} setIsOpen={setIsExportDropdownOpen} dropdownRef={exportDropdownRef} />
          </div>
        </div>

        {error ? ( <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}><p>{error}</p><button onClick={fetchEmployees} className="btn btn-primary" style={{marginTop: '10px'}}>Try Again</button></div>
        ) : filteredEmployees.length === 0 ? (
           <div style={{ padding: "64px", textAlign: "center", color: "#6b7280" }}><Users size={48} style={{ marginBottom: "16px", opacity: 0.2 }} /><h3 style={{margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#374151'}}>No candidates found</h3><p style={{margin: 0}}>Try adjusting your search filters.</p></div>
        ) : (
          <div style={dashboardStyles.tableContainer}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0", fontSize: "14px", tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{...dashboardStyles.th, width: '30px'}}><input type="checkbox" checked={filteredEmployees.length > 0 && selectedKeys.size === filteredEmployees.length} onChange={handleSelectAll} style={{ width: "18px", height: "18px", cursor: "pointer" }} /></th>
                  <th style={{...dashboardStyles.th, width: '80px'}} onClick={() => handleSort('candidateId')}>ID {getSortIcon('candidateId')}</th>
                  <th style={{...dashboardStyles.th, width: '60px'}} onClick={() => handleSort('companyId')}>Comp {getSortIcon('companyId')}</th>
                  <th style={{...dashboardStyles.th, width: '140px'}} onClick={() => handleSort('positionName')}>Position {getSortIcon('positionName')}</th>
                  <th style={{...dashboardStyles.th, width: '60px'}} onClick={() => handleSort('salutation')}>Salut. {getSortIcon('salutation')}</th>
                  <th style={{...dashboardStyles.th, width: 'auto'}} onClick={() => handleSort('fullName')}>Name {getSortIcon('fullName')}</th>
                  <th style={{...dashboardStyles.th, width: '60px'}} onClick={() => handleSort('gender')}>Gender {getSortIcon('gender')}</th>
                  <th style={{...dashboardStyles.th, width: '90px'}} onClick={() => handleSort('entryDate')}>Date {getSortIcon('entryDate')}</th>
                  <th style={{...dashboardStyles.th, width: '110px'}} onClick={() => handleSort('newIcNumber')}>IC No. {getSortIcon('newIcNumber')}</th>
                  <th style={{...dashboardStyles.th, width: '100px'}} onClick={() => handleSort('status')}>Status {getSortIcon('status')}</th>
                  <th style={{...dashboardStyles.th, width: '90px', textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => {
                  const uniqueKey = getUniqueKey(employee);
                  return (
                    <tr key={uniqueKey} style={{ backgroundColor: selectedKeys.has(uniqueKey) ? '#f8fafc' : 'transparent', transition: 'background 0.2s' }}>
                      <td style={dashboardStyles.td}><input type="checkbox" checked={selectedKeys.has(uniqueKey)} onChange={() => handleSelectOne(uniqueKey)} style={{ width: "18px", height: "18px", cursor: "pointer" }} /></td>
                      <td style={dashboardStyles.td}><span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{employee.candidateId}</span></td>
                      <td style={dashboardStyles.td}><span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{employee.companyId}</span></td>
                      
                      <td style={dashboardStyles.td} title={employee.positionName}>
                         <div style={{ fontWeight: '500', color: '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{employee.positionName}</div>
                         <div style={{ fontSize: '10px', color: '#9ca3af' }}>{employee.positionCode}</div>
                      </td>

                      <td style={dashboardStyles.td}>{employee.salutation}</td>
                      <td style={{ ...dashboardStyles.td, whiteSpace: "normal", overflowWrap: "break-word", wordBreak: "break-word" }} title={employee.fullName}>
                        <span style={{ fontWeight: '600', color: '#0f172a', lineHeight: '1.3' }}>{employee.fullName}</span>
                      </td>
                      <td style={dashboardStyles.td}>{employee.gender}</td>
                      <td style={dashboardStyles.td}>{formatDate(getEntryDate(employee))}</td>
                      <td style={dashboardStyles.td}>{employee.newIcNumber || employee.oldIcNumber || "-"}</td>
                      <td style={dashboardStyles.td}>
                        <span style={{...dashboardStyles.badge, ...getStatusStyle(employee.status)}}>
                          {getStatusIcon(employee.status)} {employee.status}
                        </span>
                      </td>
                      <td style={{...dashboardStyles.td, textAlign: 'right'}}>
                        <button onClick={() => handleView(employee)} style={{ ...dashboardStyles.actionBtn, color: '#4b5563', backgroundColor: '#f3f4f6' }} title="View Details"><Eye size={18} /></button>
                        {/* ✅ Delete Button triggers Modal */}
                        <button onClick={() => initiateDelete(employee.candidateId, employee.fullName, employee.companyId, employee.positionCode)} style={{...dashboardStyles.actionBtn, color: '#ef4444', backgroundColor: '#fee2e2'}} title="Delete"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* ✅ RENDER CONFIRMATION MODAL */}
      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
      />

      {/* ✅ Updated to include onPreviewResume */}
      <EmployeeDetailsModal 
          employee={selectedEmployee} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onDelete={initiateDelete} // Triggers the modal
          onStatusUpdate={handleSingleStatusUpdate}
          onDownloadResume={handleDownloadResume} 
          onPreviewResume={handlePreviewResume} // ✅ Passed preview handler
          getEntryDate={getEntryDate}
      />
    </div>
  );
};

export default EmployeeList;