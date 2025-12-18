// Function to find duplicate folder names
function findDuplicateFolders(allFolders, searchMode = 'perfect') {
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

  return { duplicates, totalDuplicateFolders };
}

// Function to find duplicate file names
function findDuplicateFiles(allFiles, searchMode = 'perfect') {
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

  return { duplicates, totalDuplicateFiles };
}

module.exports = {
  findDuplicateFolders,
  findDuplicateFiles
};