# File & Folder Manager Application

A comprehensive React/Node.js application for browsing, analyzing, and comparing files and folders on your local machine. Features multiple tools for folder browsing, duplicate detection, and multi-path comparison with advanced filtering and sorting capabilities.

## Features

### 🏠 Home Dashboard
- Modern card-based navigation interface
- Quick access to all features
- Intuitive user experience

### 📁 Folder Browser
- Browse and list all subfolders recursively from any directory
- **Three view modes:**
  - 📊 **Table View**: Sortable columns for name, file count, size, and path
  - 🌳 **Tree View**: Hierarchical folder structure with expand/collapse functionality
  - 📋 **List View**: Detailed list with metadata
- **Sorting capabilities:**
  - Sort by folder name (alphabetical)
  - Sort by file count
  - Sort by size
  - Toggle ascending/descending order
- Real-time statistics (file count, total size per folder)
- Loading indicators with progress feedback

### 🔍 Duplicate Folder Finder
- Scan a single directory for duplicate folders
- **Two search modes:**
  - **Perfect Search**: Groups folders with same name AND within 10% tolerance for both size and file count
  - **Full Search**: Groups all folders with matching names (case-insensitive)
- View duplicate groups with location details
- Statistics: total duplicates found, total folders analyzed

### 🔄 Multi-Folder Compare
- Compare multiple folder paths simultaneously
- Find common folders across different directories
- Same search modes as Duplicate Folder Finder
- Source path tracking for each duplicate
- Cross-directory duplicate analysis

### 📄 File Browser
- List all files recursively from any directory
- **Three view modes** (Table, Tree, List)
- **Sorting capabilities:**
  - Sort by filename
  - Sort by file size
  - Sort by file extension
  - Sort by modified date
- File metadata display (size, extension, modification date)
- Image preview support for common image formats

### 🔎 Duplicate File Finder
- Scan a single directory for duplicate files
- **Two search modes:**
  - **Perfect Search**: Groups files with same name AND within 10% size tolerance
  - **Full Search**: Groups all files with matching names
- Detailed file information (size, extension, modification date)
- Duplicate count and location tracking

### 🔀 Multi-File Compare
- Compare files across multiple folder paths
- Find common files in different locations
- Same search modes as Duplicate File Finder
- Source path tracking
- Comprehensive duplicate analysis across directories

### 🎨 UI/UX Features
- Modern, responsive design with gradient backgrounds
- Loading timers with animated indicators
- Error handling with user-friendly messages
- Smooth transitions and hover effects
- Color-coded information display
- Mobile-responsive layout

## Project Structure

```
fileandfoldercompare/
├── client/                 # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                      # Main app with routing
│   │   ├── App.css                     # Global styles
│   │   ├── Home.js                     # Dashboard/home page
│   │   ├── Home.css
│   │   ├── FolderBrowser.js            # Folder listing component
│   │   ├── FolderBrowser.css
│   │   ├── DuplicateFinder.js          # Duplicate folder finder
│   │   ├── DuplicateFinder.css
│   │   ├── MultiFolderCompare.js       # Multi-folder comparison
│   │   ├── MultiFolderCompare.css
│   │   ├── FileBrowser.js              # File listing component
│   │   ├── FileBrowser.css
│   │   ├── DuplicateFileFinder.js      # Duplicate file finder
│   │   ├── DuplicateFileFinder.css
│   │   ├── MultiFileCompare.js         # Multi-file comparison
│   │   ├── MultiFileCompare.css
│   │   ├── LoadingTimer.js             # Loading indicator
│   │   ├── LoadingTimer.css
│   │   ├── index.js                    # React entry point
│   │   └── index.css                   # Base styles
│   └── package.json
├── server/                 # Node.js backend
│   ├── server.js                       # Express server with all APIs
│   └── package.json
├── package.json            # Root package.json with scripts
└── README.md
```

## Prerequisites

### Required
- **Node.js** (v14 or higher, v18+ recommended)
- **npm** (v6 or higher) or **yarn**

### System Requirements
- **OS**: Windows, macOS, or Linux
- **RAM**: 4GB minimum (8GB recommended for large directory scans)
- **Disk Space**: 200MB for application and dependencies

## Installation

### Quick Install

Install dependencies for both client and server in one command:

```powershell
npm run install-all
```

### Manual Installation

If you prefer to install manually:

```powershell
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Dependencies Installed

**Server Dependencies:**
- `express` (^4.18.2) - Web framework
- `cors` (^2.8.5) - Cross-origin resource sharing

**Server Dev Dependencies:**
- `nodemon` (^3.0.1) - Auto-reload during development

**Client Dependencies:**
- `react` (^18.2.0) - UI library
- `react-dom` (^18.2.0) - React DOM rendering
- `react-scripts` (5.0.1) - React build tooling

## Installation

1. Install dependencies for both client and server:

```powershell
npm run install-all
```

Or manually:

```powershell
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## Running the Application

### Option 1: Run both servers separately (Recommended for Development)

**Terminal 1 - Start the backend server:**

```powershell
cd server
npm start
```

Server will run on `http://localhost:3001`

**Terminal 2 - Start the React frontend:**

```powershell
cd client
npm start
```

Frontend will run on `http://localhost:3000` and will automatically open in your default browser.

### Option 2: Use npm scripts from root directory

**Terminal 1:**

```powershell
npm run start-server
```

**Terminal 2:**

```powershell
npm run start-client
```

### Development Mode with Auto-Reload

For backend development with automatic restart on file changes:

```powershell
cd server
npm run dev
```

## Usage Guide

### Getting Started

1. **Start the application** - Follow the "Running the Application" steps above
2. **Open your browser** - Navigate to `http://localhost:3000`
3. **Select a feature** - Click on any of the feature cards on the home page

### Using Folder Browser

1. Enter a folder path (e.g., `C:\Users\YourName\Documents`)
2. Click "List Folders"
3. Choose your preferred view mode (Table, Tree, or List)
4. Use sorting controls to organize results by name, file count, or size
5. In Tree View, click folders to expand/collapse

### Using Duplicate Folder Finder

1. Enter a folder path to scan
2. Select search mode:
   - **Perfect**: Finds folders with same name AND similar size/file count (±10%)
   - **Full**: Finds all folders with matching names
3. Click "Find Duplicates"
4. Review duplicate groups with their locations

### Using Multi-Folder Compare

1. Enter 2 or more folder paths (one per line or use "Add Path" button)
2. Select search mode (Perfect or Full)
3. Click "Compare Folders"
4. View duplicates found across all specified paths

### Using File Browser

1. Enter a folder path
2. Click "List Files"
3. Switch between view modes as needed
4. Sort by filename, size, extension, or modified date
5. View file metadata and statistics

### Using Duplicate File Finder

1. Enter a folder path to scan
2. Select search mode:
   - **Perfect**: Finds files with same name AND similar size (±10%)
   - **Full**: Finds all files with matching names
3. Click "Find Duplicate Files"
4. Review results with file details

### Using Multi-File Compare

1. Enter 2 or more folder paths
2. Select search mode
3. Click "Compare Files"
4. Analyze duplicate files across different directories

## API Endpoints

The backend server exposes the following REST API endpoints:

### Folder Operations

#### `POST /api/list-folders`

List all folders in a directory recursively.

**Request:**

```json
{
  "folderPath": "C:\\Users\\YourName\\Documents"
}
```

**Response:**

```json
{
  "path": "C:\\Users\\YourName\\Documents",
  "folders": [
    {
      "name": "Work",
      "path": "C:\\Users\\YourName\\Documents\\Work",
      "size": 1048576,
      "fileCount": 25,
      "depth": 1
    }
  ],
  "count": 1
}
```

#### `POST /api/find-duplicates`

Find duplicate folders in a directory.

**Request:**

```json
{
  "folderPath": "C:\\Users\\YourName\\Documents",
  "searchMode": "perfect"
}
```

**Response:**

```json
{
  "path": "C:\\Users\\YourName\\Documents",
  "duplicates": [
    {
      "name": "backup",
      "count": 3,
      "locations": [
        { "path": "C:\\...\\backup1", "size": 1024, "fileCount": 10 }
      ]
    }
  ],
  "totalDuplicateFolders": 6,
  "totalFoldersAnalyzed": 50
}
```

#### `POST /api/compare-folders`

Compare folders across multiple paths.

**Request:**

```json
{
  "folderPaths": ["C:\\Path1", "D:\\Path2"],
  "searchMode": "perfect"
}
```

**Response:**

```json
{
  "duplicates": [...],
  "totalDuplicateFolders": 10,
  "sourcePaths": ["C:\\Path1", "D:\\Path2"]
}
```

### File Operations

#### `POST /api/list-files`

List all files in a directory recursively.

**Request:**

```json
{
  "folderPath": "C:\\Users\\YourName\\Documents"
}
```

**Response:**

```json
{
  "path": "C:\\Users\\YourName\\Documents",
  "files": [
    {
      "name": "document.pdf",
      "path": "C:\\...\\document.pdf",
      "size": 2048576,
      "extension": ".pdf",
      "modifiedDate": "2025-12-10T10:30:00.000Z",
      "depth": 1
    }
  ],
  "count": 1
}
```

#### `POST /api/find-duplicate-files`

Find duplicate files in a directory.

**Request:**

```json
{
  "folderPath": "C:\\Users\\YourName\\Documents",
  "searchMode": "perfect"
}
```

**Response:**

```json
{
  "path": "C:\\Users\\YourName\\Documents",
  "duplicates": [
    {
      "name": "photo.jpg",
      "count": 2,
      "locations": [
        {
          "path": "C:\\...\\photo.jpg",
          "size": 1024000,
          "extension": ".jpg",
          "modifiedDate": "2025-12-10T10:30:00.000Z"
        }
      ]
    }
  ],
  "totalDuplicateFiles": 4,
  "totalFilesAnalyzed": 100
}
```

#### `POST /api/compare-files`

Compare files across multiple paths.

**Request:**

```json
{
  "folderPaths": ["C:\\Path1", "D:\\Path2"],
  "searchMode": "perfect"
}
```

**Response:**

```json
{
  "duplicates": [...],
  "totalDuplicateFiles": 15,
  "sourcePaths": ["C:\\Path1", "D:\\Path2"],
  "fileCountsBySource": {
    "C:\\Path1": 50,
    "D:\\Path2": 45
  },
  "totalFilesAnalyzed": 95
}
```

#### `GET /api/image-preview`

Get image preview (for supported image formats).

**Query Parameters:**

- `path`: File path to the image

## Technologies Used

### Frontend

- **React 18** - Modern UI library with hooks
- **CSS3** - Custom styling with:
  - CSS Grid and Flexbox layouts
  - Gradient backgrounds
  - Smooth transitions and animations
  - Responsive design patterns
- **React Hooks** - useState for state management

### Backend

- **Node.js** - JavaScript runtime
- **Express.js 4.18** - Web application framework
- **CORS** - Cross-Origin Resource Sharing middleware
- **Native Node.js fs/promises** - File system operations
- **Native Node.js path** - Path manipulation

### Development Tools

- **nodemon** - Auto-reload during development
- **react-scripts** - React build and development tooling

## Algorithm Details

### Perfect Search Algorithm

The Perfect Search mode uses a 10% tolerance algorithm to group similar items:

**For Folders:**

- Groups folders with the same name (case-insensitive)
- Within each name group, further groups by:
  - File count within ±10% tolerance
  - Folder size within ±10% tolerance
- Formula: `|value1 - value2| / max(value1, value2) ≤ 0.1`

**For Files:**

- Groups files with the same name (case-insensitive)
- Within each name group, groups by:
  - File size within ±10% tolerance
- Uses same tolerance formula as folders

### Full Search Algorithm

- Groups items by name only (case-insensitive)
- No size or count restrictions
- Faster but may include more false positives

## Performance Considerations

### Large Directory Scans

- Recursive scanning can take time for directories with many files/folders
- Loading indicators provide feedback during long operations
- Consider scanning smaller subdirectories for very large file systems

### Memory Usage

- Large directory structures are loaded into memory
- Recommended 8GB RAM for scanning directories with 100,000+ items
- Results are processed in-memory for fast sorting and filtering

### Optimization Tips

- Use Perfect Search mode to reduce false positives
- Start with smaller directory scopes
- Close other memory-intensive applications during large scans

## Example Paths

### Windows

```text
C:\Users\YourName\Documents
C:\Users\YourName\Desktop
C:\Users\YourName\Downloads
D:\Projects
D:\Backup
```

### macOS/Linux

```text
/Users/YourName/Documents
/Users/YourName/Desktop
~/Downloads
/home/username/projects
/var/backup
```

## Security Considerations

### Important Security Notes

⚠️ **WARNING**: This application accesses your local file system.

**Security Best Practices:**

- **Never deploy to public servers** without implementing:
  - Authentication and authorization
  - Path restrictions and validation
  - Rate limiting
  - Input sanitization
- **Local use only** - Designed for personal/trusted environments
- **File system access** - Has read access to any path you provide
- **No built-in access control** - Anyone with access to the app can browse your file system

### Recommended Production Modifications

If you need to deploy this application:

1. Add user authentication (e.g., JWT, OAuth)
2. Implement path whitelisting
3. Add role-based access control
4. Use HTTPS/TLS encryption
5. Add rate limiting and request throttling
6. Implement comprehensive logging
7. Add file path sanitization and validation
8. Consider containerization (Docker)

## Troubleshooting

### Common Issues

**Port Already in Use:**

- **Problem**: Ports 3000 or 3001 are occupied
- **Solution**: 
  - Close other applications using these ports
  - Change ports in configuration:
    - Server: Edit `PORT` constant in `server/server.js`
    - Client: Create `.env` file with `PORT=3005` in client folder

**Path Not Found Error:**

- **Problem**: Specified path doesn't exist or is inaccessible
- **Solution**:
  - Verify the path exists
  - Check path format (use `\` or `/` for Windows)
  - Ensure you have read permissions for the directory
  - Try using absolute paths instead of relative paths

**CORS Errors:**

- **Problem**: Cross-origin requests blocked
- **Solution**:
  - Ensure both frontend and backend are running
  - Verify backend URL in client matches server port
  - Check `server/server.js` has CORS middleware enabled

**Application Not Loading:**

- **Problem**: Blank page or errors in browser console
- **Solution**:
  - Check browser console for errors (F12)
  - Verify Node.js and npm versions meet requirements
  - Clear browser cache and restart
  - Run `npm run install-all` to reinstall dependencies

**Slow Performance on Large Directories:**

- **Problem**: Application hangs or is very slow
- **Solution**:
  - Scan smaller subdirectories instead
  - Use Perfect Search to reduce processing
  - Close memory-intensive applications
  - Increase Node.js memory limit: `node --max-old-space-size=4096 server.js`

**Images Not Previewing:**

- **Problem**: Image previews don't load in File Browser
- **Solution**:
  - Verify file paths are correct
  - Check image formats are supported (JPG, PNG, GIF, BMP, WebP)
  - Ensure server has read permissions for image files

## Development Guide

### Project Architecture

**Client-Side (React):**

- Single-page application with component-based routing
- State management using React hooks
- CSS modules for component styling
- Axios-free fetch API usage

**Server-Side (Express):**

- RESTful API design
- Asynchronous file system operations
- Recursive directory traversal
- In-memory result processing

### Adding New Features

1. **Create component** in `client/src/`
2. **Add route** in `App.js`
3. **Create API endpoint** in `server/server.js`
4. **Add navigation card** in `Home.js`

### Code Style

- Use ES6+ features (arrow functions, async/await, destructuring)
- Follow React best practices (hooks, functional components)
- Use meaningful variable and function names
- Add comments for complex logic

### Testing

```powershell
# Run React tests
cd client
npm test

# Manual testing checklist:
# - Test each feature with valid paths
# - Test error handling with invalid paths
# - Test with empty directories
# - Test with large directories
# - Test sorting and filtering
# - Test view mode switching
```

## Build for Production

### Building the Client

```powershell
cd client
npm run build
```

This creates an optimized production build in `client/build/`.

### Serving Production Build

To serve the production build from the Express server, modify `server/server.js`:

```javascript
const path = require('path');

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Handle React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Future Enhancements

Potential features for future development:

- [ ] File content comparison (hash-based)
- [ ] Folder synchronization
- [ ] Export results to CSV/Excel
- [ ] Advanced filtering options
- [ ] Batch file operations (move/delete)
- [ ] File preview for more formats (PDF, videos)
- [ ] Search within file contents
- [ ] Drag-and-drop folder selection
- [ ] Dark mode theme
- [ ] Internationalization (i18n)
- [ ] Command-line interface (CLI)
- [ ] Desktop application (Electron)

## License

MIT License - Feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or contributions:

- **GitHub Issues**: [Create an issue](https://github.com/SarojTryingNew/fileandfoldercompare/issues)
- **Repository**: [fileandfoldercompare](https://github.com/SarojTryingNew/fileandfoldercompare)

## Changelog

### Version 1.0.0 (Current)

- Initial release
- Folder browser with multiple view modes
- File browser with sorting capabilities
- Duplicate folder finder (single and multi-path)
- Duplicate file finder (single and multi-path)
- Perfect Search algorithm with 10% tolerance
- Full Search mode
- Modern UI with loading indicators
- Recursive directory scanning
- Image preview support
