import React from 'react';
import './Home.css';

function Home({ onNavigate }) {
  return (
    <div className="home">
      <div className="home-header">
        <h1>Welcome to File & Folder Manager</h1>
        <p className="tagline">Manage and explore your files and folders with ease</p>
      </div>

      <div className="menu-grid">
        <div className="menu-card" onClick={() => onNavigate('folder-browser')}>
          <div className="menu-icon">📁</div>
          <h3>Folder Browser</h3>
          <p>Browse and list all folders and subfolders from any directory path</p>
          <span className="menu-arrow">→</span>
        </div>

        <div className="menu-card" onClick={() => onNavigate('duplicate-finder')}>
          <div className="menu-icon">🔍📁</div>
          <h3>Duplicate Folder Finder</h3>
          <p>Find and group folders with duplicate names in your directory</p>
          <span className="menu-arrow">→</span>
        </div>

        <div className="menu-card" onClick={() => onNavigate('multi-folder-compare')}>
          <div className="menu-icon">📂⚖️</div>
          <h3>Multi-Folder Compare</h3>
          <p>Compare multiple folder paths to find duplicate names across them</p>
          <span className="menu-arrow">→</span>
        </div>

        <div className="menu-card" onClick={() => onNavigate('file-browser')}>
          <div className="menu-icon">📄</div>
          <h3>File Browser</h3>
          <p>Browse and list all files from any directory path</p>
          <span className="menu-arrow">→</span>
        </div>

        <div className="menu-card" onClick={() => onNavigate('duplicate-file-finder')}>
          <div className="menu-icon">🔎📄</div>
          <h3>Duplicate File Finder</h3>
          <p>Find and group files with duplicate names in your directory</p>
          <span className="menu-arrow">→</span>
        </div>

        <div className="menu-card" onClick={() => onNavigate('multi-file-compare')}>
          <div className="menu-icon">📋⚖️</div>
          <h3>Multi-File Compare</h3>
          <p>Compare multiple paths to find duplicate file names across them</p>
          <span className="menu-arrow">→</span>
        </div>
      </div>

      <div className="home-footer">
        <p>Select an option above to get started</p>
      </div>
    </div>
  );
}

export default Home;
