import React, { useState } from 'react';
import './MultiFileCompare.css';
import LoadingTimer from './LoadingTimer';

function MultiFileCompare() {
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
  const [totalDuplicates, setTotalDuplicates] = useState(0);
  const [fileCountsBySource, setFileCountsBySource] = useState({});
  const [totalFilesAnalyzed, setTotalFilesAnalyzed] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [viewMode, setViewMode] = useState('list');
  const [searchMode, setSearchMode] = useState('perfect');
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [selectedLocations, setSelectedLocations] = useState(new Set());

  const toggleLocationSelection = (filePath) => {
    const newSelected = new Set(selectedLocations);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedLocations(newSelected);
  };

  const toggleSelectAllInGroup = (group) => {
    const groupPaths = group.locations.map(l => l.path);
    const allSelected = groupPaths.every(path => selectedLocations.has(path));
    const newSelected = new Set(selectedLocations);
    
    groupPaths.forEach(path => {
      if (allSelected) {
        newSelected.delete(path);
      } else {
        newSelected.add(path);
      }
    });
    setSelectedLocations(newSelected);
  };

  const handleMultiDelete = async () => {
    if (selectedLocations.size === 0) {
      alert('Please select files to delete');
      return;
    }
    
    const confirmMsg = `Delete ${selectedLocations.size} selected file(s)?`;
    const ok = window.confirm(confirmMsg);
    if (!ok) return;

    try {
      const pathsToDelete = Array.from(selectedLocations);
      const errors = [];

      for (const filePath of pathsToDelete) {
        try {
          const res = await fetch('http://localhost:3001/api/delete-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: filePath }),
          });

          const data = await res.json();
          if (!res.ok) {
            errors.push(`${filePath}: ${data.error || 'Failed to delete'}`);
          }
        } catch (err) {
          errors.push(`${filePath}: ${err.message}`);
        }
      }

      setDuplicates(prev => {
        const updated = prev
          .map(g => ({ ...g, locations: g.locations.filter(l => !selectedLocations.has(l.path)) }))
          .filter(g => g.locations.length > 1);
        return updated;
      });
      setSelectedLocations(new Set());

      if (errors.length > 0) {
        alert(`Errors during deletion:\n${errors.join('\n')}`);
      } else {
        alert(`Successfully deleted ${pathsToDelete.length} file(s)`);
      }
    } catch (err) {
      alert('Delete operation failed: ' + err.message);
    }
  };

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
      const response = await fetch('http://localhost:3001/api/compare-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderPaths: validPaths, searchMode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to compare files');
      }

      setDuplicates(data.duplicates);
      setTotalDuplicates(data.totalDuplicateFiles);
      setFileCountsBySource(data.fileCountsBySource || {});
      setTotalFilesAnalyzed(data.totalFilesAnalyzed || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFileLocation = async (filePath) => {
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

      setDuplicates(prev => prev.map(g => ({ ...g, locations: g.locations.filter(l => l.path !== filePath) })).filter(g => g.locations.length > 1));
      setTotalDuplicates(prev => Math.max(0, prev - 1));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="multi-file-compare">
      <LoadingTimer isLoading={loading} message="Comparing files..." />
      
      <h1>Multi-File Compare</h1>
      <p className="subtitle">Compare multiple folder paths to find duplicate file names across them</p>
      
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
              <span className="radio-description">(Same name & size)</span>
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
            <button type="submit" disabled={loading} className="compare-btn">
              {loading ? 'Comparing...' : 'Compare Files'}
            </button>
          </div>
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
            <h2>Found {duplicates.length} duplicate file name(s)</h2>
            <p className="total-count">Total duplicate files: {totalDuplicates}</p>
            <p className="total-count">Total files analyzed: {totalFilesAnalyzed}</p>
            <p className="sources-count">Across {folderPaths.filter(p => p.trim()).length} source paths</p>
            {Object.keys(fileCountsBySource).length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong>Files per folder:</strong>
                <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                  {Object.entries(fileCountsBySource).map(([path, count], idx) => (
                    <li key={idx} style={{ marginBottom: '3px' }}>
                      <strong>{count} files</strong> from {path}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="results-controls">
            {selectedLocations.size > 0 && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>{selectedLocations.size} file(s) selected</span>
                <button type="button" className="delete-btn" onClick={handleMultiDelete}>
                  🗑 Delete Selected
                </button>
                <button type="button" className="control-btn" onClick={() => setSelectedLocations(new Set())}>
                  Clear Selection
                </button>
              </div>
            )}
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
                    <th style={{ width: '40px' }}>Select</th>
                    <th>File Name</th>
                    <th>Extension</th>
                    <th>Size</th>
                    <th>Modified Date</th>
                    <th>Source</th>
                    <th>Path</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedDuplicates().map((group) => 
                    group.locations.map((location, locIndex) => {
                      const isSelected = selectedLocations.has(location.path);
                      return (
                      <tr key={`${group.name}-${locIndex}`} style={{ backgroundColor: isSelected ? '#e3f2fd' : 'transparent' }}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleLocationSelection(location.path)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td className="file-name-cell">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {showThumbnails && isImageFile(group.name) ? (
                              <img 
                                src={getImagePreviewUrl(location.path)} 
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
                        <td className="source-cell">{location.source}</td>
                        <td className="path-cell">{location.path}</td>
                        <td className="action-cell">
                          <button className="delete-btn" onClick={() => handleDeleteFileLocation(location.path)} title="Delete file">🗑 Delete</button>
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="duplicate-groups">
              {getSortedDuplicates().map((group, index) => {
                const isExpanded = expandedGroups.has(index);
                const allSelected = group.locations.every(l => selectedLocations.has(l.path));
                return (
                  <div key={index} className="duplicate-group">
                    <div className="group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }} onClick={() => toggleGroup(index)}>
                        <span className="expand-indicator">{isExpanded ? '▼' : '▶'}</span>
                        <span className="file-name-badge">📄 {group.name}</span>
                        <span className="count-badge">{group.count} occurrences</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => toggleSelectAllInGroup(group)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer', marginRight: '10px' }}
                        title="Select all in this group"
                      />
                    </div>
                    {isExpanded && (
                      <div className="locations">
                        {group.locations.map((location, locIndex) => {
                          const isSelected = selectedLocations.has(location.path);
                          return (
                          <div key={locIndex} className="location-item" style={{ backgroundColor: isSelected ? '#e3f2fd' : 'transparent' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleLocationSelection(location.path)}
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {showThumbnails && isImageFile(group.name) ? (
                                <img 
                                  src={getImagePreviewUrl(location.path)} 
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
                                <span className="location-path">{location.path}</span>
                                <span className="location-source">From: {location.source}</span>
                                {location.size !== undefined && (
                                  <span className="location-stats">
                                    💾 {formatSize(location.size)} | 📅 {formatDate(location.modifiedDate)}
                                  </span>
                                )}
                              </div>
                              <div className="location-actions">
                                <button className="delete-btn" onClick={() => handleDeleteFileLocation(location.path)} title="Delete file">🗑 Delete</button>
                              </div>
                            </div>
                          </div>
                        );
                        })}
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
          <h3>No duplicate file names found!</h3>
          <p>All files across the specified paths have unique names.</p>
        </div>
      )}
    </div>
  );
}

export default MultiFileCompare;
