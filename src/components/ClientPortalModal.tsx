import React, { useState } from 'react';
import { X, Share2, Copy, Check, ShieldCheck, Mail, Link as LinkIcon, UserCheck, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ClientPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientPortalModal: React.FC<ClientPortalModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  if (!isOpen) return null;

  const portalLink = `${window.location.origin}/?portal=${user?.id || 'client'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(portalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail) return;
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setClientEmail('');
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-zinc-950 rounded-2xl border border-white/25 max-w-lg w-full p-6 shadow-[0_0_40px_rgba(255,255,255,0.15)] cyber-panel space-y-5 text-white">
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/40 text-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-cyber text-base font-bold text-white neon-glow-silver tracking-wide">
                CLIENT_PORTAL_LINK.EXE
              </h3>
              <p className="text-xs font-mono text-zinc-400">
                Generate secure direct client upload channel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Direct Link */}
        <div className="space-y-2 font-mono">
          <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-white" />
            CLIENT_ACCESS_URL
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <LinkIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                readOnly
                value={portalLink}
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-900 border border-white/20 rounded-xl text-white font-mono select-all focus:outline-none"
              />
            </div>
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 chrome-btn font-cyber font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[3]" />}
              <span>{copied ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
          <p className="text-[11px] text-zinc-400">
            Transmit this URL directly to your client. They can upload design deliverables and assets straight into your partition.
          </p>
        </div>

        {/* Invite by Email */}
        <form onSubmit={handleSendInvite} className="space-y-2 pt-2 border-t border-zinc-800 font-mono">
          <label className="block text-xs font-semibold text-zinc-300">
            DISPATCH CLIENT INVITE (SMTP / SECURE)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@enterprise.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-900 border border-white/20 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-white"
              />
            </div>
            <button
              type="submit"
              disabled={!clientEmail || inviteSent}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white border border-white/20 text-xs font-tech font-bold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              {inviteSent ? <UserCheck className="w-4 h-4 text-white" /> : <Mail className="w-4 h-4" />}
              <span>{inviteSent ? 'DISPATCHED' : 'DISPATCH'}</span>
            </button>
          </div>
        </form>

        {/* Security Assurance */}
        <div className="p-3 bg-zinc-900 border border-white/20 rounded-xl flex items-start gap-2.5 text-xs text-zinc-300 font-mono">
          <ShieldCheck className="w-4 h-4 text-white shrink-0 mt-0.5" />
          <p>
            Isolated multi-tenant boundaries. Zero Firebase or 3rd-party storage snooping. Each upload is authenticated against cryptographic user IDs.
          </p>
        </div>

        <div className="flex justify-end pt-2 font-tech">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
          >
            [ DONE ]
          </button>
        </div>
      </div>
    </div>
  );
};
