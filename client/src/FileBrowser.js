import React, { useState } from 'react';
import './FileBrowser.css';
import LoadingTimer from './LoadingTimer';

function FileBrowser() {
  const [folderPath, setFolderPath] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedFiles, setSelectedFiles] = useState(new Set());

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isImageFile = (fileName) => {
    const ext = fileName.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(ext);
  };

  const getImagePreviewUrl = (filePath) => {
    return `http://localhost:3001/api/image-preview?filePath=${encodeURIComponent(filePath)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFiles([]);

    try {
      const response = await fetch('http://localhost:3001/api/list-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderPath }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch files');
      }

      setFiles(data.files);
      setCurrentPath(data.path);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (filePath) => {
    const ok = window.confirm(`Delete file? ${filePath}`);
    if (!ok) return;

    try {
      const res = await fetch('http://localhost:3001/api/delete-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete file');

      setFiles(prev => prev.filter(f => f.path !== filePath));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const toggleFileSelection = (filePath) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const toggleAllFiles = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.path)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) {
      alert('Please select files to delete');
      return;
    }

    const count = selectedFiles.size;
    const ok = window.confirm(`Delete ${count} file(s)? This action cannot be undone.`);
    if (!ok) return;

    try {
      let successCount = 0;
      let failedCount = 0;

      for (const filePath of selectedFiles) {
        try {
          const res = await fetch('http://localhost:3001/api/delete-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: filePath }),
          });

          if (res.ok) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          failedCount++;
        }
      }

      setFiles(prev => prev.filter(f => !selectedFiles.has(f.path)));
      setSelectedFiles(new Set());

      if (failedCount > 0) {
        alert(`Deleted ${successCount} file(s). ${failedCount} file(s) failed.`);
      } else {
        alert(`Successfully deleted ${successCount} file(s)`);
      }
    } catch (err) {
      alert('Bulk delete failed: ' + err.message);
    }
  };

  const getSortedFiles = () => {
    const sorted = [...files];
    const getExt = (f) => (f.extension || '').toString().toLowerCase();

    sorted.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').toString().localeCompare((b.name || '').toString(), undefined, { sensitivity: 'base' });
      }

      if (sortBy === 'size') {
        return (a.size || 0) - (b.size || 0);
      }

      if (sortBy === 'modifiedDate') {
        const da = a.modifiedDate ? new Date(a.modifiedDate).getTime() : 0;
        const db = b.modifiedDate ? new Date(b.modifiedDate).getTime() : 0;
        return da - db;
      }

      if (sortBy === 'extension') {
        return getExt(a).localeCompare(getExt(b));
      }

      return 0;
    });

    if (sortOrder === 'desc') sorted.reverse();
    return sorted;
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '⇅';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="file-browser">
      <LoadingTimer isLoading={loading} message="Scanning files..." />
      
      <h1>File Browser</h1>
      <p className="subtitle">Browse and list all files from any directory path</p>
      
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          placeholder="Enter folder path (e.g., C:\Users\YourName\Documents)"
          className="path-input"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showThumbnails} 
              onChange={(e) => setShowThumbnails(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Show image thumbnails</span>
          </label>
          <button type="submit" disabled={loading || !folderPath}>
            {loading ? 'Loading...' : 'Browse Files'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {currentPath && (
        <div className="current-path">
          <strong>Browsing:</strong> {currentPath}
        </div>
      )}

      {files.length > 0 && (
        <div className="results">
          <div className="results-header">
            <div className="results-info">
              <h2>Found {files.length} file(s)</h2>
              {selectedFiles.size > 0 && <p style={{ marginTop: '5px', color: '#666' }}>{selectedFiles.size} selected</p>}
            </div>
            {selectedFiles.size > 0 && (
              <button type="button" onClick={handleBulkDelete} className="bulk-delete-btn" style={{ backgroundColor: '#dc3545', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                🗑 Delete Selected ({selectedFiles.size})
              </button>
            )}
            <div className="sort-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontWeight: 'bold' }}>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="modifiedDate">Modified Date</option>
                <option value="extension">Extension</option>
              </select>
              <button type="button" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="toggle-btn" title="Toggle sort order">
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                📊 Table
              </button>
              <button 
                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                📋 List
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <ul className="file-list">
              {getSortedFiles().map((file, index) => (
                <li key={index} className="file-item">
                  <div className="file-header">
                    <input type="checkbox" checked={selectedFiles.has(file.path)} onChange={() => toggleFileSelection(file.path)} style={{ cursor: 'pointer', marginRight: '10px' }} />
                    {showThumbnails && isImageFile(file.name) ? (
                      <img 
                        src={getImagePreviewUrl(file.path)} 
                        alt="preview" 
                        style={{ 
                          width: '50px', 
                          height: '50px', 
                          objectFit: 'cover', 
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          marginRight: '10px'
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="file-icon">📄</span>
                    )}
                    <span className="file-name">{file.name}</span>
                  </div>
                  <div className="file-meta">
                    <span className="file-info">💾 {formatSize(file.size)}</span>
                    <span className="file-info">📅 {formatDate(file.modifiedDate)}</span>
                  </div>
                  <div className="file-path">{file.path}</div>
                  <div className="file-actions">
                    <button className="delete-btn" onClick={() => handleDeleteFile(file.path)} title="Delete file">🗑 Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="table-container">
              <table className="file-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" checked={selectedFiles.size === files.length && files.length > 0} onChange={toggleAllFiles} style={{ cursor: 'pointer' }} />
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('name')}>
                      File Name {getSortIcon('name')}
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('extension')}>
                      Extension {getSortIcon('extension')}
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('size')}>
                      Size {getSortIcon('size')}
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('modifiedDate')}>
                      Modified Date {getSortIcon('modifiedDate')}
                    </th>
                    <th>Full Path</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedFiles().map((file, index) => (
                    <tr key={index} className="table-row">
                      <td style={{ width: '40px', textAlign: 'center' }}>
                        <input type="checkbox" checked={selectedFiles.has(file.path)} onChange={() => toggleFileSelection(file.path)} style={{ cursor: 'pointer' }} />
                      </td>
                      <td className="name-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {showThumbnails && isImageFile(file.name) ? (
                            <img 
                              src={getImagePreviewUrl(file.path)} 
                              alt="preview" 
                              style={{ 
                                width: '50px', 
                                height: '50px', 
                                objectFit: 'cover', 
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                              }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <span>📄</span>
                          )}
                          <span>{file.name}</span>
                        </div>
                      </td>
                      <td className="extension-cell">{file.extension || 'N/A'}</td>
                      <td className="stats-cell">{formatSize(file.size)}</td>
                      <td className="date-cell">{formatDate(file.modifiedDate)}</td>
                      <td className="path-cell">{file.path}</td>
                      <td className="action-cell">
                        <button className="delete-btn" onClick={() => handleDeleteFile(file.path)} title="Delete file">🗑 Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {files.length === 0 && currentPath && !loading && (
        <div className="no-results">
          <div className="info-icon">ℹ️</div>
          <h3>No files found</h3>
          <p>The directory doesn't contain any files.</p>
        </div>
      )}
    </div>
  );
}

export default FileBrowser;
