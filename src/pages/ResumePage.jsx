import React, { useState, useEffect, useRef } from 'react';
import {
  getResumes,
  getResumeStats,
  uploadResume,
  renameResume,
  uploadResumeVersion,
  getResumeVersions,
  setPrimaryResume,
  deleteResume,
  downloadResume,
} from '../services/api';
import './ResumePage.css';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ResumePage = () => {
  const [resumes, setResumes] = useState([]);
  const [stats, setStats] = useState({
    totalResumes: 0,
    hasPrimary: false,
    primaryResumeName: null,
    latestUploadDate: null,
    totalVersions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: null });

  // Upload Form State
  const [uploadName, setUploadName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  // Modals State
  const [renameModal, setRenameModal] = useState({ open: false, resume: null, newName: '' });
  const [versionModal, setVersionModal] = useState({ open: false, resume: null, file: null, error: '' });
  const [historyModal, setHistoryModal] = useState({ open: false, resume: null, versions: [], loading: false });
  const [deleteModal, setDeleteModal] = useState({ open: false, resume: null });
  const versionFileInputRef = useRef(null);

  useEffect(() => {
    fetchResumesData();
  }, []);

  const fetchResumesData = async () => {
    try {
      setLoading(true);
      const [resumesData, statsData] = await Promise.all([
        getResumes(),
        getResumeStats().catch(() => null),
      ]);
      setResumes(resumesData || []);
      if (statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to load resumes.');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: null, message: null });
    }, 5000);
  };

  // Format Helpers
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // File Validation
  const validateFile = (file) => {
    if (!file) return 'Please select a file.';
    const validExtensions = ['.pdf', '.docx'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValidExt) {
      return 'Invalid file format. Only PDF (.pdf) and Microsoft Word (.docx) files are supported.';
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return `File exceeds the 5 MB limit (Selected file size: ${sizeMb} MB).`;
    }

    return '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const err = validateFile(file);
      setFileError(err);
      if (!err) {
        setSelectedFile(file);
        if (!uploadName.trim()) {
          // Pre-fill name without extension
          const clean = file.name.replace(/\.[^/.]+$/, '');
          setUploadName(clean);
        }
      } else {
        setSelectedFile(null);
      }
    }
  };

  // Upload Resume
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError('Please select a PDF or DOCX file to upload.');
      return;
    }

    const err = validateFile(selectedFile);
    if (err) {
      setFileError(err);
      return;
    }

    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (uploadName.trim()) {
        formData.append('resumeName', uploadName.trim());
      }

      await uploadResume(formData);
      showFeedback('success', 'Resume uploaded successfully with Version 1!');
      setSelectedFile(null);
      setUploadName('');
      setFileError('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchResumesData();
    } catch (err) {
      console.error('Error uploading resume:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to upload resume.');
    } finally {
      setActionLoading(false);
    }
  };

  // Download Resume
  const handleDownload = async (resumeId, originalFileName, versionNumber = null) => {
    try {
      showFeedback('info', `Preparing download for ${originalFileName}...`);
      const response = await downloadResume(resumeId, versionNumber);
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', originalFileName || 'resume');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      showFeedback('success', 'Download started successfully.');
    } catch (err) {
      console.error('Download error:', err);
      showFeedback('error', 'Failed to download resume file.');
    }
  };

  // Set Primary
  const handleSetPrimary = async (resumeId) => {
    try {
      setActionLoading(true);
      await setPrimaryResume(resumeId);
      showFeedback('success', 'Primary resume updated successfully.');
      await fetchResumesData();
    } catch (err) {
      console.error('Error setting primary resume:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to update primary resume.');
    } finally {
      setActionLoading(false);
    }
  };

  // Rename Actions
  const openRenameModal = (resume) => {
    setRenameModal({ open: true, resume, newName: resume.resumeName });
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameModal.newName.trim()) return;

    try {
      setActionLoading(true);
      await renameResume(renameModal.resume.id, { resumeName: renameModal.newName.trim() });
      showFeedback('success', 'Resume renamed successfully.');
      setRenameModal({ open: false, resume: null, newName: '' });
      await fetchResumesData();
    } catch (err) {
      console.error('Error renaming resume:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to rename resume.');
    } finally {
      setActionLoading(false);
    }
  };

  // Version Actions
  const openVersionModal = (resume) => {
    setVersionModal({ open: true, resume, file: null, error: '' });
  };

  const handleVersionFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const err = validateFile(file);
      setVersionModal((prev) => ({ ...prev, file: err ? null : file, error: err }));
    }
  };

  const handleVersionSubmit = async (e) => {
    e.preventDefault();
    if (!versionModal.file) {
      setVersionModal((prev) => ({ ...prev, error: 'Please choose a file.' }));
      return;
    }

    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append('file', versionModal.file);

      await uploadResumeVersion(versionModal.resume.id, formData);
      showFeedback(
        'success',
        `Version ${(versionModal.resume.currentVersion || 1) + 1} uploaded successfully!`
      );
      setVersionModal({ open: false, resume: null, file: null, error: '' });
      await fetchResumesData();
    } catch (err) {
      console.error('Error uploading version:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to upload new version.');
    } finally {
      setActionLoading(false);
    }
  };

  // Version History Modal
  const openHistoryModal = async (resume) => {
    setHistoryModal({ open: true, resume, versions: [], loading: true });
    try {
      const history = await getResumeVersions(resume.id);
      setHistoryModal({ open: true, resume, versions: history || [], loading: false });
    } catch (err) {
      console.error('Error fetching version history:', err);
      showFeedback('error', 'Failed to load version history.');
      setHistoryModal({ open: false, resume: null, versions: [], loading: false });
    }
  };

  // Delete Actions
  const openDeleteModal = (resume) => {
    setDeleteModal({ open: true, resume });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.resume) return;

    try {
      setActionLoading(true);
      await deleteResume(deleteModal.resume.id);
      showFeedback('success', `Resume "${deleteModal.resume.resumeName}" deleted.`);
      setDeleteModal({ open: false, resume: null });
      await fetchResumesData();
    } catch (err) {
      console.error('Error deleting resume:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to delete resume.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="resume-page-container">
      {/* Page Header */}
      <div className="resume-header-card">
        <div className="header-info">
          <span className="header-badge">Placement Assets</span>
          <h1>Resume Management</h1>
          <p>
            Organize your resumes and keep every application ready. Upload, version, and manage
            tailored CVs for your campus placements and off-campus opportunities.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            + Upload New Resume
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div className={`resume-alert alert-${feedback.type}`}>
          <span className="alert-icon">
            {feedback.type === 'success' && '✓'}
            {feedback.type === 'error' && '✕'}
            {feedback.type === 'info' && 'ℹ'}
          </span>
          <span className="alert-text">{feedback.message}</span>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="resume-metrics-grid">
        <div className="resume-metric-card primary-border">
          <div className="metric-header">
            <span className="m-icon">📄</span>
            <span className="m-tag">Total</span>
          </div>
          <span className="metric-val">{stats.totalResumes || resumes.length}</span>
          <span className="metric-lbl">Total Resumes</span>
          <span className="metric-subdetail">
            <span>{stats.totalVersions || 0} Total Versions</span>
          </span>
        </div>

        <div className="resume-metric-card accent-border">
          <div className="metric-header">
            <span className="m-icon">⭐</span>
            <span className="m-tag">Active</span>
          </div>
          <span className="metric-val text-truncate-1">
            {stats.hasPrimary && stats.primaryResumeName ? stats.primaryResumeName : 'None Selected'}
          </span>
          <span className="metric-lbl">Primary Resume</span>
          <span className="metric-subdetail">
            {stats.hasPrimary ? (
              <span className="text-success font-bold">✓ Ready for one-click apply</span>
            ) : (
              <span className="text-warning">Set a primary resume below</span>
            )}
          </span>
        </div>

        <div className="resume-metric-card info-border">
          <div className="metric-header">
            <span className="m-icon">🕒</span>
            <span className="m-tag">Activity</span>
          </div>
          <span className="metric-val-date">{formatDate(stats.latestUploadDate)}</span>
          <span className="metric-lbl">Latest Upload</span>
          <span className="metric-subdetail">
            <span>Max file size: 5 MB (PDF/DOCX)</span>
          </span>
        </div>
      </div>

      {/* Upload Section */}
      <div className="resume-upload-section">
        <div className="upload-card">
          <div className="card-top-header">
            <span className="upload-icon">📤</span>
            <div>
              <h3>Upload a Resume</h3>
              <p>Add a new tailored resume to your portfolio. Only PDF and DOCX files up to 5 MB.</p>
            </div>
          </div>

          <form onSubmit={handleUploadSubmit} className="upload-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="resumeName">Resume Title / Label</label>
                <input
                  id="resumeName"
                  type="text"
                  placeholder="e.g. Software Engineer Resume, General Resume"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="custom-input"
                  maxLength={150}
                />
                <span className="form-hint">Give it an easily recognizable name.</span>
              </div>

              <div className="form-group">
                <label htmlFor="resumeFile">Select File (.pdf, .docx)</label>
                <input
                  id="resumeFile"
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="custom-file-input"
                />
                {selectedFile && !fileError && (
                  <span className="file-info-badge">
                    Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
                  </span>
                )}
                {fileError && <span className="form-error-msg">{fileError}</span>}
              </div>
            </div>

            <div className="upload-action-row">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={actionLoading || !selectedFile || !!fileError}
              >
                {actionLoading ? 'Uploading...' : 'Upload Resume'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Resumes List */}
      <div className="resume-list-section">
        <div className="section-header-row">
          <h3>Your Resumes ({resumes.length})</h3>
          <span className="section-subtitle">
            Manage your tailored resumes, download previous versions, or update titles.
          </span>
        </div>

        {loading ? (
          <div className="resume-loading-state">
            <div className="spinner"></div>
            <p>Loading your resumes...</p>
          </div>
        ) : resumes.length === 0 ? (
          /* Empty State */
          <div className="resume-empty-card">
            <span className="empty-icon">📁</span>
            <h4>No resumes uploaded yet</h4>
            <p>
              Upload your first resume using the form above to start preparing for your campus
              placement opportunities.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              Upload Your First Resume
            </button>
          </div>
        ) : (
          <div className="resumes-grid">
            {resumes.map((resume) => {
              const latest = resume.latestVersion;
              return (
                <div
                  key={resume.id}
                  className={`resume-item-card ${resume.primary ? 'is-primary-card' : ''}`}
                >
                  <div className="item-header">
                    <div className="item-title-block">
                      <div className="title-row">
                        <h4>{resume.resumeName}</h4>
                        {resume.primary && <span className="badge-primary-star">★ Primary</span>}
                      </div>
                      <span className="version-tag">
                        Version {resume.currentVersion || 1}
                        {resume.versionsCount > 1 && ` • ${resume.versionsCount} versions`}
                      </span>
                    </div>

                    <div className="file-type-pill">
                      <span className="ft-icon">
                        {latest?.fileType === 'PDF' ? '📕' : '📘'}
                      </span>
                      <span>{latest?.fileType || 'PDF'}</span>
                    </div>
                  </div>

                  <div className="item-meta-details">
                    <div className="meta-line">
                      <span className="meta-label">Original File:</span>
                      <span className="meta-value text-truncate-1">
                        {latest?.originalFileName || 'resume.pdf'}
                      </span>
                    </div>
                    <div className="meta-line">
                      <span className="meta-label">File Size:</span>
                      <span className="meta-value">{formatBytes(latest?.fileSize)}</span>
                    </div>
                    <div className="meta-line">
                      <span className="meta-label">Last Updated:</span>
                      <span className="meta-value">{formatDate(resume.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="item-actions-row">
                    <button
                      className="btn-action btn-download"
                      title="Download latest version"
                      onClick={() =>
                        handleDownload(
                          resume.id,
                          latest?.originalFileName,
                          latest?.versionNumber
                        )
                      }
                    >
                      ⬇ Download
                    </button>

                    <button
                      className="btn-action btn-secondary"
                      title="Upload new version"
                      onClick={() => openVersionModal(resume)}
                    >
                      + New Version
                    </button>

                    <button
                      className="btn-action btn-outline"
                      title="View all previous versions"
                      onClick={() => openHistoryModal(resume)}
                    >
                      🕒 History ({resume.versionsCount || 1})
                    </button>

                    <button
                      className="btn-action btn-outline"
                      title="Rename this resume"
                      onClick={() => openRenameModal(resume)}
                    >
                      ✏ Rename
                    </button>

                    {!resume.primary && (
                      <button
                        className="btn-action btn-primary-toggle"
                        title="Set as primary resume"
                        onClick={() => handleSetPrimary(resume.id)}
                      >
                        ★ Set Primary
                      </button>
                    )}

                    <button
                      className="btn-action btn-delete"
                      title="Delete resume"
                      onClick={() => openDeleteModal(resume)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==========================================================================
          MODALS
         ========================================================================== */}

      {/* 1. Rename Modal */}
      {renameModal.open && (
        <div className="modal-overlay" onClick={() => setRenameModal({ open: false, resume: null, newName: '' })}>
          <div className="resume-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rename Resume</h3>
              <button
                className="btn-close"
                onClick={() => setRenameModal({ open: false, resume: null, newName: '' })}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRenameSubmit}>
              <div className="modal-body">
                <label htmlFor="renameInput">Resume Name</label>
                <input
                  id="renameInput"
                  type="text"
                  value={renameModal.newName}
                  onChange={(e) =>
                    setRenameModal((prev) => ({ ...prev, newName: e.target.value }))
                  }
                  className="custom-input"
                  maxLength={150}
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRenameModal({ open: false, resume: null, newName: '' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading || !renameModal.newName.trim()}
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Upload New Version Modal */}
      {versionModal.open && (
        <div className="modal-overlay" onClick={() => setVersionModal({ open: false, resume: null, file: null, error: '' })}>
          <div className="resume-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload New Version: {versionModal.resume?.resumeName}</h3>
              <button
                className="btn-close"
                onClick={() => setVersionModal({ open: false, resume: null, file: null, error: '' })}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleVersionSubmit}>
              <div className="modal-body">
                <p className="modal-desc">
                  Uploading a new version preserves previous versions in history and bumps this
                  resume to <strong>Version {(versionModal.resume?.currentVersion || 1) + 1}</strong>.
                </p>
                <label htmlFor="versionFile">Select Updated File (.pdf, .docx, max 5 MB)</label>
                <input
                  id="versionFile"
                  type="file"
                  ref={versionFileInputRef}
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleVersionFileChange}
                  className="custom-file-input"
                />
                {versionModal.file && (
                  <span className="file-info-badge">
                    Selected: {versionModal.file.name} ({formatBytes(versionModal.file.size)})
                  </span>
                )}
                {versionModal.error && (
                  <span className="form-error-msg">{versionModal.error}</span>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setVersionModal({ open: false, resume: null, file: null, error: '' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading || !versionModal.file || !!versionModal.error}
                >
                  {actionLoading ? 'Uploading...' : 'Upload New Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Version History Modal */}
      {historyModal.open && (
        <div className="modal-overlay" onClick={() => setHistoryModal({ open: false, resume: null, versions: [], loading: false })}>
          <div className="resume-modal wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Version History: {historyModal.resume?.resumeName}</h3>
              <button
                className="btn-close"
                onClick={() => setHistoryModal({ open: false, resume: null, versions: [], loading: false })}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {historyModal.loading ? (
                <div className="modal-loading">
                  <div className="spinner"></div>
                  <p>Loading version history...</p>
                </div>
              ) : historyModal.versions.length === 0 ? (
                <p>No versions found.</p>
              ) : (
                <div className="history-table-wrapper">
                  <table className="version-history-table">
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>Original Filename</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Uploaded On</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyModal.versions.map((ver) => (
                        <tr key={ver.id}>
                          <td>
                            <span className="v-num-badge">v{ver.versionNumber}</span>
                          </td>
                          <td className="text-truncate-1">{ver.originalFileName}</td>
                          <td>
                            <span className="v-type-tag">{ver.fileType}</span>
                          </td>
                          <td>{formatBytes(ver.fileSize)}</td>
                          <td>{formatDate(ver.uploadedAt)}</td>
                          <td>
                            <button
                              className="btn-table-download"
                              onClick={() =>
                                handleDownload(
                                  historyModal.resume.id,
                                  ver.originalFileName,
                                  ver.versionNumber
                                )
                              }
                            >
                              ⬇ Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setHistoryModal({ open: false, resume: null, versions: [], loading: false })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ open: false, resume: null })}>
          <div className="resume-modal delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Resume</h3>
              <button
                className="btn-close"
                onClick={() => setDeleteModal({ open: false, resume: null })}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to permanently delete{' '}
                <strong>"{deleteModal.resume?.resumeName}"</strong>?
              </p>
              <p className="delete-warning">
                ⚠️ This will delete all versions ({deleteModal.resume?.versionsCount || 1}) and
                their physical files from the server. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteModal({ open: false, resume: null })}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumePage;
