import React, { useState, useEffect } from 'react';
import { User, Product, CartItem, SaleRecord, ActiveTab, BrokenRecord, DebtRecord } from './types';
import {
  getStoredProducts,
  saveProductsToStorage,
  getStoredSales,
  saveSalesToStorage,
  getStoredBrokenRecords,
  saveBrokenRecordsToStorage,
  getStoredDebts,
  saveDebtsToStorage,
  getCurrentUser,
  setCurrentUser,
  toggleSaleGiftClaimedInStorage
} from './lib/store';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { PosTab } from './components/PosTab';
import { InventoryTab } from './components/InventoryTab';
import { SalesTab } from './components/SalesTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { DebtsTab } from './components/DebtsTab';
import { AboutTab } from './components/AboutTab';
import { ReceiptModal } from './components/ReceiptModal';

export default function App() {
  // Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Sidebar Desktop Collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Apply Theme class to document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Auth state - Require Login on startup (never auto-login as admin)
  const [currentUser, setCurrentUserParams] = useState<User | null>(() => {
    return getCurrentUser();
  });

  const handleLogin = (user: User) => {
    setCurrentUserParams(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUserParams(null);
    setCurrentUser(null);
  };

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');

  // App Core States
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>(getStoredSales);
  const [brokenRecords, setBrokenRecords] = useState<BrokenRecord[]>(getStoredBrokenRecords);
  const [debts, setDebts] = useState<DebtRecord[]>(getStoredDebts);

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptItems, setReceiptItems] = useState<{ name: string; qty: number; price: number }[]>([]);
  const [receiptTotal, setReceiptTotal] = useState(0);
  const [receiptDate, setReceiptDate] = useState('');
  const [receiptSaleId, setReceiptSaleId] = useState<string>('');

  // Debt CRUD
  const handleSaveDebt = (debt: DebtRecord) => {
    const existingIndex = debts.findIndex((d) => d.id === debt.id);
    let updatedList: DebtRecord[];
    if (existingIndex > -1) {
      updatedList = [...debts];
      updatedList[existingIndex] = debt;
    } else {
      updatedList = [debt, ...debts];
    }
    setDebts(updatedList);
    saveDebtsToStorage(updatedList);
  };

  const handleDeleteDebt = (id: string) => {
    const updatedList = debts.filter((d) => d.id !== id);
    setDebts(updatedList);
    saveDebtsToStorage(updatedList);
  };

  // Product CRUD
  const handleSaveProduct = (updatedProduct: Product) => {
    const existingIndex = products.findIndex((p) => p.qr_id === updatedProduct.qr_id);
    let updatedList: Product[];
    if (existingIndex > -1) {
      updatedList = [...products];
      updatedList[existingIndex] = updatedProduct;
    } else {
      updatedList = [...products, updatedProduct];
    }
    setProducts(updatedList);
    saveProductsToStorage(updatedList);
  };

  const handleDeleteProduct = (qrId: string) => {
    const updatedList = products.filter((p) => p.qr_id !== qrId);
    setProducts(updatedList);
    saveProductsToStorage(updatedList);
  };

  // Add item directly to POS cart from Inventory search or table
  const handleAddToCartFromInventory = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.qr_id === product.qr_id);
      if (existing) {
        return prevCart.map((item) =>
          item.qr_id === product.qr_id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prevCart,
        {
          qr_id: product.qr_id,
          name: product.name,
          price: product.price,
          buy_price: product.buy_price,
          stock: product.stock,
          qty: 1
        }
      ];
    });
  };

  // Declare Broken Product logic
  const handleDeclareBroken = (product: Product, qty: number) => {
    // 1. Deduct stock & increment broken_count on product
    const updatedProducts = products.map((p) => {
      if (p.qr_id === product.qr_id) {
        return {
          ...p,
          stock: Math.max(0, p.stock - qty),
          broken_count: (p.broken_count || 0) + qty
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    saveProductsToStorage(updatedProducts);

    // 2. Log broken record
    const newRecord: BrokenRecord = {
      id: `BRK-${Date.now()}`,
      qr_id: product.qr_id,
      product_name: product.name,
      supplier: product.supplier || 'Unspecified',
      buy_price: product.buy_price || 0,
      count: qty,
      created_at: new Date().toISOString()
    };

    const updatedBroken = [newRecord, ...brokenRecords];
    setBrokenRecords(updatedBroken);
    saveBrokenRecordsToStorage(updatedBroken);
  };

  // Checkout & Sale Completion
  const handleCompleteSale = (cartItems: CartItem[]) => {
    if (cartItems.length === 0) return;

    // 1. Calculate total & create receipt info
    const total = cartItems.reduce((acc, i) => acc + i.price * i.qty, 0);
    const dateNowStr = new Date().toLocaleString('fr-DZ');

    // 2. Deduct inventory stock
    const updatedProducts = products.map((prod) => {
      const cartMatch = cartItems.find((c) => c.qr_id === prod.qr_id);
      if (cartMatch) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartMatch.qty)
        };
      }
      return prod;
    });

    setProducts(updatedProducts);
    saveProductsToStorage(updatedProducts);

    // 3. Log sale records
    const newSalesRecords: SaleRecord[] = cartItems.map((item, index) => ({
      id: `SALE-${Date.now().toString().slice(-4)}-${index + 1}`,
      qr_id: item.qr_id,
      product_name: item.name,
      price: item.price,
      buy_price: item.buy_price,
      qty: item.qty,
      total: item.price * item.qty,
      created_at: new Date().toISOString()
    }));

    const updatedSales = [...newSalesRecords, ...sales];
    setSales(updatedSales);
    saveSalesToStorage(updatedSales);

    // 4. Open Receipt Modal
    const mainSaleId = newSalesRecords[0]?.id || `SALE-${Date.now().toString().slice(-4)}`;
    setReceiptItems(
      cartItems.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price
      }))
    );
    setReceiptTotal(total);
    setReceiptDate(dateNowStr);
    setReceiptSaleId(mainSaleId);
    setReceiptModalOpen(true);

    // 5. Clear Cart
    setCart([]);
  };

  // Reprint Receipt for existing Sale record
  const handlePrintFactureForSale = (saleRecord: SaleRecord) => {
    setReceiptItems([
      {
        name: saleRecord.product_name,
        qty: saleRecord.qty,
        price: saleRecord.price
      }
    ]);
    setReceiptTotal(saleRecord.total);
    setReceiptDate(new Date(saleRecord.created_at).toLocaleString('fr-DZ'));
    setReceiptSaleId(saleRecord.id);
    setReceiptModalOpen(true);
  };

  // Toggle Gift / Reward Claimed status on sale facture
  const handleToggleGiftClaimed = (saleId: string) => {
    const updatedSales = toggleSaleGiftClaimedInStorage(saleId);
    setSales(updatedSales);
  };

  if (!currentUser) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col md:flex-row">
      {/* Side Navigation Bar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full min-w-0">
        {activeTab === 'pos' && (
          <PosTab
            products={products}
            cart={cart}
            setCart={setCart}
            onCompleteSale={handleCompleteSale}
            userRole={currentUser.role}
          />
        )}

        {activeTab === 'stock' && (
          <InventoryTab
            products={products}
            userRole={currentUser.role}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddToCart={handleAddToCartFromInventory}
            onDeclareBroken={handleDeclareBroken}
          />
        )}

        {activeTab === 'sales' && (
          <SalesTab
            sales={sales}
            userRole={currentUser.role}
            onPrintFactureForSale={handlePrintFactureForSale}
            onToggleGiftClaimed={handleToggleGiftClaimed}
          />
        )}

        {activeTab === 'debts' && (
          <DebtsTab
            debts={debts}
            userRole={currentUser.role}
            onSaveDebt={handleSaveDebt}
            onDeleteDebt={handleDeleteDebt}
          />
        )}

        {activeTab === 'analytics' && currentUser.role === 'admin' && (
          <AnalyticsTab
            products={products}
            sales={sales}
            brokenRecords={brokenRecords}
          />
        )}

        {activeTab === 'about' && <AboutTab />}
      </main>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        items={receiptItems}
        totalAmount={receiptTotal}
        dateStr={receiptDate}
        saleId={receiptSaleId}
      />
    </div>
  );
}

