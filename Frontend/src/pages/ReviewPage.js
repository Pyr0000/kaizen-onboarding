// fileName: ReviewPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Phone, Briefcase, GraduationCap, Star, BookOpen, MapPin, FileText } from 'lucide-react';

// --- Helper Component for Displaying Data ---
const DisplayField = ({ label, value, fullWidth = false, isSectionTitle = false }) => {
    if (isSectionTitle) {
        return <h4 className="review-section-subtitle">{label}</h4>;
    }
    // Strict check to ensure we don't hide "0" or valid empty states if necessary
    if (value === null || value === undefined || value === '') {
        return null;
    }
    return (
        <div className={`field review-field ${fullWidth ? 'full-width-field' : ''}`}>
            <label>{label}:</label>
            <p>{value || '-'}</p>
        </div>
    );
};

// --- Reusable Section Component ---
const ReviewSection = ({ title, icon, editPath, children }) => {
    const navigate = useNavigate();

    return (
        <div className="form-section">
            <h3 className="review-section-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {icon} {title}
                </span>
                <button onClick={() => navigate(editPath)} className="btn-edit-inline">
                    Edit
                </button>
            </h3>
            {children}
        </div>
    );
};

// --- ✨ UPDATED: Real API Fetch Function ---
const fetchReviewData = async (candidateId) => {
    console.log("Fetching real data for Candidate ID:", candidateId);

    // ✅ Get Company ID
    const storedCompanyId = localStorage.getItem('companyId') || '';
    const queryParam = storedCompanyId ? `?companyId=${encodeURIComponent(storedCompanyId)}` : '';

    // Helper to safely fetch JSON. Returns null if 404 or error.
    const safeFetch = async (endpoint) => {
        try {
            // Append the query param to every URL
            // This ensures we fetch data specific to the company context
            const url = `${endpoint}${queryParam}`;
            
            const res = await fetch(url);
            if (!res.ok) {
                // If 404, it just means data hasn't been entered yet
                if (res.status === 404) return null; 
                throw new Error(`Error ${res.status}`);
            }
            return await res.json();
        } catch (err) {
            console.warn(`Failed to fetch ${endpoint}`, err);
            return null; 
        }
    };

    // Helper for lists (returns [] instead of null)
    const safeFetchList = async (endpoint) => {
        const res = await safeFetch(endpoint);
        return Array.isArray(res) ? res : [];
    };

    try {
        // Execute all requests in parallel matching your Form APIs
        const [
            basic,
            contact,
            quals,
            jobs,
            skills,
            hobbyLangData, // Combined endpoint
            fieldExps
        ] = await Promise.all([
            safeFetch(`/api/employees/${candidateId}`),       // PersonalForm.js
            safeFetch(`/api/contact/${candidateId}`),         // ContactForm.js
            safeFetchList(`/api/Qualification/${candidateId}`), // QualificationForm.js
            safeFetchList(`/api/EmploymentHistory/${candidateId}`), // EmploymentHistoryForm.js
            safeFetch(`/api/Skill/${candidateId}`),           // SkillForm.js
            safeFetch(`/api/HobbyLanguage/${candidateId}`),   // HobbyLanguageForm.js
            safeFetchList(`/api/FieldExperience/${candidateId}`) // FieldExp.js
        ]);

        // Map the raw DB data to the shape ReviewPage expects
        return {
            basicInfo: basic ? {
                candidateId: basic.candidateId,
                fullName: basic.fullName,
                salutation: basic.salutationDescription || basic.salutationCode,
                entryDate: basic.entryDate ? new Date(basic.entryDate).toLocaleDateString() : '',
                oldIcNumber: basic.oldIcNumber,
                newIcNumber: basic.newIcNumber,
                passport: basic.passport,
                birthDate: basic.birthDate ? new Date(basic.birthDate).toLocaleDateString() : '',
                gender: basic.genderDescription || basic.gender,
                maritalStatus: basic.maritalStatusDescription || basic.maritalStatusCode,
                race: basic.raceDescription || basic.raceCode,
                nativeStatus: basic.nativeStatus,
                religion: basic.religionDescription || basic.religionCode,
                nationality: basic.nationalityDescription || basic.nationalityCode,
                countryOfOrigin: basic.countryOfOriginDescription || basic.countryOfOriginCode,
                recommendationType: basic.recommendationType,
                recommendationDetails: basic.recommendationDetails,
                disability: basic.disability,
                disabilityReference: basic.disabilityReference,
                disabilityReference2: basic.disabilityReference2
            } : {},
            
            contactInfo: contact ? {
                // General
                email: contact.email,
                phoneNumber: contact.phoneNumber,
                officeNumber: contact.officeNumber,
                otherNumber: contact.otherNumber,
                
                // Correspondence
                correspondenceAddress: contact.correspondenceAddress,
                correspondenceState: contact.correspondenceState,
                correspondenceCity: contact.correspondenceCity,
                correspondenceArea: contact.correspondenceArea,
                correspondencePhone: contact.correspondencePhone,
                
                // Permanent
                permanentAddress: contact.permanentAddress,
                permanentPhone: contact.permanentPhone,
                
                // Emergency
                emergencyNumber: contact.emergencyNumber,
                emergencyPhone: contact.emergencyPhone,
                emergencyAddress: contact.emergencyAddress,
            } : {},
            
            qualifications: quals.map(q => ({
                schoolName: q.schoolName,
                schoolTelNo: q.schoolTelNo,
                schoolAddress: q.schoolAddress,
                qualificationName: q.qualificationName || q.qualificationCode, 
                qualificationSubName: q.qualificationSubName || q.qualificationSubCode,
                joinSchoolDate: q.joinSchoolDate ? new Date(q.joinSchoolDate).toLocaleDateString() : '',
                sinceWhenDate: q.sinceWhenDate ? new Date(q.sinceWhenDate).toLocaleDateString() : '',
                cgpa: q.cgpa,
                qualificationGradeName: q.qualificationGradeName || q.qualificationGradeCode,
                qualificationGradeRank: q.qualificationGradeRank,
                otherGradeInfo: q.otherGradeInfo,
                isHighest: q.isHighest
            })),
            
            employmentHistory: jobs.map(j => ({
                employerName: j.employerName,
                telNo: j.telNo,
                address: j.address,
                jobName: j.jobName || j.jobCode,
                emphJobName: j.emphJobName,
                industryCode: j.industryCode,
                fromDate: j.fromDate ? new Date(j.fromDate).toLocaleDateString() : '',
                toDate: j.toDate ? new Date(j.toDate).toLocaleDateString() : 'Present',
                latest: j.latest,
                startSalary: j.startSalary,
                lastSalary: j.lastSalary,
                jobFunction: j.jobFunction,
                cessationReason: j.cessationReasonCode,
                cessationDesc: j.cessationReasonDescription
            })),
            
            skills: skills ? {
                officeSkill: skills.officeSkills, 
                otherSkill: skills.otherRelevantSkills,
                otherInfo: skills.otherSkillInformation,
            } : {},
            
            hobbiesAndLanguages: {
                hobbies: (hobbyLangData?.hobbies || []).map(h => ({
                    hobbyName: h.hobbyName || h.hobbyCode, 
                    abilityLevel: h.abilityLevel,
                    localDescription: h.localDescription
                })),
                languages: (hobbyLangData?.languages || []).map(l => ({
                    languageName: l.languageName || l.languageCode, 
                    readLevel: l.readLevel,
                    writtenLevel: l.writtenLevel,
                    spokenLevel: l.spokenLevel
                })),
                resume: hobbyLangData?.resume ? {
                    fileName: hobbyLangData.resume.fileName,
                    entryDate: hobbyLangData.resume.entryDate ? new Date(hobbyLangData.resume.entryDate).toLocaleDateString() : ''
                } : null
            },
            
            fieldExperience: fieldExps.map(f => ({
                fieldAreaName: f.fieldName || f.fieldAreaCode,
                yearInField: f.yearsOfExperience, 
                remark: f.description 
            }))
        };
    } catch (error) {
        console.error("Critical error building review data:", error);
        throw error;
    }
};

// --- Main ReviewPage Component ---
const ReviewPage = () => {
    const navigate = useNavigate();

    const [reviewData, setReviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [candidateId, setCandidateId] = useState(null);
    
    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            
            const storedId = localStorage.getItem("candidateId");
            
            if (!storedId) {
                 toast.error("Session expired or invalid. Please login again.");
                 navigate('/login');
                 return;
            }
            
            if(isMounted) setCandidateId(storedId);

            try {
                const data = await fetchReviewData(storedId);
                if (isMounted) {
                    setReviewData(data);
                }
            } catch (error) { 
                if (isMounted) {
                    toast.error("Failed to load profile data.");
                }
            } 
            finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        loadData();
        return () => {
            isMounted = false;
        };
    }, [navigate]);

    const handleFinalSubmit = () => {
        setIsSubmitting(true);
        
        const finalSubmissionPromise = new Promise(async (resolve, reject) => {
            try {
                // Simulate final submission or status update
                await new Promise(r => setTimeout(r, 1000)); 
                
                console.log("Form Submitted for ID:", candidateId);
                navigate('/thanks');
                resolve('Form submitted successfully!');
            } catch (err) {
                reject(err?.message || 'Submission failed. Please try again.');
            }
        });

        toast.promise(finalSubmissionPromise, {
            loading: 'Submitting final form...',
            success: (msg) => msg,
            error: (err) => err,
        }).finally(() => {
            setIsSubmitting(false);
        });
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '20px', color: '#6b7280' }}>Gathering your information for review...</p>
            </div>
        );
    }

    if (!reviewData) {
        return <div className="error-message">Could not load data. Please reload the page.</div>;
    }

    // Safely access nested objects
    const { basicInfo, contactInfo, skills, hobbiesAndLanguages } = reviewData;

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Final Review ✅</h2>
                <p className="card-subtitle">Please review all your information carefully. If everything is correct, confirm and submit.</p>
            </div>

            <div className="form-content-area review-page">
                
                {/* --- Section: Basic Information --- */}
                <ReviewSection title="Basic Information" icon={<User size={18} />} editPath="/employees/new">
                    {basicInfo && Object.keys(basicInfo).length > 0 ? (
                        <div className="grid">
                            <DisplayField label="Candidate ID" value={basicInfo.candidateId} />
                            <DisplayField label="Full Name" value={basicInfo.fullName} />
                            <DisplayField label="Salutation" value={basicInfo.salutation} />
                            <DisplayField label="Entry Date" value={basicInfo.entryDate} />
                            <DisplayField label="New IC Number" value={basicInfo.newIcNumber} />
                            <DisplayField label="Old IC Number" value={basicInfo.oldIcNumber} />
                            <DisplayField label="Passport" value={basicInfo.passport} />
                            <DisplayField label="Birth Date" value={basicInfo.birthDate} />
                            <DisplayField label="Gender" value={basicInfo.gender} />
                            <DisplayField label="Marital Status" value={basicInfo.maritalStatus} />
                            <DisplayField label="Race" value={basicInfo.race} />
                            <DisplayField label="Native Status" value={basicInfo.nativeStatus} />
                            <DisplayField label="Religion" value={basicInfo.religion} />
                            <DisplayField label="Nationality" value={basicInfo.nationality} />
                            <DisplayField label="Country of Origin" value={basicInfo.countryOfOrigin} />
                            <DisplayField label="Recommendation" value={basicInfo.recommendationType} />
                            <DisplayField label="Rec. Details" value={basicInfo.recommendationDetails} />
                            <DisplayField label="Disability" value={basicInfo.disability} />
                            <DisplayField label="Disability Ref 1" value={basicInfo.disabilityReference} />
                            <DisplayField label="Disability Ref 2" value={basicInfo.disabilityReference2} />
                        </div>
                    ) : <p className="text-gray-500 italic">No basic information saved.</p>}
                </ReviewSection>

                {/* --- Section: Contact Information --- */}
                <ReviewSection title="Contact Information" icon={<Phone size={18} />} editPath="/contact">
                    {contactInfo && Object.keys(contactInfo).length > 0 ? (
                        <>
                            <DisplayField isSectionTitle label="General Contact" />
                            <div className="grid">
                                <DisplayField label="Email" value={contactInfo.email} />
                                <DisplayField label="Personal Phone" value={contactInfo.phoneNumber} />
                                <DisplayField label="Office Phone" value={contactInfo.officeNumber} />
                                <DisplayField label="Other Phone" value={contactInfo.otherNumber} />
                            </div>

                            <DisplayField isSectionTitle label="Correspondence Address" />
                            <div className="grid">
                                <DisplayField label="Address" value={contactInfo.correspondenceAddress} fullWidth />
                                <DisplayField label="City" value={contactInfo.correspondenceCity} />
                                <DisplayField label="State" value={contactInfo.correspondenceState} />
                                <DisplayField label="Area" value={contactInfo.correspondenceArea} />
                                <DisplayField label="Phone" value={contactInfo.correspondencePhone} />
                            </div>

                            <DisplayField isSectionTitle label="Permanent Address" />
                            <div className="grid">
                                <DisplayField label="Address" value={contactInfo.permanentAddress} fullWidth />
                                <DisplayField label="Phone" value={contactInfo.permanentPhone} />
                            </div>

                            <DisplayField isSectionTitle label="Emergency Contact" />
                            <div className="grid">
                                <DisplayField label="Primary Number" value={contactInfo.emergencyNumber} />
                                <DisplayField label="Secondary Number" value={contactInfo.emergencyPhone} />
                                <DisplayField label="Address" value={contactInfo.emergencyAddress} fullWidth />
                            </div>
                        </>
                    ) : <p className="text-gray-500 italic">No contact information saved.</p>}
                </ReviewSection>

                {/* --- Section: Qualifications --- */}
                <ReviewSection title="Qualifications" icon={<GraduationCap size={18} />} editPath="/qualification">
                    {reviewData.qualifications.length > 0 ? reviewData.qualifications.map((qual, index) => (
                        <div key={`qual-${index}`} className="review-entry">
                            <DisplayField isSectionTitle label={`Qualification #${index + 1}`} />
                            <div className="grid">
                                <DisplayField label="School Name" value={qual.schoolName} />
                                <DisplayField label="School Phone" value={qual.schoolTelNo} />
                                <DisplayField label="School Address" value={qual.schoolAddress} fullWidth />
                                <DisplayField label="Qualification" value={qual.qualificationName} />
                                <DisplayField label="Sub-Qualification" value={qual.qualificationSubName} />
                                <DisplayField label="Grade Code" value={qual.qualificationGradeName} />
                                <DisplayField label="Grade Rank" value={qual.qualificationGradeRank} />
                                <DisplayField label="CGPA / Score" value={qual.cgpa} />
                                <DisplayField label="Other Grade Info" value={qual.otherGradeInfo} fullWidth />
                                <DisplayField label="Start Date" value={qual.joinSchoolDate} />
                                <DisplayField label="End Date" value={qual.sinceWhenDate} />
                                <DisplayField label="Highest Qualification" value={qual.isHighest ? 'Yes' : 'No'} />
                            </div>
                        </div>
                    )) : <p className="text-gray-500 italic">No qualifications added.</p>}
                </ReviewSection>

                {/* --- Section: Employment History --- */}
                <ReviewSection title="Employment History" icon={<Briefcase size={18} />} editPath="/employment">
                    {reviewData.employmentHistory.length > 0 ? reviewData.employmentHistory.map((job, index) => (
                        <div key={`job-${index}`} className="review-entry">
                            <DisplayField isSectionTitle label={`Employment #${index + 1} ${job.latest ? '(Latest)' : ''}`} />
                            <div className="grid">
                                <DisplayField label="Employer" value={job.employerName} />
                                <DisplayField label="Phone" value={job.telNo} />
                                <DisplayField label="Address" value={job.address} fullWidth />
                                <DisplayField label="Job Title" value={job.jobName} />
                                <DisplayField label="Emphasized Title" value={job.emphJobName} />
                                <DisplayField label="Industry Code" value={job.industryCode} />
                                <DisplayField label="From Date" value={job.fromDate} />
                                <DisplayField label="To Date" value={job.toDate} />
                                <DisplayField label="Start Salary" value={job.startSalary} />
                                <DisplayField label="Last Salary" value={job.lastSalary} />
                                <DisplayField label="Cessation Reason" value={job.cessationReason} />
                                <DisplayField label="Cessation Detail" value={job.cessationDesc} fullWidth />
                                <DisplayField label="Responsibilities" value={job.jobFunction} fullWidth />
                            </div>
                        </div>
                    )) : <p className="text-gray-500 italic">No employment history added.</p>}
                </ReviewSection>

                {/* --- Section: Skills --- */}
                <ReviewSection title="Skills" icon={<Star size={18} />} editPath="/skills">
                    {skills && Object.keys(skills).length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <DisplayField label="Office Skills" value={skills.officeSkill} fullWidth />
                            <DisplayField label="Other Skills" value={skills.otherSkill} fullWidth />
                            <DisplayField label="Additional Notes" value={skills.otherInfo} fullWidth />
                        </div>
                    ) : <p className="text-gray-500 italic">No skills information saved.</p>}
                </ReviewSection>

                {/* --- Section: Hobbies & Languages & Resume --- */}
                <ReviewSection title="Hobbies, Languages & Resume" icon={<BookOpen size={18} />} editPath="/hobby-language">
                    
                    {/* Hobbies */}
                    <DisplayField isSectionTitle label="Hobbies" />
                    <div className="grid">
                        {hobbiesAndLanguages.hobbies.length > 0 ? hobbiesAndLanguages.hobbies.map((hobby, i) => (
                            <div key={`hobby-${i}`} className="field review-field">
                                <label>{hobby.hobbyName}:</label>
                                <p>{hobby.abilityLevel} {hobby.localDescription ? `(${hobby.localDescription})` : ''}</p>
                            </div>
                        )) : <p className="text-gray-500 italic">No hobbies added.</p>}
                    </div>

                    {/* Languages */}
                    <DisplayField isSectionTitle label="Languages" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {hobbiesAndLanguages.languages.length > 0 ? hobbiesAndLanguages.languages.map((lang, i) => (
                            <DisplayField key={`lang-${i}`} label={lang.languageName} value={`Read: ${lang.readLevel}, Write: ${lang.writtenLevel}, Speak: ${lang.spokenLevel}`} fullWidth />
                        )) : <p className="text-gray-500 italic">No languages added.</p>}
                    </div>

                    {/* Resume */}
                    <DisplayField isSectionTitle label="Resume" />
                    <div className="grid">
                        {hobbiesAndLanguages.resume ? (
                            <div className="field review-field full-width-field">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <FileText size={16} /> Uploaded File:
                                </label>
                                <p><strong>{hobbiesAndLanguages.resume.fileName}</strong> (Uploaded on {hobbiesAndLanguages.resume.entryDate})</p>
                            </div>
                        ) : <p className="text-gray-500 italic">No resume uploaded.</p>}
                    </div>
                </ReviewSection>

                {/* --- Section: Field Experience --- */}
                <ReviewSection title="Field Experience" icon={<MapPin size={18} />} editPath="/field-experience">
                    {reviewData.fieldExperience.length > 0 ? reviewData.fieldExperience.map((exp, index) => (
                        <div key={`exp-${index}`} className="review-entry">
                            <DisplayField isSectionTitle label={`Experience #${index + 1}`} />
                            <div className="grid">
                                <DisplayField label="Field Area" value={exp.fieldAreaName} />
                                <DisplayField label="Years in Field" value={exp.yearInField} />
                                <DisplayField label="Remarks" value={exp.remark} fullWidth />
                            </div>
                        </div>
                    )) : <p className="text-gray-500 italic">No field experience added.</p>}
                </ReviewSection>
            </div>

            <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={handleFinalSubmit}
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{ minWidth: '220px' }}
                >
                    {isSubmitting ? 'Submitting...' : 'Confirm & Submit Form'}
                </button>
            </div>
        </div>
    );
};

export default ReviewPage;