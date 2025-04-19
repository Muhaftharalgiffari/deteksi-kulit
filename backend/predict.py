import sys
import os
import json
import warnings
import tensorflow as tf
import numpy as np
import cv2
from scipy import ndimage
import time
import requests
import hashlib

# Matikan semua warning
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.get_logger().setLevel('ERROR')

# Set thread dan parallelism untuk optimasi
tf.config.threading.set_inter_op_parallelism_threads(4)
tf.config.threading.set_intra_op_parallelism_threads(4)

# Gunakan memory growth untuk GPU jika tersedia
gpus = tf.config.experimental.list_physical_devices('GPU')
if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    except RuntimeError as e:
        print(f"Error setting GPU memory growth: {e}", file=sys.stderr)

# Load model di awal dan cache
MODEL = None
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'skin_cancer_model.h5')
# URL akan diisi dengan URL download dari GitHub Release
MODEL_URL = os.getenv('MODEL_URL', 'https://github.com/[USERNAME]/[REPO]/releases/download/v1.0.0/skin_cancer_model.h5')

def download_model():
    """Download model dari GitHub Release"""
    try:
        if not MODEL_URL:
            raise Exception("MODEL_URL tidak ditemukan di environment variables")
            
        # Buat direktori model jika belum ada
        model_dir = os.path.dirname(MODEL_PATH)
        os.makedirs(model_dir, exist_ok=True)
        
        print("Mengunduh model dari GitHub Release...")
        response = requests.get(MODEL_URL, stream=True)
        response.raise_for_status()
        
        # Hitung total size untuk progress bar
        total_size = int(response.headers.get('content-length', 0))
        block_size = 1024  # 1 Kibibyte
        downloaded = 0
        
        # Download dengan progress bar
        with open(MODEL_PATH, 'wb') as f:
            for data in response.iter_content(block_size):
                downloaded += len(data)
                f.write(data)
                # Update progress
                progress = (downloaded / total_size) * 100
                sys.stderr.write(f"\rDownloading: {progress:.1f}%")
        sys.stderr.write("\n")
        
        print(f"Model berhasil diunduh ke {MODEL_PATH}")
        return True
    except Exception as e:
        print(f"Error downloading model: {e}", file=sys.stderr)
        return False

def get_model():
    global MODEL
    if MODEL is None:
        try:
            # Download model jika belum ada
            if not os.path.exists(MODEL_PATH):
                if not download_model():
                    raise Exception("Gagal mengunduh model")
            
            # Load model
            print("Loading model...", file=sys.stderr)
            MODEL = tf.keras.models.load_model(MODEL_PATH)
            print("Model berhasil dimuat", file=sys.stderr)
        except Exception as e:
            print(f"Error loading model: {e}", file=sys.stderr)
            raise
    return MODEL

def enhance_image(img):
    """Meningkatkan kualitas gambar untuk deteksi fitur yang lebih baik"""
    try:
        # Convert ke LAB color space untuk pemrosesan yang lebih baik
        lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        
        # CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        
        # Gabungkan kembali channels
        enhanced_lab = cv2.merge([l, a, b])
        
        # Convert kembali ke RGB
        enhanced_rgb = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)
        
        return enhanced_rgb
    except Exception as e:
        print(f"Error in enhance_image: {str(e)}", file=sys.stderr)
        return img  # Return original image on error

def remove_noise(img):
    """Menghilangkan noise pada gambar"""
    try:
        # Bilateral filter untuk menghilangkan noise sambil mempertahankan edge
        denoised = cv2.bilateralFilter(img, 9, 75, 75)
        return denoised
    except Exception as e:
        print(f"Error in remove_noise: {str(e)}", file=sys.stderr)
        return img  # Return original image on error

def sharpen_image(img):
    """Mempertajam detail gambar"""
    try:
        kernel = np.array([[-1,-1,-1],
                          [-1, 9,-1],
                          [-1,-1,-1]])
        sharpened = cv2.filter2D(img, -1, kernel)
        return sharpened
    except Exception as e:
        print(f"Error in sharpen_image: {str(e)}", file=sys.stderr)
        return img  # Return original image on error

def adjust_contrast(img):
    """Menyesuaikan kontras gambar"""
    try:
        # Convert ke float32 untuk perhitungan
        img_float = img.astype(np.float32)
        
        # Normalisasi ke range [0,1]
        img_norm = (img_float - img_float.min()) / (img_float.max() - img_float.min() + 1e-8)
        
        # Sesuaikan kontras
        contrast = 1.2
        img_contrast = (img_norm - 0.5) * contrast + 0.5
        
        # Clip ke range [0,1]
        img_clipped = np.clip(img_contrast, 0, 1)
        
        # Convert kembali ke uint8
        return (img_clipped * 255).astype(np.uint8)
    except Exception as e:
        print(f"Error in adjust_contrast: {str(e)}", file=sys.stderr)
        return img  # Return original image on error

def preprocess_image(image_path):
    try:
        # Baca gambar
        img = cv2.imread(image_path)
        if img is None:
            raise Exception(f"Failed to load image: {image_path}")
        
        # Convert BGR ke RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize awal untuk standarisasi ukuran
        img = cv2.resize(img, (224, 224), interpolation=cv2.INTER_CUBIC)
        
        # Aplikasikan preprocessing - kurangi jumlah operasi untuk kecepatan
        # Gunakan enhance_image saja yang paling efektif
        img = enhance_image(img)
        
        # Normalisasi gambar
        img = img.astype(np.float32) / 255.0
        
        # Standardisasi dengan nilai ImageNet
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        img = (img - mean) / std
        
        # Tambah dimensi batch
        img = np.expand_dims(img, axis=0)
        
        return img
        
    except Exception as e:
        print(f"Error in preprocess_image: {str(e)}", file=sys.stderr)
        raise

def get_prediction_explanation(class_name, confidence):
    """Memberikan penjelasan tentang prediksi"""
    explanations = {
        'akiec': 'ct - Lesi pra-kanker yang muncul sebagai bercak kasar dan bersisik',
        'bcc': 'Basal Cell Carcinoma - Kanker kulit yang muncul sebagai benjolan mengkilap atau luka yang tidak sembuh',
        'bkl': 'Benign Keratosis - Pertumbuhan jinak yang muncul sebagai bercak coklat dengan permukaan berminyak',
        'df': 'Dermatofibroma - Benjolan keras dan jinak dengan warna coklat hingga kemerahan',
        'mel': 'Melanoma - Kanker kulit yang berbahaya, sering muncul sebagai tahi lalat yang berubah atau tidak teratur',
        'nv': 'Melanocytic Nevus - Tahi lalat jinak dengan warna dan bentuk yang teratur',
        'vasc': 'Vascular Lesion - Kelainan pembuluh darah yang muncul sebagai bercak merah atau ungu'
    }
    
    return {
        'class': class_name,
        'confidence': confidence,
        'explanation': explanations.get(class_name, 'Tidak ada penjelasan tersedia')
    }

def main():
    if len(sys.argv) != 2:
        result = {
            'success': False,
            'error': 'Image path not provided'
        }
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(1)

    start_time = time.time()
    try:
        image_path = sys.argv[1]
        
        # Cek apakah file ada
        if not os.path.exists(image_path):
            result = {
                'success': False,
                'error': f'Image file not found: {image_path}'
            }
            print(json.dumps(result, ensure_ascii=False))
            sys.exit(1)
            
        # Preload dan cache model
        try:
            model = get_model()
        except Exception as e:
            result = {
                'success': False,
                'error': f'Failed to load model: {str(e)}'
            }
            print(json.dumps(result, ensure_ascii=False))
            sys.exit(1)
        
        # Preprocess gambar
        try:
            processed_image = preprocess_image(image_path)
        except Exception as e:
            result = {
                'success': False,
                'error': f'Failed to preprocess image: {str(e)}'
            }
            print(json.dumps(result, ensure_ascii=False))
            sys.exit(1)
        
        # Lakukan prediksi
        try:
            predictions = model.predict(processed_image, verbose=0)
            
            # Log prediksi untuk debugging
            print(f"Raw predictions: {predictions[0]}", file=sys.stderr)
            
        except Exception as e:
            result = {
                'success': False,
                'error': f'Failed to make prediction: {str(e)}'
            }
            print(json.dumps(result, ensure_ascii=False))
            sys.exit(1)
        
        # Dapatkan probabilitas untuk setiap kelas
        class_names = ['akiec', 'bcc', 'bkl', 'df', 'mel', 'nv', 'vasc']
        probabilities = predictions[0].tolist()
        
        # Urutkan prediksi dari yang tertinggi ke terendah
        predictions_sorted = sorted(
            zip(class_names, probabilities), 
            key=lambda x: x[1], 
            reverse=True
        )[:3]  # Ambil 3 prediksi teratas
        
        # Log prediksi teratas
        print(f"Top predictions: {predictions_sorted}", file=sys.stderr)
        
        # Format hasil dengan penjelasan
        top_predictions = [
            get_prediction_explanation(class_name, float(prob))
            for class_name, prob in predictions_sorted
        ]
        
        # Hitung waktu eksekusi
        elapsed_time = time.time() - start_time
        
        result = {
            'success': True,
            'top_3_predictions': top_predictions,
            'performance': {
                'processing_time': elapsed_time
            },
            'warning': 'Hasil prediksi hanya untuk referensi. Silakan konsultasi dengan dokter untuk diagnosis yang akurat.'
        }
        
        # Print hasil sebagai JSON string
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)
        
    except Exception as e:
        result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(1)

if __name__ == '__main__':
    main() 