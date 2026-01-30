// fileName: PersonalForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DROPDOWN_API_BASE_URL = '/api/AdminUpdate';
const EMPLOYEE_API_URL = '/api/employees'; 

const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return ''; 
    
    let month = '' + (d.getMonth() + 1);
    let day = '' + (d.getDate());
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
};

const initialForm = {
    candidateId: '',
    companyId: '', 
    entryDate: '', 
    fullName: '',
    salutationCode: '',
    oldIcNumber: '',
    newIcNumber: '',
    passport: '',
    birthDate: '',
    gender: '', 
    maritalStatusCode: '',
    raceCode: '',
    nativeStatus: 'Non-Native',
    religionCode: '',
    nationalityCode: '',
    countryOfOriginCode: '',
    recommendationType: '', 
    recommendationDetails: '', 
    disability: '',
    referee1: '', 
    referee2: '' 
};

const initialSelectedDescriptions = {
    salutationDescription: '',
    maritalStatusDescription: '',
    raceDescription: '',
    religionDescription: '',
    nationalityDescription: '',
    countryOfOriginDescription: '',
};

const DROPDOWN_FETCH_CONFIG = [
    { name: 'salutation', tableName: 'salutation_code', codeKey: 'salutationCode', descriptionKey: 'salutationDescription' },
    { name: 'maritalStatus', tableName: 'marital_status_codes', codeKey: 'maritalStatusCode', descriptionKey: 'maritalStatusDescription' },
    { name: 'race', tableName: 'race_codes', codeKey: 'raceCode', descriptionKey: 'raceDescription' },
    { name: 'religion', tableName: 'religion_codes', codeKey: 'religionCode', descriptionKey: 'religionDescription' },
    { name: 'nationality', tableName: 'nationality_codes', codeKey: 'nationalityCode', descriptionKey: 'nationalityDescription' },
    { name: 'countryOfOrigin', tableName: 'country_origin_codes', codeKey: 'countryOfOriginCode', descriptionKey: 'countryOfOriginDescription' },
];

const RECOMMENDATION_TYPE_OPTIONS = [
    { code: 'EMPLOYEE', description: 'EMPLOYEE' },
    { code: 'COLLEGE', description: 'COLLEGE' },
    { code: 'AGENCY', description: 'AGENCY' },
    { code: 'ADVERTISEMENT', description: 'ADVERTISEMENT' },
    { code: 'OTHERS', description: 'OTHERS' },
];

const FormField = ({ label, children, fullWidth = false }) => (
    <div className={`field ${fullWidth ? 'full-width-field' : ''}`}>
        <label>{label}</label>
        {children}
    </div>
);

const PersonalForm = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState(initialForm);
    const [selectedDescriptions, setSelectedDescriptions] = useState(initialSelectedDescriptions); 
    const [submitting, setSubmitting] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    
    const [dropdownOptions, setDropdownOptions] = useState({
        salutation: [],
        maritalStatus: [],
        race: [],
        religion: [],
        nationality: [],
        countryOfOrigin: [],
    });
    
    const [loadingDropdowns, setLoadingDropdowns] = useState(true);
    const [isSaved, setIsSaved] = useState(false);

    // ✅ UPDATED: Fetch data based on CandidateID AND CompanyID
    const fetchCandidateData = async (id) => {
        setFetchingData(true);
        try {
            const storedCompanyId = localStorage.getItem('companyId');
            
            // Construct URL with companyId query parameter
            const url = storedCompanyId 
                ? `${EMPLOYEE_API_URL}/${id}?companyId=${encodeURIComponent(storedCompanyId)}`
                : `${EMPLOYEE_API_URL}/${id}`;

            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 404) {
                    // This is normal for a new company application; user starts blank
                    return; 
                }
                throw new Error(`Failed to fetch data: ${response.status}`);
            }

            const data = await response.json();
            
            if (data) {
                const getValue = (obj, key) => {
                    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
                    const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
                    if (obj[pascalKey] !== undefined && obj[pascalKey] !== null) return obj[pascalKey];
                    return '';
                };

                setForm(prev => ({
                    ...prev,
                    ...data,
                    companyId: localStorage.getItem('companyId') || prev.companyId,
                    entryDate: getValue(data, 'entryDate') ? formatDate(getValue(data, 'entryDate')) : prev.entryDate,
                    birthDate: getValue(data, 'birthDate') ? formatDate(getValue(data, 'birthDate')) : '',
                    oldIcNumber: getValue(data, 'oldIcNumber'),
                    newIcNumber: getValue(data, 'newIcNumber'),
                    passport: getValue(data, 'passport'),
                    recommendationType: getValue(data, 'recommendationType'),
                    recommendationDetails: getValue(data, 'recommendationDetails'),
                    disability: getValue(data, 'disability'),
                    referee1: getValue(data, 'referee1'),
                    referee2: getValue(data, 'referee2'),
                    nativeStatus: getValue(data, 'nativeStatus') || 'Non-Native'
                }));

                setSelectedDescriptions({
                    salutationDescription: getValue(data, 'salutationDescription'),
                    maritalStatusDescription: getValue(data, 'maritalStatusDescription'),
                    raceDescription: getValue(data, 'raceDescription'),
                    religionDescription: getValue(data, 'religionDescription'),
                    nationalityDescription: getValue(data, 'nationalityDescription'),
                    countryOfOriginDescription: getValue(data, 'countryOfOriginDescription'),
                });

                setIsSaved(true); 
            }

        } catch (error) {
            console.error("Error loading candidate data:", error);
            toast.error("Could not load existing profile data.");
        } finally {
            setFetchingData(false);
        }
    };

    useEffect(() => {
        setForm(prev => ({
            ...prev,
            entryDate: formatDate(new Date())
        }));

        const storedId = localStorage.getItem('candidateId');
        const storedCompanyId = localStorage.getItem('companyId'); 
        
        if (storedId) {
            setForm(prev => ({ 
                ...prev, 
                candidateId: storedId,
                companyId: storedCompanyId || '' 
            }));
            fetchCandidateData(storedId);
        } else {
            console.warn("No Candidate ID found in storage.");
        }
    }, []);
    
    const fetchDropdowns = useCallback(async () => {
        setLoadingDropdowns(true);
        const storedCompanyId = localStorage.getItem('companyId') || '';
        
        const promises = DROPDOWN_FETCH_CONFIG.map(async (config) => {
            const { name, tableName } = config;
            try {
                // Append companyId to the query string for dropdowns too
                const response = await fetch(`${DROPDOWN_API_BASE_URL}/options/${tableName}?companyId=${encodeURIComponent(storedCompanyId)}`); 
                if (!response.ok) throw new Error(`Failed to fetch ${name} options`);
                const data = await response.json(); 
                return { name, data: Array.isArray(data) ? data : [] }; 
            } catch (error) {
                return { name, data: [] }; 
            }
        });

        const results = await Promise.allSettled(promises);
        
        setDropdownOptions(currentOptions => {
            let finalOptions = { ...currentOptions };
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    const { name, data } = result.value;
                    finalOptions[name] = data; 
                }
            });
            return finalOptions;
        });
        setLoadingDropdowns(false); 
    }, []); 

    useEffect(() => {
        fetchDropdowns();
    }, [fetchDropdowns]); 

    const update = (e) => {
        const { name, value, type, checked } = e.target;
        if (isSaved) setIsSaved(false);
        
        setForm((prev) => {
            let updatedFields = {};
            let codeKey = name;

            const dropdownConfig = DROPDOWN_FETCH_CONFIG.find(c => c.name === name);
            if (dropdownConfig) {
                 codeKey = dropdownConfig.codeKey;
            }
            
            if (type === 'checkbox' && name === 'isNative') {
                updatedFields.nativeStatus = checked ? 'Native' : 'Non-Native';
            } else {
                updatedFields[codeKey] = value;
            }
            return { ...prev, ...updatedFields };
        });

        if (e.target.tagName === 'SELECT' && name !== 'gender' && name !== 'recommendationType') {
            const selectElement = e.target;
            const selectedIndex = selectElement.selectedIndex;
            const description = selectedIndex !== -1 ? selectElement.options[selectedIndex].text : '';
            
            const dropdownConfig = DROPDOWN_FETCH_CONFIG.find(c => c.name === name);
            if (dropdownConfig) {
                const descriptionKey = dropdownConfig.descriptionKey;
                setSelectedDescriptions(prevDescriptions => ({
                    ...prevDescriptions,
                    [descriptionKey]: description === 'Select' || description === 'Loading...' ? '' : description
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const submissionPromise = new Promise(async (resolve, reject) => {
            try {
                let payload = { 
                    ...form,
                    companyId: localStorage.getItem('companyId') || form.companyId 
                };
                
                Object.keys(selectedDescriptions).forEach(descriptionKey => {
                    payload[descriptionKey] = selectedDescriptions[descriptionKey];
                });
                
                const recKey = 'recommendationType';
                const recDescriptionKey = 'recommendationTypeDescription';
                if (payload[recKey]) {
                    const recOption = RECOMMENDATION_TYPE_OPTIONS.find(opt => opt.code === payload[recKey]);
                    payload[recDescriptionKey] = recOption ? recOption.description : '';
                } else {
                     payload[recDescriptionKey] = '';
                }

                if (payload.gender) {
                    payload.genderDescription = payload.gender; 
                } else {
                    payload.genderDescription = ''; 
                }

                const response = await fetch(EMPLOYEE_API_URL, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    let errorMessage = `Failed to save candidate (Status: ${response.status})`;
                    try {
                        const errorJson = await response.json();
                        if (errorJson.errors) {
                            errorMessage = Object.values(errorJson.errors).flat().join('; ');
                        } else if (errorJson.title) {
                            errorMessage = errorJson.title;
                        } else if (response.statusText) {
                            errorMessage += ` - ${response.statusText}`;
                        }
                    } catch {
                        errorMessage = `Failed to save candidate (Status: ${response.status})`;
                    }
                    throw new Error(errorMessage);
                }

                setIsSaved(true);
                resolve('Candidate information saved successfully');
            } catch (err) {
                console.error('Submission failed:', err);
                setIsSaved(false);
                reject(err?.message || 'Failed to save candidate.');
            }
        });

        toast.promise(submissionPromise, {
            loading: 'Saving...',
            success: (msg) => msg,
            error: (err) => `Error: ${err}`, 
        }).finally(() => {
            setSubmitting(false);
        });
    };

    const handleNext = () => {
        navigate('/contact');
    };

    const renderDefaultOption = () => (
        <option value="">{loadingDropdowns ? 'Loading...' : 'Select'}</option>
    );

    const renderCandidateInfo = () => (
        <>
            <h3>Candidate Information</h3>
            <div className="grid">
                <FormField label="Candidate ID">
                    <input
                        name="candidateId"
                        value={form.candidateId}
                        readOnly disabled
                        className="form-input"
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                    />
                </FormField>
                <FormField label="Entry Date">
                    <input type="date" name="entryDate" value={form.entryDate} readOnly disabled className="form-input" />
                </FormField>
            </div>
            
            <div className="grid">
                <FormField label="Select Salutation">
                    <select name="salutation" value={form.salutationCode} onChange={update} disabled={loadingDropdowns || submitting} className="form-input">
                        {renderDefaultOption()}
                        {dropdownOptions.salutation.map(option => (
                            <option key={option.code} value={option.code}>{option.description}</option>
                        ))}
                    </select>
                </FormField>
                <FormField label="Full Name *">
                    <input name="fullName" value={form.fullName} onChange={update} required className="form-input" />
                </FormField>
            </div>

            <div className="grid">
                <FormField label="Old IC Number">
                    <input name="oldIcNumber" value={form.oldIcNumber} onChange={update} className="form-input" />
                </FormField>
                <FormField label="New IC Number">
                    <input name="newIcNumber" value={form.newIcNumber} onChange={update} className="form-input" />
                </FormField>
            </div>
            
            <div className="grid">
                <FormField label="Passport">
                    <input name="passport" value={form.passport} onChange={update} className="form-input" />
                </FormField>
                <FormField label="Birth Date *">
                    <input type="date" name="birthDate" value={form.birthDate} onChange={update} required className="form-input" />
                </FormField>
            </div>
        </>
    );

    const renderDemographics = () => (
        <>
            <h3>Demographics</h3>
            <div className="grid">
                <FormField label="Gender">
                    <select name="gender" value={form.gender} onChange={update} className="form-input">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </FormField>
                <FormField label="Marital Status">
                    <select name="maritalStatus" value={form.maritalStatusCode} onChange={update} disabled={loadingDropdowns || submitting} className="form-input">
                        {renderDefaultOption()}
                        {dropdownOptions.maritalStatus.map(option => (
                            <option key={option.code} value={option.code}>{option.description}</option>
                        ))}
                    </select>
                </FormField>
            </div>
            
            <div className="grid">
                <FormField label="Race">
                    <select name="race" value={form.raceCode} onChange={update} disabled={loadingDropdowns || submitting} className="form-input">
                        {renderDefaultOption()}
                        {dropdownOptions.race.map(option => (
                            <option key={option.code} value={option.code}>{option.description}</option>
                        ))}
                    </select>
                </FormField>
                <div className="field">
                    <label>Native Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                        <input id="isNativeCheckbox" type="checkbox" name="isNative" checked={form.nativeStatus === 'Native'} onChange={update} style={{ width: '20px', height: '20px', marginRight: '8px', cursor: 'pointer' }} />
                        <label htmlFor="isNativeCheckbox" style={{ margin: 0, fontWeight: 'normal', cursor: 'pointer' }}>Is Native</label>
                    </div>
                </div>
            </div>
            
            <div className="grid">
                <FormField label="Religion">
                    <select name="religion" value={form.religionCode} onChange={update} disabled={loadingDropdowns || submitting} className="form-input">
                        {renderDefaultOption()}
                        {dropdownOptions.religion.map(option => (
                            <option key={option.code} value={option.code}>{option.description}</option>
                        ))}
                    </select>
                </FormField>
                <FormField label="Nationality">
                    <select name="nationality" value={form.nationalityCode} onChange={update} disabled={loadingDropdowns || submitting} className="form-input">
                        {renderDefaultOption()}
                        {dropdownOptions.nationality.map(option => (
                            <option key={option.code} value={option.code}>{option.description}</option>
                        ))}
                    </select>
                </FormField>
            </div>
            
            <div className="grid">
                <FormField label="Country of Origin" fullWidth>
                    <select name="countryOfOrigin" value={form.countryOfOriginCode} onChange={update} disabled={loadingDropdowns || submitting} className="form-input">
                        {renderDefaultOption()}
                        {dropdownOptions.countryOfOrigin.map(option => (
                            <option key={option.code} value={option.code}>{option.description}</option>
                        ))}
                    </select>
                </FormField>
            </div>
        </>
    );

    const renderOtherInfo = () => (
        <>
            <h3>Other Information</h3>
            <div className="grid">
                <FormField label="Recommendation Type" fullWidth>
                    <select name="recommendationType" value={form.recommendationType} onChange={update} disabled={submitting} className="form-input">
                        <option value="">Select</option> 
                        {RECOMMENDATION_TYPE_OPTIONS.map(option => (
                            <option key={option.code} value={option.code}>{option.description}</option>
                        ))}
                    </select>
                </FormField>
            </div>
            
            {form.recommendationType && form.recommendationType !== '' && (
                <div className="grid">
                    <FormField label="Recommendation Detail" fullWidth>
                        <input name="recommendationDetails" value={form.recommendationDetails} onChange={update} placeholder={`Specify details...`} className="form-input"/>
                    </FormField>
                </div>
            )}

            <h3>Disability Information</h3>
            <div className="grid">
                <FormField label="Disability" fullWidth>
                    <input name="disability" value={form.disability} onChange={update} placeholder="Describe any disabilities" className="form-input" />
                </FormField>
            </div>
            
            <h3>References</h3>
            <div className="grid">
                <FormField label="Referee 1">
                    <input name="referee1" value={form.referee1} onChange={update} placeholder="Name of Referee 1" className="form-input" />
                </FormField>
                <FormField label="Referee 2">
                    <input name="referee2" value={form.referee2} onChange={update} placeholder="Name of Referee 2" className="form-input" />
                </FormField>
            </div>
        </>
    );

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">{fetchingData ? 'Loading Profile...' : 'Candidate Onboarding'}</h2>
                <p className="card-subtitle">{fetchingData ? 'Retrieving information.' : 'Manage your candidate details.'}</p>
            </div>
            
            {fetchingData && <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading data...</div>}

            <form onSubmit={handleSubmit} style={{ opacity: fetchingData ? 0.5 : 1, pointerEvents: fetchingData ? 'none' : 'auto' }}>
                <div className="form-content-area">
                    <div className="form-section">{renderCandidateInfo()}</div>
                    <hr style={{margin: '20px 0', border: '0', borderTop: '1px solid #f3f4f6'}} />
                    <div className="form-section">{renderDemographics()}</div>
                    <hr style={{margin: '20px 0', border: '0', borderTop: '1px solid #f3f4f6'}} />
                    <div className="form-section">{renderOtherInfo()}</div>
                </div>

                <div className="form-actions">
                    {isSaved ? (
                        <>
                            <button type="submit" className="btn btn-secondary" disabled={submitting} style={{ marginRight: '10px' }}>
                                {submitting ? 'Updating...' : 'Update Information'}
                            </button>
                            <button type="button" onClick={handleNext} className="btn btn-primary">
                                Next: Contact Information &rarr;
                            </button>
                        </>
                    ) : (
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Saving...' : 'Save Candidate'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default PersonalForm;