import React, { useState } from 'react';
import './DuplicateFinder.css';
import LoadingTimer from './LoadingTimer';

function DuplicateFinder() {
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
  const [error, setError] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [totalDuplicates, setTotalDuplicates] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [viewMode, setViewMode] = useState('list');
  const [searchMode, setSearchMode] = useState('perfect');
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
      const response = await fetch('http://localhost:3001/api/find-duplicates', {
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
      setTotalDuplicates(data.totalDuplicateFolders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="duplicate-finder">
      <LoadingTimer isLoading={loading} message="Finding duplicates..." />
      
      <h1>Duplicate Folder Finder</h1>
      <p className="subtitle">Find folders with duplicate names in your directory structure</p>
      
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
              <span className="radio-description">(Same name, size & file count)</span>
            </label>
          </div>
        </div>
        <div className="input-row">
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            placeholder="Enter folder path (e.g., C:\Users\YourName\Documents)"
            className="path-input"
          />
          <button type="submit" disabled={loading || !folderPath}>
            {loading ? 'Searching...' : 'Find Duplicates'}
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
          <strong>Searching in:</strong> {currentPath}
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="results">
          <div className="summary">
            <h2>Found {duplicates.length} folder name(s) with duplicates</h2>
            <p className="total-count">Total duplicate folders: {totalDuplicates}</p>
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
              <>
                <button type="button" className="control-btn" onClick={expandAll}>
                  Expand All
                </button>
                <button type="button" className="control-btn" onClick={collapseAll}>
                  Collapse All
                </button>
              </>
            )}
          </div>

          {viewMode === 'table' ? (
            <div className="table-container">
              <table className="folders-table">
                <thead>
                  <tr>
                    <th>Folder Name</th>
                    <th>Files</th>
                    <th>Size</th>
                    <th>Path</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedDuplicates().map((group) => 
                    group.locations.map((location, locIndex) => (
                      <tr key={`${group.name}-${locIndex}`}>
                        <td className="folder-name-cell">📁 {group.name}</td>
                        <td className="stats-cell">{location.fileCount !== undefined ? location.fileCount : 'N/A'}</td>
                        <td className="stats-cell">{location.size !== undefined ? formatSize(location.size) : 'N/A'}</td>
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
                        <span className="folder-name-badge">📁 {group.name}</span>
                      </div>
                      <span className="count-badge">{group.count} occurrences</span>
                    </div>
                    {isExpanded && (
                      <div className="locations">
                        {group.locations.map((location, locIndex) => (
                          <div key={locIndex} className="location-item">
                            <span className="location-icon">📍</span>
                            <div className="location-details">
                              <span className="location-path">{typeof location === 'string' ? location : location.path}</span>
                              {location.fileCount !== undefined && (
                                <span className="location-stats">
                                  📄 {location.fileCount} files | 💾 {formatSize(location.size)}
                                </span>
                              )}
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
          <h3>No duplicate folder names found!</h3>
          <p>All folders in this directory have unique names.</p>
        </div>
      )}
    </div>
  );
}

export default DuplicateFinder;
