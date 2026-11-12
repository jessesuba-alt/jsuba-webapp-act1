import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Directories setup
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Database Interfaces
interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  role: 'freelancer' | 'client';
  company?: string;
  createdAt: string;
}

interface VaultFile {
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

interface ClientPortal {
  id: string;
  freelancerId: string;
  title: string;
  clientEmail?: string;
  accessCode: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  files: VaultFile[];
  portals: ClientPortal[];
  sessions: { [token: string]: { userId: string; expiresAt: number } };
}

// Read / Write Database
function readDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading database:', err);
  }
  return { users: [], files: [], portals: [], sessions: {} };
}

function writeDB(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database:', err);
  }
}

// Crypto Helpers
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Initialize default seed user if db is empty so users can immediately test
function initSeedData() {
  const db = readDB();
  if (db.users.length === 0) {
    const salt1 = crypto.randomBytes(16).toString('hex');
    const defaultUser: User = {
      id: 'usr_designer_01',
      email: 'designer@suvault.com',
      passwordHash: hashPassword('password123', salt1),
      salt: salt1,
      name: 'Alex Morgan',
      role: 'freelancer',
      company: 'Studio Aurora Design',
      createdAt: new Date().toISOString()
    };

    const salt2 = crypto.randomBytes(16).toString('hex');
    const defaultClient: User = {
      id: 'usr_client_02',
      email: 'client@acme.com',
      passwordHash: hashPassword('password123', salt2),
      salt: salt2,
      name: 'Sarah Chen',
      role: 'client',
      company: 'Acme Corporation',
      createdAt: new Date().toISOString()
    };

    db.users.push(defaultUser, defaultClient);

    // Create a mock initial sample file for demo
    const sampleContent = 'SuVault Sample Deliverable - Design Brand Kit v1.0\nReady for client review.';
    const sampleFileName = 'design_system_preview.txt';
    const storedSample = `seed_${Date.now()}_design_system.txt`;
    const userUploadDir = path.join(UPLOADS_DIR, defaultUser.id);
    if (!fs.existsSync(userUploadDir)) {
      fs.mkdirSync(userUploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(userUploadDir, storedSample), sampleContent);

    db.files.push({
      id: 'file_demo_01',
      userId: defaultUser.id,
      originalName: sampleFileName,
      storedFilename: storedSample,
      mimeType: 'text/plain',
      size: Buffer.byteLength(sampleContent),
      uploadedAt: new Date(Date.now() - 3600 * 24 * 1000 * 2).toISOString(),
      category: 'Design',
      notes: 'Initial typography, color palettes, and component spec sheet.'
    });

    writeDB(db);
    console.log('Seeded initial SuVault users and sample files.');
  }
}
initSeedData();

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = (req as any).user?.id || 'anonymous';
    const userDir = path.join(UPLOADS_DIR, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitized}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB per file
});

// Middleware
app.use(express.json());

// Auth Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  let token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token && req.query.token) {
    token = String(req.query.token);
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const db = readDB();
  const session = db.sessions[token];

  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  (req as any).user = user;
  (req as any).token = token;
  next();
}

// --- AUTH ROUTES ---

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name, role, company } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const db = readDB();
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const newUser: User = {
    id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password, salt),
    salt,
    name: name.trim(),
    role: role === 'client' ? 'client' : 'freelancer',
    company: company ? String(company).trim() : undefined,
    createdAt: new Date().toISOString()
  };

  const token = generateToken();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days

  db.users.push(newUser);
  db.sessions[token] = { userId: newUser.id, expiresAt };
  writeDB(db);

  return res.json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      company: newUser.company,
      createdAt: newUser.createdAt
    }
  });
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter your email and password.' });
  }

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Incorrect email or password. Please try again.' });
  }

  const testHash = hashPassword(password, user.salt);
  if (testHash !== user.passwordHash) {
    return res.status(401).json({ error: 'Incorrect email or password. Please try again.' });
  }

  const token = generateToken();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days

  db.sessions[token] = { userId: user.id, expiresAt };
  writeDB(db);

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company,
      createdAt: user.createdAt
    }
  });
});

// Current User Me
app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company,
      createdAt: user.createdAt
    }
  });
});

// Logout
app.post('/api/auth/logout', requireAuth, (req: Request, res: Response) => {
  const token = (req as any).token as string;
  const db = readDB();
  delete db.sessions[token];
  writeDB(db);
  return res.json({ success: true, message: 'Successfully signed out.' });
});

// --- FILE STORAGE & METADATA ROUTES ---

// List files for current user (Security rules: each user can ONLY access their own files)
app.get('/api/files', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const db = readDB();

  // Strict ownership security rule: filter only by userId
  const userFiles = db.files
    .filter(f => f.userId === user.id)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  return res.json({ files: userFiles });
});

// Upload files
app.post('/api/files/upload', requireAuth, upload.array('files', 10), (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const uploadedFiles = req.files as Express.Multer.File[];

  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({ error: 'No files were provided for upload.' });
  }

  const category = (req.body.category as any) || 'Deliverable';
  const notes = req.body.notes ? String(req.body.notes).trim() : '';

  const db = readDB();
  const savedRecords: VaultFile[] = [];

  for (const f of uploadedFiles) {
    // Categorize based on mime/extension if not explicitly passed
    let fileCategory: VaultFile['category'] = category;
    const ext = path.extname(f.originalname).toLowerCase();
    if (['.fig', '.psd', '.ai', '.xd', '.sketch', '.blend'].includes(ext)) {
      fileCategory = 'Design';
    } else if (['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'].includes(ext)) {
      fileCategory = 'Image';
    } else if (['.pdf', '.docx', '.doc', '.xlsx', '.csv', '.txt'].includes(ext)) {
      fileCategory = 'Document';
    }

    const newFile: VaultFile = {
      id: `file_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId: user.id, // Strictly tagged with authenticated user ID
      originalName: f.originalname,
      storedFilename: f.filename,
      mimeType: f.mimetype || 'application/octet-stream',
      size: f.size,
      uploadedAt: new Date().toISOString(),
      category: fileCategory,
      notes: notes || undefined
    };

    db.files.push(newFile);
    savedRecords.push(newFile);
  }

  writeDB(db);
  return res.status(201).json({
    message: `Successfully uploaded ${savedRecords.length} file${savedRecords.length > 1 ? 's' : ''}.`,
    files: savedRecords
  });
});

// Download / View file content
app.get('/api/files/:id/download', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const fileId = req.params.id;
  const isInline = req.query.inline === 'true';

  const db = readDB();
  const fileRecord = db.files.find(f => f.id === fileId);

  if (!fileRecord) {
    return res.status(404).json({ error: 'File not found.' });
  }

  // Security check: Only the file owner can access it
  if (fileRecord.userId !== user.id) {
    return res.status(403).json({ error: 'Access denied: You do not have permission to access this file.' });
  }

  const filePath = path.join(UPLOADS_DIR, fileRecord.userId, fileRecord.storedFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Physical file content is missing from storage.' });
  }

  res.setHeader('Content-Type', fileRecord.mimeType);
  if (isInline) {
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileRecord.originalName)}"`);
  } else {
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileRecord.originalName)}"`);
  }

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// Delete file
app.delete('/api/files/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const fileId = req.params.id;

  const db = readDB();
  const fileIndex = db.files.findIndex(f => f.id === fileId);

  if (fileIndex === -1) {
    return res.status(404).json({ error: 'File not found.' });
  }

  const fileRecord = db.files[fileIndex];

  // Security check: Only owner can delete
  if (fileRecord.userId !== user.id) {
    return res.status(403).json({ error: 'Access denied: You can only delete your own files.' });
  }

  // Remove physical file from disk
  const filePath = path.join(UPLOADS_DIR, fileRecord.userId, fileRecord.storedFilename);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Failed to unlink file:', err);
  }

  // Remove from database
  db.files.splice(fileIndex, 1);
  writeDB(db);

  return res.json({ success: true, message: `File "${fileRecord.originalName}" was permanently deleted.` });
});

// Update file notes / category
app.patch('/api/files/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const fileId = req.params.id;
  const { notes, category } = req.body;

  const db = readDB();
  const fileRecord = db.files.find(f => f.id === fileId);

  if (!fileRecord) {
    return res.status(404).json({ error: 'File not found.' });
  }

  if (fileRecord.userId !== user.id) {
    return res.status(403).json({ error: 'Access denied: You can only modify your own files.' });
  }

  if (notes !== undefined) fileRecord.notes = String(notes).trim();
  if (category) fileRecord.category = category;

  writeDB(db);
  return res.json({ success: true, file: fileRecord });
});

// User Storage & Activity Stats
app.get('/api/stats', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const db = readDB();

  const userFiles = db.files.filter(f => f.userId === user.id);
  const totalBytes = userFiles.reduce((acc, f) => acc + f.size, 0);

  const categoryBreakdown: { [key: string]: { count: number; bytes: number } } = {
    Design: { count: 0, bytes: 0 },
    Document: { count: 0, bytes: 0 },
    Image: { count: 0, bytes: 0 },
    Deliverable: { count: 0, bytes: 0 },
    Other: { count: 0, bytes: 0 }
  };

  userFiles.forEach(f => {
    const cat = categoryBreakdown[f.category] ? f.category : 'Other';
    categoryBreakdown[cat].count++;
    categoryBreakdown[cat].bytes += f.size;
  });

  return res.json({
    totalFiles: userFiles.length,
    totalBytes,
    quotaBytes: 5 * 1024 * 1024 * 1024, // 5 GB default client quota
    categoryBreakdown
  });
});

// Express + Vite Integration
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Vite Dev Server
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SuVault server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
