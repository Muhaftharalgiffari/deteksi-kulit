from google.cloud import storage
import os
import datetime

def upload_model_to_gcs():
    """Upload model ke Google Cloud Storage"""
    try:
        # Set credentials jika ada
        if os.path.exists('google-credentials.json'):
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'google-credentials.json'
        
        # Konfigurasi GCS
        bucket_name = "skin-disease-model"  # Ganti dengan nama bucket Anda
        source_file = "model/skin_cancer_model.h5"
        destination_blob_name = "models/skin_cancer_model.h5"

        # Inisialisasi client
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(destination_blob_name)

        # Upload file
        print(f"Mengupload {source_file} ke {destination_blob_name}...")
        blob.upload_from_filename(source_file)
        
        print(f"Model berhasil diupload ke gs://{bucket_name}/{destination_blob_name}")
        
        # Generate signed URL yang bisa diakses publik
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(days=7),
            method="GET"
        )
        
        print(f"\nURL untuk download model (berlaku 7 hari):")
        print(url)
        
        # Simpan URL ke file untuk referensi
        with open('model_url.txt', 'w') as f:
            f.write(url)
        print("\nURL telah disimpan ke model_url.txt")
        
    except Exception as e:
        print(f"Error uploading to GCS: {e}")

if __name__ == "__main__":
    upload_model_to_gcs() 