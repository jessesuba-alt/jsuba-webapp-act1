import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { FileUploadArea } from './components/FileUploadArea';
import { FileList } from './components/FileList';
import { FilePreviewModal } from './components/FilePreviewModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ClientPortalModal } from './components/ClientPortalModal';
import { StorageView } from './components/StorageView';
import type { VaultFile, StorageStats } from './types';
import { Loader2, Zap, FolderUp, ShieldCheck } from 'lucide-react';

function Dashboard() {
  const { user, token } = useAuth();

  const [files, setFiles] = useState<VaultFile[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentView, setCurrentView] = useState<'all' | 'recent' | 'portals' | 'storage'>('all');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch files and storage stats
  const fetchData = async () => {
    if (!token) return;
    try {
      const [filesRes, statsRes] = await Promise.all([
        fetch('/api/files', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (filesRes.ok) {
        const filesData = await filesRes.json();
        setFiles(filesData.files || []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load vault data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle file upload callback
  const handleUploadSuccess = (newFiles: VaultFile[]) => {
    setFiles(prev => [...newFiles, ...prev]);
    fetchData(); // Refresh stats
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!fileToDelete || !token) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/files/${fileToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
        setFileToDelete(null);
        fetchData(); // Refresh stats
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete file.');
      }
    } catch (err) {
      alert('Network error while deleting file.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle notes update callback
  const handleUpdateNotes = (fileId: string, notes: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, notes } : f));
  };

  return (
    <div className="min-h-screen bg-[#050507] cyber-grid flex flex-col md:flex-row relative text-white">
      {/* Background Soft Monochromatic Silver Glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-64 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Monochromatic Cyber Sidebar */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block fixed md:static inset-0 z-40 bg-black/75 md:bg-transparent`}>
        <div className="w-64 md:w-72 h-full" onClick={(e) => e.stopPropagation()}>
          <Sidebar
            currentView={currentView}
            setCurrentView={(view) => {
              setCurrentView(view);
              setMobileMenuOpen(false);
            }}
            stats={stats}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onOpenPortalModal={() => setIsPortalModalOpen(true)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        <TopNavbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          currentView={currentView}
        />

        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Monochromatic Action Banner */}
          <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-white/20 cyber-panel shadow-[0_0_30px_rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="font-cyber uppercase font-bold tracking-wider text-white bg-zinc-900 border border-white/30 px-2 py-0.5 rounded-md">
                  SUVAULT_MONOCHROME_CORE
                </span>
                <span className="text-zinc-600">//</span>
                <span className="text-zinc-300 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  ISOLATED VAULT ONLINE
                </span>
              </div>
              <h2 className="font-cyber text-xl sm:text-2xl font-bold text-white neon-glow-silver">
                {user?.role === 'freelancer' ? `WELCOME // ${user.name.toUpperCase()}` : `CLIENT_PORTAL // ${user?.name.toUpperCase()}`}
              </h2>
              <p className="text-xs font-mono text-zinc-300 max-w-2xl">
                {user?.role === 'freelancer'
                  ? 'Manage client deliverables, upload creative design packages, or generate dedicated client upload links.'
                  : 'Review delivered design assets, download approved project files, and upload feedback.'}
              </p>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 chrome-btn font-cyber font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              <FolderUp className="w-4 h-4 stroke-[3]" />
              <span>Upload Data</span>
            </button>
          </div>

          {/* Conditional View Rendering */}
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-3 cyber-card rounded-2xl border border-white/15">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <p className="text-xs font-mono text-zinc-300 font-medium">CONNECTING TO SECURE VAULT PARTITION...</p>
            </div>
          ) : currentView === 'storage' ? (
            <StorageView stats={stats} onOpenUpload={() => setIsUploadModalOpen(true)} />
          ) : (
            <>
              {/* File Upload Area on Main Dashboard */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-cyber text-sm font-bold text-white flex items-center gap-2 neon-glow-silver">
                    <Zap className="w-4 h-4 text-white fill-white" />
                    <span>QUICK_FILE_UPLOAD.SYS</span>
                  </h3>
                  <span className="text-xs font-mono text-zinc-400">Drag and drop files to encrypt</span>
                </div>
                <FileUploadArea onUploadSuccess={handleUploadSuccess} />
              </div>

              {/* Uploaded Files List */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-cyber text-base font-bold text-white tracking-wide">
                      {currentView === 'recent' ? 'RECENT_UPLOADS.LOG' : 'COMMITTED_VAULT_FILES'}
                    </h3>
                    <p className="text-xs font-mono text-zinc-400">
                      Showing encrypted files with size metrics, timestamps, and client action tools
                    </p>
                  </div>
                </div>

                <FileList
                  files={currentView === 'recent' ? files.slice(0, 5) : files}
                  searchQuery={searchQuery}
                  viewMode={viewMode}
                  onDeleteFile={(id, name) => setFileToDelete({ id, name })}
                  onPreviewFile={(file) => setPreviewFile(file)}
                  onOpenUpload={() => setIsUploadModalOpen(true)}
                />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal Dialogs */}
      <FileUploadArea
        isOpenModal={isUploadModalOpen}
        onCloseModal={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onUpdateNotes={handleUpdateNotes}
      />

      <DeleteConfirmModal
        isOpen={!!fileToDelete}
        fileName={fileToDelete?.name || ''}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setFileToDelete(null)}
      />

      <ClientPortalModal
        isOpen={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050507] cyber-grid text-white">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p className="text-xs font-mono tracking-widest uppercase">INITIALIZING SUVAULT CORE...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <Dashboard />;
}
