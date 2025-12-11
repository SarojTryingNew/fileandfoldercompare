import React, { useState } from 'react';
import './FolderBrowser.css';
import LoadingTimer from './LoadingTimer';

function FolderBrowser() {
  const [folderPath, setFolderPath] = useState('');
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'list', 'table', or 'tree'
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [sortBy, setSortBy] = useState('name'); // 'name', 'fileCount', or 'size'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedFolders, setSelectedFolders] = useState(new Set());

  const toggleFolder = (folderPath) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const sortFolders = (foldersToSort) => {
    const sorted = [...foldersToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          break;
        case 'fileCount':
          comparison = a.fileCount - b.fileCount;
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with ascending order
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '⇅';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const buildTree = (folders) => {
    const tree = [];
    const map = {};

    // Create a map of all folders
    folders.forEach(folder => {
      map[folder.path] = { ...folder, children: [] };
    });

    // Build the tree structure
    folders.forEach(folder => {
      const parentPath = folder.path.substring(0, folder.path.lastIndexOf('\\'));
      if (map[parentPath]) {
        map[parentPath].children.push(map[folder.path]);
      } else {
        tree.push(map[folder.path]);
      }
    });

    return tree;
  };

  const renderTreeNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedFolders.has(node.path);
    const indent = level * 24;

    return (
      <div key={node.path}>
        <div 
          className="tree-node" 
          style={{ paddingLeft: `${indent}px` }}
          onClick={() => hasChildren && toggleFolder(node.path)}
        >
          {hasChildren && (
            <span className="expand-icon">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!hasChildren && <span className="expand-icon-placeholder"></span>}
          <span className="folder-icon">📁</span>
          <span className="tree-node-name">{node.name}</span>
          {hasChildren && (
            <span className="children-count">({node.children.length})</span>
          )}
          <span className="folder-stats">
            {node.fileCount} files • {formatSize(node.size)}
          </span>
          <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(node.path); }} title="Delete folder">🗑</button>
        </div>
        {hasChildren && isExpanded && (
          <div className="tree-children">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFolders([]);

    try {
      const response = await fetch('http://localhost:3001/api/list-folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderPath }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch folders');
      }

      setFolders(data.folders);
      setCurrentPath(data.path);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folderPathToDelete) => {
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

      setFolders(prev => prev.filter(f => f.path !== folderPathToDelete));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const toggleFolderSelection = (folderPath) => {
    const newSelected = new Set(selectedFolders);
    if (newSelected.has(folderPath)) {
      newSelected.delete(folderPath);
    } else {
      newSelected.add(folderPath);
    }
    setSelectedFolders(newSelected);
  };

  const toggleAllFolders = () => {
    if (selectedFolders.size === folders.length) {
      setSelectedFolders(new Set());
    } else {
      setSelectedFolders(new Set(folders.map(f => f.path)));
    }
  };

  const handleBulkDeleteFolders = async () => {
    if (selectedFolders.size === 0) {
      alert('Please select folders to delete');
      return;
    }

    const count = selectedFolders.size;
    const ok = window.confirm(`Delete ${count} folder(s) and all their contents? This action cannot be undone.`);
    if (!ok) return;

    try {
      let successCount = 0;
      let failedCount = 0;

      for (const folderPath of selectedFolders) {
        try {
          const res = await fetch('http://localhost:3001/api/delete-folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: folderPath }),
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

      setFolders(prev => prev.filter(f => !selectedFolders.has(f.path)));
      setSelectedFolders(new Set());

      if (failedCount > 0) {
        alert(`Deleted ${successCount} folder(s). ${failedCount} folder(s) failed.`);
      } else {
        alert(`Successfully deleted ${successCount} folder(s)`);
      }
    } catch (err) {
      alert('Bulk delete failed: ' + err.message);
    }
  };

  return (
    <div className="folder-browser">
      <LoadingTimer isLoading={loading} message="Scanning folders..." />
      
      <h1>Folder Browser</h1>
      
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          placeholder="Enter folder path (e.g., C:\Users\YourName\Documents)"
          className="path-input"
        />
        <button type="submit" disabled={loading || !folderPath}>
          {loading ? 'Loading...' : 'List Folders'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {currentPath && (
        <div className="current-path">
          <strong>Current Path:</strong> {currentPath}
        </div>
      )}

      {folders.length > 0 && (
        <div className="results">
          <div className="results-header">
            <h2>Found {folders.length} folder(s)</h2>
            {selectedFolders.size > 0 && <p style={{ marginTop: '5px', color: '#666' }}>{selectedFolders.size} selected</p>}
            {selectedFolders.size > 0 && (
              <button type="button" onClick={handleBulkDeleteFolders} className="bulk-delete-btn" style={{ backgroundColor: '#dc3545', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                🗑 Delete Selected ({selectedFolders.size})
              </button>
            )}
            <div className="controls-row">
              <div className="sort-controls">
                <label>Sort by:</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="name">Name</option>
                  <option value="fileCount">File Count</option>
                  <option value="size">Size</option>
                </select>
                <button
                  type="button"
                  className="sort-order-btn"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                </button>
              </div>
              <div className="view-toggle">
                <button
                  type="button"
                  className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  📊 Table View
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${viewMode === 'tree' ? 'active' : ''}`}
                  onClick={() => setViewMode('tree')}
                >
                  🌳 Tree View
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  📋 List View
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'list' ? (
            <ul className="folder-list">
              {sortFolders(folders).map((folder, index) => (
                <li key={index} className="folder-item" style={{ paddingLeft: `${folder.depth * 20 + 16}px` }}>
                  <input type="checkbox" checked={selectedFolders.has(folder.path)} onChange={() => toggleFolderSelection(folder.path)} style={{ cursor: 'pointer', marginRight: '10px' }} />
                  <span className="folder-icon">📁</span>
                  <div className="folder-info">
                    <div className="folder-name">{folder.name}</div>
                    <div className="folder-meta">
                      <span className="meta-item">📄 {folder.fileCount} files</span>
                      <span className="meta-divider">•</span>
                      <span className="meta-item">💾 {formatSize(folder.size)}</span>
                    </div>
                    <div className="folder-path">{folder.path}</div>
                    <div className="folder-actions">
                      <button className="delete-btn" onClick={() => handleDeleteFolder(folder.path)} title="Delete folder">🗑 Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : viewMode === 'table' ? (
            <div className="table-container">
              <table className="folder-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" checked={selectedFolders.size === folders.length && folders.length > 0} onChange={toggleAllFolders} style={{ cursor: 'pointer' }} />
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('name')}>
                      Folder Name {getSortIcon('name')}
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('fileCount')}>
                      Files {getSortIcon('fileCount')}
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('size')}>
                      Size {getSortIcon('size')}
                    </th>
                    <th>Full Path</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortFolders(folders).map((folder, index) => {
                    return (
                      <tr key={index} className="table-row">
                        <td style={{ width: '40px', textAlign: 'center' }}>
                          <input type="checkbox" checked={selectedFolders.has(folder.path)} onChange={() => toggleFolderSelection(folder.path)} style={{ cursor: 'pointer' }} />
                        </td>
                        <td className="name-cell">{folder.name}</td>
                        <td className="stats-cell">{folder.fileCount}</td>
                        <td className="stats-cell">{formatSize(folder.size)}</td>
                        <td className="path-cell">{folder.path}</td>
                        <td className="action-cell">
                          <button className="delete-btn" onClick={() => handleDeleteFolder(folder.path)} title="Delete folder">🗑 Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="tree-view">
              <div className="tree-controls">
                <button 
                  type="button" 
                  className="tree-control-btn"
                  onClick={() => {
                    const allPaths = new Set(folders.map(f => f.path));
                    setExpandedFolders(allPaths);
                  }}
                >
                  Expand All
                </button>
                <button 
                  type="button" 
                  className="tree-control-btn"
                  onClick={() => setExpandedFolders(new Set())}
                >
                  Collapse All
                </button>
              </div>
              <div className="tree-container">
                {buildTree(folders).map(node => renderTreeNode(node))}
              </div>
            </div>
          )}
        </div>
      )}

      {folders.length === 0 && currentPath && !loading && (
        <div className="no-results">
          No folders found in this directory.
        </div>
      )}
    </div>
  );
}

export default FolderBrowser;
