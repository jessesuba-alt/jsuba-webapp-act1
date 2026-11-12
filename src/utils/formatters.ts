export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1));
  return `${val} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Recently';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(d);
  } catch {
    return 'Recently';
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Recently';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return 'Recently';
  }
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts.pop()?.toUpperCase() || 'FILE';
  }
  return 'FILE';
}

export function getFileTypeInfo(filename: string, mimeType: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (['fig', 'psd', 'ai', 'xd', 'sketch', 'blend', 'cdr', 'indd'].includes(ext)) {
    return {
      type: 'Design',
      badgeColor: 'text-white bg-white/10 border-white/30',
      iconType: 'design'
    };
  }

  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'tiff'].includes(ext) || mimeType.startsWith('image/')) {
    return {
      type: 'Image',
      badgeColor: 'text-slate-200 bg-white/5 border-white/20',
      iconType: 'image'
    };
  }

  if (['pdf'].includes(ext) || mimeType === 'application/pdf') {
    return {
      type: 'PDF',
      badgeColor: 'text-white bg-zinc-800 border-zinc-600',
      iconType: 'pdf'
    };
  }

  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return {
      type: 'Archive',
      badgeColor: 'text-slate-300 bg-zinc-900 border-zinc-700',
      iconType: 'archive'
    };
  }

  if (['doc', 'docx', 'txt', 'rtf', 'odt', 'pages', 'csv', 'xlsx', 'xls', 'ppt', 'pptx'].includes(ext)) {
    return {
      type: 'Document',
      badgeColor: 'text-slate-200 bg-zinc-800 border-zinc-600',
      iconType: 'document'
    };
  }

  return {
    type: 'File',
    badgeColor: 'text-slate-400 bg-zinc-900 border-zinc-800',
    iconType: 'other'
  };
}
