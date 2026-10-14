import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './ComingSoonPage.css';

const ComingSoonPage = () => {
  const location = useLocation();

  const moduleInfo = {
    '/dsa': {
      title: 'DSA Preparation Module',
      icon: '⚡',
      description: 'Track topic-wise Data Structures & Algorithms problem solving progress, LeetCode sync, and revision lists.',
    },
    '/aptitude': {
      title: 'Aptitude Practice Module',
      icon: '📐',
      description: 'Practice quantitative aptitude, logical reasoning, and verbal ability tests with instant feedback.',
    },
    '/resume': {
      title: 'Resume Management',
      icon: '📄',
      description: 'Build ATS-friendly resumes, store multiple versions, and analyze resume match scores for jobs.',
    },
    '/certifications': {
      title: 'Certifications & Badges',
      icon: '📜',
      description: 'Store course certificates, verified skill badges, and showcase achievements on your student profile.',
    },
    '/jobs': {
      title: 'Job Applications Tracker',
      icon: '💼',
      description: 'Track ongoing campus placements, company application deadlines, interview rounds, and offer status.',
    },
    '/interviews': {
      title: 'Mock Interviews',
      icon: '🎙️',
      description: 'Schedule peer-to-peer and AI-driven technical mock interviews with detailed feedback reports.',
    },
    '/analytics': {
      title: 'Performance Analytics',
      icon: '📈',
      description: 'Visualize preparation growth charts, weakness breakdown, speed metrics, and peer comparisons.',
    },
    '/ai-assistant': {
      title: 'AI Career Assistant',
      icon: '🤖',
      description: 'Get personalized study roadmap recommendations, interview tips, and AI resume review.',
    },
  };

  const currentModule = moduleInfo[location.pathname] || {
    title: 'Module Under Development',
    icon: '🚀',
    description: 'This placement preparation feature is currently being developed.',
  };

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-card">
        <div className="module-icon-wrapper">{currentModule.icon}</div>
        <h2>{currentModule.title}</h2>
        <span className="coming-soon-badge">Coming Soon</span>
        <p className="module-description">{currentModule.description}</p>
        <div className="coming-soon-actions">
          <Link to="/dashboard" className="btn btn-primary">
            Return to Dashboard
          </Link>
          <Link to="/profile" className="btn btn-secondary">
            Update Student Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
