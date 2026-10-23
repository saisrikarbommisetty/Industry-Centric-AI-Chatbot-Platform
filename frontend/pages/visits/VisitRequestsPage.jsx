import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  Download, 
  FileSpreadsheet, 
  RefreshCw, 
  Filter, 
  ExternalLink, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  X,
  Eye
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { api } from '../../utils/api';

export const VisitRequestsPage = () => {
  const { addToast } = usePlatform();

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [localityFilter, setLocalityFilter] = useState('');

  const fetchVisits = async () => {
    setLoading(true);
    let remoteVisits = [];
    try {
      const res = await api.visits.getVisits();
      if (res?.success && Array.isArray(res.data)) {
        remoteVisits = res.data;
      }
    } catch (err) {
      console.warn('API getVisits note:', err.message);
    }

    // Merge with any locally recorded visit requests from localStorage
    let localVisits = [];
    try {
      localVisits = JSON.parse(localStorage.getItem('brim_visit_requests') || '[]');
    } catch (e) {
      localVisits = [];
    }

    // Combine and deduplicate by requestId or mobileNumber + propertyName
    const combined = [...remoteVisits];
    for (const lv of localVisits) {
      if (!combined.some((rv) => rv.requestId === lv.requestId || (rv.mobileNumber === lv.mobileNumber && rv.propertyName === lv.propertyName))) {
        combined.unshift(lv);
      }
    }

    setVisits(combined);
    setLoading(false);
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  // Filtered visits
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
        (v.customerName && v.customerName.toLowerCase().includes(q)) ||
        (v.mobileNumber && v.mobileNumber.toLowerCase().includes(q)) ||
        (v.propertyName && v.propertyName.toLowerCase().includes(q)) ||
        (v.requestId && v.requestId.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || 
        (v.visitStatus && v.visitStatus.toUpperCase() === statusFilter.toUpperCase());

      const matchesLocality = !localityFilter || 
        (v.locality && v.locality.toLowerCase().includes(localityFilter.toLowerCase().trim()));

      return matchesSearch && matchesStatus && matchesLocality;
    });
  }, [visits, search, statusFilter, localityFilter]);

  // Export to Excel handler
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (localityFilter) params.locality = localityFilter;
      if (search) params.search = search;

      const resBlob = await api.visits.exportExcel(params);
      const fileBlob = (resBlob instanceof Blob) ? resBlob : (resBlob?.blob || resBlob);
      if (fileBlob && (fileBlob instanceof Blob || fileBlob.size > 0)) {
        const url = URL.createObjectURL(fileBlob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        link.download = `Prycoons_Property_Visit_Requests_${dateStr}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        addToast('Excel spreadsheet exported successfully 📊', 'success');
      } else {
        throw new Error('Received empty spreadsheet file');
      }
    } catch (err) {
      console.error('Excel export error:', err);
      addToast(err.message || 'Failed to export visit requests to Excel.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'NEW_REQUEST').toUpperCase();
    if (s.includes('CONFIRM')) {
      return <span className="badge badge-success">Confirmed</span>;
    }
    if (s.includes('CONTACT') || s.includes('IN_PROGRESS')) {
      return <span className="badge badge-warning">Contacted</span>;
    }
    if (s.includes('CANCEL')) {
      return <span className="badge badge-danger">Cancelled</span>;
    }
    return <span className="badge badge-primary">New Request</span>;
  };

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Property Visit Requests
          </h1>
          <p className="page-description">
            Admin portal to review scheduled site tours, follow up with qualified buyers, and export Excel records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={fetchVisits} 
            disabled={loading}
            title="Refresh visit requests"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleExportExcel} 
            disabled={exporting || visits.length === 0}
            title="Export filtered records to professional Excel workbook"
          >
            <FileSpreadsheet size={15} />
            <span>{exporting ? 'Generating Excel...' : 'Export to Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid-4" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center justify-between" style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', fontWeight: 600 }}>
            <span>Total Requests</span>
            <Calendar size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text-primary)' }}>
            {visits.length}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center justify-between" style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', fontWeight: 600 }}>
            <span>New Inquiries</span>
            <AlertCircle size={16} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: '#f59e0b' }}>
            {visits.filter(v => (v.visitStatus || 'NEW_REQUEST').toUpperCase().includes('NEW') || (v.visitStatus || '').toUpperCase().includes('PENDING')).length}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center justify-between" style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', fontWeight: 600 }}>
            <span>Confirmed Tours</span>
            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: '#10b981' }}>
            {visits.filter(v => (v.visitStatus || '').toUpperCase().includes('CONFIRM')).length}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center justify-between" style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', fontWeight: 600 }}>
            <span>Filtered Matching</span>
            <Filter size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text-primary)' }}>
            {filteredVisits.length}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap" style={{ flex: 1 }}>
            {/* Search */}
            <div className="input-wrapper" style={{ minWidth: '240px', maxWidth: '340px', width: '100%' }}>
              <Search size={15} className="input-icon-left" />
              <input
                type="text"
                className="form-input has-left-icon"
                placeholder="Search name, phone, or property..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '0.45rem 0.85rem 0.45rem 2.2rem', fontSize: '0.825rem' }}
              />
            </div>

            {/* Status Filter */}
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem', width: 'auto' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW_REQUEST">New Request</option>
              <option value="PENDING">Pending</option>
              <option value="CONTACTED">Contacted</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Locality Input */}
            <input
              type="text"
              className="form-input"
              placeholder="Filter by locality (e.g. Shela, Science City)..."
              value={localityFilter}
              onChange={(e) => setLocalityFilter(e.target.value)}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem', maxWidth: '240px' }}
            />

            {(search || statusFilter !== 'ALL' || localityFilter) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setLocalityFilter('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Showing <strong>{filteredVisits.length}</strong> of {visits.length} records
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>Request ID</th>
                <th>Submitted At</th>
                <th>Customer Name</th>
                <th>Mobile Number</th>
                <th>Property Name</th>
                <th>Locality</th>
                <th>Configuration</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Loading visit requests...</div>
                  </td>
                </tr>
              ) : filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <Calendar size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem auto' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      No visit requests found
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {search || statusFilter !== 'ALL' || localityFilter
                        ? 'Try adjusting your search criteria or clearing active filters.'
                        : 'New customer site visit requests scheduled through the chatbot will appear here.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVisits.map((v) => (
                  <tr key={v.requestId || v.id}>
                    <td>
                      <span 
                        style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: 700, 
                          fontSize: '0.78rem',
                          background: 'var(--bg-app)',
                          padding: '0.2rem 0.45rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-default)'
                        }}
                      >
                        #{v.requestId || v.id?.substring(0, 8)}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(v.submittedAt).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(v.submittedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {v.customerName}
                      </div>
                      {v.email && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {v.email}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <a 
                        href={`tel:${v.mobileNumber}`} 
                        style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                      >
                        {v.mobileNumber}
                      </a>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {v.propertyName || 'Unspecified'}
                      </div>
                      {v.propertyPrice && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                          {v.propertyPrice}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1" style={{ fontSize: '0.825rem' }}>
                        <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                        <span>{v.locality || 'Ahmedabad'}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.825rem' }}>
                      {v.bhk || '—'}
                    </td>
                    <td>
                      {getStatusBadge(v.visitStatus)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        title="View Full Request"
                        onClick={() => setSelectedVisit(v)}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedVisit && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedVisit(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div 
            className="card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '1.75rem',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
              backgroundColor: '#ffffff'
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Visit Request #{selectedVisit.requestId}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Submitted on {new Date(selectedVisit.submittedAt).toLocaleString()}
                </span>
              </div>
              <button 
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => setSelectedVisit(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Customer Name</div>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedVisit.customerName}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Mobile Number</div>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedVisit.mobileNumber}</div>
                </div>
              </div>

              {selectedVisit.email && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Email</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedVisit.email}</div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '0.85rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Property Association</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '2px', color: 'var(--primary)' }}>
                  {selectedVisit.propertyName}
                </div>
                {selectedVisit.propertyUrl && (
                  <a 
                    href={selectedVisit.propertyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}
                  >
                    <span>{selectedVisit.propertyUrl}</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>

              <div className="grid-3" style={{ gap: '0.75rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Locality</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedVisit.locality}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Configuration</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedVisit.bhk || '—'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Price</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedVisit.propertyPrice || '—'}</div>
                </div>
              </div>

              {selectedVisit.customerNotes && (
                <div style={{ background: 'var(--bg-app)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Customer Notes & Slot</div>
                  <div style={{ marginTop: '3px', lineHeight: 1.4 }}>{selectedVisit.customerNotes}</div>
                </div>
              )}

              <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--border-default)', paddingTop: '0.85rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '8px' }}>Status:</span>
                  {getStatusBadge(selectedVisit.visitStatus)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Conversation: #{selectedVisit.conversationId?.substring(0, 10) || 'DIRECT'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
