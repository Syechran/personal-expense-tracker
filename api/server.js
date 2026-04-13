const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); // Mengizinkan React mengakses server ini
app.use(express.json()); // Membaca data JSON dari React

// Autentikasi ke Google Cloud menggunakan Service Account
// Siapkan opsi dasarnya
let authOptions = {
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
};

// Cek apakah sedang berjalan di Render (mencari variabel Environment)
if (process.env.GOOGLE_CREDS_JSON) {
  // Parsing teks JSON dari Render menjadi objek Javascript
  authOptions.credentials = JSON.parse(process.env.GOOGLE_CREDS_JSON);
} else {
  // Jika berjalan di laptop, baca dari file lokal
  authOptions.keyFile = 'credentials.json';
}

// Inisialisasi GoogleAuth dengan opsi yang sudah disesuaikan
const auth = new google.auth.GoogleAuth(authOptions);

// Masukkan Spreadsheet ID kamu di sini
const spreadsheetId = '1YqmvUgwtyLrw_uPnre4wDQwy4vGGb_V5d8UCVN0BVoY'; 

const path = require('path');

// --- ROUTE 1: TES KONEKSI KE SHEETS ---
app.get('/api/test', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Membaca baris pertama (Header) dari 'Sheet1' (A1 sampai H1)
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
    // 1. Tangkap data yang dikirim oleh React
    const { title, type, amount, date, category, report, balance } = req.body;

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // 2. Buat ID unik sederhana (menggunakan timestamp waktu saat ini)
    const id = Date.now().toString();

    // 3. Susun data menjadi array sesuai urutan kolom header di Sheets kamu
    // ['ID', 'Title', 'Type', 'Amount', 'Date', 'Category', 'Report', 'Balance']
    const values = [
      [id, title, type, amount, date, category, report, balance]
    ];

    // 4. Perintah untuk menambahkan baris (append)
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:H', // Target kolom A sampai H
      valueInputOption: 'USER_ENTERED', // Mengizinkan Sheets membaca angka sebagai angka sungguhan, bukan teks
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

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Jalankan Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend Server berjalan di http://localhost:${PORT}`);
});