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
              {files.map((file, index) => (
                <li key={index} className="file-item">
                  <div className="file-header">
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
                </li>
              ))}
            </ul>
          ) : (
            <div className="table-container">
              <table className="file-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Extension</th>
                    <th>Size</th>
                    <th>Modified Date</th>
                    <th>Full Path</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, index) => (
                    <tr key={index} className="table-row">
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
