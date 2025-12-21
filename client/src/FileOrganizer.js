import React, { useState } from 'react';
import './FileOrganizer.css';
import LoadingTimer from './LoadingTimer';

function FileOrganizer() {
  const [sourcePath, setSourcePath] = useState('');
  const [targetPath, setTargetPath] = useState('D:\\Saroj\\Memories\\Organized');
  const [dateField, setDateField] = useState('date');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/organize-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourcePath, targetPath, dateField }),
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
    <div className="file-organizer">
      <LoadingTimer isLoading={loading} message="Organizing files..." />

      <h1>Media Organizer</h1>
      <p className="subtitle">Organize images and videos by date into year/month/date/Photos|Videos folders</p>

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
            placeholder="Enter target folder path (default: D:\Saroj\Memories\Organized)"
            className="path-input"
            required
          />
          <small className="input-help">Files will be organized into year/MonthName/DD-MM-YYYY/Photos|Videos folders</small>
        </div>

        <div className="input-group">
          <label htmlFor="dateField">Date Field to Use:</label>
          <select
            id="dateField"
            value={dateField}
            onChange={(e) => setDateField(e.target.value)}
            className="date-select"
          >
            <option value="modifiedDate">Date Modified</option>
            <option value="createdDate">Date Created</option>
            <option value="date">Date</option>
          </select>
          <small className="input-help">Select which date field to use for organizing files</small>
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
              <span className="stat-label">Images moved:</span>
              <span className="stat-value">{result.imagesMoved}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Videos moved:</span>
              <span className="stat-value">{result.videosMoved}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Folders created:</span>
              <span className="stat-value">{result.foldersCreated}</span>
            </div>
          </div>

          {result.details && result.details.length > 0 && (
            <div className="details">
              <h3>Details:</h3>
              <ul>
                {result.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FileOrganizer;