const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

const PORT = process.env.PORT || 5000;

// Buat direktori yang diperlukan
const uploadDir = path.join(__dirname, 'uploads');
const modelDir = path.join(__dirname, 'model');

// Pastikan direktori ada
[uploadDir, modelDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

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

// Enable CORS with specific configuration
app.use(cors({
    origin: [
        'https://skin-disease-detection-frontend.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    maxAge: 86400
}));

// Tambahkan header CORS secara manual untuk memastikan
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://skin-disease-detection-frontend.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
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
        modelExists: fs.existsSync(path.join(modelDir, 'skin_cancer_model_optimized.tflite'))
    });
});

// Endpoint untuk mengunduh model
app.get('/api/model', (req, res) => {
    try {
        const modelPath = path.join(__dirname, 'model', 'skin_cancer_model_optimized.tflite');
        if (!fs.existsSync(modelPath)) {
            return res.status(404).json({
                success: false,
                error: 'Model tidak ditemukan'
            });
        }
        res.download(modelPath);
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
        const modelPath = path.join(modelDir, 'skin_cancer_model_optimized.tflite');
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
        const modelPath = path.join(modelDir, 'skin_cancer_model_optimized.tflite');
        if (!fs.existsSync(modelPath)) {
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