const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MODEL_DIR = path.join(__dirname, 'model');
const MODEL_PATH = path.join(MODEL_DIR, 'skin_cancer_model_optimized.tflite');

console.log('Current working directory:', process.cwd());
console.log('Model directory path:', MODEL_DIR);
console.log('Full model path:', MODEL_PATH);

// Pastikan direktori model ada
if (!fs.existsSync(MODEL_DIR)) {
    console.log('Creating model directory...');
    fs.mkdirSync(MODEL_DIR, { recursive: true });
}

// List semua file di direktori model
console.log('Files in model directory:');
if (fs.existsSync(MODEL_DIR)) {
    fs.readdirSync(MODEL_DIR).forEach(file => {
        const filePath = path.join(MODEL_DIR, file);
        const stats = fs.statSync(filePath);
        console.log(`- ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    });
}

// Periksa apakah model ada
if (fs.existsSync(MODEL_PATH)) {
    const stats = fs.statSync(MODEL_PATH);
    const fileSizeInMB = stats.size / (1024 * 1024);
    console.log(`Model found! Size: ${fileSizeInMB.toFixed(2)} MB`);
} else {
    console.error('Error: Model file not found!');
    console.error('Expected at:', MODEL_PATH);
    console.error('Please ensure skin_cancer_model_optimized.tflite exists in the model directory');
    process.exit(1);
}

module.exports = {
    MODEL_PATH
}; 