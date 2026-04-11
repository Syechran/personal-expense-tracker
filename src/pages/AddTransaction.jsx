import { useState, useEffect } from "react";
import {
  ChevronLeft,
  Utensils,
  ShoppingBag,
  Zap,
  Car,
  Tv,
  ChevronDown,
  Banknote,
} from "lucide-react";

export default function AddTransaction({ onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Transport");
  const [reportType, setReportType] = useState("Income");
  const [isBalanceOpen, setIsBalanceOpen] = useState(false);
  
  // INI DIA TERSANGKANYA! State balance ini sebelumnya hilang
  const [balance, setBalance] = useState("Bank"); 

  // Dilengkapi Sabuk Pengaman JSON
// Dilengkapi Sabuk Pengaman & Smart Merge
  const [balances, setBalances] = useState(() => {
    const defaultCategories = ["Bank", "Cash", "E-Wallet"];
    try {
      const saved = localStorage.getItem("balanceCategories");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
           // Gabungkan bawaan dengan yang tersimpan, lalu buang duplikat
           return [...new Set([...defaultCategories, ...parsed])];
        }
      }
    } catch (error) {
      console.error("Gagal parse kategori di AddTransaction:", error);
    }
    return defaultCategories;
  });

  const categories = [
    { name: "Food", icon: <Utensils size={20} /> },
    { name: "Shoppings", icon: <ShoppingBag size={20} /> },
    { name: "Utilities", icon: <Zap size={20} /> },
    { name: "Transport", icon: <Car size={20} /> },
    { name: "Entertainment", icon: <Tv size={20} /> },
    { name: "Other", icon: <Banknote size={20} /> },
  ];

  const handleBack = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleDraft = () => {
    const draftData = { amount, description, category, reportType, balance };
    localStorage.setItem("txDraft", JSON.stringify(draftData));
    handleBack(); 
  };

  const handleSave = async () => {
    const cleanAmount = parseInt(amount.replace(/\D/g, ""), 10) || 0;
    const finalAmount = reportType === "Expenses" ? -Math.abs(cleanAmount) : Math.abs(cleanAmount);
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });

    const newTransaction = {
      title: description || "Tanpa Keterangan", 
      type: balance === "Bank" ? "Transfer" : "Cash", 
      amount: finalAmount, 
      date: today,
      category: category,
      report: reportType,
      balance: balance
    };

    try {
      const response = await fetch("/api/transactionss", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTransaction),
      });

      const result = await response.json();

      if (result.status === "Success") {
        localStorage.removeItem("txDraft");
        setShowSuccessPopup(true);
      } else {
        alert("Gagal menyimpan: " + result.message);
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Terjadi kesalahan jaringan atau server Backend belum menyala.");
    }
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/\D/g, "");

    if (!numericValue) {
      setAmount("");
      return;
    }

    const formattedNumber = new Intl.NumberFormat("id-ID").format(numericValue);
    setAmount(`Rp${formattedNumber}`);
  };

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem("txDraft");
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        setAmount(parsedDraft.amount || "");
        setDescription(parsedDraft.description || "");
        setCategory(parsedDraft.category || "Transport");
        setReportType(parsedDraft.reportType || "Income");
        setBalance(parsedDraft.balance || "Bank");
      }
    } catch (error) {
      console.error("Gagal load draft:", error);
    }
  }, []);

  return (
    <div className="add-transaction-overlay">
      <div className={`add-tx-modal ${isClosing ? "closing" : ""}`}>
        <div className="back-btn-container" onClick={handleBack}>
          <ChevronLeft size={24} />
          <span className="back-text">Back</span>
        </div>
        <h2 className="modal-title">Transaction</h2>

        <div className="tx-input-box">
          <label className="tx-input-name">Amount</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Rp0"
            value={amount}
            onChange={handleAmountChange}
            className="tx-input-field amount-text"
          />
        </div>

        <div className="tx-input-box">
          <label className="tx-input-name">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="tx-input-field desc-text"
            placeholder="..."
          />
        </div>

        <div className="tx-section">
          <h4 className="section-label">Category</h4>
          <div className="category-grid">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className={`category-item ${category === cat.name ? "active" : ""}`}
                onClick={() => setCategory(cat.name)}
              >
                {cat.icon}
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tx-section">
          <h4 className="section-label">Report</h4>
          <div className="report-toggle-container">
            <button
              className={`report-btn ${reportType === "Income" ? "active" : ""}`}
              onClick={() => setReportType("Income")}
            >
              Income
            </button>
            <button
              className={`report-btn ${reportType === "Expenses" ? "active" : ""}`}
              onClick={() => setReportType("Expenses")}
            >
              Expenses
            </button>
          </div>
        </div>

        <div className="tx-section" style={{ position: 'relative' }}> 
          <h4 className="section-label">Balance Category</h4>
          
          <div 
            className="balance-select-btn" 
            onClick={() => setIsBalanceOpen(!isBalanceOpen)}
          >
            <span>{balance}</span>
            <ChevronDown 
              size={18} 
              style={{ 
                marginLeft: 'auto', 
                transform: isBalanceOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s' 
              }} 
            />
          </div>

          {isBalanceOpen && (
            <div className="balance-dropdown-list">
              {balances.map((item) => (
                <div 
                  key={item} 
                  className={`dropdown-item ${balance === item ? 'active' : ''}`}
                  onClick={() => {
                    setBalance(item); 
                    setIsBalanceOpen(false); 
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tx-actions">
          <button className="btn-save" onClick={handleSave}>
            Save
          </button>
          <button className="btn-draft" onClick={handleDraft}>
            Draft
          </button>
        </div>
      </div>

      {/* CUSTOM SUCCESS POPUP */}
      {showSuccessPopup && (
        <div className="custom-popup-overlay">
          <div className="custom-popup" style={{ alignItems: "center" }}>
            <div style={{ backgroundColor: "#2ecc71", width: "48px", height: "48px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "8px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 className="custom-popup-title">Yeay!</h3>
            <p className="custom-popup-desc">Transaksi berhasil masuk ke Google Sheets!</p>
            <div className="custom-popup-actions" style={{ width: "100%" }}>
              <button 
                className="popup-btn confirm" 
                onClick={() => {
                  setShowSuccessPopup(false);
                  handleBack();
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}