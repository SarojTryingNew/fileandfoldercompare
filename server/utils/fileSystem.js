const fs = require('fs').promises;
const path = require('path');

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

module.exports = {
  getAllFolders,
  getFolderStats,
  getAllFiles
};