# Web Deteksi Penyakit Kulit

Aplikasi web untuk mendeteksi penyakit kulit menggunakan machine learning.

## Teknologi yang Digunakan

- Frontend: React + Vite
- Backend: Node.js + Express
- Machine Learning: TensorFlow + Python
- Database: MongoDB

## Cara Menjalankan Aplikasi

### Backend

```bash
cd backend
npm install
pip install -r requirements.txt
node server.js
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Fitur

- Upload gambar kulit
- Deteksi 7 jenis penyakit kulit:
  - Actinic Keratoses (akiec)
  - Basal Cell Carcinoma (bcc)
  - Benign Keratosis (bkl)
  - Dermatofibroma (df)
  - Melanoma (mel)
  - Melanocytic Nevus (nv)
  - Vascular Lesion (vasc)
- Tampilan hasil dengan penjelasan
- Responsive design

## Catatan

Model machine learning tidak disimpan di repository karena ukurannya besar. Model akan didownload otomatis saat pertama kali menjalankan aplikasi.

## Disclaimer

Aplikasi ini hanya untuk referensi. Silakan konsultasi dengan dokter untuk diagnosis yang akurat. 