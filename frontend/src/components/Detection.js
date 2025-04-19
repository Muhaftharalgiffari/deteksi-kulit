import { API_URL } from '../config.js';

export function renderDetection() {
    const detection = document.createElement('div');

    detection.innerHTML = `
    <h2 class="text-center mb-4 animate__animated animate__fadeInDown">Deteksi Kanker Kulit</h2>
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card animate__animated animate__fadeInUp">
          <div class="card-body">
            <div class="upload-area" id="dropZone">
              <i class="fas fa-cloud-upload-alt fa-3x mb-3 text-primary"></i>
              <h4>Upload Gambar</h4>
              <p class="text-muted">Drag & drop gambar, paste (Ctrl+V), atau klik untuk memilih file</p>
              <input type="file" id="fileInput" accept="image/*" class="d-none">
            </div>
            <div class="preview-container mt-4" style="display: none;">
              <div class="text-center mb-3">
                <img id="imagePreview" class="img-fluid rounded shadow" style="max-height: 300px; object-fit: contain;">
              </div>
              <div class="d-flex justify-content-center gap-2">
                <button class="btn btn-danger" id="removeImageBtn">
                  <i class="fas fa-trash me-1"></i> Hapus Gambar
                </button>
                <button class="btn btn-primary" id="retakeImageBtn">
                  <i class="fas fa-camera me-1"></i> Ambil Ulang
                </button>
              </div>
            </div>
            <div class="loading mt-4" style="display: none;">
              <div class="loading-spinner"></div>
              <p class="mt-3">Memproses gambar...</p>
            </div>
            <div id="result" class="mt-4"></div>
          </div>
        </div>
      </div>
    </div>
  `;

    // Add event listeners after attaching to DOM
    setTimeout(() => {
        initializeDetection();
    }, 0);

    return detection;
}

function initializeDetection() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const loading = document.querySelector('.loading');
    const result = document.getElementById('result');
    const previewContainer = document.querySelector('.preview-container');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const retakeImageBtn = document.getElementById('retakeImageBtn');

    if (!dropZone || !fileInput) return;

    // Handle paste event
    document.addEventListener('paste', function (e) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                handleFile(file);
                break;
            }
        }
    });

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.background = 'rgba(52, 152, 219, 0.1)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.background = 'transparent';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.background = 'transparent';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFile(file);
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });

    removeImageBtn.addEventListener('click', removeImage);
    retakeImageBtn.addEventListener('click', retakeImage);

    function handleFile(file) {
        // Show preview
        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            // Handle image error
            imagePreview.onerror = function () {
                console.error("Failed to load image preview");
                imagePreview.src = "https://via.placeholder.com/300x200?text=Format+Gambar+Tidak+Didukung";
            };
            previewContainer.style.display = 'block';
            dropZone.style.display = 'none'; // Hide upload area when preview is shown
        }
        reader.onerror = function (e) {
            console.error("FileReader error:", e);
            result.innerHTML = `<div class="alert alert-danger">
                <h5 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i>Error!</h5>
                <p>Gagal membaca file gambar. Coba gunakan format gambar yang berbeda.</p>
            </div>`;
            return;
        }
        reader.readAsDataURL(file);

        // Validasi tipe file
        if (!file.type.match('image.*')) {
            result.innerHTML = `<div class="alert alert-danger">
                <h5 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i>Error!</h5>
                <p>File yang dipilih bukan gambar. Silakan pilih file gambar (JPG, PNG, atau GIF).</p>
            </div>`;
            return;
        }

        // Validasi ukuran file (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            result.innerHTML = `<div class="alert alert-danger">
                <h5 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i>Error!</h5>
                <p>Ukuran file terlalu besar. Maksimum 5MB.</p>
            </div>`;
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        loading.style.display = 'block';
        result.innerHTML = '';

        // Fungsi untuk melakukan prediksi dengan retry
        const makePrediction = (retryCount = 0) => {
            fetch(`${API_URL}/predict`, {
                method: 'POST',
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.text().then(text => {
                        try {
                            return JSON.parse(text);
                        } catch (e) {
                            console.error("Failed to parse JSON:", text);
                            throw new Error("Response bukan format JSON yang valid");
                        }
                    });
                })
                .then(data => {
                    loading.style.display = 'none';
                    if (data.success) {
                        displayResults(data.top_3_predictions);
                        addToHistory(file.name, data.top_3_predictions[0]);
                    } else {
                        result.innerHTML = `<div class="alert alert-danger">Error: ${data.error || "Terjadi kesalahan pada server"}</div>`;
                    }
                })
                .catch(error => {
                    console.error("Error fetching prediction:", error);
                    
                    // Cek apakah error terkait model
                    if (error.message.includes('model') || error.message.includes('Model')) {
                        if (retryCount < 3) {
                            // Retry setelah 2 detik
                            setTimeout(() => {
                                console.log(`Retrying prediction (attempt ${retryCount + 1})`);
                                makePrediction(retryCount + 1);
                            }, 2000);
                        } else {
                            loading.style.display = 'none';
                            result.innerHTML = `<div class="alert alert-danger">
                                <h5 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i>Error!</h5>
                                <p>Gagal memuat model AI setelah beberapa percobaan.</p>
                                <hr>
                                <p class="mb-0">Silakan coba lagi nanti atau hubungi administrator.</p>
                            </div>`;
                        }
                    } else {
                        loading.style.display = 'none';
                        result.innerHTML = `<div class="alert alert-danger">
                            <h5 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i>Error!</h5>
                            <p>${error.message}</p>
                            <hr>
                            <p class="mb-0">Pastikan backend server berjalan di localhost:5000 dan model AI tersedia.</p>
                        </div>`;
                    }
                });
        };

        // Mulai prediksi
        makePrediction();
    }

    function removeImage() {
        previewContainer.style.display = 'none';
        dropZone.style.display = 'block'; // Show upload area again
        result.innerHTML = '';
        fileInput.value = '';
    }

    function retakeImage() {
        fileInput.click();
    }

    function displayResults(predictions) {
        const result = document.getElementById('result');
        
        // Ambil prediksi teratas
        const topPrediction = predictions[0];
        
        // Tentukan warna dan ikon berdasarkan kelas
        let colorClass = 'primary';
        let icon = 'fa-info-circle';
        let severity = 'Normal';
        
        switch(topPrediction.class) {
            case 'mel':
            case 'bcc':
                colorClass = 'danger';
                icon = 'fa-exclamation-triangle';
                severity = 'Serius';
                break;
            case 'akiec':
                colorClass = 'warning';
                icon = 'fa-exclamation-circle';
                severity = 'Perhatian';
                break;
            default:
                colorClass = 'success';
                icon = 'fa-check-circle';
                severity = 'Normal';
        }

        result.innerHTML = `
            <div class="card animate__animated animate__fadeIn">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <i class="fas ${icon} fa-2x text-${colorClass} me-3"></i>
                        <h4 class="mb-0">Hasil Deteksi</h4>
                    </div>
                    
                    <div class="alert alert-${colorClass}">
                        <h5 class="alert-heading mb-2">${topPrediction.class_name || 'Kondisi Kulit'}</h5>
                        <p class="mb-0">${topPrediction.explanation || 'Tidak ada penjelasan tersedia'}</p>
                    </div>
                    
                    <div class="mt-3">
                        <h5 class="mb-3">Rekomendasi:</h5>
                        <ul class="list-group">
                            <li class="list-group-item d-flex align-items-center">
                                <i class="fas fa-check-circle text-success me-2"></i>
                                <span>Konsultasikan dengan dokter kulit untuk pemeriksaan lebih lanjut</span>
                            </li>
                            <li class="list-group-item d-flex align-items-center">
                                <i class="fas fa-check-circle text-success me-2"></i>
                                <span>Lakukan pemeriksaan rutin setiap 6 bulan</span>
                            </li>
                            <li class="list-group-item d-flex align-items-center">
                                <i class="fas fa-check-circle text-success me-2"></i>
                                <span>Gunakan tabir surya dengan SPF minimal 30</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="mt-4">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge bg-${colorClass} p-2">${severity}</span>
                            <small class="text-muted">Hasil ini hanya untuk referensi awal</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function addToHistory(filename, prediction) {
        let history = JSON.parse(localStorage.getItem('detectionHistory') || '[]');

        const newEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            filename,
            result: prediction
        };

        history.unshift(newEntry);
        // Keep only the last 20 entries
        if (history.length > 20) {
            history = history.slice(0, 20);
        }

        localStorage.setItem('detectionHistory', JSON.stringify(history));

        // Update history page if visible
        const historyPage = document.getElementById('history');
        if (historyPage && historyPage.classList.contains('active')) {
            updateHistoryTable();
        }
    }
} 