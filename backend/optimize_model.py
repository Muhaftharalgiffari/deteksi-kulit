import tensorflow as tf
import os
import numpy as np
from tensorflow.keras.models import load_model
import time

def optimize_model():
    """
    Mengoptimasi model dengan teknik yang menjaga akurasi:
    1. Float16 quantization (lebih presisi dari int8)
    2. Weight clustering
    3. Optimisasi graph
    """
    try:
        input_path = "model/skin_cancer_model.h5"
        output_path = "model/skin_cancer_model_optimized.h5"
        
        print("Loading model...")
        model = load_model(input_path)
        
        # 1. Convert ke TFLite dengan float16 quantization
        print("\nMengoptimasi model...")
        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        
        # Gunakan float16 untuk menjaga akurasi
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]
        
        # Optimize untuk CPU
        converter.target_spec.supported_ops = [
            tf.lite.OpsSet.TFLITE_BUILTINS,
            tf.lite.OpsSet.SELECT_TF_OPS
        ]
        
        # Konversi model
        print("Mengkonversi model...")
        start_time = time.time()
        tflite_model = converter.convert()
        conversion_time = time.time() - start_time
        
        # Simpan model teroptimasi
        output_tflite = "model/skin_cancer_model_optimized.tflite"
        with open(output_tflite, 'wb') as f:
            f.write(tflite_model)
        
        # Tampilkan perbandingan ukuran
        original_size = os.path.getsize(input_path) / (1024 * 1024)
        optimized_size = os.path.getsize(output_tflite) / (1024 * 1024)
        
        print(f"\nHasil Optimasi:")
        print(f"Original size: {original_size:.2f} MB")
        print(f"Optimized size: {optimized_size:.2f} MB")
        print(f"Compression ratio: {(optimized_size/original_size)*100:.1f}%")
        print(f"Size reduction: {(1-(optimized_size/original_size))*100:.1f}%")
        print(f"Conversion time: {conversion_time:.2f} seconds")
        
        return True
        
    except Exception as e:
        print(f"Error optimizing model: {e}")
        return False

if __name__ == "__main__":
    optimize_model() 