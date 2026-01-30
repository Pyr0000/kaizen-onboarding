// fileName: SkillForm.js
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; 
import { Terminal, Lightbulb, BookOpen } from 'lucide-react'; 

const API_URL = '/api/Skill'; 

const FormField = ({ label, children, fullWidth = false }) => (
    <div className={`field ${fullWidth ? 'full-width-field' : ''}`}>
        <label className="form-label">{label}</label>
        {children}
    </div>
);

const flexGrowStyle = { flex: 1 };

const initialSkill = {
    officeSkill: '',
    otherSkill: '',
    otherInfo: '',
};

const SkillForm = () => {
    const [skill, setSkill] = useState(initialSkill);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [candidateId, setCandidateId] = useState(null);

    useEffect(() => {
        const loadInitialData = async () => {
            const storedId = localStorage.getItem("candidateId");
            const storedCompanyId = localStorage.getItem("companyId");

            if (!storedId) {
                toast.error("No Candidate ID found. Please ensure you are logged in.");
                setLoading(false);
                return;
            } 
            setCandidateId(storedId);
            try {
                // ✅ UPDATED: Fetch based on CandidateID AND CompanyID
                const url = storedCompanyId 
                    ? `${API_URL}/${storedId}?companyId=${encodeURIComponent(storedCompanyId)}`
                    : `${API_URL}/${storedId}`;

                const response = await fetch(url);
                
                if (response.status === 404 || response.status === 204) return; 
                if (response.ok) {
                    const text = await response.text();
                    if (!text) return; 
                    const data = JSON.parse(text);
                    if (data) {
                        const getValue = (key) => {
                            if (data[key] !== undefined && data[key] !== null) return data[key];
                            const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
                            if (data[pascalKey] !== undefined && data[pascalKey] !== null) return data[pascalKey];
                            return '';
                        };
                        setSkill({
                            officeSkill: getValue('officeSkills'),
                            otherSkill: getValue('otherRelevantSkills'),
                            otherInfo: getValue('otherSkillInformation')
                        });
                        setIsSaved(true);
                    }
                } else {
                    console.error("Failed to fetch skills:", response.statusText);
                }
            } catch (error) {
                console.error("Error loading skill data:", error);
                toast.error("Could not load existing skills.");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (isSaved) setIsSaved(false);
        setSkill(prevSkill => ({ ...prevSkill, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!candidateId) {
            toast.error("Cannot save: Missing Candidate ID.");
            return;
        }

        setIsSubmitting(true);

        const storedCompanyId = localStorage.getItem('companyId');

        const payload = {
            candidateId: candidateId, 
            companyId: storedCompanyId, // ✅ CRITICAL: Send companyId
            officeSkills: skill.officeSkill,
            otherRelevantSkills: skill.otherSkill,
            otherSkillInformation: skill.otherInfo
        };

        const saveOperation = async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to save skill details.");
            }
            setIsSaved(true);
            return "Successfully saved skill details!";
        };

        toast.promise(saveOperation(), {
            loading: 'Saving skill details...',
            success: (msg) => msg,
            error: (err) => err.message || "An error occurred",
        }).finally(() => {
            setIsSubmitting(false);
        });
    };

    return (
        <div className="card">
            <div className="card-header"><h2 className="card-title">Skill Details 💡</h2><p className="card-subtitle">{loading ? "Loading skills..." : "List the candidate's technical, office, and other relevant skills."}</p></div>
            {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading data...</div>}
            <form onSubmit={handleSubmit} style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
                <div className="form-content-area">
                    <div className="form-section p-4 mb-6 border border-gray-200 rounded-lg relative shadow-sm" style={{ border: '1px solid #d1d5db' }}>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Candidate Skills</h3>
                        <div className="sub-form-section">
                            <FormField label="Office Skills" fullWidth><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Terminal className="text-gray-500" size={18} /><input type="text" name="officeSkill" value={skill.officeSkill} onChange={handleChange} placeholder="e.g., Microsoft Office Suite, SAP, PowerBI" className="form-input" style={flexGrowStyle}/></div></FormField>
                            <FormField label="Other Relevant Skills" fullWidth><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Lightbulb className="text-gray-500" size={18} /><input type="text" name="otherSkill" value={skill.otherSkill} onChange={handleChange} placeholder="e.g., Fluent in Mandarin, Project Management, SEO" className="form-input" style={flexGrowStyle}/></div></FormField>
                            <FormField label="Other Information/Notes" fullWidth><div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><BookOpen className="text-gray-500 mt-2" size={18} /><textarea name="otherInfo" value={skill.otherInfo} onChange={handleChange} rows="3" placeholder="Any additional notes on skills, proficiency levels, or certifications." className="form-input" style={flexGrowStyle}/></div></FormField>
                        </div>
                    </div>
                </div>
                <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                    {isSaved ? (<button type="submit" className="btn btn-secondary" style={{ minWidth: '200px' }} disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Skills'}</button>) : (<button type="submit" className="btn btn-primary" style={{ minWidth: '200px' }} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Skills'}</button>)}
                </div>
            </form>
        </div>
    );
};

export default SkillForm;