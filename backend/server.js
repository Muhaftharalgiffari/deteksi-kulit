const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
    origin: [
        'https://deteksi-kulit.vercel.app',
        'https://deteksi-kulit-jjw06goln-afthars-projects-cdfc14e0.vercel.app',
        'http://localhost:5173'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

// Konfigurasi storage untuk upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
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

// Disable cluster mode in container
const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Endpoint untuk mengunduh model
app.get('/model', (req, res) => {
    try {
        const modelPath = path.join(__dirname, 'model', 'skin_cancer_model.h5');
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
app.post('/upload-model', upload.single('model'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Tidak ada file model yang diupload'
            });
        }

        // Pastikan file adalah model h5
        if (!req.file.originalname.endsWith('.h5')) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error(`Error deleting file: ${err.message}`);
            });
            return res.status(400).json({
                success: false,
                error: 'File harus berformat .h5'
            });
        }

        // Buat direktori model jika belum ada
        const modelDir = path.join(__dirname, 'model');
        if (!fs.existsSync(modelDir)) {
            fs.mkdirSync(modelDir, { recursive: true });
        }

        // Pindahkan file ke direktori model
        const modelPath = path.join(modelDir, 'skin_cancer_model.h5');
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

// Caching prediksi
const predictionCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 jam

// Hapus cache item yang sudah expired
function cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of predictionCache.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
            predictionCache.delete(key);
        }
    }
}

// Bersihkan cache setiap 10 menit
setInterval(cleanupCache, 10 * 60 * 1000);

// Predict endpoint
app.post('/predict', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Tidak ada file yang diupload'
            });
        }

        console.log(`File diterima: ${req.file.path}`);

        // Check cache untuk file yang mirip
        const fileHash = req.file.size + '_' + path.extname(req.file.originalname);
        if (predictionCache.has(fileHash)) {
            const cachedResult = predictionCache.get(fileHash);
            if (Date.now() - cachedResult.timestamp < CACHE_TTL) {
                console.log('Serving cached prediction');

                // Delete file since we're using cache
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error(`Error deleting file: ${err.message}`);
                });

                return res.json(cachedResult.data);
            }
        }

        // Execute Python script for prediction
        const pythonProcess = spawn('python', ['predict.py', req.file.path]);

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

        // Timeout promise untuk kill jika python script berjalan terlalu lama
        const timeoutPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
                pythonProcess.kill();
                reject(new Error('Prediction timed out after 60 seconds'));
            }, 60000); // 60 seconds timeout
        });

        // Handle Python script completion
        const processPromise = new Promise((resolve, reject) => {
            pythonProcess.on('close', (code) => {
                // Delete the uploaded file after processing
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error(`Error deleting file: ${err.message}`);
                });

                if (code !== 0) {
                    console.error(`Python process exited with code ${code}`);
                    // Cek apakah error terkait model
                    if (errorOutput.includes('model') || errorOutput.includes('Model')) {
                        reject(new Error('Gagal memuat model AI. Silakan coba lagi nanti.'));
                    } else {
                        reject(new Error(`Proses prediksi gagal dengan kode ${code}: ${errorOutput}`));
                    }
                    return;
                }

                try {
                    // Parse prediction result
                    const predictionResult = JSON.parse(predictionOutput);

                    // Add class names to response
                    if (predictionResult.success && predictionResult.top_3_predictions) {
                        // Cache result
                        predictionCache.set(fileHash, {
                            timestamp: Date.now(),
                            data: predictionResult
                        });

                        resolve(predictionResult);
                    } else {
                        console.error('Invalid prediction result:', predictionResult);
                        reject(new Error(predictionResult.error || 'Hasil prediksi tidak valid'));
                    }
                } catch (error) {
                    console.error('Error parsing prediction result:', error);
                    console.error('Raw prediction output:', predictionOutput);
                    reject(new Error('Gagal memproses hasil prediksi: ' + error.message));
                }
            });
        });

        // Race between process completion and timeout
        Promise.race([processPromise, timeoutPromise])
            .then(result => {
                res.json(result);
            })
            .catch(error => {
                console.error('Prediction error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message,
                    details: errorOutput
                });
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Upload directory: ${path.join(__dirname, 'uploads')}`);
}); 