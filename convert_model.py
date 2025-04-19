import tensorflowjs as tfjs
from tensorflow.keras.models import load_model
import os

def convert_model():
    try:
        # Buat direktori untuk menyimpan model JavaScript
        os.makedirs('public/model', exist_ok=True)

        print("Loading model H5...")
        model = load_model('model/skin_cancer_model.h5')
        
        print("Mengkonversi model ke format TensorFlow.js...")
        tfjs.converters.save_keras_model(model, 'public/model')
        
        print("Model berhasil dikonversi ke format TensorFlow.js")
        print("File model tersimpan di folder public/model/")
        
        # Hapus file H5 dari folder public (tidak diperlukan)
        h5_path = 'public/model/skin_cancer_model.h5'
        if os.path.exists(h5_path):
            os.remove(h5_path)
            
    except Exception as e:
        print(f"Error saat mengkonversi model: {str(e)}")

if __name__ == "__main__":
    convert_model() 