const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

const PORT = process.env.PORT || 5000;
const MODEL_PATH = process.env.MODEL_PATH || path.join(__dirname, 'model', 'skin_cancer_model_optimized.tflite');

// Daftar domain yang diizinkan
const allowedOrigins = [
    'https://skin-disease-detection-frontend-e3y7h0du8.vercel.app',
    'https://skin-disease-detection-frontend.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
];

// Buat direktori yang diperlukan
const uploadDir = path.join(__dirname, 'uploads');
const modelDir = path.dirname(MODEL_PATH);

// Debug logging
console.log('=== Server Configuration ===');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current working directory:', process.cwd());
console.log('Upload directory:', uploadDir);
console.log('Model directory:', modelDir);
console.log('Model path:', MODEL_PATH);
console.log('Allowed origins:', allowedOrigins);

// Pastikan direktori ada
[uploadDir, modelDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }
});

// List files in model directory
if (fs.existsSync(modelDir)) {
    console.log('\n=== Model Directory Contents ===');
    fs.readdirSync(modelDir).forEach(file => {
        const filePath = path.join(modelDir, file);
        const stats = fs.statSync(filePath);
        console.log(`- ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    });
}

// Konfigurasi storage untuk upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Filter untuk hanya menerima file gambar
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file gambar yang diperbolehkan'), false);
    }
};

// Konfigurasi upload
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Max 5MB
    }
});

const app = express();

// CORS middleware
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Log the request origin
    console.log('Request origin:', origin);
    
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware untuk logging requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// OPTIONS handler untuk preflight requests
app.options('*', cors());

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Selamat datang di API Deteksi Penyakit Kulit',
        endpoints: {
            predict: 'POST /api/predict - Upload gambar untuk prediksi',
            model: 'GET /api/model - Download model',
            uploadModel: 'POST /api/upload-model - Upload model baru',
            health: 'GET /api/health - Health check'
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server berjalan dengan baik',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        modelExists: fs.existsSync(MODEL_PATH)
    });
});

// Endpoint untuk mengunduh model
app.get('/api/model', (req, res) => {
    try {
        if (!fs.existsSync(MODEL_PATH)) {
            return res.status(404).json({
                success: false,
                error: 'Model tidak ditemukan'
            });
        }
        res.download(MODEL_PATH);
    } catch (error) {
        console.error('Error serving model:', error);
        res.status(500).json({
            success: false,
            error: 'Gagal mengunduh model'
        });
    }
});

// Endpoint untuk upload model
app.post('/api/upload-model', upload.single('model'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Tidak ada file model yang diupload'
            });
        }

        // Pastikan file adalah model tflite
        if (!req.file.originalname.endsWith('.tflite')) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error(`Error deleting file: ${err.message}`);
            });
            return res.status(400).json({
                success: false,
                error: 'File harus berformat .tflite'
            });
        }

        // Pindahkan file ke direktori model
        const modelPath = MODEL_PATH;
        fs.rename(req.file.path, modelPath, (err) => {
            if (err) {
                console.error('Error moving model file:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Gagal menyimpan model'
                });
            }
            res.json({
                success: true,
                message: 'Model berhasil diupload',
                path: modelPath
            });
        });
    } catch (error) {
        console.error('Error in model upload:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan saat mengupload model'
        });
    }
});

// Predict endpoint dengan error handling yang lebih baik
app.post('/api/predict', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Tidak ada file yang diupload'
            });
        }

        console.log(`File diterima: ${req.file.path}`);

        // Periksa apakah model ada
        if (!fs.existsSync(MODEL_PATH)) {
            return res.status(500).json({
                success: false,
                error: 'Model AI tidak ditemukan di server'
            });
        }

        // Execute Python script for prediction
        const pythonProcess = spawn('python', [
            path.join(__dirname, 'predict.py'),
            req.file.path
        ]);

        let predictionOutput = '';
        let errorOutput = '';

        // Collect output from Python script
        pythonProcess.stdout.on('data', (data) => {
            predictionOutput += data.toString();
        });

        // Collect error output from Python script
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.log(`Python Error: ${data}`);
        });

        // Handle Python script completion
        pythonProcess.on('close', (code) => {
            // Delete the uploaded file after processing
            fs.unlink(req.file.path, (err) => {
                if (err) console.error(`Error deleting file: ${err.message}`);
            });

            if (code !== 0) {
                console.error(`Python process exited with code ${code}`);
                return res.status(500).json({
                    success: false,
                    error: 'Gagal memproses gambar',
                    details: errorOutput
                });
            }

            try {
                const result = JSON.parse(predictionOutput);
                res.json(result);
            } catch (error) {
                console.error('Error parsing prediction result:', error);
                res.status(500).json({
                    success: false,
                    error: 'Gagal memproses hasil prediksi',
                    details: error.message
                });
            }
        });

    } catch (error) {
        console.error('Server error in prediction route:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan pada server',
            details: error.message
        });
    }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        error: 'Terjadi kesalahan pada server: ' + (err.message || 'Unknown error')
    });
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint tidak ditemukan'
    });
});

// Mulai server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Upload directory: ${uploadDir}`);
    console.log(`Model directory: ${modelDir}`);
}); 