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
  const [selectedLocations, setSelectedLocations] = useState(new Set());

  const toggleLocationSelection = (folderPath) => {
    const newSelected = new Set(selectedLocations);
    if (newSelected.has(folderPath)) {
      newSelected.delete(folderPath);
    } else {
      newSelected.add(folderPath);
    }
    setSelectedLocations(newSelected);
  };

  const toggleSelectAllInGroup = (group) => {
    const groupPaths = group.locations.map(l => typeof l === 'string' ? l : l.path);
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
      alert('Please select folders to delete');
      return;
    }
    
    const confirmMsg = `Delete ${selectedLocations.size} selected folder(s) and all contents?`;
    const ok = window.confirm(confirmMsg);
    if (!ok) return;

    try {
      const pathsToDelete = Array.from(selectedLocations);
      const errors = [];

      for (const folderPath of pathsToDelete) {
        try {
          const res = await fetch('http://localhost:3001/api/delete-folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: folderPath }),
          });

          const data = await res.json();
          if (!res.ok) {
            errors.push(`${folderPath}: ${data.error || 'Failed to delete'}`);
          }
        } catch (err) {
          errors.push(`${folderPath}: ${err.message}`);
        }
      }

      setDuplicates(prev => {
        const updated = prev
          .map(g => ({ ...g, locations: g.locations.filter(l => !selectedLocations.has(typeof l === 'string' ? l : l.path)) }))
          .filter(g => g.locations && g.locations.length > 1);
        return updated;
      });
      setSelectedLocations(new Set());

      if (errors.length > 0) {
        alert(`Errors during deletion:\n${errors.join('\n')}`);
      } else {
        alert(`Successfully deleted ${pathsToDelete.length} folder(s)`);
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

  const handleDeleteFolderLocation = async (folderPathToDelete) => {
    const ok = window.confirm(`Delete folder and all contents? ${folderPathToDelete}`);
    if (!ok) return;

    try {
      const res = await fetch('http://localhost:3001/api/delete-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPathToDelete }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete folder');

      setDuplicates(prev => prev
        .map(g => ({ ...g, locations: g.locations.filter(l => (typeof l === 'string' ? l : l.path) !== folderPathToDelete) }))
        .filter(g => g.locations && g.locations.length > 1)
      );

      setTotalDuplicates(prev => Math.max(0, prev - 1));
    } catch (err) {
      alert('Delete failed: ' + err.message);
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
            {selectedLocations.size > 0 && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>{selectedLocations.size} folder(s) selected</span>
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
                    <th style={{ width: '40px' }}>Select</th>
                    <th>Folder Name</th>
                    <th>Files</th>
                    <th>Size</th>
                    <th>Path</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedDuplicates().map((group) => 
                    group.locations.map((location, locIndex) => {
                      const folderPath = typeof location === 'string' ? location : location.path;
                      const isSelected = selectedLocations.has(folderPath);
                      return (
                      <tr key={`${group.name}-${locIndex}`} style={{ backgroundColor: isSelected ? '#e3f2fd' : 'transparent' }}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleLocationSelection(folderPath)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td className="folder-name-cell">📁 {group.name}</td>
                        <td className="stats-cell">{location.fileCount !== undefined ? location.fileCount : 'N/A'}</td>
                        <td className="stats-cell">{location.size !== undefined ? formatSize(location.size) : 'N/A'}</td>
                        <td className="path-cell">{folderPath}</td>
                        <td className="action-cell">
                          <button className="delete-btn" onClick={() => handleDeleteFolderLocation(folderPath)} title="Delete folder">🗑 Delete</button>
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
                const allSelected = group.locations.every(l => selectedLocations.has(typeof l === 'string' ? l : l.path));
                return (
                  <div key={index} className="duplicate-group">
                    <div className="group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }} onClick={() => toggleGroup(index)}>
                        <span className="expand-indicator">{isExpanded ? '▼' : '▶'}</span>
                        <span className="folder-name-badge">📁 {group.name}</span>
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
                          const folderPath = typeof location === 'string' ? location : location.path;
                          const isSelected = selectedLocations.has(folderPath);
                          return (
                          <div key={locIndex} className="location-item" style={{ backgroundColor: isSelected ? '#e3f2fd' : 'transparent' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleLocationSelection(folderPath)}
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="location-icon">📍</span>
                            <div className="location-details">
                              <span className="location-path">{folderPath}</span>
                              {location.fileCount !== undefined && (
                                <span className="location-stats">
                                  📄 {location.fileCount} files | 💾 {formatSize(location.size)}
                                </span>
                              )}
                            </div>
                            <div className="location-actions">
                              <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteFolderLocation(folderPath); }} title="Delete folder">🗑 Delete</button>
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
