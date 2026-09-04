// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import './brand.css';
import LoginPage          from './components/login';
import RegistrationPage   from './components/registration';
import ApproveJoinPage    from './components/ApproveJoinPage';
import './App.css';
import SubscriptionPage   from './components/subscription/SubscriptionPage';
import ContactForm        from "./components/subscription/ContactForm";
import ForgotPasswordPage from './components/ForgotPassword';
import ResetPasswordPage  from './components/ResetPassword';
import PaymentResultPage  from './components/subscription/PaymentResultPage';
import WelcomePage        from './components/WelcomePage';   // NEW

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('userApiKey'));
  const [username,        setUsername]        = useState(localStorage.getItem('username') || '');

  useEffect(() => {
    const handleStorageChange = () => {
      const key            = localStorage.getItem('userApiKey');
      const storedUsername = localStorage.getItem('username');
      setIsAuthenticated(!!key);
      setUsername(storedUsername || '');
    };
    window.addEventListener('storage', handleStorageChange);
    handleStorageChange();
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLoginSuccess = (apiKey, userData) => {
    localStorage.setItem('userApiKey', apiKey);
    localStorage.setItem('username',   userData.username);
    localStorage.setItem('email',      userData.email);
    setIsAuthenticated(true);
    setUsername(userData.username);
  };

  const handleLogout = (navigateFunc) => {
    localStorage.removeItem('userApiKey');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
    navigateFunc('/login');
  };

  const Logout = () => {
    const navigate = useNavigate();
    useEffect(() => { handleLogout(navigate); }, [navigate]);
    return <div>Logging out...</div>;
  };

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
  };

  const LoginWithRedirect = () => {
    const location = useLocation();
    const navigate = useNavigate();

    if (isAuthenticated) {
      const params         = new URLSearchParams(location.search);
      const redirectTarget = params.get('redirect');
      if (redirectTarget) return <Navigate to={decodeURIComponent(redirectTarget)} replace />;
      return <Navigate to="/" replace />;
    }

    return (
      <LoginPage
        onLoginSuccess={(apiKey, userData) => {
          handleLoginSuccess(apiKey, userData);
          const params         = new URLSearchParams(location.search);
          const redirectTarget = params.get('redirect');
          navigate(redirectTarget ? decodeURIComponent(redirectTarget) : '/welcome');
        }}
      />
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/login"           element={<LoginWithRedirect />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/logout"          element={<Logout />} />
        <Route path="/welcome"         element={<WelcomePage />} />  {/* PUBLIC — after registration */}
        <Route path="/register"        element={isAuthenticated ? <Navigate to="/" replace /> : <RegistrationPage />} />
        <Route path="/approve-join"    element={<ApproveJoinPage />} />

        <Route path="/" element={<ProtectedRoute><Navigate to="/welcome" replace /></ProtectedRoute>} />

        <Route path="/subscribe"      element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
        <Route path="/payment-result" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
        <Route path="/contact"        element={<ProtectedRoute><ContactForm /></ProtectedRoute>} />

        <Route path="*" element={isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;