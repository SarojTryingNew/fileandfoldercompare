import React, { useState } from 'react';
import './FileOrganizerByExtension.css';
import LoadingTimer from './LoadingTimer';

function FileOrganizerByExtension() {
  const [sourcePath, setSourcePath] = useState('');
  const [targetPath, setTargetPath] = useState('D:\\File Sorted');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/organize-files-by-extension', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourcePath, targetPath }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to organize files');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-organizer-by-extension">
      <LoadingTimer isLoading={loading} message="Organizing files..." />

      <h1>Document Organizer</h1>
      <p className="subtitle">Organize documents and files (excluding images/videos) by year and file extension</p>

      <form onSubmit={handleSubmit} className="organizer-form">
        <div className="input-group">
          <label htmlFor="sourcePath">Source Folder Path:</label>
          <input
            id="sourcePath"
            type="text"
            value={sourcePath}
            onChange={(e) => setSourcePath(e.target.value)}
            placeholder="Enter source folder path (e.g., C:\Users\YourName\Downloads)"
            className="path-input"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="targetPath">Target Folder Path:</label>
          <input
            id="targetPath"
            type="text"
            value={targetPath}
            onChange={(e) => setTargetPath(e.target.value)}
            placeholder="Enter target folder path (default: D:\File Sorted)"
            className="path-input"
            required
          />
          <small className="input-help">Files will be organized into year/extension folders (excludes images & videos)</small>
        </div>

        <button type="submit" disabled={loading || !sourcePath || !targetPath}>
          {loading ? 'Organizing...' : 'Organize Files'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="results">
          <h2>Organization Complete!</h2>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">Files moved:</span>
              <span className="stat-value">{result.filesMoved}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Extensions processed:</span>
              <span className="stat-value">{result.extensionsProcessed}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Folders created:</span>
              <span className="stat-value">{result.foldersCreated}</span>
            </div>
          </div>

          {result.extensionStats && result.extensionStats.length > 0 && (
            <div className="extension-breakdown">
              <h3>Files by Extension:</h3>
              <div className="extension-grid">
                {result.extensionStats.map((stat, index) => (
                  <div key={index} className="extension-item">
                    <span className="extension-name">.{stat.extension}</span>
                    <span className="extension-count">{stat.count} files</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.details && result.details.length > 0 && (
            <div className="details">
              <h3>Details:</h3>
              <ul>
                {result.details.slice(0, 10).map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
                {result.details.length > 10 && (
                  <li>... and {result.details.length - 10} more operations</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FileOrganizerByExtension;