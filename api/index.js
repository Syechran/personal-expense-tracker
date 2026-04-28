import express from 'express';
import { google } from 'googleapis';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 

// Autentikasi ke Google Cloud menggunakan Service Account
let authOptions = {
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
};

// Cek apakah sedang berjalan di Vercel (mencari variabel Environment)
if (process.env.GOOGLE_CREDS_JSON) {
  authOptions.credentials = JSON.parse(process.env.GOOGLE_CREDS_JSON);
} else {
  // Jika berjalan di laptop, baca dari file lokal
  authOptions.keyFile = 'D:/Project/Keuangan/personal-expense-tracker/credentials.json';
}

const auth = new google.auth.GoogleAuth(authOptions);

// Masukkan Spreadsheet ID kamu di sini
const spreadsheetId = '1YqmvUgwtyLrw_uPnre4wDQwy4vGGb_V5d8UCVN0BVoY'; 

// --- ROUTE 1: TES KONEKSI KE SHEETS ---
app.get('/api/test', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A1:H1', 
    });

    res.json({ 
        status: 'Berhasil Konek ke Google Sheets!', 
        data: response.data.values 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

// --- ROUTE 2: MENYIMPAN TRANSAKSI BARU KE SHEETS ---
app.post('/api/transactions', async (req, res) => {
  try {
    const { title, type, amount, date, category, report, balance } = req.body;

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const id = Date.now().toString();
    const values = [
      [id, title, type, amount, date, category, report, balance]
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:H', 
      valueInputOption: 'USER_ENTERED', 
      resource: {
        values,
      },
    });

    res.json({ status: 'Success', message: 'Data berhasil disimpan ke Sheets!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

// --- ROUTE 3: MENGAMBIL SEMUA DATA TRANSAKSI (VERSI FIX) ---
app.get('/api/transactions', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A2:H', 
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return res.json({ status: 'Success', data: [] });
    }

    const transactions = rows.map((row) => ({
      id: row[0],
      title: row[1],
      type: row[2],
      amount: parseInt(row[3], 10) || 0,
      date: row[4],
      category: row[5],
      report: row[6],
      balance: row[7]
    }));

    res.json({ status: 'Success', data: transactions.reverse() });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

// --- PENGATURAN SERVER KHUSUS VERCEL & LOCALHOST ---
if (!process.env.VERCEL) {
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Backend Server berjalan di http://localhost:${PORT}`);
  });
}

// Wajib diexport dengan format ES Module agar Vercel bisa menyalakannya
export default app;