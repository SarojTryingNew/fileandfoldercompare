const express = require('express');
const fs = require('fs').promises;
const router = express.Router();
const { getAllFiles } = require('../utils/fileSystem');
const { findDuplicateFiles } = require('../utils/duplicateFinder');

// Endpoint to list files in a given directory
router.post('/api/list-files', async (req, res) => {
  try {
    const { folderPath } = req.body;

    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' });
    }

    try {
      await fs.access(folderPath);
    } catch (error) {
      return res.status(404).json({ error: 'Path does not exist' });
    }

    const files = await getAllFiles(folderPath);

    res.json({
      path: folderPath,
      files: files,
      count: files.length
    });

  } catch (error) {
    console.error('Error reading directory:', error);
    res.status(500).json({ error: 'Failed to read directory', details: error.message });
  }
});

// Endpoint to find duplicate file names
router.post('/api/find-duplicate-files', async (req, res) => {
  try {
    const { folderPath, searchMode = 'perfect' } = req.body;

    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' });
    }

    try {
      await fs.access(folderPath);
    } catch (error) {
      return res.status(404).json({ error: 'Path does not exist' });
    }

    const allFiles = await getAllFiles(folderPath);

    // Find duplicates
    const { duplicates, totalDuplicateFiles } = findDuplicateFiles(allFiles, searchMode);

    res.json({
      path: folderPath,
      duplicates: duplicates,
      totalDuplicateFiles: totalDuplicateFiles,
      totalFilesAnalyzed: allFiles.length
    });

  } catch (error) {
    console.error('Error finding duplicate files:', error);
    res.status(500).json({ error: 'Failed to find duplicate files', details: error.message });
  }
});

// Endpoint to compare multiple paths for duplicate files
router.post('/api/compare-files', async (req, res) => {
  try {
    const { folderPaths, searchMode = 'perfect' } = req.body;

    if (!folderPaths || !Array.isArray(folderPaths) || folderPaths.length < 2) {
      return res.status(400).json({ error: 'At least 2 folder paths are required' });
    }

    for (const folderPath of folderPaths) {
      try {
        await fs.access(folderPath);
      } catch (error) {
        return res.status(404).json({ error: `Path does not exist: ${folderPath}` });
      }
    }

    const allFilesWithSource = [];
    const fileCountsBySource = {};

    for (const sourcePath of folderPaths) {
      const files = await getAllFiles(sourcePath);
      fileCountsBySource[sourcePath] = files.length;
      files.forEach(file => {
        allFilesWithSource.push({
          name: file.name,
          path: file.path,
          source: sourcePath,
          size: file.size,
          extension: file.extension,
          modifiedDate: file.modifiedDate
        });
      });
    }

    // Find duplicates
    const { duplicates, totalDuplicateFiles } = findDuplicateFiles(allFilesWithSource, searchMode);

    res.json({
      duplicates: duplicates,
      totalDuplicateFiles: totalDuplicateFiles,
      sourcePaths: folderPaths,
      fileCountsBySource: fileCountsBySource,
      totalFilesAnalyzed: allFilesWithSource.length
    });

  } catch (error) {
    console.error('Error comparing files:', error);
    res.status(500).json({ error: 'Failed to compare files', details: error.message });
  }
});

module.exports = router;