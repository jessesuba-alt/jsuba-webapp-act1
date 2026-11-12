export interface User {
  id: string;
  email: string;
  name: string;
  role: 'freelancer' | 'client';
  company?: string;
  createdAt: string;
}

export interface VaultFile {
  id: string;
  userId: string;
  originalName: string;
  storedFilename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  category: 'Design' | 'Document' | 'Image' | 'Deliverable' | 'Other';
  notes?: string;
  clientPortalId?: string;
}

export interface StorageStats {
  totalFiles: number;
  totalBytes: number;
  quotaBytes: number;
  categoryBreakdown: {
    [key: string]: {
      count: number;
      bytes: number;
    };
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}
