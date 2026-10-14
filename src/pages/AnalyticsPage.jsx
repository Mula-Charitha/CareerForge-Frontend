import React, { useState, useEffect } from 'react';
import { getAnalyticsOverview } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import './AnalyticsPage.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await getAnalyticsOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load performance analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Crunching your placement performance data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="analytics-error">
        <p>{error || 'No analytics data available.'}</p>
        <button onClick={fetchAnalytics} className="btn-retry">Retry</button>
      </div>
    );
  }

  // Dimension Scores Bar Data
  const dimensionChartData = data.categoryScores
    ? Object.entries(data.categoryScores).map(([key, value]) => ({
        name: key.replace(' Problem Solving', '').replace(' Accuracy', '').replace(' Readiness', ''),
        score: value,
      }))
    : [];

  // Job Pipeline Funnel Data
  const pipelineData = data.applications
    ? [
        { name: 'Applied', value: data.applications.appliedCount, color: '#6366f1' },
        { name: 'Online Assessment', value: data.applications.onlineAssessmentCount, color: '#f59e0b' },
        { name: 'Interview', value: data.applications.interviewCount, color: '#8b5cf6' },
        { name: 'Offer', value: data.applications.offerCount, color: '#10b981' },
      ].filter((item) => item.value > 0)
    : [];

  // Readiness tier and color
  const readiness = data.readinessScore || 0;
  let readinessTier = 'Needs Focus';
  let tierColor = '#ef4444';
  if (readiness >= 80) {
    readinessTier = 'Interview Ready (Elite)';
    tierColor = '#10b981';
  } else if (readiness >= 60) {
    readinessTier = 'Good Progress (Competitive)';
    tierColor = '#3b82f6';
  } else if (readiness >= 40) {
    readinessTier = 'Developing Foundation';
    tierColor = '#f59e0b';
  }

  return (
    <div className="analytics-page-container">
      {/* Header */}
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Placement Readiness & Performance</h1>
          <p className="page-subtitle">
            Holistic multidimensional evaluation of your DSA, aptitude, resume, certifications, and interview preparation.
          </p>
        </div>
        <button className="btn-refresh-analytics" onClick={fetchAnalytics}>
          🔄 Refresh Analytics
        </button>
      </div>

      {/* Hero: Overall Placement Readiness Score */}
      <div className="readiness-hero-card">
        <div className="readiness-hero-content">
          <div className="readiness-gauge-circle" style={{ borderColor: tierColor }}>
            <span className="gauge-score">{Math.round(readiness)}%</span>
            <span className="gauge-sub">Readiness</span>
          </div>
          <div className="readiness-hero-text">
            <span className="tier-badge" style={{ backgroundColor: `${tierColor}20`, color: tierColor }}>
              {readinessTier}
            </span>
            <h2>Placement Preparation Index</h2>
            <p>
              Your score is computed across 6 weighted core competencies: DSA (25%), Aptitude (20%),
              Resume (15%), Mock Interviews (15%), Certifications (15%), and Job Applications (10%).
            </p>
          </div>
        </div>

        {/* Actionable Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="recommendations-box">
            <h4>💡 High-Priority Placement Action Items:</h4>
            <ul>
              {data.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Competency Dimension Scores Chart */}
      <div className="analytics-card chart-card">
        <h3>📊 Competency Scores by Domain (0 - 100%)</h3>
        <p className="chart-subtitle">Relative strength across all placement preparation pillars.</p>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dimensionChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ color: '#ffffff' }}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {dimensionChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6 Dimension Deep-Dive Grid */}
      <div className="metrics-summary-grid">
        {/* 1. DSA */}
        <div className="dimension-card">
          <div className="dim-header">
            <span className="dim-icon">💻</span>
            <h4>DSA Problem Solving</h4>
          </div>
          <div className="dim-main-stat">
            <span className="dim-num">{data.dsa?.solved || 0}</span>
            <span className="dim-sub">/ {data.dsa?.total || 0} Solved</span>
          </div>
          <div className="difficulty-pills">
            <span className="diff-pill easy">Easy: {data.dsa?.easySolved || 0}</span>
            <span className="diff-pill medium">Med: {data.dsa?.mediumSolved || 0}</span>
            <span className="diff-pill hard">Hard: {data.dsa?.hardSolved || 0}</span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill fill-blue"
              style={{ width: `${Math.min(100, data.dsa?.completionRate || 0)}%` }}
            ></div>
          </div>
          <div className="dim-footer-text">{data.dsa?.completionRate || 0}% problem catalog solved</div>
        </div>

        {/* 2. Aptitude */}
        <div className="dimension-card">
          <div className="dim-header">
            <span className="dim-icon">🧠</span>
            <h4>Aptitude & Reasoning</h4>
          </div>
          <div className="dim-main-stat">
            <span className="dim-num">{data.aptitude?.accuracyPercentage || 0}%</span>
            <span className="dim-sub">Accuracy</span>
          </div>
          <div className="dim-stats-row">
            <div>
              <strong>{data.aptitude?.questionsAttempted || 0}</strong>
              <span>Attempted</span>
            </div>
            <div>
              <strong>{data.aptitude?.correctAnswers || 0}</strong>
              <span>Correct</span>
            </div>
            <div>
              <strong>{data.aptitude?.sessionsCompleted || 0}</strong>
              <span>Tests</span>
            </div>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill fill-green"
              style={{ width: `${Math.min(100, data.aptitude?.accuracyPercentage || 0)}%` }}
            ></div>
          </div>
          <div className="dim-footer-text">Quantitative & Logical tests completed</div>
        </div>

        {/* 3. Resume */}
        <div className="dimension-card">
          <div className="dim-header">
            <span className="dim-icon">📄</span>
            <h4>Resume Readiness</h4>
          </div>
          <div className="dim-main-stat">
            <span className="dim-num">{data.resume?.totalResumes || 0}</span>
            <span className="dim-sub">Resumes</span>
          </div>
          <div className="resume-status-badge">
            {data.resume?.hasPrimary ? (
              <span className="badge-primary-active">✓ Primary: {data.resume?.primaryResumeName}</span>
            ) : (
              <span className="badge-primary-missing">⚠️ No Primary Resume Selected</span>
            )}
          </div>
          <div className="dim-footer-text">
            {data.resume?.hasPrimary ? 'Ready for fast-track job applications' : 'Mark a primary resume for auto-apply'}
          </div>
        </div>

        {/* 4. Certifications */}
        <div className="dimension-card">
          <div className="dim-header">
            <span className="dim-icon">📜</span>
            <h4>Certifications</h4>
          </div>
          <div className="dim-main-stat">
            <span className="dim-num">{data.certifications?.totalCertifications || 0}</span>
            <span className="dim-sub">Verified</span>
          </div>
          <div className="cert-note">
            Industry cloud, developer, and data credentials substantiate your hands-on competencies.
          </div>
          <div className="dim-footer-text">
            {data.certifications?.totalCertifications > 0
              ? 'Certificates on record'
              : 'Add AWS, Java, or React certifications'}
          </div>
        </div>

        {/* 5. Job Applications */}
        <div className="dimension-card">
          <div className="dim-header">
            <span className="dim-icon">💼</span>
            <h4>Job Applications</h4>
          </div>
          <div className="dim-main-stat">
            <span className="dim-num">{data.applications?.totalApplications || 0}</span>
            <span className="dim-sub">Applications</span>
          </div>
          <div className="pipeline-mini-flow">
            <span>📝 {data.applications?.appliedCount || 0} Applied</span>
            <span>💬 {data.applications?.interviewCount || 0} Interview</span>
            <span>🎉 {data.applications?.offerCount || 0} Offers</span>
          </div>
          <div className="dim-footer-text">
            Offer Conversion Rate: <strong>{data.applications?.offerRate || 0}%</strong>
          </div>
        </div>

        {/* 6. Mock Interviews */}
        <div className="dimension-card">
          <div className="dim-header">
            <span className="dim-icon">🎙️</span>
            <h4>Mock Interviews</h4>
          </div>
          <div className="dim-main-stat">
            <span className="dim-num">
              {data.mockInterviews?.averageRating > 0 ? `${data.mockInterviews?.averageRating}/10` : 'N/A'}
            </span>
            <span className="dim-sub">Avg Rating</span>
          </div>
          <div className="interview-note">
            <strong>{data.mockInterviews?.completedCount || 0}</strong> completed interview rounds with
            interviewer notes & feedback recorded.
          </div>
          <div className="dim-footer-text">
            {data.mockInterviews?.completedCount > 0
              ? 'Communication rehearsed'
              : 'Practice timed questions in Mock Drills'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
