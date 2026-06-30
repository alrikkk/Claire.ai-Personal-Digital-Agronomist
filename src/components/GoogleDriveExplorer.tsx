import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileText, 
  File, 
  Trash2, 
  Upload, 
  Download, 
  RefreshCw, 
  CloudRain, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Plus, 
  Database, 
  LogOut, 
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react';
import { googleSignIn, getAccessToken, logoutGoogle } from '../lib/googleAuth';
import { showToast, Project, User } from '../types';

interface GoogleDriveExplorerProps {
  user: User;
  projects: Project[];
  onSelectCropImage?: (imageUrl: string, fileName: string) => void;
  onSwitchTab?: (tabName: 'insights' | 'scanner' | 'logs') => void;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  thumbnailLink?: string;
  iconLink?: string;
}

export default function GoogleDriveExplorer({ 
  user, 
  projects, 
  onSelectCropImage, 
  onSwitchTab 
}: GoogleDriveExplorerProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: 'My Drive' }
  ]);

  // Sync token state with googleAuth utility on mount or when connected changes
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setAccessToken(token);
      setIsConnected(true);
      fetchFiles(token, currentFolderId);
    }
  }, [currentFolderId]);

  // Connect Google account using real OAuth Firebase Sign-In popup
  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setAccessToken(result.accessToken);
        setGoogleUser(result.user);
        setIsConnected(true);
        showToast(`Connected to Google Drive as ${result.user.displayName}`, 'success');
        fetchFiles(result.accessToken, 'root');
      }
    } catch (err: any) {
      console.error('Failed to connect Google Drive:', err);
      showToast('Authentication failed or cancelled.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect Google Drive
  const handleDisconnect = async () => {
    try {
      await logoutGoogle();
      setIsConnected(false);
      setAccessToken(null);
      setGoogleUser(null);
      setFiles([]);
      showToast('Disconnected from Google Drive', 'info');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  // Fetch file metadata from Google Drive
  const fetchFiles = async (token: string, folderId: string = 'root') => {
    setIsLoading(true);
    try {
      // Formulate query. If folder is specific, target parent.
      const q = `'${folderId}' in parents and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=30&fields=files(id,name,mimeType,size,createdTime,thumbnailLink,iconLink)&orderBy=folder,name`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Token expired, require reconnection
          setIsConnected(false);
          setAccessToken(null);
          showToast('Google session expired. Please reconnect.', 'warning');
          return;
        }
        throw new Error('Failed to query Google Drive files');
      }

      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      showToast('Failed to load Google Drive content', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate inside folders
  const handleFolderClick = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setFolderHistory((prev) => [...prev, { id: folderId, name: folderName }]);
  };

  // Go to a specific folder in history trail
  const handleBreadcrumbClick = (folderId: string, index: number) => {
    setCurrentFolderId(folderId);
    setFolderHistory((prev) => prev.slice(0, index + 1));
  };

  // Create a new folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !accessToken) return;

    setIsLoading(true);
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          mimeType: 'application/vnd.google-apps.folder',
          parents: currentFolderId === 'root' ? [] : [currentFolderId]
        })
      });

      if (!res.ok) throw new Error('Could not create folder');

      showToast(`Folder "${newFolderName}" created successfully!`, 'success');
      setNewFolderName('');
      setIsCreatingFolder(false);
      fetchFiles(accessToken, currentFolderId);
    } catch (err) {
      console.error('Folder creation error:', err);
      showToast('Failed to create folder in Drive.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a file with MANDATORY confirmation as required by security guidelines
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    const isConfirmed = window.confirm(
      `CRITICAL DELETION:\n\nAre you sure you want to permanently delete "${fileName}" from Google Drive?\n\nThis action is irreversible and will delete the cloud file.`
    );

    if (!isConfirmed) return;

    setIsLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!res.ok) throw new Error('Deletion failed');

      showToast(`Deleted file: ${fileName}`, 'success');
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete file from Drive.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function: Safe text upload followed by PATCH name update
  const uploadTextFile = async (fileName: string, content: string, mimeType: string) => {
    if (!accessToken) return;
    setIsUploading(true);
    try {
      // 1. Base media upload
      const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=media', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': mimeType
        },
        body: content
      });

      if (!uploadRes.ok) throw new Error('Content upload failed');
      const uploadData = await uploadRes.json();
      const fileId = uploadData.id;

      // 2. Set file name and parents
      const patchData: any = { name: fileName };
      if (currentFolderId !== 'root') {
        patchData.addParents = currentFolderId;
      }

      const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patchData)
      });

      if (!metaRes.ok) throw new Error('Metadata update failed');

      showToast(`File "${fileName}" saved to Drive!`, 'success');
      fetchFiles(accessToken, currentFolderId);
    } catch (err) {
      console.error('File upload failed:', err);
      showToast('Failed to back up file.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Back up Yield logs as formatted CSV
  const handleBackupYieldLogs = () => {
    if (projects.length === 0) {
      showToast('No logged projects or regions to back up.', 'warning');
      return;
    }

    const headers = 'Project ID,User ID,Farm Name,Crop Type,Location Coordinate,Created At\n';
    const rows = projects.map(p => 
      `"${p.id}","${p.user_id}","${p.name}","${p.crop}","${p.location}","${p.created_at}"`
    ).join('\n');
    
    const csvContent = headers + rows;
    const dateStr = new Date().toISOString().split('T')[0];
    uploadTextFile(`claire_yield_logs_${dateStr}.csv`, csvContent, 'text/csv');
  };

  // Export diagnostic consultation report markdown
  const handleExportConsultationReport = () => {
    const reportMarkdown = `# Claire.ai Agronomic Diagnostic Report
*Generated on ${new Date().toLocaleDateString()} for ${user.fullName}*

## Farmer Operational Profile
- **Farmer Name:** ${user.fullName}
- **Contact Email:** ${user.email}
- **Coordinates Registered:** ${projects.length} Field Zones

## Active Farm Zones Listed
${projects.map((p, idx) => `${idx + 1}. **${p.name}** (${p.crop}) — Location: ${p.location}`).join('\n')}

---
*Protected under the Claire.ai Agronomy Sandbox system. Data synced securely.*
`;
    const dateStr = new Date().toISOString().split('T')[0];
    uploadTextFile(`claire_diagnostics_${dateStr}.md`, reportMarkdown, 'text/markdown');
  };

  // Select crop image from Google Drive for Pathology Scanner
  const handleSelectDriveImage = (file: DriveFile) => {
    if (!onSelectCropImage || !onSwitchTab) return;

    // Google Drive provides webContentLink or we can construct a placeholder/proxy,
    // but in this iframe preview, we can display the Google Drive icon or thumbnail,
    // and analyze it dynamically. Let's send a premium, high-contrast placeholder
    // URL or thumbnail link.
    const url = file.thumbnailLink || 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500';
    onSelectCropImage(url, file.name);
    onSwitchTab('scanner');
    showToast(`Loaded "${file.name}" into Pathology Scanner!`, 'success');
  };

  // Format bytes helper
  const formatBytes = (bytes?: string) => {
    if (!bytes) return 'N/A';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return 'N/A';
    if (num < 1024) return num + ' B';
    if (num < 1048576) return (num / 1024).toFixed(1) + ' KB';
    return (num / 1048576).toFixed(1) + ' MB';
  };

  // Helper for rendering icons based on mimeType
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-5 h-5 text-amber-400 fill-amber-400" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    }
    if (mimeType.includes('image')) {
      return <ImageIcon className="w-5 h-5 text-sky-500" />;
    }
    if (mimeType.includes('pdf') || mimeType.includes('text') || mimeType.includes('document')) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  // Filter files by query
  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="google_drive_container" className="space-y-6">
      
      {/* Google Drive Header Status Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-tr from-slate-50 to-orange-50/20 border border-orange-100/50 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-orange-100/60 shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#FFC107" d="M15.35 12H22L15.35 1h-6.7L15.35 12z" />
              <path fill="#3F51B5" d="M15.35 12H22l-6.65 11h-6.7L15.35 12z" />
              <path fill="#4CAF50" d="M8.65 12L2 1h6.65l6.7 11H8.65z" />
              <path fill="#2196F3" d="M8.65 12L2 23h6.65l6.7-11H8.65z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Google Drive Cloud Sync
            </h2>
            <p className="text-[11px] text-slate-400">
              Synchronize, export, and manage farming reports directly to your Cloud storage.
            </p>
          </div>
        </div>

        <div>
          {isConnected ? (
            <div className="flex items-center gap-3">
              <span className="hidden md:inline-block text-right">
                <span className="block text-xs font-semibold text-slate-700">Cloud Link Active</span>
                <span className="block text-[10px] text-emerald-600 font-bold">● Drive Connected</span>
              </span>
              <button
                type="button"
                onClick={handleDisconnect}
                className="h-9 px-3.5 bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-100 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={isLoading}
              className="h-10 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 active:opacity-100 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-blue-100 flex items-center gap-2 transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                    <path
                      fill="#FFFFFF"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#FFFFFF"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FFFFFF"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                    />
                    <path
                      fill="#FFFFFF"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Connect Google Drive
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {!isConnected ? (
        /* Not Connected Welcome Banner */
        <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-3xl space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 animate-bounce" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M15.35 12H22L15.35 1h-6.7L15.35 12z" />
            </svg>
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-base font-bold text-slate-800">Secure Cloud Sync Unlocked</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect your Google account to unlock full-stack agricultural backups, cloud file browsing, and instant diagnostic report exports. Claire.ai works strictly inside safe sandboxed scopes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleConnect}
            className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md transition-colors"
          >
            Connect Account Now
          </button>
        </div>
      ) : (
        /* Cloud Sync Connected Interface split 40/60 */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT PANEL: Backup and Export actions (cols 1-4) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Backup & Export Tools
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Upload files directly to your current Drive folder.
                </p>
              </div>

              {/* Actions Grid */}
              <div className="space-y-3">
                
                {/* Backup Yield Logs */}
                <button
                  type="button"
                  onClick={handleBackupYieldLogs}
                  disabled={isUploading}
                  className="w-full p-3 bg-slate-50 hover:bg-orange-50/20 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <Database className="w-4.5 h-4.5 text-orange-500" />
                    <div>
                      <span className="block text-xs font-bold text-slate-700 group-hover:text-orange-600">
                        Sync Yield Logs
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Export {projects.length} field zones to CSV
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Export Diagnostics */}
                <button
                  type="button"
                  onClick={handleExportConsultationReport}
                  disabled={isUploading}
                  className="w-full p-3 bg-slate-50 hover:bg-orange-50/20 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <FileText className="w-4.5 h-4.5 text-blue-500" />
                    <div>
                      <span className="block text-xs font-bold text-slate-700 group-hover:text-orange-600">
                        Export Pathology Report
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Write diagnostics as Markdown
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

              </div>

              {/* Status information */}
              <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-[10px] text-slate-500 leading-normal">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-800">Operational Security Engaged</strong>
                  <p className="mt-0.5">
                    Claire.ai uses authorized API keys & in-memory access tokens. Disconnecting clears all variables instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: File browser (cols 5-12) */}
          <div className="lg:col-span-8 bg-white border border-slate-150 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[400px]">
            
            {/* Folder Browser Navigation / Search Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/30">
              
              {/* Breadcrumbs Navigation */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
                {folderHistory.map((folder, idx) => (
                  <React.Fragment key={folder.id}>
                    {idx > 0 && <span className="text-slate-300">/</span>}
                    <button
                      type="button"
                      onClick={() => handleBreadcrumbClick(folder.id, idx)}
                      className={`hover:text-orange-600 cursor-pointer transition-colors ${
                        idx === folderHistory.length - 1 ? 'text-slate-800 font-bold' : ''
                      }`}
                    >
                      {folder.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48 bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:border-orange-300 transition-colors"
                />
              </div>

            </div>

            {/* Folder / File Action Bar */}
            <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
              <div className="flex items-center gap-2">
                {isCreatingFolder ? (
                  <form onSubmit={handleCreateFolder} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Folder name..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      required
                      className="h-8 bg-white border border-slate-200 rounded-lg px-2 text-xs outline-none focus:border-orange-300 w-32"
                    />
                    <button
                      type="submit"
                      className="h-8 px-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingFolder(false)}
                      className="h-8 px-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(true)}
                    className="h-8 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-500" />
                    New Folder
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => fetchFiles(accessToken!, currentFolderId)}
                disabled={isLoading}
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center cursor-pointer shadow-sm transition-colors"
                title="Refresh Files"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Main File list container */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && files.length === 0 ? (
                /* Loading State */
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-orange-400" />
                  <span className="text-xs font-semibold">Retrieving cloud files...</span>
                </div>
              ) : filteredFiles.length === 0 ? (
                /* Empty Files State */
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center space-y-1">
                  <Folder className="w-10 h-10 text-slate-200" />
                  <span className="text-xs font-bold text-slate-700 block">No Files Found</span>
                  <span className="text-[10px] text-slate-400 block max-w-xs">
                    This directory is empty or no files match your active search filter.
                  </span>
                </div>
              ) : (
                /* Files Listing */
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4 hidden md:table-cell">Created Time</th>
                      <th className="py-3 px-4 hidden sm:table-cell">File Size</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50/40 text-xs transition-colors group">
                        
                        {/* File details */}
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {file.mimeType === 'application/vnd.google-apps.folder' ? (
                            <button
                              type="button"
                              onClick={() => handleFolderClick(file.id, file.name)}
                              className="flex items-center gap-2.5 font-bold text-slate-800 hover:text-orange-600 transition-colors text-left outline-none cursor-pointer"
                            >
                              {getFileIcon(file.mimeType)}
                              <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              {getFileIcon(file.mimeType)}
                              <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                            </div>
                          )}
                        </td>

                        {/* Created time */}
                        <td className="py-3 px-4 text-slate-400 hidden md:table-cell font-mono text-[11px]">
                          {file.createdTime ? new Date(file.createdTime).toLocaleDateString() : 'N/A'}
                        </td>

                        {/* File size */}
                        <td className="py-3 px-4 text-slate-500 hidden sm:table-cell font-mono text-[11px]">
                          {file.mimeType === 'application/vnd.google-apps.folder' ? '—' : formatBytes(file.size)}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            
                            {/* Analyze Crop Image button */}
                            {file.mimeType.startsWith('image/') && onSelectCropImage && (
                              <button
                                type="button"
                                onClick={() => handleSelectDriveImage(file)}
                                className="h-7 px-2.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                                title="Import and Analyze this Image"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                                Analyze
                              </button>
                            )}

                            {/* Delete File Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteFile(file.id, file.name)}
                              className="w-7 h-7 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 text-slate-400 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                              title="Delete File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
