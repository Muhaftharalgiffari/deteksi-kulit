import tensorflow as tf
import numpy as np
import cv2
import os
from tensorflow.keras.models import load_model
import time

def load_and_preprocess_image(image_path):
    """Preprocess gambar untuk prediksi"""
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Failed to load image: {image_path}")
    
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (224, 224))
    img = img.astype(np.float32) / 255.0
    
    # Standardisasi
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img = (img - mean) / std
    
    return np.expand_dims(img, axis=0).astype(np.float32)

def predict_original_model(model, image):
    """Prediksi menggunakan model original"""
    return model.predict(image, verbose=0)

def predict_tflite_model(interpreter, image):
    """Prediksi menggunakan model TFLite"""
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    # Ensure input type matches model's expected type
    input_dtype = input_details[0]['dtype']
    if input_dtype == np.float32:
        image = image.astype(np.float32)
    
    interpreter.set_tensor(input_details[0]['index'], image)
    interpreter.invoke()
    
    return interpreter.get_tensor(output_details[0]['index'])

def test_models():
    """Test dan bandingkan kedua model"""
    try:
        # Load kedua model
        print("Loading models...")
        original_model = load_model('model/skin_cancer_model.h5')
        
        interpreter = tf.lite.Interpreter(model_path='model/skin_cancer_model_optimized.tflite')
        interpreter.allocate_tensors()
        
        # Print model details
        input_details = interpreter.get_input_details()
        print("\nModel Input Details:")
        print(f"Shape: {input_details[0]['shape']}")
        print(f"Type: {input_details[0]['dtype']}")
        
        # Kelas yang mungkin
        class_names = ['akiec', 'bcc', 'bkl', 'df', 'mel', 'nv', 'vasc']
        
        # Directory dengan sample images
        test_dir = 'test_images'
        if not os.path.exists(test_dir):
            print(f"Please create '{test_dir}' directory with test images")
            return
            
        # Variabel untuk tracking metrics
        total_images = 0
        matching_predictions = 0
        original_time = 0
        optimized_time = 0
        confidence_diffs = []
        
        print("\nTesting models...")
        print("-" * 50)
        
        # Test setiap gambar
        for image_file in os.listdir(test_dir):
            if not image_file.lower().endswith(('.png', '.jpg', '.jpeg')):
                continue
                
            image_path = os.path.join(test_dir, image_file)
            try:
                image = load_and_preprocess_image(image_path)
                
                # Prediksi dengan model original
                start_time = time.time()
                original_pred = predict_original_model(original_model, image)
                original_time += time.time() - start_time
                
                # Prediksi dengan model optimized
                start_time = time.time()
                optimized_pred = predict_tflite_model(interpreter, image)
                optimized_time += time.time() - start_time
                
                # Get predicted classes
                original_class = class_names[np.argmax(original_pred[0])]
                optimized_class = class_names[np.argmax(optimized_pred[0])]
                
                # Calculate confidence scores
                original_conf = float(np.max(original_pred[0])) * 100
                optimized_conf = float(np.max(optimized_pred[0])) * 100
                
                # Track confidence difference
                confidence_diffs.append(abs(original_conf - optimized_conf))
                
                # Print results
                print(f"\nImage: {image_file}")
                print(f"Original Model  : {original_class} ({original_conf:.1f}%)")
                print(f"Optimized Model: {optimized_class} ({optimized_conf:.1f}%)")
                print(f"Confidence Diff: {abs(original_conf - optimized_conf):.1f}%")
                
                # Track metrics
                total_images += 1
                if original_class == optimized_class:
                    matching_predictions += 1
                    
            except Exception as e:
                print(f"Error processing {image_file}: {e}")
                continue
                
        if total_images == 0:
            print("No valid images found for testing")
            return
                
        # Calculate and print final metrics
        accuracy = (matching_predictions / total_images) * 100
        avg_original_time = original_time / total_images
        avg_optimized_time = optimized_time / total_images
        speed_improvement = ((avg_original_time - avg_optimized_time) / avg_original_time) * 100
        avg_confidence_diff = sum(confidence_diffs) / len(confidence_diffs)
        
        print("\nFinal Results:")
        print("-" * 50)
        print(f"Total images tested: {total_images}")
        print(f"Matching predictions: {matching_predictions}")
        print(f"Prediction accuracy: {accuracy:.1f}%")
        print(f"Average confidence difference: {avg_confidence_diff:.1f}%")
        print(f"\nAverage prediction time:")
        print(f"Original model : {avg_original_time*1000:.2f}ms")
        print(f"Optimized model: {avg_optimized_time*1000:.2f}ms")
        print(f"Speed improvement: {speed_improvement:.1f}%")
        
    except Exception as e:
        print(f"Error testing models: {e}")
        raise

if __name__ == "__main__":
    test_models() 