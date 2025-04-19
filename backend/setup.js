const fs = require('fs');
const path = require('path');

// Pastikan direktori model ada
const modelDir = path.join(__dirname, 'model');
if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
    console.log('Created model directory');
}

// Periksa apakah model ada
const modelPath = path.join(modelDir, 'skin_cancer_model_optimized.tflite');
if (!fs.existsSync(modelPath)) {
    console.log('Model file not found');
} else {
    console.log('Model file exists');
    console.log('Model size:', fs.statSync(modelPath).size / 1024 / 1024, 'MB');
} 