import React, { useState } from 'react';
import './DuplicateFileFinder.css';
import LoadingTimer from './LoadingTimer';

function DuplicateFileFinder() {
  const [folderPath, setFolderPath] = useState('');
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const [error, setError] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [totalDuplicates, setTotalDuplicates] = useState(0);
  const [totalFilesAnalyzed, setTotalFilesAnalyzed] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [viewMode, setViewMode] = useState('list');
  const [searchMode, setSearchMode] = useState('perfect');
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [sortBy, setSortBy] = useState('name');

  const toggleGroup = (index) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAll = () => {
    const allIndices = new Set(duplicates.map((_, i) => i));
    setExpandedGroups(allIndices);
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const getSortedDuplicates = () => {
    const sorted = [...duplicates];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'size') {
      sorted.sort((a, b) => {
        const sizeA = a.locations[0]?.size || 0;
        const sizeB = b.locations[0]?.size || 0;
        return sizeB - sizeA;
      });
    }
    return sorted;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDuplicates([]);
    setTotalDuplicates(0);

    try {
      const response = await fetch('http://localhost:3001/api/find-duplicate-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderPath, searchMode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find duplicates');
      }

      setDuplicates(data.duplicates);
      setCurrentPath(data.path);
      setTotalDuplicates(data.totalDuplicateFiles);
      setTotalFilesAnalyzed(data.totalFilesAnalyzed || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="duplicate-file-finder">
      <LoadingTimer isLoading={loading} message="Finding duplicate files..." />
      
      <h1>Duplicate File Finder</h1>
      <p className="subtitle">Find files with duplicate names in your directory structure</p>
      
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-mode-selector">
          <label className="search-mode-label">Search Mode:</label>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                value="full"
                checked={searchMode === 'full'}
                onChange={(e) => setSearchMode(e.target.value)}
              />
              <span>Full Search</span>
              <span className="radio-description">(Same name only)</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                value="perfect"
                checked={searchMode === 'perfect'}
                onChange={(e) => setSearchMode(e.target.value)}
              />
              <span>Perfect Search</span>
              <span className="radio-description">(Same name & size)</span>
            </label>
          </div>
        </div>
        <div className="input-row">
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            placeholder="Enter folder path (e.g., C:\\Users\\YourName\\Documents)"
            className="path-input"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
              {loading ? 'Searching...' : 'Find Duplicates'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {currentPath && (
        <div className="current-path">
          <strong>Searching in:</strong> {currentPath}
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="results">
          <div className="summary">
            <h2>Found {duplicates.length} file name(s) with duplicates</h2>
            <p className="total-count">Total duplicate files: {totalDuplicates}</p>
            <p className="total-count">Total files analyzed: {totalFilesAnalyzed}</p>
          </div>

          <div className="results-controls">
            <div className="view-selector">
              <button 
                type="button" 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                📋 List View
              </button>
              <button 
                type="button" 
                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                📊 Table View
              </button>
            </div>
            <div className="sort-selector" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold' }}>Sort by:</label>
              <button 
                type="button" 
                className={`view-btn ${sortBy === 'name' ? 'active' : ''}`}
                onClick={() => setSortBy('name')}
              >
                📝 Name
              </button>
              <button 
                type="button" 
                className={`view-btn ${sortBy === 'size' ? 'active' : ''}`}
                onClick={() => setSortBy('size')}
              >
                📏 Size
              </button>
            </div>
            {viewMode === 'list' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="control-btn" onClick={expandAll}>
                  Expand All
                </button>
                <button type="button" className="control-btn" onClick={collapseAll}>
                  Collapse All
                </button>
              </div>
            )}
          </div>

          {viewMode === 'table' ? (
            <div className="table-container">
              <table className="files-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Extension</th>
                    <th>Size</th>
                    <th>Modified Date</th>
                    <th>Path</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedDuplicates().map((group) => 
                    group.locations.map((location, locIndex) => (
                      <tr key={`${group.name}-${locIndex}`}>
                        <td className="file-name-cell">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {showThumbnails && isImageFile(group.name) ? (
                              <img 
                                src={getImagePreviewUrl(typeof location === 'string' ? location : location.path)} 
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
                            <span>{group.name}</span>
                          </div>
                        </td>
                        <td className="extension-cell">{location.extension || 'N/A'}</td>
                        <td className="stats-cell">{location.size !== undefined ? formatSize(location.size) : 'N/A'}</td>
                        <td className="date-cell">{location.modifiedDate ? formatDate(location.modifiedDate) : 'N/A'}</td>
                        <td className="path-cell">{typeof location === 'string' ? location : location.path}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="duplicate-groups">
              {getSortedDuplicates().map((group, index) => {
                const isExpanded = expandedGroups.has(index);
                return (
                  <div key={index} className="duplicate-group">
                    <div className="group-header" onClick={() => toggleGroup(index)}>
                      <div className="header-left">
                        <span className="expand-indicator">{isExpanded ? '▼' : '▶'}</span>
                        <span className="file-name-badge">📄 {group.name}</span>
                      </div>
                      <span className="count-badge">{group.count} occurrences</span>
                    </div>
                    {isExpanded && (
                      <div className="locations">
                        {group.locations.map((location, locIndex) => (
                          <div key={locIndex} className="location-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {showThumbnails && isImageFile(group.name) ? (
                                <img 
                                  src={getImagePreviewUrl(typeof location === 'string' ? location : location.path)} 
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
                                <span className="location-icon">📍</span>
                              )}
                              <div className="location-details">
                                <span className="location-path">{typeof location === 'string' ? location : location.path}</span>
                                {location.size !== undefined && (
                                  <span className="location-stats">
                                    💾 {formatSize(location.size)} | 📅 {formatDate(location.modifiedDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {duplicates.length === 0 && currentPath && !loading && (
        <div className="no-results">
          <div className="success-icon">✓</div>
          <h3>No duplicate file names found!</h3>
          <p>All files in this directory have unique names.</p>
        </div>
      )}
    </div>
  );
}

export default DuplicateFileFinder;
