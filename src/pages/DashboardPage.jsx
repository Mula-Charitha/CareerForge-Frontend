import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getProfileCompletion,
  getDsaStatistics,
  getAptitudeStatistics,
  getResumeStats,
  getCertificationStats,
  getJobApplicationStats,
  getMockInterviewStats,
} from '../services/api';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const [profileCompletion, setProfileCompletion] = useState({
    completionPercentage: 0,
    completedFieldsCount: 0,
    totalFieldsCount: 10,
    missingFields: [],
  });

  const [dsaStats, setDsaStats] = useState({
    solvedProblems: 0,
    totalProblems: 0,
    overallProgress: 0,
  });

  const [aptitudeStats, setAptitudeStats] = useState({
    totalQuestionsAttempted: 0,
    totalCorrectAnswers: 0,
    overallAccuracyPercentage: 0,
    completedSessions: 0,
  });

  const [resumeStats, setResumeStats] = useState({
    totalResumes: 0,
    hasPrimary: false,
    primaryResumeName: null,
    totalVersions: 0,
  });

  const [certStats, setCertStats] = useState({
    totalCertifications: 0,
  });

  const [jobStats, setJobStats] = useState({
    totalApplications: 0,
    appliedCount: 0,
    onlineAssessmentCount: 0,
    interviewCount: 0,
    offerCount: 0,
  });

  const [interviewStats, setInterviewStats] = useState({
    totalInterviews: 0,
    completedCount: 0,
    scheduledCount: 0,
    averageRating: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profComp, dsaData, aptData, resData, certData, jobData, interviewData] = await Promise.all([
          getProfileCompletion(),
          getDsaStatistics(),
          getAptitudeStatistics().catch(() => null),
          getResumeStats().catch(() => null),
          getCertificationStats().catch(() => null),
          getJobApplicationStats().catch(() => null),
          getMockInterviewStats().catch(() => null),
        ]);
        if (profComp) setProfileCompletion(profComp);
        if (dsaData) setDsaStats(dsaData);
        if (aptData) setAptitudeStats(aptData);
        if (resData) setResumeStats(resData);
        if (certData) setCertStats(certData);
        if (jobData) setJobStats(jobData);
        if (interviewData) setInterviewStats(interviewData);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const overallReadinessScore = Math.round(
    profileCompletion.completionPercentage * 0.2 +
    dsaStats.overallProgress * 0.4 +
    (aptitudeStats.totalQuestionsAttempted > 0 ? (aptitudeStats.overallAccuracyPercentage * 0.4) : 0)
  );

  return (
    <div className="dashboard-page-container">
      <div className="dashboard-hero">
        <div className="hero-text">
          <h2>Welcome back, <span className="highlight-name">{user?.fullName || 'Student'}</span>! 👋</h2>
          <p>Track your placement preparation roadmap, DSA problem solving, resumes, and campus opportunities.</p>
        </div>
        <Link to="/dsa" className="btn btn-primary hero-btn">
          ⚡ Practice DSA Problems
        </Link>
      </div>

      <div className="dashboard-cards-grid">
        {/* 1. Overall Preparation Card */}
        <div className="dashboard-card main-metric-card">
          <div className="card-header-flex">
            <span className="card-icon">🎯</span>
            <span className="card-badge active-badge">Live Metric</span>
          </div>
          <h3>Overall Preparation</h3>
          <div className="metric-large">
            <span className="metric-value">{overallReadinessScore}%</span>
            <span className="metric-sublabel">Placement Readiness</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-fill" style={{ width: `${overallReadinessScore}%` }}></div>
          </div>
          <p className="card-footnote">Calculated live from profile completion & DSA progress.</p>
        </div>

        {/* 2. Real Profile Completion Card */}
        <div className="dashboard-card profile-metric-card">
          <div className="card-header-flex">
            <span className="card-icon">👤</span>
            <span className="card-badge active-badge">Live API Data</span>
          </div>
          <h3>Profile Completion</h3>
          <div className="metric-large">
            <span className="metric-value">{profileCompletion.completionPercentage}%</span>
            <span className="metric-sublabel">
              {profileCompletion.completedFieldsCount} / {profileCompletion.totalFieldsCount} Fields Complete
            </span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-fill primary-fill"
              style={{ width: `${profileCompletion.completionPercentage}%` }}
            ></div>
          </div>
          <Link to="/profile" className="card-action-link">
            {profileCompletion.completionPercentage < 100 ? 'Fix missing profile details →' : 'View Student Profile →'}
          </Link>
        </div>

        {/* 3. DSA Progress (Connected to Live API) */}
        <div className="dashboard-card main-metric-card">
          <div className="card-header-flex">
            <span className="card-icon">⚡</span>
            <span className="card-badge active-badge">Live API Data</span>
          </div>
          <h3>DSA Progress</h3>
          <div className="metric-large">
            <span className="metric-value">
              {dsaStats.solvedProblems} <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>/ {dsaStats.totalProblems}</span>
            </span>
            <span className="metric-sublabel">{dsaStats.overallProgress}% Solved</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-fill" style={{ width: `${dsaStats.overallProgress}%` }}></div>
          </div>
          <Link to="/dsa" className="card-action-link">
            Open DSA Tracker →
          </Link>
        </div>

        {/* 4. Aptitude Progress (Connected to Live API) */}
        <div className="dashboard-card main-metric-card">
          <div className="card-header-flex">
            <span className="card-icon">📐</span>
            <span className="card-badge active-badge">Live API Data</span>
          </div>
          <h3>Aptitude Progress</h3>
          <div className="metric-large">
            <span className="metric-value">
              {aptitudeStats.totalQuestionsAttempted} <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Attempted</span>
            </span>
            <span className="metric-sublabel">{aptitudeStats.overallAccuracyPercentage}% Accuracy</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(aptitudeStats.overallAccuracyPercentage, 100)}%` }}
            ></div>
          </div>
          <Link to="/aptitude" className="card-action-link">
            Open Aptitude Tracker →
          </Link>
        </div>

        {/* 5. Resume Status (Live Module) */}
        <div className="dashboard-card live-card">
          <div className="card-header-flex">
            <span className="card-icon">📄</span>
            <span
              className={`card-badge ${
                resumeStats.hasPrimary
                  ? 'ready-badge'
                  : resumeStats.totalResumes > 0
                  ? 'in-progress-badge'
                  : 'coming-soon-badge'
              }`}
            >
              {resumeStats.hasPrimary
                ? 'Active'
                : resumeStats.totalResumes > 0
                ? 'Uploaded'
                : 'Action Needed'}
            </span>
          </div>
          <h3>Resume Status</h3>
          <div className="metric-large">
            <span className="metric-value">
              {resumeStats.totalResumes}{' '}
              <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                {resumeStats.totalResumes === 1 ? 'Resume' : 'Resumes'}
              </span>
            </span>
            <span className="metric-sublabel" style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {resumeStats.hasPrimary && resumeStats.primaryResumeName
                ? `★ ${resumeStats.primaryResumeName}`
                : resumeStats.totalResumes > 0
                ? 'No primary resume set'
                : 'No resume uploaded yet'}
            </span>
          </div>
          <p className="card-subtext" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0 1rem' }}>
            {resumeStats.totalVersions > 0
              ? `${resumeStats.totalVersions} version(s) tracked with file history.`
              : 'Upload and manage multiple resume versions.'}
          </p>
          <Link to="/resume" className="card-action-link">
            Manage Resumes →
          </Link>
        </div>

        {/* 6. Certifications (Live Module) */}
        <div className="dashboard-card live-card">
          <div className="card-header-flex">
            <span className="card-icon">📜</span>
            <span
              className={`card-badge ${
                certStats.totalCertifications > 0 ? 'ready-badge' : 'coming-soon-badge'
              }`}
            >
              {certStats.totalCertifications > 0 ? 'Verified' : 'Get Started'}
            </span>
          </div>
          <h3>Certifications</h3>
          <div className="metric-large">
            <span className="metric-value">
              {certStats.totalCertifications}{' '}
              <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                {certStats.totalCertifications === 1 ? 'Credential' : 'Credentials'}
              </span>
            </span>
            <span className="metric-sublabel">
              {certStats.totalCertifications > 0
                ? 'Documented & Verified'
                : 'No certificates added'}
            </span>
          </div>
          <p className="card-subtext" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0 1rem' }}>
            {certStats.totalCertifications > 0
              ? 'Licenses, course completions, and cloud badges.'
              : 'Add AWS, Google, or Coursera credentials to boost profile.'}
          </p>
          <Link to="/certifications" className="card-action-link">
            Manage Credentials →
          </Link>
        </div>

        {/* 7. Job Applications (Live Module) */}
        <div className="dashboard-card live-card">
          <div className="card-header-flex">
            <span className="card-icon">💼</span>
            <span
              className={`card-badge ${
                jobStats.totalApplications > 0 ? 'ready-badge' : 'coming-soon-badge'
              }`}
            >
              {jobStats.totalApplications > 0 ? `${jobStats.interviewCount} Interviews` : 'Active'}
            </span>
          </div>
          <h3>Job Applications</h3>
          <div className="metric-large">
            <span className="metric-value">
              {jobStats.totalApplications}{' '}
              <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                {jobStats.totalApplications === 1 ? 'Application' : 'Applications'}
              </span>
            </span>
            <span className="metric-sublabel">
              {jobStats.totalApplications > 0
                ? `${jobStats.offerCount} Offers, ${jobStats.interviewCount} Interview rounds`
                : 'No applications tracked yet'}
            </span>
          </div>
          <p className="card-subtext" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0 1rem' }}>
            {jobStats.totalApplications > 0
              ? 'Campus hiring drives, referrals & deadlines.'
              : 'Track applications from submission to final offer.'}
          </p>
          <Link to="/jobs" className="card-action-link">
            Track Applications →
          </Link>
        </div>

        {/* 8. Mock Interviews (Live Module) */}
        <div className="dashboard-card live-card">
          <div className="card-header-flex">
            <span className="card-icon">🎙️</span>
            <span
              className={`card-badge ${
                interviewStats.completedCount > 0 ? 'ready-badge' : 'coming-soon-badge'
              }`}
            >
              {interviewStats.averageRating > 0
                ? `⭐ ${interviewStats.averageRating}/10 Avg`
                : 'Interactive'}
            </span>
          </div>
          <h3>Mock Interviews</h3>
          <div className="metric-large">
            <span className="metric-value">
              {interviewStats.completedCount}{' '}
              <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                {interviewStats.completedCount === 1 ? 'Completed' : 'Completed'}
              </span>
            </span>
            <span className="metric-sublabel">
              {interviewStats.scheduledCount > 0
                ? `${interviewStats.scheduledCount} Scheduled Upcoming`
                : interviewStats.completedCount > 0
                ? 'Technical, HR & System Design'
                : 'No interviews logged yet'}
            </span>
          </div>
          <p className="card-subtext" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0 1rem' }}>
            {interviewStats.completedCount > 0
              ? 'Drills, peer feedback, and communication rehearsal.'
              : 'Practice timed prompts and log peer feedback.'}
          </p>
          <Link to="/interviews" className="card-action-link">
            Practice & Schedule →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
