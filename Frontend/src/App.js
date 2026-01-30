// fileName: App.js

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";

// Pages
import PersonalForm from "./pages/PersonalForm"; 
import EmployeeList from "./pages/EmployeeList/EmployeeList";
import ContactForm from "./pages/ContactForm"; 
import QualificationForm from "./pages/QualificationForm"; 
import EmploymentHistoryForm from "./pages/EmploymentHistoryForm"; 
import SkillForm from "./pages/SkillForm"; 
import HobbyLanguageForm from "./pages/HobbyLanguageForm";
import ResumeForm from "./pages/ResumeForm"; 
import ReviewPage from './pages/ReviewPage';
import FieldExp from "./pages/FieldExp"; 
import ThanksPage from './pages/ThanksPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import LoginAdmin from './pages/LoginAdmin'; 
import AdminUpdate from './pages/AdminUpdate';
import ChangePassword from './pages/ChangePassword';
import CreateAdminPage from './pages/CreateAdminPage'; 
import AdminList from './pages/AdminList'; 
import CreateCompany from './pages/CreateCompany';
import CompanyUpdate from './pages/CompanyUpdate'; 
import ForgotPasswordPage from './pages/ForgotPasswordPage';

import "./styles/App.css";

// --- 1. Define Navigation Groups ---

// Links accessible when not logged in
const publicNavItems = [
    { id: "login", label: "Candidate Login", to: "/login" },
    { id: "admin-login", label: "Admin Login", to: "/admin-login" }, 
    { id: "signup", label: "Sign Up", to: "/signup" },
];

// Links for Admin Dashboard
const adminNavItems = [
    { id: "employees", label: "Candidate Directory", to: "/employees" },
    { id: "admin-update", label: "Admin Update", to: "/admin-update" },
    { id: "logout", label: "Logout", to: "/login", isLogout: true }
];

// Links for SUPER ADMIN
const superAdminNavItems = [
    { id: "create-company", label: "Create Company", to: "/create-company" }, 
    { id: "company-update", label: "Update Company", to: "/company-update" },
    { id: "admin-list", label: "Manage Admins", to: "/admin-list" }, 
    { id: "create-admin", label: "Create Admin", to: "/create-admin" }, 
    { id: "logout", label: "Logout", to: "/login", isLogout: true }
];

// Links for Candidate Dashboard
const candidateNavItems = [
    { id: "new-employee", label: "Personal Information", to: "/employees/new" }, 
    { id: "contact", label: "Contact", to: "/contact" }, 
    { id: "qualification", label: "Qualification", to: "/qualification" }, 
    { id: "employment", label: "Employment History", to: "/employment" }, 
    { id: "skills", label: "Skills", to: "/skills" }, 
    { id: "hobby-language", label: "Hobby & Language", to: "/hobby-language" },
    { id: "field-experience", label: "Field Experience", to: "/field-experience" },
    { id: "resume", label: "Resume Upload", to: "/resume" }, 
    { id: "logout", label: "Logout", to: "/login", isLogout: true }
];

// --- 2. Protected Route Component ---
const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem("authToken");
    const userRole = localStorage.getItem("userRole");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        if (userRole === 'admin' || userRole === 'superadmin') {
            return <Navigate to="/employees" replace />;
        } else {
            return <Navigate to="/employees/new" replace />;
        }
    }

    return children;
};

const App = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [currentNavItems, setCurrentNavItems] = useState(publicNavItems);
    
    const location = useLocation();
    const navigate = useNavigate();

    // --- Logic to Determine Sidebar Visibility ---
    const userRole = localStorage.getItem("userRole");
    const companyId = localStorage.getItem("companyId");
    
    const isStandardAuthPage = ['/login', '/admin-login', '/signup', '/forgot-password'].includes(location.pathname);
    const isAdminChangePassword = location.pathname === '/change-password' && (userRole === 'admin' || userRole === 'superadmin');
    const shouldHideSidebar = isStandardAuthPage || isAdminChangePassword;

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // --- 3. Dynamic Navigation Logic ---
    useEffect(() => {
        const role = localStorage.getItem("userRole");
        
        if (role === "superadmin") {
            setCurrentNavItems(superAdminNavItems); 
        } else if (role === "admin") {
            setCurrentNavItems(adminNavItems);
        } else if (role === "candidate") {
            setCurrentNavItems(candidateNavItems);
        } else {
            setCurrentNavItems(publicNavItems);
        }
    }, [location.pathname]); 

    // --- 4. THEME ENGINE ---
    useEffect(() => {
        const applyTheme = async () => {
            const defaultColor = '#7c3aed'; 
            if (!companyId) {
                document.documentElement.style.setProperty('--theme-primary', defaultColor);
                document.documentElement.style.setProperty('--theme-secondary', '#6366f1');
                return;
            }

            try {
                const response = await fetch(`/api/company/${companyId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.colourCode) {
                        document.documentElement.style.setProperty('--theme-primary', data.colourCode);
                        document.documentElement.style.setProperty('--theme-secondary', data.colourCode);
                    } else {
                        document.documentElement.style.setProperty('--theme-primary', defaultColor);
                        document.documentElement.style.setProperty('--theme-secondary', '#6366f1');
                    }
                }
            } catch (error) {
                console.error("Failed to load theme:", error);
                document.documentElement.style.setProperty('--theme-primary', defaultColor);
                document.documentElement.style.setProperty('--theme-secondary', '#6366f1');
            }
        };

        applyTheme();
    }, [companyId]); 


    const handleNavClick = (item) => {
        if (item.isLogout) {
            const role = localStorage.getItem("userRole");
            localStorage.clear(); 
            document.documentElement.style.removeProperty('--theme-primary');
            document.documentElement.style.removeProperty('--theme-secondary');

            if (role === "admin" || role === "superadmin") {
                navigate("/admin-login");
            } else {
                navigate("/login");
            }
        }
    };

    return (
        <div className="app-container">
            {/* Sidebar is HIDDEN if shouldHideSidebar is true */}
            {!shouldHideSidebar && (
                <Sidebar 
                    isOpen={isSidebarOpen} 
                    toggleSidebar={toggleSidebar} 
                    navItems={currentNavItems}
                    onNavClick={handleNavClick} 
                />
            )}
            
            <div 
                className={`content-wrapper ${!shouldHideSidebar && isSidebarOpen ? 'sidebar-open' : ''}`}
                style={shouldHideSidebar ? { marginLeft: 0 } : {}}
            >
                {/* ✅ CHANGED: Pass isSidebarOpen to Header */}
                <Header 
                    toggleSidebar={toggleSidebar} 
                    isSidebarOpen={isSidebarOpen} 
                />
                
                <main className="main-content py-6">
                    <div className="container mx-auto px-4">
                        <Routes>
                            {/* --- PUBLIC ROUTES --- */}
                            <Route path="/" element={<Navigate to="/login" replace />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/admin-login" element={<LoginAdmin />} />
                            <Route path="/signup" element={<SignUpPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            
                            {/* --- SUPER ADMIN --- */}
                            <Route path="/create-company" element={
                                <ProtectedRoute allowedRoles={['superadmin']}>
                                    <CreateCompany />
                                </ProtectedRoute>
                            } /> 
                            <Route path="/company-update" element={
                                <ProtectedRoute allowedRoles={['superadmin']}>
                                    <CompanyUpdate />
                                </ProtectedRoute>
                            } /> 
                            <Route path="/admin-list" element={
                                <ProtectedRoute allowedRoles={['superadmin']}>
                                    <AdminList />
                                </ProtectedRoute>
                            } />
                            <Route path="/create-admin" element={
                                <ProtectedRoute allowedRoles={['superadmin']}>
                                    <CreateAdminPage />
                                </ProtectedRoute>
                            } />

                            {/* --- ADMIN & SUPER ADMIN --- */}
                            <Route path="/employees" element={
                                <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                                    <EmployeeList />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin-update" element={
                                <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                                    <AdminUpdate />
                                </ProtectedRoute>
                            } />
                            
                            {/* --- SHARED --- */}
                            <Route path="/change-password" element={
                                <ProtectedRoute allowedRoles={['candidate', 'admin', 'superadmin']}>
                                    <ChangePassword />
                                </ProtectedRoute>
                            } />
                            
                            {/* --- CANDIDATE ONLY --- */}
                            <Route path="/employees/new" element={
                                <ProtectedRoute allowedRoles={['candidate']}>
                                    <PersonalForm />
                                </ProtectedRoute>
                            } />
                            <Route path="/contact" element={
                                <ProtectedRoute allowedRoles={['candidate']}>
                                    <ContactForm />
                                </ProtectedRoute>
                            } />
                            <Route path="/qualification" element={
                                <ProtectedRoute allowedRoles={['candidate']}>
                                    <QualificationForm />
                                </ProtectedRoute>
                            } /> 
                            <Route path="/employment" element={
                                <ProtectedRoute allowedRoles={['candidate']}>
                                    <EmploymentHistoryForm />
                                </ProtectedRoute>
                            } />
                            <Route path="/skills" element={
                                <ProtectedRoute allowedRoles={['candidate']}>
                                    <SkillForm />
                                </ProtectedRoute>
                            } /> 
                            <Route path="/hobby-language" element={
                                <ProtectedRoute allowedRoles={['candidate']}>
                                    <HobbyLanguageForm />
                                </ProtectedRoute>
                            } /> 
                            <Route path="/resume" element={
                                <ProtectedRoute allowedRoles={['candidate']}>
                                    <ResumeForm />
                                </ProtectedRoute>
                            } />
                            <Route path="/field-experience" element={
                                <ProtectedRoute allowedRoles={['candidate']}>
                                    <FieldExp />
                                </ProtectedRoute>
                            } />
                            <Route path="/review" element={
                                <ProtectedRoute allowedRoles={['candidate']}>
                                    <ReviewPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/thanks" element={
                                <ProtectedRoute allowedRoles={['candidate']}>
                                    <ThanksPage />
                                </ProtectedRoute>
                            } />

                        </Routes>
                    </div>
                </main>
            </div>
            <Toaster position="bottom-right" />
        </div>
    );
}

export default App;