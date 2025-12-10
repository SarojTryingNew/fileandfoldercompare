import React, { useState } from 'react';
import './MultiFolderCompare.css';
import LoadingTimer from './LoadingTimer';

function MultiFolderCompare() {
  const [folderPaths, setFolderPaths] = useState(['', '']);
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
  const [totalDuplicates, setTotalDuplicates] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [viewMode, setViewMode] = useState('list');
  const [searchMode, setSearchMode] = useState('perfect');

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

  const addFolderPath = () => {
    setFolderPaths([...folderPaths, '']);
  };

  const removeFolderPath = (index) => {
    if (folderPaths.length > 2) {
      const newPaths = folderPaths.filter((_, i) => i !== index);
      setFolderPaths(newPaths);
    }
  };

  const updateFolderPath = (index, value) => {
    const newPaths = [...folderPaths];
    newPaths[index] = value;
    setFolderPaths(newPaths);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty paths
    const validPaths = folderPaths.filter(path => path.trim() !== '');
    
    if (validPaths.length < 2) {
      setError('Please enter at least 2 folder paths');
      return;
    }

    setLoading(true);
    setError('');
    setDuplicates([]);
    setTotalDuplicates(0);

    try {
      const response = await fetch('http://localhost:3001/api/compare-folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderPaths: validPaths, searchMode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to compare folders');
      }

      setDuplicates(data.duplicates);
      setTotalDuplicates(data.totalDuplicateFolders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="multi-folder-compare">
      <LoadingTimer isLoading={loading} message="Comparing folders..." />
      
      <h1>Multi-Folder Compare</h1>
      <p className="subtitle">Compare multiple folder paths to find duplicate folder names across them</p>
      
      <form onSubmit={handleSubmit} className="compare-form">
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
        <div className="folder-paths-container">
          {folderPaths.map((path, index) => (
            <div key={index} className="path-row">
              <span className="path-label">Path {index + 1}:</span>
              <input
                type="text"
                value={path}
                onChange={(e) => updateFolderPath(index, e.target.value)}
                placeholder={`Enter folder path ${index + 1} (e.g., C:\\Users\\YourName\\Documents)`}
                className="path-input"
              />
              {folderPaths.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeFolderPath(index)}
                  className="remove-btn"
                  title="Remove this path"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="button" onClick={addFolderPath} className="add-path-btn">
            ➕ Add Another Path
          </button>
          <button type="submit" disabled={loading} className="compare-btn">
            {loading ? 'Comparing...' : 'Compare Folders'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="results">
          <div className="summary">
            <h2>Found {duplicates.length} duplicate folder name(s)</h2>
            <p className="total-count">Total duplicate folders: {totalDuplicates}</p>
            <p className="sources-count">Across {folderPaths.filter(p => p.trim()).length} source paths</p>
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
                    <th>Source</th>
                    <th>Path</th>
                  </tr>
                </thead>
                <tbody>
                  {duplicates.map((group) => 
                    group.locations.map((location, locIndex) => (
                      <tr key={`${group.name}-${locIndex}`}>
                        <td className="folder-name-cell">📁 {group.name}</td>
                        <td className="stats-cell">{location.fileCount !== undefined ? location.fileCount : 'N/A'}</td>
                        <td className="stats-cell">{location.size !== undefined ? formatSize(location.size) : 'N/A'}</td>
                        <td className="source-cell">{location.source}</td>
                        <td className="path-cell">{location.path}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="duplicate-groups">
            {duplicates.map((group, index) => {
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
                            <span className="location-path">{location.path}</span>
                            <span className="location-source">From: {location.source}</span>
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

      {duplicates.length === 0 && !loading && folderPaths.some(p => p.trim()) && !error && (
        <div className="no-results">
          <div className="success-icon">✓</div>
          <h3>No duplicate folder names found!</h3>
          <p>All folders across the specified paths have unique names.</p>
        </div>
      )}
    </div>
  );
}

export default MultiFolderCompare;
