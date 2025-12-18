const express = require('express');
const fs = require('fs').promises;
const router = express.Router();
const { getAllFolders } = require('../utils/fileSystem');
const { findDuplicateFolders } = require('../utils/duplicateFinder');

// Endpoint to serve image files for preview
router.get('/api/image-preview', async (req, res) => {
  try {
    const { filePath: imagePath } = req.query;

    if (!imagePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Verify file exists
    try {
      await fs.access(imagePath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if it's an image file
    const ext = require('path').extname(imagePath).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'];

    if (!imageExtensions.includes(ext)) {
      return res.status(400).json({ error: 'File is not an image' });
    }

    // Set content type based on extension
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };

    res.setHeader('Content-Type', contentTypes[ext] || 'image/jpeg');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Disable caching
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const fileStream = require('fs').createReadStream(imagePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image', details: error.message });
  }
});

// Endpoint to list folders in a given directory
router.post('/api/list-folders', async (req, res) => {
  try {
    const { folderPath } = req.body;

    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' });
    }

    // Check if path exists
    try {
      await fs.access(folderPath);
    } catch (error) {
      return res.status(404).json({ error: 'Path does not exist' });
    }

    // Get all folders recursively
    const folders = await getAllFolders(folderPath);

    res.json({
      path: folderPath,
      folders: folders,
      count: folders.length
    });

  } catch (error) {
    console.error('Error reading directory:', error);
    res.status(500).json({ error: 'Failed to read directory', details: error.message });
  }
});

// Endpoint to find duplicate folder names
router.post('/api/find-duplicates', async (req, res) => {
  try {
    const { folderPath, searchMode = 'perfect' } = req.body;

    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' });
    }

    // Check if path exists
    try {
      await fs.access(folderPath);
    } catch (error) {
      return res.status(404).json({ error: 'Path does not exist' });
    }

    // Get all folders recursively
    const allFolders = await getAllFolders(folderPath);

    // Find duplicates
    const { duplicates, totalDuplicateFolders } = findDuplicateFolders(allFolders, searchMode);

    res.json({
      path: folderPath,
      duplicates: duplicates,
      totalDuplicateFolders: totalDuplicateFolders
    });

  } catch (error) {
    console.error('Error finding duplicates:', error);
    res.status(500).json({ error: 'Failed to find duplicates', details: error.message });
  }
});

// Endpoint to compare multiple folders and find duplicates
router.post('/api/compare-folders', async (req, res) => {
  try {
    const { folderPaths, searchMode = 'perfect' } = req.body;

    if (!folderPaths || !Array.isArray(folderPaths) || folderPaths.length < 2) {
      return res.status(400).json({ error: 'At least 2 folder paths are required' });
    }

    // Validate all paths exist
    for (const folderPath of folderPaths) {
      try {
        await fs.access(folderPath);
      } catch (error) {
        return res.status(404).json({ error: `Path does not exist: ${folderPath}` });
      }
    }

    // Get all folders from each path
    const allFoldersWithSource = [];

    for (const sourcePath of folderPaths) {
      const folders = await getAllFolders(sourcePath);
      folders.forEach(folder => {
        allFoldersWithSource.push({
          name: folder.name,
          path: folder.path,
          source: sourcePath,
          size: folder.size,
          fileCount: folder.fileCount
        });
      });
    }

    // Find duplicates
    const { duplicates, totalDuplicateFolders } = findDuplicateFolders(allFoldersWithSource, searchMode);

    res.json({
      duplicates: duplicates,
      totalDuplicateFolders: totalDuplicateFolders,
      sourcePaths: folderPaths
    });

  } catch (error) {
    console.error('Error comparing folders:', error);
    res.status(500).json({ error: 'Failed to compare folders', details: error.message });
  }
});

module.exports = router;