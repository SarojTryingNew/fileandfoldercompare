const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Endpoint to serve image files for preview
app.get('/api/image-preview', async (req, res) => {
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
    const ext = path.extname(imagePath).toLowerCase();
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

// Recursive function to get all folders and subfolders
async function getAllFolders(dirPath, depth = 0, maxDepth = 10) {
  const results = [];
  
  if (depth > maxDepth) {
    return results; // Prevent infinite recursion
  }

  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        const fullPath = path.join(dirPath, item.name);
        
        // Get folder stats
        let fileCount = 0;
        let folderSize = 0;
        try {
          const stats = await getFolderStats(fullPath);
          fileCount = stats.fileCount;
          folderSize = stats.size;
        } catch (err) {
          console.log(`Could not get stats for ${fullPath}: ${err.message}`);
        }
        
        results.push({
          name: item.name,
          path: fullPath,
          depth: depth,
          fileCount: fileCount,
          size: folderSize
        });
        
        // Recursively get subfolders
        try {
          const subFolders = await getAllFolders(fullPath, depth + 1, maxDepth);
          results.push(...subFolders);
        } catch (err) {
          // Skip folders we can't access (permission issues)
          console.log(`Skipping ${fullPath}: ${err.message}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading ${dirPath}:`, error.message);
  }
  
  return results;
}

// Function to calculate folder size and file count
async function getFolderStats(dirPath) {
  let totalSize = 0;
  let fileCount = 0;

  async function calculateSize(currentPath) {
    try {
      const items = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item.name);
        
        try {
          if (item.isFile()) {
            const stats = await fs.stat(itemPath);
            totalSize += stats.size;
            fileCount++;
          } else if (item.isDirectory()) {
            await calculateSize(itemPath);
          }
        } catch (err) {
          // Skip items we can't access
          console.log(`Skipping ${itemPath}: ${err.message}`);
        }
      }
    } catch (error) {
      console.log(`Error calculating size for ${currentPath}: ${error.message}`);
    }
  }

  await calculateSize(dirPath);
  return { size: totalSize, fileCount: fileCount };
}

// Endpoint to list folders in a given directory
app.post('/api/list-folders', async (req, res) => {
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
app.post('/api/find-duplicates', async (req, res) => {
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

    // Group folders by name based on search mode
    const foldersByName = {};
    
    if (searchMode === 'perfect') {
      // Perfect search: group by name, then filter by similar size and file count
      allFolders.forEach(folder => {
        const name = folder.name.toLowerCase();
        if (!foldersByName[name]) {
          foldersByName[name] = [];
        }
        foldersByName[name].push({
          path: folder.path,
          size: folder.size,
          fileCount: folder.fileCount,
          originalName: folder.name
        });
      });
    } else {
      // Full search: group by name only (case-insensitive)
      allFolders.forEach(folder => {
        const name = folder.name.toLowerCase();
        if (!foldersByName[name]) {
          foldersByName[name] = [];
        }
        foldersByName[name].push({
          path: folder.path,
          size: folder.size,
          fileCount: folder.fileCount,
          originalName: folder.name
        });
      });
    }

    // Filter only duplicates (names with more than 1 occurrence)
    const duplicates = [];
    let totalDuplicateFolders = 0;
    
    Object.keys(foldersByName).forEach(name => {
      const folders = foldersByName[name];
      
      if (searchMode === 'perfect' && folders.length > 1) {
        // Perfect search: group by similar size and file count (within 10% tolerance)
        const perfectGroups = [];
        
        folders.forEach(folder => {
          let addedToGroup = false;
          
          // Try to find an existing group where this folder fits (within 10% tolerance)
          for (const group of perfectGroups) {
            const representative = group[0];
            const sizeDelta = Math.abs(folder.size - representative.size) / Math.max(folder.size, representative.size);
            const countDelta = Math.abs(folder.fileCount - representative.fileCount) / Math.max(folder.fileCount, representative.fileCount);
            
            if (sizeDelta <= 0.1 && countDelta <= 0.1) {
              group.push(folder);
              addedToGroup = true;
              break;
            }
          }
          
          // If no matching group found, create a new one
          if (!addedToGroup) {
            perfectGroups.push([folder]);
          }
        });
        
        // Add groups with more than 1 folder
        perfectGroups.forEach(group => {
          if (group.length > 1) {
            duplicates.push({
              name: group[0].originalName,
              count: group.length,
              locations: group
            });
            totalDuplicateFolders += group.length;
          }
        });
      } else if (searchMode === 'full' && folders.length > 1) {
        // Full search: just check name
        duplicates.push({
          name: folders[0].originalName,
          count: folders.length,
          locations: folders
        });
        totalDuplicateFolders += folders.length;
      }
    });

    // Sort by count (most duplicates first)
    duplicates.sort((a, b) => b.count - a.count);

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
app.post('/api/compare-folders', async (req, res) => {
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

    // Group folders by name based on search mode
    const foldersByName = {};
    
    if (searchMode === 'perfect') {
      // Perfect search: group by name, then filter by similar size and file count
      allFoldersWithSource.forEach(folder => {
        const name = folder.name.toLowerCase();
        if (!foldersByName[name]) {
          foldersByName[name] = [];
        }
        foldersByName[name].push({
          path: folder.path,
          source: folder.source,
          size: folder.size,
          fileCount: folder.fileCount,
          originalName: folder.name
        });
      });
    } else {
      // Full search: group by name only (case-insensitive)
      allFoldersWithSource.forEach(folder => {
        const name = folder.name.toLowerCase();
        if (!foldersByName[name]) {
          foldersByName[name] = [];
        }
        foldersByName[name].push({
          path: folder.path,
          source: folder.source,
          size: folder.size,
          fileCount: folder.fileCount,
          originalName: folder.name
        });
      });
    }

    // Filter only duplicates (names with more than 1 occurrence)
    const duplicates = [];
    let totalDuplicateFolders = 0;
    
    Object.keys(foldersByName).forEach(name => {
      const folders = foldersByName[name];
      
      if (searchMode === 'perfect' && folders.length > 1) {
        // Perfect search: group by similar size and file count (within 10% tolerance)
        const perfectGroups = [];
        
        folders.forEach(folder => {
          let addedToGroup = false;
          
          // Try to find an existing group where this folder fits (within 10% tolerance)
          for (const group of perfectGroups) {
            const representative = group[0];
            const sizeDelta = Math.abs(folder.size - representative.size) / Math.max(folder.size, representative.size);
            const countDelta = Math.abs(folder.fileCount - representative.fileCount) / Math.max(folder.fileCount, representative.fileCount);
            
            if (sizeDelta <= 0.1 && countDelta <= 0.1) {
              group.push(folder);
              addedToGroup = true;
              break;
            }
          }
          
          // If no matching group found, create a new one
          if (!addedToGroup) {
            perfectGroups.push([folder]);
          }
        });
        
        // Add groups with more than 1 folder
        perfectGroups.forEach(group => {
          if (group.length > 1) {
            duplicates.push({
              name: group[0].originalName,
              count: group.length,
              locations: group
            });
            totalDuplicateFolders += group.length;
          }
        });
      } else if (searchMode === 'full' && folders.length > 1) {
        // Full search: just check name
        duplicates.push({
          name: folders[0].originalName,
          count: folders.length,
          locations: folders
        });
        totalDuplicateFolders += folders.length;
      }
    });

    // Sort by count (most duplicates first)
    duplicates.sort((a, b) => b.count - a.count);

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

// Recursive function to get all files
async function getAllFiles(dirPath, depth = 0, maxDepth = 10) {
  const results = [];
  
  if (depth > maxDepth) {
    return results;
  }

  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      try {
        if (item.isFile()) {
          const stats = await fs.stat(fullPath);
          results.push({
            name: item.name,
            path: fullPath,
            size: stats.size,
            extension: path.extname(item.name),
            modifiedDate: stats.mtime
          });
        } else if (item.isDirectory()) {
          const subFiles = await getAllFiles(fullPath, depth + 1, maxDepth);
          results.push(...subFiles);
        }
      } catch (err) {
        console.log(`Skipping ${fullPath}: ${err.message}`);
      }
    }
  } catch (error) {
    console.error(`Error reading ${dirPath}:`, error.message);
  }
  
  return results;
}

// Endpoint to list files in a given directory
app.post('/api/list-files', async (req, res) => {
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
app.post('/api/find-duplicate-files', async (req, res) => {
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

    // Group files by name based on search mode
    const filesByName = {};
    
    if (searchMode === 'perfect') {
      allFiles.forEach(file => {
        const name = file.name.toLowerCase();
        if (!filesByName[name]) {
          filesByName[name] = [];
        }
        filesByName[name].push({
          path: file.path,
          size: file.size,
          extension: file.extension,
          originalName: file.name,
          modifiedDate: file.modifiedDate
        });
      });
    } else {
      allFiles.forEach(file => {
        const name = file.name.toLowerCase();
        if (!filesByName[name]) {
          filesByName[name] = [];
        }
        filesByName[name].push({
          path: file.path,
          size: file.size,
          extension: file.extension,
          originalName: file.name,
          modifiedDate: file.modifiedDate
        });
      });
    }

    // Filter only duplicates
    const duplicates = [];
    let totalDuplicateFiles = 0;
    
    Object.keys(filesByName).forEach(name => {
      const files = filesByName[name];
      
      if (searchMode === 'perfect' && files.length > 1) {
        // Perfect search: group by similar size (within 10% tolerance)
        const perfectGroups = [];
        
        files.forEach(file => {
          let addedToGroup = false;
          
          // Try to find an existing group where this file fits (within 10% size tolerance)
          for (const group of perfectGroups) {
            const representative = group[0];
            const sizeDelta = Math.abs(file.size - representative.size) / Math.max(file.size, representative.size);
            
            if (sizeDelta <= 0.1) {
              group.push(file);
              addedToGroup = true;
              break;
            }
          }
          
          // If no matching group found, create a new one
          if (!addedToGroup) {
            perfectGroups.push([file]);
          }
        });
        
        perfectGroups.forEach(group => {
          if (group.length > 1) {
            duplicates.push({
              name: group[0].originalName,
              count: group.length,
              locations: group
            });
            totalDuplicateFiles += group.length;
          }
        });
      } else if (searchMode === 'full' && files.length > 1) {
        duplicates.push({
          name: files[0].originalName,
          count: files.length,
          locations: files
        });
        totalDuplicateFiles += files.length;
      }
    });

    duplicates.sort((a, b) => b.count - a.count);

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
app.post('/api/compare-files', async (req, res) => {
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

    // Group files by name based on search mode
    const filesByName = {};
    
    if (searchMode === 'perfect') {
      allFilesWithSource.forEach(file => {
        const name = file.name.toLowerCase();
        if (!filesByName[name]) {
          filesByName[name] = [];
        }
        filesByName[name].push({
          path: file.path,
          source: file.source,
          size: file.size,
          extension: file.extension,
          originalName: file.name,
          modifiedDate: file.modifiedDate
        });
      });
    } else {
      allFilesWithSource.forEach(file => {
        const name = file.name.toLowerCase();
        if (!filesByName[name]) {
          filesByName[name] = [];
        }
        filesByName[name].push({
          path: file.path,
          source: file.source,
          size: file.size,
          extension: file.extension,
          originalName: file.name,
          modifiedDate: file.modifiedDate
        });
      });
    }

    // Filter only duplicates
    const duplicates = [];
    let totalDuplicateFiles = 0;
    
    Object.keys(filesByName).forEach(name => {
      const files = filesByName[name];
      
      if (searchMode === 'perfect' && files.length > 1) {
        // Perfect search: group by similar size (within 10% tolerance)
        const perfectGroups = [];
        
        files.forEach(file => {
          let addedToGroup = false;
          
          // Try to find an existing group where this file fits (within 10% size tolerance)
          for (const group of perfectGroups) {
            const representative = group[0];
            const sizeDelta = Math.abs(file.size - representative.size) / Math.max(file.size, representative.size);
            
            if (sizeDelta <= 0.1) {
              group.push(file);
              addedToGroup = true;
              break;
            }
          }
          
          // If no matching group found, create a new one
          if (!addedToGroup) {
            perfectGroups.push([file]);
          }
        });
        
        perfectGroups.forEach(group => {
          if (group.length > 1) {
            duplicates.push({
              name: group[0].originalName,
              count: group.length,
              locations: group
            });
            totalDuplicateFiles += group.length;
          }
        });
      } else if (searchMode === 'full' && files.length > 1) {
        duplicates.push({
          name: files[0].originalName,
          count: files.length,
          locations: files
        });
        totalDuplicateFiles += files.length;
      }
    });

    duplicates.sort((a, b) => b.count - a.count);

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
