import os
import numpy as np
from PIL import Image
import tensorflow as tf

# Path ke model TFLite yang dioptimalkan
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'skin_cancer_model_optimized.tflite')

# Daftar kelas penyakit kulit
CLASSES = [
    'Actinic Keratoses',
    'Basal Cell Carcinoma',
    'Benign Keratosis',
    'Dermatofibroma',
    'Melanoma',
    'Melanocytic Nevi',
    'Vascular Lesions'
]

def get_model():
    """Load model TFLite yang dioptimalkan."""
    try:
        interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
        interpreter.allocate_tensors()
        return interpreter
    except Exception as e:
        raise Exception(f"Error loading model: {str(e)}")

def preprocess_image(image_path):
    """Preprocess gambar untuk prediksi."""
    try:
        img = Image.open(image_path)
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return img_array.astype(np.float32)
    except Exception as e:
        raise Exception(f"Error preprocessing image: {str(e)}")

def get_prediction(image_path):
    """Prediksi penyakit kulit dari gambar."""
    try:
        # Load model
        interpreter = get_model()
        
        # Get input and output details
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        
        # Preprocess image
        input_data = preprocess_image(image_path)
        
        # Set input tensor
        interpreter.set_tensor(input_details[0]['index'], input_data)
        
        # Run inference
        interpreter.invoke()
        
        # Get prediction
        predictions = interpreter.get_tensor(output_details[0]['index'])
        predicted_class = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class])
        
        return {
            'predicted_class': CLASSES[predicted_class],
            'confidence': confidence,
            'explanation': get_prediction_explanation(CLASSES[predicted_class])
        }
    except Exception as e:
        raise Exception(f"Error during prediction: {str(e)}")

def get_prediction_explanation(disease_name):
    """Dapatkan penjelasan untuk prediksi penyakit."""
    explanations = {
        'Actinic Keratoses': 'Pertumbuhan pra-kanker yang disebabkan oleh paparan sinar matahari berlebihan.',
        'Basal Cell Carcinoma': 'Jenis kanker kulit paling umum, biasanya tumbuh perlahan.',
        'Benign Keratosis': 'Pertumbuhan jinak yang muncul dengan bertambahnya usia.',
        'Dermatofibroma': 'Tumor kulit jinak yang biasanya muncul di tungkai.',
        'Melanoma': 'Jenis kanker kulit yang paling berbahaya, dapat menyebar ke organ lain.',
        'Melanocytic Nevi': 'Tahi lalat yang biasanya jinak.',
        'Vascular Lesions': 'Kelainan pembuluh darah yang menyebabkan perubahan warna kulit.'
    }
    return explanations.get(disease_name, 'Penjelasan tidak tersedia.')

if __name__ == '__main__':
    import sys
    if len(sys.argv) != 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)
        
    try:
        result = get_prediction(sys.argv[1])
        print("\nHasil Prediksi:")
        print(f"Penyakit: {result['predicted_class']}")
        print(f"Tingkat Kepercayaan: {result['confidence']:.2%}")
        print(f"\nPenjelasan:\n{result['explanation']}")
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)