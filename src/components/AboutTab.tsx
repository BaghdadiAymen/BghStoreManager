import React, { useState } from 'react';
import {
  Mail,
  Linkedin,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  ShoppingCart,
  Package,
  CreditCard,
  BarChart3,
  QrCode,
  Printer
} from 'lucide-react';

export const AboutTab: React.FC = () => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const developerEmail = 'baghdadi.net.bus@gmail.com';
  const linkedinUrl = 'https://www.linkedin.com/in/aymenabdlmalek/';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Developer & App Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 md:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 text-center md:text-left">
          {/* Avatar / BGH Logo Graphic */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-1 shadow-2xl shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center font-black text-3xl md:text-4xl text-white font-mono border border-white/10">
              BGH
            </div>
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Software Engineer & Lead Creator
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold uppercase tracking-wider">
                Official Release
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              BiPOS <span className="text-blue-400 font-extrabold text-2xl md:text-3xl">PRO</span>
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl">
              Engineered by <b>BGHaymen (Aymen Abdelmalek)</b> — a complete Point of Sale, Inventory Management, Thermal Sticker Printing, and Debt Tracking terminal built for high-efficiency store management.
            </p>

            {/* Contact Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              {/* Email Badge */}
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{developerEmail}</span>
                <button
                  onClick={() => copyToClipboard(developerEmail)}
                  className="ml-1 p-1 hover:text-white transition-colors cursor-pointer text-slate-400"
                  title="Copy Email"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* LinkedIn Button */}
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105"
              >
                <Linkedin className="w-4 h-4 fill-current" />
                <span>LinkedIn Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* System Features Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-blue-500" />
          <span>BiPOS Core Terminal Capabilities</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl w-fit">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">POS & Barcode Scanner</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Fast 2D QR/Barcode scanner integration, instant item lookup, custom quantity adjustments, and receipt generation.
            </p>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl w-fit">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">5-Inch Thermal Label Printing</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Print high-contrast product stickers with QR codes on the left, store name BOUKHARI ZONE, and product price.
            </p>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Customer & Supplier Debts</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Separate ledgers for customer debts (credits owed to store) and supplier debts, partial payment tracking, and due dates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
