import React, { useState, useRef, useEffect } from 'react';
import { Product, CartItem, Role } from '../types';
import { formatPrice } from '../lib/store';
import { ShoppingCart, QrCode, Trash2, AlertTriangle, Plus, Check } from 'lucide-react';

interface PosTabProps {
  products: Product[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onCompleteSale: (cartItems: CartItem[]) => void;
  userRole: Role;
}

export const PosTab: React.FC<PosTabProps> = ({
  products,
  cart,
  setCart,
  onCompleteSale,
  userRole
}) => {
  const [qrInput, setQrInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleAddToCartByQr = (qrIdToFind: string) => {
    const trimmed = qrIdToFind.trim();
    if (!trimmed) return;

    const found = products.find(
      (p) => p.qr_id.toLowerCase() === trimmed.toLowerCase()
    );

    if (!found) {
      showToast(`⚠️ Product '${trimmed}' not found in inventory!`);
      return;
    }

    if (found.stock <= 0) {
      showToast(`⚠️ Warning: '${found.name}' is out of stock!`);
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.qr_id === found.qr_id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].qty += 1;
        return updated;
      } else {
        return [
          ...prevCart,
          {
            qr_id: found.qr_id,
            name: found.name,
            category: found.category,
            buy_price: found.buy_price || 0,
            price: found.price,
            qty: 1,
            stock: found.stock
          }
        ];
      }
    });

    setQrInput('');
  };

  const handleScannerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddToCartByQr(qrInput);
    }
  };

  const handleQtyChange = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCart((prev) => {
        const updated = [...prev];
        updated[index].qty = newQty;
        return updated;
      });
    }
  };

  const handlePriceChange = (index: number, newPriceStr: string) => {
    const newPrice = parseFloat(newPriceStr) || 0;
    const item = cart[index];

    // Trigger warning if price goes below buy price
    if (item.buy_price && newPrice < item.buy_price) {
      showToast(
        `⚠️ WARNING: Selling price (${formatPrice(newPrice)}) is lower than purchase cost (${formatPrice(
          item.buy_price
        )})!`
      );
    } else if (newPrice < item.price) {
      showToast(
        `⚠️ Note: Selling price reduced below default retail price (${formatPrice(item.price)}).`
      );
    }

    setCart((prev) => {
      const updated = [...prev];
      updated[index].price = newPrice;
      return updated;
    });
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <div className="space-y-6">
      {/* Toast Warning Popup */}
      {toastMessage && (
        <div className="bg-amber-500 text-slate-950 font-semibold px-4 py-3 rounded-xl shadow-lg border border-amber-400 flex items-center justify-between gap-3 text-sm animate-bounce-short">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs bg-black/10 hover:bg-black/20 px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Barcode Scanner, Quick Items & Active Cart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scanner Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Scan Item</span>
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Press Enter after scanning</span>
            </div>

            <div className="relative">
              <input
                ref={inputRef}
                id="pos-scanner"
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyDown={handleScannerKeyDown}
                placeholder="⚡ Scan barcode / QR code or enter product ID (e.g., 1001)..."
                autoFocus
                autoComplete="off"
                className="w-full px-4 py-3.5 text-base rounded-xl border-2 border-blue-500 focus:border-blue-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all shadow-inner font-mono"
              />
              {qrInput && (
                <button
                  type="button"
                  onClick={() => handleAddToCartByQr(qrInput)}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              )}
            </div>

            {/* Quick Select Buttons */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                Quick Select Products:
              </span>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {products.map((p) => (
                  <button
                    key={p.qr_id}
                    onClick={() => handleAddToCartByQr(p.qr_id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-800 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-medium">{p.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">({p.qr_id})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Cart Table Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Active Cart ({cart.reduce((acc, i) => acc + i.qty, 0)} items)</span>
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  Clear Cart
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3">Price (DA)</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Total</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                        Cart is empty. Scan an item or use Quick Select above!
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, i) => {
                      const subtotal = item.price * item.qty;
                      return (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              ID: {item.qr_id}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => handlePriceChange(i, e.target.value)}
                              className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleQtyChange(i, parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                            {formatPrice(subtotal)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleQtyChange(i, 0)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Checkout Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6 sticky top-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg border-b border-slate-100 dark:border-slate-700 pb-3">
              Checkout & Summary
            </h3>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-xl p-4 flex items-center justify-between">
              <span className="font-extrabold text-emerald-800 dark:text-emerald-300 text-base uppercase tracking-wider">
                TOTAL:
              </span>
              <span className="font-extrabold text-2xl text-emerald-600 dark:text-emerald-400 font-mono">
                {formatPrice(totalAmount)}
              </span>
            </div>

            <button
              onClick={() => onCompleteSale(cart)}
              disabled={cart.length === 0}
              className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-md ${
                cart.length === 0
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-[0.99]'
              }`}
            >
              <Check className="w-5 h-5" />
              <span>Complete Sale & Print Facture</span>
            </button>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex justify-between">
                <span>Items Count:</span>
                <span className="font-semibold">{cart.reduce((acc, i) => acc + i.qty, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-emerald-600 font-semibold">Ready for Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
