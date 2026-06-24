import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Utensils,
  Banknote,
  Ticket,
  Car,
  MinusCircle,
  Trash2
} from "lucide-react";

export default function Home() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState("Total Balance");

  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [transactions, setTransactions] = useState([]);

  // States for swipe to delete
  const [swipedTransactionId, setSwipedTransactionId] = useState(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for See all toggle
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const [balanceData, setBalanceData] = useState({
    "Total Balance": { amount: 0, income: 0, expenses: 0 },
    "Bank": { amount: 0, income: 0, expenses: 0 },
    "Cash": { amount: 0, income: 0, expenses: 0 },
    "E-Wallet": { amount: 0, income: 0, expenses: 0 }, // Sesuaikan dengan kategori di AddTransaction
  });

useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((result) => {
        if (result.status === "Success") {
          const data = result.data;
          setTransactions(data);
          calculateBalances(data); 

          // --- LOGIKA SMART MERGE SINKRONISASI KATEGORI ---
          const defaultCategories = ["Bank", "Cash", "E-Wallet"]; // 1. Data Bawaan
          const savedCategories = JSON.parse(localStorage.getItem("balanceCategories") || "[]"); // 2. Data Manual (BCA dll)
          const sheetsCategories = data.map(trx => trx.balance).filter(Boolean); // 3. Data Database

          // Gabungkan ketiganya dan buang yang duplikat menggunakan Set
          const mergedCategories = [...new Set([...defaultCategories, ...savedCategories, ...sheetsCategories])];
          
          // Simpan kembali secara permanen
          localStorage.setItem("balanceCategories", JSON.stringify(mergedCategories));
        }
      })
      .catch((err) => console.error("Gagal ambil data:", err));
  }, []);

// 4. Fungsi Logika untuk menghitung saldo dari daftar transaksi (VERSI PINTAR)
  const calculateBalances = (allTransactions) => {
    
    // Kita pancing dengan Data Default agar aman
    const freshBalance = {
      "Total Balance": { amount: 0, income: 0, expenses: 0 },
      "Bank": { amount: 0, income: 0, expenses: 0 },
      "Cash": { amount: 0, income: 0, expenses: 0 },
      "E-Wallet": { amount: 0, income: 0, expenses: 0 },
    };

    allTransactions.forEach((trx) => {
      const amt = parseInt(trx.amount) || 0;
      const balKey = trx.balance;

      // KUNCI UTAMA: Jika ada nama kategori baru dari Database yang belum ada di list,
      // buatkan tempatnya secara otomatis!
      if (!freshBalance[balKey]) {
        freshBalance[balKey] = { amount: 0, income: 0, expenses: 0 };
      }

      // Update Per Kategori
      freshBalance[balKey].amount += amt;
      if (amt > 0) freshBalance[balKey].income += amt;
      else freshBalance[balKey].expenses += Math.abs(amt);

      // Update Total Keseluruhan
      freshBalance["Total Balance"].amount += amt;
      if (amt > 0) freshBalance["Total Balance"].income += amt;
      else freshBalance["Total Balance"].expenses += Math.abs(amt);
    });

    // Supaya kategori yang ditambahkan manual via tombol tidak hilang,
    // kita gabungkan data lama (prev) dengan hasil hitungan baru
    setBalanceData((prev) => ({
      ...prev,
      ...freshBalance
    }));
  };

  const handleSelectBalance = (category) => {
    setSelectedBalance(category);
    setIsExpanded(false);
  };

  // Fungsi untuk menambah kategori rekening baru
  const handleAddCategory = () => {
    setNewCategoryInput("");
    setShowAddPrompt(true);
  };

  const confirmAddCategory = (newCategory) => {
    if (newCategory && newCategory.trim() !== "") {
      const trimmedCategory = newCategory.trim();

      if (balanceData[trimmedCategory]) {
        alert("Kategori tersebut sudah ada!");
        return;
      }

      // 1. Update UI Home secara instan
      setBalanceData((prev) => ({
        ...prev,
        [trimmedCategory]: { amount: 0, income: 0, expenses: 0 }
      }));

      // 2. SINKRONISASI: Simpan daftar kategori ke LocalStorage agar bisa dibaca halaman Add
      const currentCategories = JSON.parse(localStorage.getItem("balanceCategories") || '["Bank", "Cash", "E-Wallet"]');
      if (!currentCategories.includes(trimmedCategory)) {
        const updatedCategories = [...currentCategories, trimmedCategory];
        localStorage.setItem("balanceCategories", JSON.stringify(updatedCategories));
      }
    }
    setShowAddPrompt(false);
  };

  // Fungsi untuk MENGHAPUS kategori
  const handleDeleteCategory = (e, categoryName) => {
    e.stopPropagation(); // Mencegah klik nyasar yang malah memilih kartu
    setCategoryToDelete(categoryName);
    setShowDeletePrompt(true);
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;

    // 1. Hapus dari LocalStorage agar sinkron dengan halaman Add & Overview
    const currentCategories = JSON.parse(localStorage.getItem("balanceCategories") || "[]");
    const updatedCategories = currentCategories.filter(cat => cat !== categoryToDelete);
    localStorage.setItem("balanceCategories", JSON.stringify(updatedCategories));

    // 2. Hapus dari layar Home seketika
    setBalanceData((prevData) => {
      const newData = { ...prevData };
      delete newData[categoryToDelete];
      return newData;
    });

    // 3. Jika yang dihapus sedang aktif dilihat, kembalikan ke Total Balance
    if (selectedBalance === categoryToDelete) {
      setSelectedBalance("Total Balance");
    }
    
    setShowDeletePrompt(false);
    setCategoryToDelete(null);
  };

  // --- SWIPE TO DELETE LOGIC ---
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e, id) => {
    const touchCurrentX = e.touches[0].clientX;
    const diff = touchCurrentX - touchStartX;
    
    // Geser ke kanan (swipe right) memunculkan tombol hapus
    if (diff > 50) {
      setSwipedTransactionId(id);
    } 
    // Geser ke kiri menyembunyikan tombol hapus
    else if (diff < -50 && swipedTransactionId === id) {
      setSwipedTransactionId(null);
    }
  };

  // --- FILTER TRANSAKSI UNTUK BULAN INI ---
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const getMonthAndYearFromDate = (dateString) => {
    if (!dateString) return null;
    const parts = String(dateString).split(" ");
    if (parts.length >= 3) {
      return { month: parts[0], year: parseInt(parts[2], 10) };
    }
    return null;
  };

  const filteredTransactions = showAllTransactions 
    ? transactions 
    : transactions.filter(trx => {
        const parsed = getMonthAndYearFromDate(trx.date);
        return parsed && parsed.month === currentMonthName && parsed.year === currentYear;
      });

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm("Yakin ingin menghapus transaksi ini?")) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.status === 'Success') {
        const updatedTransactions = transactions.filter(trx => trx.id !== id);
        setTransactions(updatedTransactions);
        calculateBalances(updatedTransactions);
        setSwipedTransactionId(null);
      } else {
        alert(result.message || "Gagal menghapus transaksi");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="screen-content">
      <header className="header">
        <h1>Home</h1>
      </header>

{/* BALANCE CARD */}
      <section className={`balance-card ${isExpanded ? "expanded" : ""}`}>
        {/* HEADER */}
        <div className="balance-header" onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: "pointer" }}>
          <span className="balance-label">
            {selectedBalance} {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
          <h2 className="total-amount">
            Rp{balanceData[selectedBalance].amount.toLocaleString("id-ID")}
          </h2>
        </div>

        {/* LOGIKA TOGGLE: Tampilan Default (Collapsed) */}
          <div className={`balance-summary ${isExpanded ? "hidden" : ""}`}>
          <div className="summary-item">
            <span className="summary-label">Income</span>
            <span className="summary-value">Rp{balanceData[selectedBalance].income.toLocaleString("id-ID")}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Expenses</span>
            <span className="summary-value">Rp{balanceData[selectedBalance].expenses.toLocaleString("id-ID")}</span>
          </div>
        </div>

{/* LOGIKA TOGGLE: Tampilan Detail (Expanded) */}
        {/* Kita atur class 'hidden' aktif saat isExpanded = false */}
        <div className={`balance-details ${isExpanded ? "" : "hidden"}`}>
          
          <div className="balance-list-scrollable">
          {selectedBalance !== "Total Balance" && (
            <div className="detail-item" onClick={() => handleSelectBalance("Total Balance")} style={{ cursor: "pointer" }}>
              <span className="detail-label">Total Balance</span>
              <span className="detail-value">Rp{balanceData["Total Balance"].amount.toLocaleString("id-ID")}</span>
            </div>
          )}

          {Object.keys(balanceData).map((key) => {
            if (key === "Total Balance") return null;
            return (
              <div 
                className="detail-item" 
                key={key} 
                onClick={() => handleSelectBalance(key)} 
                style={{ cursor: "pointer", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                {/* Bagian Teks (Kiri) */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <span className="detail-label">{key}</span>
                  <span className="detail-value">Rp{balanceData[key].amount.toLocaleString("id-ID")}</span>
                </div>
                
                {/* Tombol Hapus (Kanan) */}
                <MinusCircle 
                  size={20} 
                  color="#ffffff" 
                  onClick={(e) => handleDeleteCategory(e, key)}
                />
              </div>
            );
          })}
          </div>

          <button 
            className="add-category-btn" 
            style={{ marginTop: "12px", flexShrink: 0 }}
            onClick={handleAddCategory} 
          >
            <Plus size={16} /> Add Balance Category
          </button>
        </div>
      </section>

      {/* TRANSACTIONS SECTION */}
      <section className="transactions-section">
        <div className="section-header">
          <h3>Transactions</h3>
          <span 
            className="see-all" 
            onClick={() => setShowAllTransactions(!showAllTransactions)}
          >
            {showAllTransactions ? "Show less" : "See all"}
          </span>
        </div>
        <div className="transaction-list">
          {filteredTransactions.map((trx) => {
            let iconDisplay = <Banknote size={24} color="white" />; // default
            if (trx.category === "Food") iconDisplay = <Utensils size={24} color="white" />;
            if (trx.category === "Transport") iconDisplay = <Car size={24} color="white" />;

            return (
              <div 
                className="transaction-swipe-container" 
                key={trx.id}
                onTouchStart={handleTouchStart}
                onTouchMove={(e) => handleTouchMove(e, trx.id)}
              >
                {/* Tombol Hapus (Tersembunyi di kiri) */}
                <div className={`transaction-swipe-action ${swipedTransactionId === trx.id ? 'visible' : ''}`}>
                  <button 
                    className="delete-icon-btn" 
                    onClick={() => handleDeleteTransaction(trx.id)}
                    disabled={isDeleting}
                    style={{ opacity: isDeleting && swipedTransactionId === trx.id ? 0.5 : 1 }}
                  >
                    <Trash2 size={24} color={isDeleting && swipedTransactionId === trx.id ? "#888" : "#000"} />
                  </button>
                </div>

                {/* Konten Transaksi (Bergeser ke kanan saat di-swipe) */}
                <div 
                  className={`transaction-content-wrapper ${swipedTransactionId === trx.id ? 'swiped' : ''}`}
                  onClick={() => { if(swipedTransactionId === trx.id) setSwipedTransactionId(null) }}
                >
                  <div className="transaction-item">
                    <div className="transaction-icon-box">{iconDisplay}</div>
                    <div className="transaction-info">
                      <p className="transaction-title">{trx.title}</p>
                      <p className="transaction-type">{trx.type}</p>
                    </div>
                    <div className="transaction-amount-data">
                      <p
                        className={
                          trx.amount > 0 ? "amount-positive" : "amount-negative"
                        }
                      >
                        {trx.amount > 0 ? "+" : ""}Rp
                        {Math.abs(trx.amount).toLocaleString("id-ID")}
                      </p>
                      <p className="transaction-date">{trx.date}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CUSTOM PROMPT ADD CATEGORY */}
      {showAddPrompt && (
        <div className="custom-popup-overlay">
          <div className="custom-popup">
            <h3 className="custom-popup-title">Tambah Rekening</h3>
            <p className="custom-popup-desc">Masukkan nama rekening baru:</p>
            <input 
              type="text" 
              className="custom-popup-input"
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value)}
              placeholder="e.g. BCA, OVO, Gopay"
              autoFocus
            />
            <div className="custom-popup-actions">
              <button 
                className="popup-btn cancel" 
                onClick={() => setShowAddPrompt(false)}
              >
                Batal
              </button>
              <button 
                className="popup-btn confirm" 
                onClick={() => confirmAddCategory(newCategoryInput)}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE PROMPT */}
      {showDeletePrompt && (
        <div className="custom-popup-overlay">
          <div className="custom-popup">
            <h3 className="custom-popup-title">Hapus Rekening?</h3>
            <p className="custom-popup-desc">Yakin ingin menghapus rekening <b>"{categoryToDelete}"</b>?</p>
            <div className="custom-popup-actions">
              <button 
                className="popup-btn cancel" 
                onClick={() => setShowDeletePrompt(false)}
              >
                Batal
              </button>
              <button 
                className="popup-btn confirm" 
                onClick={confirmDeleteCategory}
                style={{ backgroundColor: "#e74c3c" }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
