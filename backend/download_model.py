import os
import gdown

def download_model():
    """Download model dari Google Drive"""
    try:
        # Buat direktori model jika belum ada
        os.makedirs("model", exist_ok=True)
        
        output = "model/skin_cancer_model.h5"
        file_id = "1BRY8oK5z9SYb4G5o5TFl7C9M5k_7PUR9"
        
        print("Mengunduh model dari Google Drive...")
        gdown.download(id=file_id, output=output, quiet=False)
        
        if os.path.exists(output):
            file_size = os.path.getsize(output)
            print(f"Model berhasil diunduh ke {output} (Size: {file_size/1024/1024:.2f} MB)")
            return True
        else:
            print("Gagal mengunduh model")
            return False
    except Exception as e:
        print(f"Error downloading model: {e}")
        return False

if __name__ == "__main__":
    download_model() 