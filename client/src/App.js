import React, { useState } from 'react';
import './App.css';
import Home from './Home';
import FolderBrowser from './FolderBrowser';
import DuplicateFinder from './DuplicateFinder';
import MultiFolderCompare from './MultiFolderCompare';
import FileBrowser from './FileBrowser';
import DuplicateFileFinder from './DuplicateFileFinder';
import MultiFileCompare from './MultiFileCompare';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="App">
      <div className="app-header">
        <div className="logo" onClick={() => setCurrentPage('home')}>
          📂 File & Folder Manager
        </div>
        {currentPage !== 'home' && (
          <button className="back-btn" onClick={() => setCurrentPage('home')}>
            ← Back to Home
          </button>
        )}
      </div>
      
      <div className="container">
        {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
        {currentPage === 'folder-browser' && <FolderBrowser />}
        {currentPage === 'duplicate-finder' && <DuplicateFinder />}
        {currentPage === 'multi-folder-compare' && <MultiFolderCompare />}
        {currentPage === 'file-browser' && <FileBrowser />}
        {currentPage === 'duplicate-file-finder' && <DuplicateFileFinder />}
        {currentPage === 'multi-file-compare' && <MultiFileCompare />}
      </div>
    </div>
  );
}

export default App;
