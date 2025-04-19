let model = null;
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const predictBtn = document.getElementById('predictBtn');
const predictionResult = document.getElementById('predictionResult');
const loadingModel = document.getElementById('loadingModel');
const spinner = document.querySelector('.spinner-border');
const errorAlert = document.getElementById('errorAlert');
const dropText = document.getElementById('dropText');

// Fungsi untuk menampilkan error
function showError(message) {
    errorAlert.textContent = message;
    errorAlert.classList.remove('d-none');
    setTimeout(() => {
        errorAlert.classList.add('d-none');
    }, 5000);
}

// Inisialisasi aplikasi
async function init() {
    try {
        // Coba muat model yang sudah dilatih terlebih dahulu
        try {
            model = await skinDetection.loadTrainedModel();
            console.log('Model yang sudah dilatih berhasil dimuat');
        } catch (loadError) {
            console.warn('Tidak dapat memuat model yang sudah dilatih:', loadError);
            console.log('Membuat model baru...');
            model = await skinDetection.createModel();

            // Load pre-trained weights jika tersedia
            try {
                const response = await fetch('/model/weights.json');
                if (response.ok) {
                    const weights = await response.json();
                    await model.setWeights(weights);
                    console.log('Pre-trained weights berhasil dimuat');
                }
            } catch (weightsError) {
                console.warn('Tidak dapat memuat pre-trained weights:', weightsError);
            }
        }

        loadingModel.classList.add('d-none');
        console.log('Model siap digunakan');
    } catch (error) {
        console.error('Error saat inisialisasi model:', error);
        loadingModel.innerHTML = `
            <div class="alert alert-danger mb-0">
                Error: ${error.message}
                <button type="button" class="btn btn-danger btn-sm float-end" onclick="window.location.reload()">
                    Coba Lagi
                </button>
            </div>
        `;
    }
}

// Fungsi untuk menangani gambar
function handleImage(imageData, fileName = 'pasted-image.png') {
    try {
        imagePreview.src = imageData;
        imagePreview.style.display = 'block';
        dropText.style.display = 'none';
        predictBtn.disabled = false;
        predictionResult.innerHTML = '<div class="text-center text-muted">Klik tombol Analisis untuk memulai deteksi</div>';

        // Konversi base64 ke Blob untuk keperluan upload
        const base64Data = imageData.split(',')[1];
        const mimeType = imageData.split(',')[0].split(':')[1].split(';')[0];
        const binaryStr = atob(base64Data);
        const arr = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            arr[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([arr], { type: mimeType });

        // Buat File object dari Blob
        const file = new File([blob], fileName, { type: mimeType });

        // Buat DataTransfer object untuk mengupdate file input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        imageInput.files = dataTransfer.files;
    } catch (error) {
        console.error('Error saat menangani gambar:', error);
        showError('Gagal memproses gambar. Silakan coba gambar lain.');
    }
}

// Preview gambar dari file input
imageInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            showError('File yang dipilih bukan gambar. Silakan pilih file gambar.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            handleImage(e.target.result, file.name);
        }
        reader.onerror = function () {
            showError('Gagal membaca file. Silakan coba file lain.');
        }
        reader.readAsDataURL(file);
    }
});

// Menangani paste gambar
document.addEventListener('paste', function (e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let hasImage = false;

    for (let item of items) {
        if (item.type.indexOf('image') === 0) {
            hasImage = true;
            e.preventDefault();
            const blob = item.getAsFile();
            const reader = new FileReader();
            reader.onload = function (e) {
                handleImage(e.target.result);
            };
            reader.onerror = function () {
                showError('Gagal membaca gambar yang di-paste. Silakan coba lagi.');
            };
            reader.readAsDataURL(blob);
            break;
        }
    }

    if (!hasImage) {
        showError('Tidak ada gambar yang di-paste. Silakan copy gambar terlebih dahulu.');
    }
});

// Fungsi untuk menampilkan hasil prediksi
function displayPredictions(predictions) {
    try {
        const maxIndex = predictions.indexOf(Math.max(...predictions));
        const confidence = (predictions[maxIndex] * 100).toFixed(2);
        const className = skinDetection.SKIN_CLASSES[maxIndex];
        const description = skinDetection.SKIN_CLASS_DESCRIPTIONS[className];

        // Tentukan threshold confidence yang lebih rendah
        const CONFIDENCE_THRESHOLD = 15; // 15%
        const isConfident = confidence > CONFIDENCE_THRESHOLD;

        // Filter dan urutkan prediksi
        const significantPredictions = predictions.map((pred, idx) => ({
            class: skinDetection.SKIN_CLASSES[idx],
            confidence: (pred * 100).toFixed(1),
            index: idx
        })).sort((a, b) => parseFloat(b.confidence) - parseFloat(a.confidence))
            .slice(0, 3); // Ambil 3 prediksi teratas

        predictionResult.innerHTML = `
            <div class="prediction-result">
                <h4 class="mb-3">Hasil Deteksi:</h4>
                <div class="alert ${confidence > 50 ? 'alert-success' : confidence > 30 ? 'alert-warning' : 'alert-danger'}">
                    ${isConfident ? `
                        <h5 class="mb-2">${className}</h5>
                        <p class="mb-1">Tingkat Kepercayaan: ${confidence}%</p>
                        <hr>
                        <p class="mb-0"><small>${description}</small></p>
                    ` : `
                        <h5 class="mb-2">Tidak Dapat Mendeteksi dengan Pasti</h5>
                        <p class="mb-0"><small>Tingkat kepercayaan terlalu rendah (${confidence}%). Silakan coba dengan gambar yang lebih jelas.</small></p>
                    `}
                </div>
                <div class="mt-3">
                    <h6>3 Kemungkinan Teratas:</h6>
                    <div class="progress-list">
                        ${significantPredictions.map(pred => `
                            <div class="progress-item">
                                <div class="d-flex justify-content-between mb-1">
                                    <small>${pred.class}</small>
                                    <small>${pred.confidence}%</small>
                                </div>
                                <div class="progress" style="height: 5px;">
                                    <div class="progress-bar ${pred.index === maxIndex ? 'bg-primary' : 'bg-secondary'}" 
                                         role="progressbar" 
                                         style="width: ${pred.confidence}%" 
                                         aria-valuenow="${pred.confidence}" 
                                         aria-valuemin="0" 
                                         aria-valuemax="100">
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error saat menampilkan prediksi:', error);
        predictionResult.innerHTML = `
            <div class="alert alert-danger">
                Gagal menampilkan hasil prediksi. Silakan coba lagi.
            </div>
        `;
    }
}

// Handle prediksi
predictBtn.addEventListener('click', async function () {
    if (!imagePreview.src || imagePreview.src === '') {
        showError('Silakan pilih gambar terlebih dahulu');
        return;
    }

    try {
        // Tampilkan loading state
        predictBtn.disabled = true;
        spinner.classList.remove('d-none');
        predictionResult.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary mb-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div>Menganalisis gambar...</div>
            </div>
        `;

        // Lakukan prediksi
        const predictions = await skinDetection.predict(model, imagePreview);

        // Tampilkan hasil
        displayPredictions(predictions);

        // Simpan hasil ke server
        const formData = new FormData();
        formData.append('image', imageInput.files[0]);
        formData.append('predictions', JSON.stringify(predictions));

        const response = await fetch('/api/predictions', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Gagal menyimpan hasil prediksi');
        }

    } catch (error) {
        console.error('Error:', error);
        predictionResult.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;
    } finally {
        // Reset UI state
        predictBtn.disabled = false;
        spinner.classList.add('d-none');
    }
});

// Inisialisasi aplikasi saat halaman dimuat
init(); 