import React, { useEffect, useState } from 'react';
import { formatPrice, getStoreName } from '../lib/store';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';

interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ReceiptItem[];
  totalAmount: number;
  dateStr?: string;
  saleId?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  items,
  totalAmount,
  dateStr,
  saleId
}) => {
  const [saleQrDataUrl, setSaleQrDataUrl] = useState<string>('');
  const [storeQrDataUrl, setStoreQrDataUrl] = useState<string>('');

  const currentSaleId = saleId || `SALE-${Date.now().toString().slice(-6)}`;

  useEffect(() => {
    if (isOpen) {
      // Sale ID QR
      QRCode.toDataURL(currentSaleId, { width: 100, margin: 1 })
        .then((url) => setSaleQrDataUrl(url))
        .catch((err) => console.error('Error sale QR:', err));

      // Store Page QR
      QRCode.toDataURL('https://boukharizone.dz', { width: 90, margin: 1 })
        .then((url) => setStoreQrDataUrl(url))
        .catch((err) => console.error('Error store QR:', err));
    }
  }, [isOpen, currentSaleId]);

  if (!isOpen) return null;

  const receiptDate = dateStr || new Date().toLocaleString('fr-DZ');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header bar */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Receipt / Facture</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content Printable Area */}
        <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs text-slate-800 dark:text-slate-200 print-receipt-content" id="receipt-print-area">
          {/* Top Header with Sale ID QR Code */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="font-black text-base tracking-wider text-blue-600 dark:text-blue-400 uppercase">
                {getStoreName()}
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">PHONE & ELECTRONICS</p>
              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 pt-1 font-mono">
                Facture #: {currentSaleId}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">Date: {receiptDate}</p>
            </div>

            {/* Sale ID QR Code at top */}
            <div className="w-16 h-16 shrink-0 border border-slate-200 dark:border-slate-700 rounded p-0.5 bg-white flex items-center justify-center">
              {saleQrDataUrl ? (
                <img src={saleQrDataUrl} alt={`Sale QR ${currentSaleId}`} className="w-full h-full object-contain" />
              ) : (
                <span className="text-[8px] text-gray-400">QR</span>
              )}
            </div>
          </div>

          <div className="border-b border-dashed border-slate-300 dark:border-slate-700 pb-3 space-y-1.5">
            <div className="flex justify-between font-bold text-slate-600 dark:text-slate-300 pb-1 border-b border-slate-200 dark:border-slate-800">
              <span>ITEM</span>
              <span>TOTAL</span>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start gap-2">
                <span className="line-clamp-2">
                  {item.qty}x {item.name}
                </span>
                <span className="shrink-0 font-semibold">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>

          <div className="pt-1 space-y-1">
            <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-1">
              <span>TOTAL FACTURE:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          {/* Bottom Store Page QR & Greeting */}
          <div className="pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between gap-3 text-slate-500 dark:text-slate-400 text-[10px]">
            <div>
              <div className="font-extrabold text-slate-800 dark:text-slate-200">BOUKHARI ZONE STORE</div>
              <div>Scan QR to visit our store page</div>
              <div>Merci de votre confiance!</div>
            </div>

            {/* Store Page QR Code at bottom */}
            <div className="w-14 h-14 shrink-0 border border-slate-200 dark:border-slate-700 rounded p-0.5 bg-white flex items-center justify-center">
              {storeQrDataUrl ? (
                <img src={storeQrDataUrl} alt="Store QR" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[8px] text-gray-400">QR</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Facture</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-colors text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
