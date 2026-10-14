import React, { useState, useEffect } from 'react';
import {
  getCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  downloadCertificateFile,
} from '../services/api';
import './CertificationsPage.css';

const CertificationsPage = () => {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    issuingOrganization: '',
    issueDate: '',
    expiryDate: '',
    noExpiry: false,
    credentialId: '',
    credentialUrl: '',
    notes: '',
  });
  const [certificateFile, setCertificateFile] = useState(null);

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const data = await getCertifications();
      setCertifications(data || []);
    } catch (err) {
      console.error('Failed to fetch certifications:', err);
      showAlert('error', 'Failed to load certifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert({ type: '', message: '' });
    }, 5000);
  };

  const handleOpenAddModal = () => {
    setEditingCert(null);
    setFormData({
      name: '',
      issuingOrganization: '',
      issueDate: '',
      expiryDate: '',
      noExpiry: false,
      credentialId: '',
      credentialUrl: '',
      notes: '',
    });
    setCertificateFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cert) => {
    setEditingCert(cert);
    setFormData({
      name: cert.name || '',
      issuingOrganization: cert.issuingOrganization || '',
      issueDate: cert.issueDate || '',
      expiryDate: cert.expiryDate || '',
      noExpiry: !cert.expiryDate,
      credentialId: cert.credentialId || '',
      credentialUrl: cert.credentialUrl || '',
      notes: cert.notes || '',
    });
    setCertificateFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCert(null);
    setCertificateFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert('error', 'Certificate file cannot exceed 5 MB.');
        e.target.value = '';
        setCertificateFile(null);
        return;
      }
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'docx'].includes(ext)) {
        showAlert('error', 'Only PDF and DOCX files are supported.');
        e.target.value = '';
        setCertificateFile(null);
        return;
      }
      setCertificateFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.issuingOrganization.trim() || !formData.issueDate) {
      showAlert('error', 'Please fill in all required fields (Name, Issuing Organization, Issue Date).');
      return;
    }

    try {
      setIsSubmitting(true);
      const submission = new FormData();
      submission.append('name', formData.name.trim());
      submission.append('issuingOrganization', formData.issuingOrganization.trim());
      submission.append('issueDate', formData.issueDate);

      if (!formData.noExpiry && formData.expiryDate) {
        submission.append('expiryDate', formData.expiryDate);
      }

      if (formData.credentialId.trim()) {
        submission.append('credentialId', formData.credentialId.trim());
      }

      if (formData.credentialUrl.trim()) {
        submission.append('credentialUrl', formData.credentialUrl.trim());
      }

      if (formData.notes.trim()) {
        submission.append('notes', formData.notes.trim());
      }

      if (certificateFile) {
        submission.append('file', certificateFile);
      }

      if (editingCert) {
        await updateCertification(editingCert.id, submission);
        showAlert('success', 'Certification updated successfully!');
      } else {
        await createCertification(submission);
        showAlert('success', 'Certification added successfully!');
      }

      handleCloseModal();
      fetchCertifications();
    } catch (err) {
      console.error('Error saving certification:', err);
      showAlert('error', err.response?.data?.message || 'Failed to save certification. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCertification(id);
      showAlert('success', 'Certification deleted successfully.');
      setDeleteTargetId(null);
      fetchCertifications();
    } catch (err) {
      console.error('Error deleting certification:', err);
      showAlert('error', 'Failed to delete certification.');
    }
  };

  const handleDownloadFile = async (cert) => {
    try {
      const response = await downloadCertificateFile(cert.id);
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', cert.originalFileName || `${cert.name}_certificate.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading certificate file:', err);
      showAlert('error', 'Failed to download certificate file.');
    }
  };

  // Metrics computation
  const today = new Date().toISOString().split('T')[0];
  const activeCount = certifications.filter(
    (c) => !c.expiryDate || c.expiryDate >= today
  ).length;
  const expiredCount = certifications.filter(
    (c) => c.expiryDate && c.expiryDate < today
  ).length;

  const filteredCerts = certifications.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.issuingOrganization.toLowerCase().includes(q) ||
      (c.credentialId && c.credentialId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="certifications-page-container">
      {/* Page Header */}
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Certifications & Credentials</h1>
          <p className="page-subtitle">
            Store, verify, and showcase your industry licenses, badges, and completed courses.
          </p>
        </div>
        <button className="btn-add-cert" onClick={handleOpenAddModal}>
          + Add Certification
        </button>
      </div>

      {/* Alert Banner */}
      {alert.message && (
        <div className={`alert-banner ${alert.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          <span>{alert.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="cert-stats-grid">
        <div className="cert-stat-card">
          <div className="stat-icon-wrapper blue-icon">📜</div>
          <div>
            <div className="stat-card-value">{certifications.length}</div>
            <div className="stat-card-label">Total Certifications</div>
          </div>
        </div>
        <div className="cert-stat-card">
          <div className="stat-icon-wrapper green-icon">✓</div>
          <div>
            <div className="stat-card-value">{activeCount}</div>
            <div className="stat-card-label">Active & Valid</div>
          </div>
        </div>
        <div className="cert-stat-card">
          <div className="stat-icon-wrapper amber-icon">⏳</div>
          <div>
            <div className="stat-card-value">{expiredCount}</div>
            <div className="stat-card-label">Expired / Needs Renewal</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="cert-filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by certificate name, organization, or credential ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        {searchQuery && (
          <button className="btn-clear-search" onClick={() => setSearchQuery('')}>
            Clear
          </button>
        )}
      </div>

      {/* Certifications List / Empty State */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your credentials...</p>
        </div>
      ) : filteredCerts.length === 0 ? (
        <div className="empty-cert-state">
          <div className="empty-icon">📜</div>
          <h3>{searchQuery ? 'No matching certifications found' : 'No certifications added yet'}</h3>
          <p>
            {searchQuery
              ? 'Try adjusting your search criteria.'
              : 'Add AWS, Azure, Google, HackerRank, or academic credentials to boost your placement readiness score.'}
          </p>
          {!searchQuery && (
            <button className="btn-add-cert-empty" onClick={handleOpenAddModal}>
              + Add First Certification
            </button>
          )}
        </div>
      ) : (
        <div className="cert-cards-grid">
          {filteredCerts.map((cert) => {
            const isExpired = cert.expiryDate && cert.expiryDate < today;

            return (
              <div key={cert.id} className={`cert-card ${isExpired ? 'cert-expired' : ''}`}>
                <div className="cert-card-header">
                  <div className="cert-org-badge">{cert.issuingOrganization}</div>
                  <span className={`status-pill ${isExpired ? 'pill-expired' : 'pill-active'}`}>
                    {isExpired ? 'Expired' : 'Active'}
                  </span>
                </div>

                <h3 className="cert-name">{cert.name}</h3>

                <div className="cert-dates-row">
                  <div className="date-item">
                    <span className="date-label">Issued:</span>
                    <span className="date-value">{cert.issueDate}</span>
                  </div>
                  <div className="date-item">
                    <span className="date-label">Expires:</span>
                    <span className="date-value">{cert.expiryDate || 'No Expiry'}</span>
                  </div>
                </div>

                {cert.credentialId && (
                  <div className="cert-detail-row">
                    <span className="detail-label">Credential ID:</span>
                    <code className="credential-id-code">{cert.credentialId}</code>
                  </div>
                )}

                {cert.credentialUrl && (
                  <div className="cert-detail-row">
                    <span className="detail-label">Verification:</span>
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="credential-link"
                    >
                      View Credential ↗
                    </a>
                  </div>
                )}

                {cert.notes && (
                  <p className="cert-notes">{cert.notes}</p>
                )}

                {cert.hasFile && (
                  <div className="attached-file-box">
                    <div className="file-info-mini">
                      <span>📎</span>
                      <span className="file-name-mini">{cert.originalFileName}</span>
                    </div>
                    <button
                      className="btn-download-mini"
                      onClick={() => handleDownloadFile(cert)}
                      title="Download Certificate File"
                    >
                      ⬇ Download
                    </button>
                  </div>
                )}

                <div className="cert-card-actions">
                  <button
                    className="btn-edit-cert"
                    onClick={() => handleOpenEditModal(cert)}
                  >
                    ✏ Edit
                  </button>
                  <button
                    className="btn-delete-cert"
                    onClick={() => setDeleteTargetId(cert.id)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Certification Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content cert-modal">
            <div className="modal-header">
              <h2>{editingCert ? 'Edit Certification' : 'Add New Certification'}</h2>
              <button className="btn-close-modal" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="cert-form">
              <div className="form-group">
                <label>Certification Name *</label>
                <input
                  type="text"
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Issuing Organization *</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Web Services, Google Cloud, Oracle"
                  value={formData.issuingOrganization}
                  onChange={(e) => setFormData({ ...formData, issuingOrganization: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Issue Date *</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    disabled={formData.noExpiry}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.noExpiry}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData({
                        ...formData,
                        noExpiry: checked,
                        expiryDate: checked ? '' : formData.expiryDate,
                      });
                    }}
                  />
                  <span>This certification does not expire</span>
                </label>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Credential ID</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS-123456789"
                    value={formData.credentialId}
                    onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Credential URL</label>
                  <input
                    type="url"
                    placeholder="https://credly.com/your-badge"
                    value={formData.credentialUrl}
                    onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Upload Certificate File (PDF or DOCX, max 5 MB)</label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                />
                {editingCert && editingCert.hasFile && !certificateFile && (
                  <p className="file-existing-hint">
                    Current file: <strong>{editingCert.originalFileName}</strong>. Upload a new file to replace it.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Notes / Topics Covered</label>
                <textarea
                  rows="3"
                  placeholder="Key concepts, score, or skills validated..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingCert ? 'Save Changes' : 'Add Certification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="modal-backdrop">
          <div className="modal-content delete-modal">
            <h3>Delete Certification?</h3>
            <p>Are you sure you want to delete this credential and any associated certificate files? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteTargetId(null)}>
                Cancel
              </button>
              <button className="btn-confirm-delete" onClick={() => handleDelete(deleteTargetId)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationsPage;
