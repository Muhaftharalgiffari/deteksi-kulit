import tensorflow as tf
import os
import numpy as np

def compress_model():
    """Kompres model menggunakan quantization"""
    try:
        input_path = "model/skin_cancer_model.h5"
        output_path = "model/skin_cancer_model_compressed.h5"
        
        print("Loading model...")
        model = tf.keras.models.load_model(input_path)
        
        print("Mengkonversi model ke TFLite...")
        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        
        # Mengaktifkan optimisasi
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        
        # Mengaktifkan quantization
        converter.target_spec.supported_types = [tf.float16]
        converter.target_spec.supported_ops = [
            tf.lite.OpsSet.TFLITE_BUILTINS,
            tf.lite.OpsSet.SELECT_TF_OPS
        ]
        
        # Konversi model
        tflite_model = converter.convert()
        
        # Simpan model
        with open(output_path, 'wb') as f:
            f.write(tflite_model)
        
        # Tampilkan perbandingan ukuran
        original_size = os.path.getsize(input_path) / (1024 * 1024)
        compressed_size = os.path.getsize(output_path) / (1024 * 1024)
        
        print(f"\nPerbandingan ukuran:")
        print(f"Original: {original_size:.2f} MB")
        print(f"Compressed: {compressed_size:.2f} MB")
        print(f"Rasio kompresi: {compressed_size/original_size*100:.1f}%")
        
        return True
    except Exception as e:
        print(f"Error compressing model: {e}")
        return False

if __name__ == "__main__":
    compress_model() 