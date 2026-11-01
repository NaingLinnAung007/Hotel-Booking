import React, { useState } from 'react';
import { Check, Copy, Database, X } from 'lucide-react';
import { SUPABASE_SETUP_SQL } from '../../config/brandAssets';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-900/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supabase-setup-title"
    >
      <div className="bg-ivory-50 border border-taupe-300 rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-champagne-200 bg-ivory-100">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-rosebronze-600" />
            <h2 id="supabase-setup-title" className="text-lg font-semibold text-espresso-900">
              Supabase Database & Auth Setup Guide
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-umber-600 hover:text-espresso-900 hover:bg-champagne-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm text-espresso-800">
          <div className="space-y-2">
            <p className="font-semibold text-espresso-900">1. Add your Supabase Project Credentials</p>
            <p className="text-umber-600 leading-relaxed">
              Update <code className="font-mono text-xs bg-champagne-100 px-1.5 py-0.5 rounded">.env.local</code> (or your environment secrets) with your project URL and publishable anon key:
            </p>
            <pre className="bg-espresso-900 text-ivory-100 p-3.5 rounded-xl font-mono text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key`}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-espresso-900">
                2. Run Exact Schema & RLS Script in Supabase SQL Editor
              </p>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rosebronze-500 text-white hover:bg-rosebronze-600 transition-colors whitespace-nowrap shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied SQL' : 'Copy SQL Script'}
              </button>
            </div>
            <pre className="bg-espresso-900 text-ivory-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-64">
              {SUPABASE_SETUP_SQL}
            </pre>
          </div>

          <div className="space-y-1.5 bg-champagne-100/70 border border-taupe-300 rounded-xl p-4">
            <p className="font-semibold text-espresso-900">3. Grant Admin Access</p>
            <p className="text-umber-600 text-xs leading-relaxed">
              Create an account in <strong>Supabase Authentication → Users</strong>, copy that user&apos;s UUID, and insert it into <code className="font-mono">public.admin_users (user_id)</code>:
            </p>
            <pre className="bg-ivory-50 border border-champagne-200 text-espresso-900 p-2.5 rounded-lg font-mono text-xs overflow-x-auto mt-2">
{`insert into public.admin_users (user_id) values ('PASTE-AUTH-USER-UUID-HERE');`}
            </pre>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-champagne-200 bg-ivory-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-espresso-900 text-ivory-50 hover:bg-espresso-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
