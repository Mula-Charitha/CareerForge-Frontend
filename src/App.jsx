import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import DsaPage from './pages/DsaPage';
import AptitudePage from './pages/AptitudePage';
import ResumePage from './pages/ResumePage';
import CertificationsPage from './pages/CertificationsPage';
import JobApplicationsPage from './pages/JobApplicationsPage';
import MockInterviewsPage from './pages/MockInterviewsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AiAssistantPage from './pages/AiAssistantPage';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing & Guest Auth Routes */}
          <Route
            path="/"
            element={
              <MainLayout>
                <LandingPage />
              </MainLayout>
            }
          />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <MainLayout>
                  <LoginPage />
                </MainLayout>
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <MainLayout>
                  <RegisterPage />
                </MainLayout>
              </GuestRoute>
            }
          />

          {/* Protected Placement Platform Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dsa"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DsaPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/aptitude"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AptitudePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ResumePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/certifications"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CertificationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <JobApplicationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <JobApplicationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/interviews"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MockInterviewsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-interviews"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MockInterviewsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AnalyticsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AnalyticsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-assistant"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AiAssistantPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assistant"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AiAssistantPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
