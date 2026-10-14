import React, { useState, useEffect } from 'react';
import { getStudentProfile, updateStudentProfile, getProfileCompletion } from '../services/api';
import './ProfilePage.css';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [completionInfo, setCompletionInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    college: '',
    branch: '',
    graduationYear: '',
    skills: '',
    githubUrl: '',
    linkedinUrl: '',
    profilePhoto: '',
  });

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const [profileData, completionData] = await Promise.all([
        getStudentProfile(),
        getProfileCompletion(),
      ]);
      setProfile(profileData);
      setCompletionInfo(completionData);

      setFormData({
        fullName: profileData.fullName || '',
        phone: profileData.phone || '',
        college: profileData.college || '',
        branch: profileData.branch || '',
        graduationYear: profileData.graduationYear || '',
        skills: profileData.skills || '',
        githubUrl: profileData.githubUrl || '',
        linkedinUrl: profileData.linkedinUrl || '',
        profilePhoto: profileData.profilePhoto || '',
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load profile data. Please refresh.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        ...formData,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear, 10) : null,
      };
      const updated = await updateStudentProfile(payload);
      const completion = await getProfileCompletion();

      setProfile(updated);
      setCompletionInfo(completion);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Student profile updated successfully!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile. Please check your inputs.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="auth-spinner"></div>
        <p>Loading student profile...</p>
      </div>
    );
  }

  const skillsList = profile?.skills
    ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="profile-page-container">
      {message.text && (
        <div className={`profile-alert ${message.type}-alert`}>
          {message.text}
        </div>
      )}

      <div className="profile-header-card">
        <div className="profile-avatar-large">
          {profile?.profilePhoto ? (
            <img src={profile.profilePhoto} alt="Profile" className="avatar-img" />
          ) : (
            <span>{profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'S'}</span>
          )}
        </div>

        <div className="profile-header-info">
          <h2>{profile?.fullName || 'Student Name'}</h2>
          <p className="profile-email">✉️ {profile?.email}</p>
          <div className="profile-meta-tags">
            {profile?.college && <span className="meta-tag">🏛️ {profile.college}</span>}
            {profile?.branch && <span className="meta-tag">🎓 {profile.branch}</span>}
            {profile?.graduationYear && <span className="meta-tag">📅 Class of {profile.graduationYear}</span>}
          </div>
        </div>

        <div className="profile-header-actions">
          {!isEditing ? (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              ✏️ Edit Profile
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {completionInfo && (
        <div className="completion-card">
          <div className="completion-header">
            <div>
              <h3>Profile Completion Status</h3>
              <p>{completionInfo.completedFieldsCount} of {completionInfo.totalFieldsCount} key profile items completed</p>
            </div>
            <div className="completion-percentage-badge">
              {completionInfo.completionPercentage}%
            </div>
          </div>
          <div className="completion-bar-large">
            <div
              className="completion-fill-large"
              style={{ width: `${completionInfo.completionPercentage}%` }}
            ></div>
          </div>

          {completionInfo.missingFields?.length > 0 && (
            <div className="missing-fields-box">
              <p className="missing-title">💡 Missing details to reach 100% completion:</p>
              <div className="missing-tags">
                {completionInfo.missingFields.map((field, idx) => (
                  <span key={idx} className="missing-tag">+ {field}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!isEditing ? (
        <div className="profile-details-grid">
          <div className="profile-section-card">
            <h3>🎓 Academic & Basic Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Full Name</span>
                <span className="info-value">{profile?.fullName || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email Address</span>
                <span className="info-value">{profile?.email || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone Number</span>
                <span className="info-value">{profile?.phone || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">College / University</span>
                <span className="info-value">{profile?.college || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Branch / Specialization</span>
                <span className="info-value">{profile?.branch || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Graduation Year</span>
                <span className="info-value">{profile?.graduationYear || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <div className="profile-section-card">
            <h3>💻 Technical Skills & Links</h3>
            <div className="info-group">
              <span className="info-label">Key Skills</span>
              <div className="skills-chip-container">
                {skillsList.length > 0 ? (
                  skillsList.map((skill, i) => (
                    <span key={i} className="skill-chip">{skill}</span>
                  ))
                ) : (
                  <span className="text-muted">No skills added yet</span>
                )}
              </div>
            </div>

            <div className="info-grid" style={{ marginTop: '1.5rem' }}>
              <div className="info-item">
                <span className="info-label">GitHub Profile</span>
                {profile?.githubUrl ? (
                  <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="profile-link">
                    🔗 {profile.githubUrl}
                  </a>
                ) : (
                  <span className="text-muted">Not provided</span>
                )}
              </div>

              <div className="info-item">
                <span className="info-label">LinkedIn Profile</span>
                {profile?.linkedinUrl ? (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="profile-link">
                    🔗 {profile.linkedinUrl}
                  </a>
                ) : (
                  <span className="text-muted">Not provided</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="profile-edit-form">
          <div className="profile-section-card">
            <h3>✏️ Edit Student Profile</h3>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 9876543210"
                />
              </div>

              <div className="form-group">
                <label htmlFor="college">College / University</label>
                <input
                  type="text"
                  id="college"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="e.g. ABC Institute of Technology"
                />
              </div>

              <div className="form-group">
                <label htmlFor="branch">Branch / Major</label>
                <input
                  type="text"
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science & Engineering"
                />
              </div>

              <div className="form-group">
                <label htmlFor="graduationYear">Graduation Year</label>
                <input
                  type="number"
                  id="graduationYear"
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleChange}
                  placeholder="e.g. 2026"
                  min="2000"
                  max="2100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="skills">Key Skills (comma separated)</label>
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="e.g. Java, Python, React, Data Structures, SQL"
                />
              </div>

              <div className="form-group">
                <label htmlFor="githubUrl">GitHub Profile URL</label>
                <input
                  type="url"
                  id="githubUrl"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div className="form-group">
                <label htmlFor="linkedinUrl">LinkedIn Profile URL</label>
                <input
                  type="url"
                  id="linkedinUrl"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourusername"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="profilePhoto">Profile Photo URL</label>
                <input
                  type="url"
                  id="profilePhoto"
                  name="profilePhoto"
                  value={formData.profilePhoto}
                  onChange={handleChange}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfilePage;
