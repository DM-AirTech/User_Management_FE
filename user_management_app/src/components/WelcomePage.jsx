// src/components/WelcomePage.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import './WelcomePage.css';

const WelcomePage = () => {
  const location = useLocation();
  const isPending = location.state?.pending === true;

  const apiKey   = localStorage.getItem('userApiKey') || '';
  const username = localStorage.getItem('username')   || '';

  const go = (url) => { window.location.href = url; };

  if (isPending) {
    return (
      <div className="wp-page">
        <div className="wp-topbar">
          <div className="wp-logobox">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="wp-brandname">DM AirTech</span>
        </div>

        <div className="wp-pending">
          <div className="wp-pending-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <p className="wp-pending-title">Almost there</p>
          <p className="wp-pending-desc">
            Your account request has been sent to your organisation's admin.
            You'll get an email as soon as it's approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wp-page">
      <div className="wp-topbar">
        <div className="wp-logobox">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span className="wp-brandname">DM AirTech</span>
      </div>

      <p className="wp-welcome">
        Welcome{username ? `, ${username}` : ''} — choose your workspace to get started
      </p>

      <div className="wp-grid">
        {/* ...unchanged: VertiMonitor / VertiPlace / WeTwin cards... */}
      </div>

      <p className="wp-signout">
        Signed in to your DM-AirTech account &nbsp;·&nbsp;
        <a href="/login" onClick={(e) => {
          e.preventDefault();
          localStorage.removeItem('userApiKey');
          localStorage.removeItem('username');
          localStorage.removeItem('email');
          window.location.href = '/login';
        }}>Sign out</a>
      </p>
    </div>
  );
};

export default WelcomePage;