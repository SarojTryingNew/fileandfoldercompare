const express = require('express');
const fs = require('fs').promises;
const router = express.Router();

// Endpoint to delete a file
router.post('/api/delete-file', async (req, res) => {
  try {
    const { path: filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'File not found' });
      }
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file', details: error.message });
  }
});

// Endpoint to delete a folder (recursive)
router.post('/api/delete-folder', async (req, res) => {
  try {
    const { path: folderPath } = req.body;

    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' });
    }

    try {
      if (fs.rm) {
        await fs.rm(folderPath, { recursive: true, force: true });
      } else {
        // Fallback for older Node versions
        await fs.rmdir(folderPath, { recursive: true });
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'Folder not found' });
      }
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder', details: error.message });
  }
});

module.exports = router;