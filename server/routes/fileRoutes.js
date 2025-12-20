const express = require('express');
const fs = require('fs').promises;
const path = require('path');
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

// Endpoint to organize files by type and date
router.post('/api/organize-files', async (req, res) => {
  try {
    const { sourcePath, targetPath } = req.body;

    if (!sourcePath || !targetPath) {
      return res.status(400).json({ error: 'Source path and target path are required' });
    }

    // Validate paths exist
    try {
      await fs.access(sourcePath);
    } catch (error) {
      return res.status(404).json({ error: `Source path does not exist: ${sourcePath}` });
    }

    try {
      await fs.access(targetPath);
    } catch (error) {
      return res.status(404).json({ error: `Target path does not exist: ${targetPath}` });
    }

    // Get all files from source
    const allFiles = await getAllFiles(sourcePath);

    // Define file type categories
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.raw', '.heic'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.m4v', '.3gp'];

    let imagesMoved = 0;
    let videosMoved = 0;
    let duplicatesMoved = 0;
    let foldersCreated = new Set();
    const details = [];

    for (const file of allFiles) {
      const ext = file.extension.toLowerCase();
      let category = null;
      let categoryFolderName = null;

      if (imageExtensions.includes(ext)) {
        category = 'images';
        categoryFolderName = 'Photos';
      } else if (videoExtensions.includes(ext)) {
        category = 'videos';
        categoryFolderName = 'Videos';
      }

      if (category) {
        // Get file date
        const fileDate = new Date(file.modifiedDate);
        const day = String(fileDate.getDate()).padStart(2, '0');
        const month = String(fileDate.getMonth() + 1).padStart(2, '0');
        const year = fileDate.getFullYear();
        const dateStr = `${day}-${month}-${year}`; // DD-MM-YYYY format

        // Month names array
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[fileDate.getMonth()];

        // Create target directory structure: year/month/DD-MM-YYYY/Photos|Video
        const yearFolder = path.join(targetPath, year.toString());
        const monthFolder = path.join(yearFolder, monthName);
        const dateFolder = path.join(monthFolder, dateStr);
        const categoryFolder = path.join(dateFolder, categoryFolderName);

        // Create directories if they don't exist
        try {
          await fs.mkdir(categoryFolder, { recursive: true });
          foldersCreated.add(yearFolder);
          foldersCreated.add(monthFolder);
          foldersCreated.add(dateFolder);
          foldersCreated.add(categoryFolder);
        } catch (error) {
          if (error.code !== 'EEXIST') {
            details.push(`Failed to create directory ${categoryFolder}: ${error.message}`);
            continue;
          }
        }

        // Move file
        const fileName = path.basename(file.path);
        let targetFilePath = path.join(categoryFolder, fileName);
        let isDuplicate = false;

        // Check if file already exists at target location
        try {
          await fs.access(targetFilePath);
          isDuplicate = true;
        } catch (error) {
          // File doesn't exist, proceed with normal move
        }

        if (isDuplicate) {
          // Create duplicate folder structure in D:\Saroj\Memories\Organized Duplicate: year/month/DD-MM-YYYY/Photos|Video
          const memoriesBasePath = 'D:\\Saroj\\Memories\\Organized Duplicate';
          const duplicateYearFolder = path.join(memoriesBasePath, year.toString());
          const duplicateMonthFolder = path.join(duplicateYearFolder, monthName);
          const duplicateDateFolder = path.join(duplicateMonthFolder, dateStr);
          const duplicateCategoryFolder = path.join(duplicateDateFolder, categoryFolderName);

          // Create duplicate directories if they don't exist
          try {
            await fs.mkdir(duplicateCategoryFolder, { recursive: true });
            foldersCreated.add(memoriesBasePath);
            foldersCreated.add(duplicateYearFolder);
            foldersCreated.add(duplicateMonthFolder);
            foldersCreated.add(duplicateDateFolder);
            foldersCreated.add(duplicateCategoryFolder);
          } catch (error) {
            if (error.code !== 'EEXIST') {
              details.push(`Failed to create duplicate directory ${duplicateCategoryFolder}: ${error.message}`);
              continue;
            }
          }

          targetFilePath = path.join(duplicateCategoryFolder, fileName);
          duplicatesMoved++;
          details.push(`Duplicate moved ${fileName} to ${targetFilePath}`);
        }

        try {
          await fs.rename(file.path, targetFilePath);
          if (!isDuplicate) {
            if (category === 'images') {
              imagesMoved++;
            } else {
              videosMoved++;
            }
            details.push(`Moved ${fileName} to ${path.relative(targetPath, targetFilePath)}`);
          }
        } catch (error) {
          details.push(`Failed to move ${fileName}: ${error.message}`);
        }
      }
    }

    res.json({
      success: true,
      imagesMoved,
      videosMoved,
      duplicatesMoved,
      foldersCreated: foldersCreated.size,
      totalFilesProcessed: allFiles.length,
      details
    });

  } catch (error) {
    console.error('Error organizing files:', error);
    res.status(500).json({ error: 'Failed to organize files', details: error.message });
  }
});

// Endpoint to organize files by extension and year
router.post('/api/organize-files-by-extension', async (req, res) => {
  try {
    const { sourcePath, targetPath } = req.body;

    if (!sourcePath || !targetPath) {
      return res.status(400).json({ error: 'Source path and target path are required' });
    }

    // Validate paths exist
    try {
      await fs.access(sourcePath);
    } catch (error) {
      return res.status(404).json({ error: `Source path does not exist: ${sourcePath}` });
    }

    try {
      await fs.access(targetPath);
    } catch (error) {
      return res.status(404).json({ error: `Target path does not exist: ${targetPath}` });
    }

    // Get all files from source
    const allFiles = await getAllFiles(sourcePath);

    // Define file type categories to exclude (handled by media organizer)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.raw', '.heic'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.m4v', '.3gp'];

    let filesMoved = 0;
    let duplicatesMoved = 0;
    let foldersCreated = new Set();
    const extensionStats = {};
    const details = [];

    for (const file of allFiles) {
      const ext = file.extension.toLowerCase();

      // Skip files without extensions or with empty extensions
      if (!ext || ext === '') {
        continue;
      }

      // Check if file is an image or video - move to Media folder
      if (imageExtensions.includes(ext) || videoExtensions.includes(ext)) {
        const fileDate = new Date(file.modifiedDate);
        const year = fileDate.getFullYear();
        const month = String(fileDate.getMonth() + 1).padStart(2, '0');
        const day = String(fileDate.getDate()).padStart(2, '0');
        const dateStr = `${day}-${month}-${year}`;

        // Month names array
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[fileDate.getMonth()];

        // Determine category
        let categoryFolderName = null;
        if (imageExtensions.includes(ext)) {
          categoryFolderName = 'Photos';
        } else if (videoExtensions.includes(ext)) {
          categoryFolderName = 'Videos';
        }

        // Create Media structure: year/month/DD-MM-YYYY/Photos|Videos/
        const mediaBaseFolder = path.join(targetPath, 'Media');
        const mediaYearFolder = path.join(mediaBaseFolder, year.toString());
        const mediaMonthFolder = path.join(mediaYearFolder, monthName);
        const mediaDateFolder = path.join(mediaMonthFolder, dateStr);
        const mediaCategoryFolder = path.join(mediaDateFolder, categoryFolderName);

        // Create directories if they don't exist
        try {
          await fs.mkdir(mediaCategoryFolder, { recursive: true });
          foldersCreated.add(mediaBaseFolder);
          foldersCreated.add(mediaYearFolder);
          foldersCreated.add(mediaMonthFolder);
          foldersCreated.add(mediaDateFolder);
          foldersCreated.add(mediaCategoryFolder);
        } catch (error) {
          if (error.code !== 'EEXIST') {
            details.push(`Failed to create media directory ${mediaCategoryFolder}: ${error.message}`);
            continue;
          }
        }

        // Move file to media folder
        const fileName = path.basename(file.path);
        let mediaFilePath = path.join(mediaCategoryFolder, fileName);
        let isDuplicate = false;

        // Check if file already exists at target location
        try {
          await fs.access(mediaFilePath);
          isDuplicate = true;
        } catch (error) {
          // File doesn't exist, proceed with normal move
        }

        if (isDuplicate) {
          // Create duplicate folder structure in D:\File Sorted Duplicate\Media: year/month/DD-MM-YYYY/Photos|Videos/
          const duplicateBasePath = 'D:\\File Sorted Duplicate\\Media';
          const duplicateYearFolder = path.join(duplicateBasePath, year.toString());
          const duplicateMonthFolder = path.join(duplicateYearFolder, monthName);
          const duplicateDateFolder = path.join(duplicateMonthFolder, dateStr);
          const duplicateCategoryFolder = path.join(duplicateDateFolder, categoryFolderName);

          // Create duplicate directories if they don't exist
          try {
            await fs.mkdir(duplicateCategoryFolder, { recursive: true });
            foldersCreated.add(duplicateBasePath);
            foldersCreated.add(duplicateYearFolder);
            foldersCreated.add(duplicateMonthFolder);
            foldersCreated.add(duplicateDateFolder);
            foldersCreated.add(duplicateCategoryFolder);
          } catch (error) {
            if (error.code !== 'EEXIST') {
              details.push(`Failed to create duplicate directory ${duplicateCategoryFolder}: ${error.message}`);
              continue;
            }
          }

          mediaFilePath = path.join(duplicateCategoryFolder, fileName);
          duplicatesMoved++;
          details.push(`Media duplicate moved ${fileName} to ${mediaFilePath}`);
        }

        try {
          await fs.rename(file.path, mediaFilePath);
          if (!isDuplicate) {
            filesMoved++;
            details.push(`Media file moved ${fileName} to ${path.relative(targetPath, mediaFilePath)}`);
          }
        } catch (error) {
          details.push(`Failed to move media file ${fileName}: ${error.message}`);
        }
        continue; // Skip the rest of the loop for media files
      }

      // Get file date
      const fileDate = new Date(file.modifiedDate);
      const year = fileDate.getFullYear();

      // Create target directory structure: year/extension/
      const yearFolder = path.join(targetPath, year.toString());
      const extensionFolder = path.join(yearFolder, ext.substring(1)); // Remove the leading dot

      // Create directories if they don't exist
      try {
        await fs.mkdir(extensionFolder, { recursive: true });
        foldersCreated.add(yearFolder);
        foldersCreated.add(extensionFolder);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          details.push(`Failed to create directory ${extensionFolder}: ${error.message}`);
          continue;
        }
      }

      // Move file
      const fileName = path.basename(file.path);
      let targetFilePath = path.join(extensionFolder, fileName);
      let isDuplicate = false;

      // Check if file already exists at target location
      try {
        await fs.access(targetFilePath);
        isDuplicate = true;
      } catch (error) {
        // File doesn't exist, proceed with normal move
      }

      if (isDuplicate) {
        // Create duplicate folder structure in D:\File Sorted Duplicate: year/extension/
        const duplicateBasePath = 'D:\\File Sorted Duplicate';
        const duplicateYearFolder = path.join(duplicateBasePath, year.toString());
        const duplicateExtensionFolder = path.join(duplicateYearFolder, ext.substring(1)); // Remove the leading dot

        // Create duplicate directories if they don't exist
        try {
          await fs.mkdir(duplicateExtensionFolder, { recursive: true });
          foldersCreated.add(duplicateBasePath);
          foldersCreated.add(duplicateYearFolder);
          foldersCreated.add(duplicateExtensionFolder);
        } catch (error) {
          if (error.code !== 'EEXIST') {
            details.push(`Failed to create duplicate directory ${duplicateExtensionFolder}: ${error.message}`);
            continue;
          }
        }

        targetFilePath = path.join(duplicateExtensionFolder, fileName);
        duplicatesMoved++;
        details.push(`Duplicate moved ${fileName} to ${targetFilePath}`);
      }

      try {
        await fs.rename(file.path, targetFilePath);
        if (!isDuplicate) {
          filesMoved++;

          // Track extension statistics
          if (!extensionStats[ext]) {
            extensionStats[ext] = 0;
          }
          extensionStats[ext]++;

          details.push(`Moved ${fileName} to ${path.relative(targetPath, targetFilePath)}`);
        }
      } catch (error) {
        details.push(`Failed to move ${fileName}: ${error.message}`);
      }
    }

    // Convert extension stats to array for frontend
    const extensionStatsArray = Object.keys(extensionStats).map(ext => ({
      extension: ext.substring(1), // Remove leading dot for display
      count: extensionStats[ext]
    })).sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      filesMoved,
      duplicatesMoved,
      extensionsProcessed: extensionStatsArray.length,
      foldersCreated: foldersCreated.size,
      totalFilesProcessed: allFiles.length,
      extensionStats: extensionStatsArray,
      details
    });
  } catch (error) {
    console.error('Error organizing files by extension:', error);
    res.status(500).json({ error: 'Failed to organize files by extension', details: error.message });
  }
});

module.exports = router;