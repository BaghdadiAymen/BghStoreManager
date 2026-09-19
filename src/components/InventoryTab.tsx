import React, { useState } from 'react';
import { Product, Role } from '../types';
import { formatPrice } from '../lib/store';
import { Search, Plus, Pencil, Trash2, X, AlertCircle, ShoppingCart, ShieldAlert, Check, QrCode } from 'lucide-react';
import { ProductStickerModal } from './ProductStickerModal';

interface InventoryTabProps {
  products: Product[];
  userRole: Role;
  onSaveProduct: (p: Product) => void;
  onDeleteProduct: (qrId: string) => void;
  onAddToCart: (p: Product) => void;
  onDeclareBroken: (p: Product, qty: number) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  products,
  userRole,
  onSaveProduct,
  onDeleteProduct,
  onAddToCart,
  onDeclareBroken
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQrId, setEditingQrId] = useState<string | null>(null);

  // Sticker Print Modal State
  const [stickerModalProduct, setStickerModalProduct] = useState<Product | null>(null);

  // Broken Confirmation Modal State
  const [brokenProduct, setBrokenProduct] = useState<Product | null>(null);
  const [brokenQty, setBrokenQty] = useState<number>(1);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [isLowStockAlertDismissed, setIsLowStockAlertDismissed] = useState(false);

  // Form State
  const [formQr, setFormQr] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Accessories');
  const [formBuyPrice, setFormBuyPrice] = useState<number | ''>('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formStock, setFormStock] = useState<number | ''>('');

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.qr_id.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.supplier.toLowerCase().includes(term)
    );
  });

  const showToast = (msg: string) => {
    setAddedToast(msg);
    setTimeout(() => {
      setAddedToast(null);
    }, 3000);
  };

  const handleAddToCart = (p: Product) => {
    if (p.stock <= 0) {
      alert(`⚠️ Item '${p.name}' is out of stock!`);
      return;
    }
    onAddToCart(p);
    showToast(`🛒 Added '${p.name}' to cart!`);
  };

  const openAddModal = () => {
    setEditingQrId(null);
    setFormQr('');
    setFormName('');
    setFormCategory('Accessories');
    setFormBuyPrice(0);
    setFormPrice(0);
    setFormSupplier('');
    setFormStock(10);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingQrId(p.qr_id);
    setFormQr(p.qr_id);
    setFormName(p.name);
    setFormCategory(p.category || 'General');
    setFormBuyPrice(p.buy_price || 0);
    setFormPrice(p.price || 0);
    setFormSupplier(p.supplier || '');
    setFormStock(p.stock || 0);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQr || !formName) {
      alert('QR ID and Product Name are required!');
      return;
    }

    const newProd: Product = {
      qr_id: formQr.trim(),
      name: formName.trim(),
      category: formCategory.trim() || 'General',
      buy_price: Number(formBuyPrice) || 0,
      price: Number(formPrice) || 0,
      stock: Number(formStock) || 0,
      supplier: formSupplier.trim()
    };

    onSaveProduct(newProd);
    setIsModalOpen(false);
  };

  const handleDelete = (qrId: string, name: string) => {
    if (confirm(`Are you sure you want to delete product '${name}' (${qrId})?`)) {
      onDeleteProduct(qrId);
    }
  };

  const confirmDeclareBroken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokenProduct) return;
    if (brokenQty <= 0) {
      alert('Broken quantity must be at least 1');
      return;
    }
    if (brokenQty > brokenProduct.stock) {
      alert(`Cannot declare ${brokenQty} broken units when stock is only ${brokenProduct.stock}!`);
      return;
    }

    onDeclareBroken(brokenProduct, brokenQty);
    showToast(`⚠️ Declared ${brokenQty} broken unit(s) for '${brokenProduct.name}'`);
    setBrokenProduct(null);
    setBrokenQty(1);
  };

  const lowStockItems = products.filter((p) => p.stock < 5);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm animate-bounce-short">
          <Check className="w-4 h-4" />
          <span>{addedToast}</span>
        </div>
      )}

      {/* Ignorable Quantity Alert Banner */}
      {lowStockItems.length > 0 && !isLowStockAlertDismissed && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 p-4 rounded-xl shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
                <span>Low Inventory Alert ({lowStockItems.length} items with &lt; 5 stock)</span>
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 truncate">
                Items requiring restock:{' '}
                <span className="font-semibold">{lowStockItems.map((i) => `${i.name} (${i.stock})`).join(', ')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsLowStockAlertDismissed(true)}
              className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Ignore / Dismiss Alert
            </button>
          </div>
        </div>
      )}

      {/* Top Search & Actions Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search by name, barcode/QR ID, category, or supplier..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {userRole === 'admin' && (
          <button
            onClick={openAddModal}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Product Inventory ({filteredProducts.length} items)
          </h3>
          {userRole !== 'admin' && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              (Seller view: cost & supplier details hidden)
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                <th className="py-3 px-4">QR / Barcode</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                {userRole === 'admin' && (
                  <>
                    <th className="py-3 px-4">Buy Price</th>
                    <th className="py-3 px-4">Supplier</th>
                  </>
                )}
                <th className="py-3 px-4">Sell Price</th>
                <th className="py-3 px-4">Stock & Defective</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={userRole === 'admin' ? 8 : 6}
                    className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm"
                  >
                    No products found matching '{searchTerm}'.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLowStock = p.stock < 5;
                  const brokenCount = p.broken_count || 0;
                  return (
                    <tr key={p.qr_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {p.qr_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {p.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                          {p.category}
                        </span>
                      </td>
                      {userRole === 'admin' && (
                        <>
                          <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                            {formatPrice(p.buy_price)}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                            {p.supplier || '—'}
                          </td>
                        </>
                      )}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-mono">
                        {formatPrice(p.price)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span
                            className={`font-bold flex items-center gap-1 ${
                              isLowStock
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {isLowStock && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                            {p.stock} units
                          </span>
                          {brokenCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              ⚠️ {brokenCount} broken
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end flex-wrap gap-1.5">
                          {/* Print Thermal Label Sticker Button */}
                          <button
                            onClick={() => setStickerModalProduct(p)}
                            className="px-2 py-1 text-xs font-medium rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Print 5-inch Thermal Sticker Label"
                          >
                            <QrCode className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span>Label</span>
                          </button>

                          {/* Quick Add to Cart Button */}
                          <button
                            onClick={() => handleAddToCart(p)}
                            disabled={p.stock <= 0}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 shadow-2xs ${
                              p.stock <= 0
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                            }`}
                            title="Add item to POS Cart"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </button>

                          {/* Declare Broken Button */}
                          <button
                            onClick={() => {
                              setBrokenProduct(p);
                              setBrokenQty(1);
                            }}
                            disabled={p.stock <= 0}
                            className="px-2 py-1 text-xs font-medium rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Declare broken/defective item"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Broken</span>
                          </button>

                          {/* Admin Edit/Delete */}
                          {userRole === 'admin' && (
                            <>
                              <button
                                onClick={() => openEditModal(p)}
                                className="px-2 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Edit Product"
                              >
                                <Pencil className="w-3.5 h-3.5 text-blue-500" />
                              </button>
                              <button
                                onClick={() => handleDelete(p.qr_id, p.name)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Declare Broken Confirmation Modal */}
      {brokenProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-amber-200 dark:border-amber-800/60 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-7 h-7 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  Declare Broken Product
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Defective / Damaged Item Reporting
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-slate-800 dark:text-slate-200 space-y-1.5">
              <div>
                <b>Product:</b> {brokenProduct.name} (ID: {brokenProduct.qr_id})
              </div>
              <div>
                <b>Supplier:</b> {brokenProduct.supplier || 'Unspecified'}
              </div>
              <div>
                <b>Unit Cost Loss:</b> {formatPrice(brokenProduct.buy_price)}
              </div>
              <div>
                <b>Available Stock:</b> {brokenProduct.stock} units
              </div>
            </div>

            <form onSubmit={confirmDeclareBroken} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Broken Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max={brokenProduct.stock}
                  value={brokenQty}
                  onChange={(e) => setBrokenQty(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-[11px] text-slate-500 dark:text-slate-400">
                ⚠️ Confirming will deduct {brokenQty} unit(s) from inventory stock and attribute the broken item record to <b>{brokenProduct.supplier || 'the supplier'}</b> for analytics tracking.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs transition-colors text-sm"
                >
                  Yes, Declare Broken
                </button>
                <button
                  type="button"
                  onClick={() => setBrokenProduct(null)}
                  className="py-2.5 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                {editingQrId ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  QR ID / Barcode Code
                </label>
                <input
                  type="text"
                  value={formQr}
                  onChange={(e) => setFormQr(e.target.value)}
                  readOnly={!!editingQrId}
                  required
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-mono ${
                    editingQrId
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value === '' ? '' : parseInt(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Buy Cost (DA)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Selling Price (DA)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  placeholder="Optional supplier..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Save Product
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Thermal Label Sticker Printing Modal */}
      <ProductStickerModal
        isOpen={!!stickerModalProduct}
        onClose={() => setStickerModalProduct(null)}
        product={stickerModalProduct}
      />
    </div>
  );
};

