import React, { useEffect, useState, useRef } from 'react';
import { Product } from '../types';
import { formatPrice, getStoreName } from '../lib/store';
import {
  generateTSPLCommands,
  sendTSPLToWebUSB,
  sendTSPLToWebSerial
} from '../lib/tsplPrinter';
import {
  Printer,
  X,
  QrCode,
  RotateCw,
  Sliders,
  Cpu,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download,
  Usb,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import QRCode from 'qrcode';

interface ProductStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

type StickerPreset = '40x20' | '50x30' | '30x20' | 'custom';
type RotationOption = '0' | '90' | '180' | '270';
type ActiveTab = 'preview' | 'hardware' | 'guide';

export const ProductStickerModal: React.FC<ProductStickerModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview');
  const [preset, setPreset] = useState<StickerPreset>('40x20');
  const [widthMm, setWidthMm] = useState<number>(40);
  const [heightMm, setHeightMm] = useState<number>(20);
  const [rotation, setRotation] = useState<RotationOption>('0');
  const [copies, setCopies] = useState<number>(1);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [layoutStyle, setLayoutStyle] = useState<'side-by-side' | 'stacked'>('side-by-side');
  const [usbStatus, setUsbStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSendingUsb, setIsSendingUsb] = useState(false);

  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Sync preset changes with width/height
  const handlePresetChange = (newPreset: StickerPreset) => {
    setPreset(newPreset);
    if (newPreset === '40x20') {
      setWidthMm(40);
      setHeightMm(20);
      setLayoutStyle('side-by-side');
    } else if (newPreset === '50x30') {
      setWidthMm(50);
      setHeightMm(30);
      setLayoutStyle('side-by-side');
    } else if (newPreset === '30x20') {
      setWidthMm(30);
      setHeightMm(20);
      setLayoutStyle('side-by-side');
    }
  };

  // Generate crisp QR code on changes
  useEffect(() => {
    if (product && product.qr_id) {
      QRCode.toDataURL(product.qr_id, {
        width: 300, // High resolution for crisp 203 DPI thermal print
        margin: 0,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR:', err));
    }
  }, [product, widthMm, heightMm]);

  if (!isOpen || !product) return null;

  const storeName = getStoreName();
  const priceFormatted = formatPrice(product.price);

  /**
   * Browser Precision Printing using an Isolated Hidden IFrame with exact @page CSS
   */
  const handleBrowserPrint = () => {
    let iframe = printIframeRef.current;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      printIframeRef.current = iframe;
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Build repeated sticker pages based on copies requested
    let pagesHtml = '';
    for (let i = 0; i < copies; i++) {
      if (layoutStyle === 'side-by-side') {
        pagesHtml += `
          <div class="sticker-page rot-${rotation}">
            <div class="sticker-container side-by-side">
              <div class="qr-col">
                <img src="${qrDataUrl}" alt="QR" class="qr-img" />
              </div>
              <div class="text-col">
                <div class="store-name">${storeName}</div>
                <div class="product-title">${product.name}</div>
                <div class="product-id">ID: ${product.qr_id}</div>
                <div class="price-badge">${priceFormatted}</div>
              </div>
            </div>
          </div>
        `;
      } else {
        pagesHtml += `
          <div class="sticker-page rot-${rotation}">
            <div class="sticker-container stacked">
              <div class="store-name center">${storeName}</div>
              <div class="qr-col center">
                <img src="${qrDataUrl}" alt="QR" class="qr-img stacked-qr" />
              </div>
              <div class="product-title center">${product.name}</div>
              <div class="product-id center">ID: ${product.qr_id}</div>
              <div class="price-badge center">${priceFormatted}</div>
            </div>
          </div>
        `;
      }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Label - ${product.name}</title>
        <style>
          @page {
            size: ${widthMm}mm ${heightMm}mm;
            margin: 0mm !important;
          }
          @page :left { margin: 0; }
          @page :right { margin: 0; }
          
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0;
            padding: 0;
          }
          
          html, body {
            width: ${widthMm}mm;
            height: ${heightMm}mm;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          
          .sticker-page {
            width: ${widthMm}mm;
            height: ${heightMm}mm;
            page-break-after: always;
            page-break-inside: avoid;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }

          .rot-90 {
            transform: rotate(90deg);
            transform-origin: center center;
          }
          .rot-180 {
            transform: rotate(180deg);
            transform-origin: center center;
          }
          .rot-270 {
            transform: rotate(270deg);
            transform-origin: center center;
          }
          
          .sticker-container.side-by-side {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            padding: 1mm 1.5mm;
            gap: 1.5mm;
          }
          
          .qr-col {
            width: ${Math.min(heightMm - 2, 22)}mm;
            height: ${Math.min(heightMm - 2, 22)}mm;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          
          .qr-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            image-rendering: pixelated;
          }
          
          .text-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            min-width: 0;
            overflow: hidden;
            padding: 0.2mm 0;
          }
          
          .store-name {
            font-size: 6.5pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border-bottom: 0.6px solid #000;
            padding-bottom: 0.2mm;
            line-height: 1.1;
          }
          
          .product-title {
            font-size: 7pt;
            font-weight: 800;
            line-height: 1.1;
            max-height: 2.3em;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            margin: auto 0;
            color: #000;
          }
          
          .product-id {
            font-size: 5.5pt;
            font-family: monospace;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1;
          }
          
          .price-badge {
            background: #000000 !important;
            color: #ffffff !important;
            font-size: 7.5pt;
            font-weight: 900;
            text-align: center;
            padding: 0.3mm 0.8mm;
            border-radius: 0.8mm;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.1;
          }

          .sticker-container.stacked {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 1mm;
            text-align: center;
          }
          .stacked-qr {
            width: 14mm;
            height: 14mm;
          }
          .center {
            text-align: center;
            margin: 0 auto;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Trigger print once styles and images are ready
    setTimeout(() => {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    }, 250);
  };

  /**
   * TSPL commands generation
   */
  const tsplCode = generateTSPLCommands({
    storeName,
    productName: product.name,
    priceFormatted,
    qrId: product.qr_id,
    widthMm,
    heightMm,
    gapMm: 2,
    copies,
    direction: rotation === '180' || rotation === '270' ? 1 : 0,
    layout: layoutStyle
  });

  const handleSendWebUSB = async () => {
    setIsSendingUsb(true);
    setUsbStatus(null);
    const result = await sendTSPLToWebUSB(tsplCode);
    setIsSendingUsb(false);
    if (result.success) {
      setUsbStatus({ type: 'success', text: result.message });
    } else {
      setUsbStatus({ type: 'error', text: result.message });
    }
  };

  const handleSendWebSerial = async () => {
    setIsSendingUsb(true);
    setUsbStatus(null);
    const result = await sendTSPLToWebSerial(tsplCode);
    setIsSendingUsb(false);
    if (result.success) {
      setUsbStatus({ type: 'success', text: result.message });
    } else {
      setUsbStatus({ type: 'error', text: result.message });
    }
  };

  const handleDownloadTSPL = () => {
    const blob = new Blob([tsplCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `label_${product.qr_id}.prn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyTSPL = () => {
    navigator.clipboard.writeText(tsplCode);
    setUsbStatus({ type: 'info', text: 'TSPL command copied to clipboard!' });
    setTimeout(() => setUsbStatus(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Thermal Label & Barcode Center
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Precision printing for 203 DPI thermal label printers (Xprinter / TSC / Gprinter)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/50 px-5 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t border-x border-slate-200 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Sticker Designer & Print</span>
          </button>

          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'hardware'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 border-t border-x border-slate-200 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Direct TSPL / WebUSB</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-t border-x border-slate-200 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Fix Alignment / Sliced Labels</span>
          </button>
        </div>

        {/* Tab 1: Preview & Driver Print */}
        {activeTab === 'preview' && (
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Quick Presets & Orientation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Preset Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  1. Label Roll Size (mm)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePresetChange('40x20')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
                      preset === '40x20'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    40 x 20 mm
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetChange('50x30')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
                      preset === '50x30'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    50 x 30 mm
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetChange('custom')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
                      preset === 'custom'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Rotation / Orientation */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  2. Rotation / Feed Angle
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['0', '90', '180', '270'] as RotationOption[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRotation(r)}
                      className={`py-1.5 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        rotation === r
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>{r}°</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Sizing inputs if custom */}
            {preset === 'custom' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Width (mm)
                  </label>
                  <input
                    type="number"
                    value={widthMm}
                    onChange={(e) => setWidthMm(Number(e.target.value) || 20)}
                    min={15}
                    max={120}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Height (mm)
                  </label>
                  <input
                    type="number"
                    value={heightMm}
                    onChange={(e) => setHeightMm(Number(e.target.value) || 15)}
                    min={10}
                    max={150}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>
              </div>
            )}

            {/* Live Visual Sticker Canvas Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Live Thermal Output Preview ({widthMm}mm × {heightMm}mm):</span>
                <span className="text-[11px] text-slate-400 font-mono">Rotation: {rotation}°</span>
              </div>

              <div className="p-8 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[170px] overflow-hidden">
                {/* Physical Sticker Container */}
                <div
                  style={{
                    width: `${widthMm * 5.2}px`,
                    height: `${heightMm * 5.2}px`,
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  className="bg-white text-black p-2 rounded shadow-lg border-2 border-black/80 flex items-center gap-2 font-sans select-none overflow-hidden"
                >
                  {/* Left: Vector QR Code */}
                  <div className="w-[36%] h-[90%] shrink-0 flex items-center justify-center p-0.5 border border-black/30 rounded">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt={`QR ${product.qr_id}`}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <span className="text-[8px] text-gray-400">QR</span>
                    )}
                  </div>

                  {/* Right: Store, Product Name, ID, Price */}
                  <div className="flex-1 flex flex-col justify-between h-full min-w-0 py-0.5 text-left">
                    <div className="font-black text-[9px] text-black uppercase tracking-tight truncate border-b border-black/30 pb-0.5">
                      {storeName}
                    </div>
                    <div className="font-extrabold text-[10px] leading-tight text-black line-clamp-2 my-auto">
                      {product.name}
                    </div>
                    <div className="font-mono text-[7.5px] text-black/80 font-bold truncate">
                      ID: {product.qr_id}
                    </div>
                    <div className="bg-black text-white font-black text-[9.5px] py-0.5 px-1 rounded text-center truncate">
                      {priceFormatted}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Copies & Print Controls */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Number of Copies:
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCopies(num)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      copies === num
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Hardware TSPL (WebUSB) */}
        {activeTab === 'hardware' && (
          <div className="p-5 space-y-4 overflow-y-auto">
            <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/60 space-y-2">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>Zero-Driver Direct Hardware TSPL Printing</span>
              </div>
              <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
                Your printer (as shown on its technical sticker) natively speaks <strong>TSPL2 command language</strong>. 
                Using WebUSB, BiPOS sends raw micro-millimeter instructions directly to the printer chip with <strong>0 scaling errors and 0 margin gaps!</strong>
              </p>
            </div>

            {usbStatus && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
                usbStatus.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                  : usbStatus.type === 'error'
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300'
                  : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-300'
              }`}>
                {usbStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{usbStatus.text}</span>
              </div>
            )}

            {/* 1-Click Hardware Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleSendWebUSB}
                disabled={isSendingUsb}
                className="py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Usb className="w-4 h-4" />
                <span>{isSendingUsb ? 'Connecting...' : 'Print via Direct WebUSB'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendWebSerial}
                disabled={isSendingUsb}
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Cpu className="w-4 h-4" />
                <span>Print via WebSerial / COM</span>
              </button>
            </div>

            {/* TSPL Code Inspector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Generated TSPL Command Code:</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyTSPL}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <button
                    onClick={handleDownloadTSPL}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Download className="w-3 h-3" /> Download .prn
                  </button>
                </div>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-36 border border-slate-800 select-all">
                {tsplCode}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Calibration & Troubleshooting Guide */}
        {activeTab === 'guide' && (
          <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {/* Sensor Calibration Card */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Fix 1: Calibrate the Gap Sensor (Stops Slicing & Skipping Labels)</span>
              </div>
              <p className="text-emerald-800 dark:text-emerald-300 text-[11.5px]">
                Your printer label indicates <strong>"标签纸自动定位" (Automatic Label Positioning)</strong>. If it prints across the middle gap of two stickers, the sensor must be calibrated:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-emerald-900 dark:text-emerald-200 text-[11.5px] font-medium">
                <li>Turn the printer power switch <strong>OFF</strong>.</li>
                <li>Press and <strong>HOLD</strong> the green <strong>FEED / PAUSE</strong> button on the front.</li>
                <li>While holding the button, turn the power switch <strong>ON</strong>.</li>
                <li>Wait 3 seconds until the printer beeps twice (or the LED blinks pink/blue), then <strong>RELEASE</strong> the button.</li>
                <li>The printer will feed 2-3 stickers and stop <strong>exactly on the gap tear-line</strong>.</li>
              </ol>
            </div>

            {/* Chrome / Windows Print Dialog Settings */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200 text-sm">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Fix 2: Browser Print Dialog Settings Checklist</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-blue-900 dark:text-blue-200 text-[11.5px]">
                <li><strong>Destination:</strong> Select your Thermal Barcode Printer (not Microsoft Print to PDF).</li>
                <li><strong>Paper Size:</strong> Select <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded font-mono">40mm x 20mm</code> (or match your roll).</li>
                <li><strong>Margins:</strong> Set to <strong>None (0)</strong>.</li>
                <li><strong>Scale:</strong> Set to <strong>100%</strong> (or Custom: 100%).</li>
                <li><strong>Headers and Footers:</strong> <strong>Uncheck / Turn OFF</strong>.</li>
                <li><strong>If it prints sideways:</strong> Use the <strong>90° / 270° Rotation</strong> button in the designer tab.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex gap-3 shrink-0">
          <button
            onClick={handleBrowserPrint}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print {copies}x Thermal Label ({widthMm}x{heightMm}mm)</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
