// Fungsi untuk memuat dan memproses dataset
async function loadDataset(imageUrls, labels) {
    const images = [];
    const processedLabels = [];

    try {
        for (let i = 0; i < imageUrls.length; i++) {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            // Load gambar
            await new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error(`Gagal memuat gambar: ${imageUrls[i]}`));
                img.src = imageUrls[i];
            });

            // Preprocessing gambar
            const processedImage = await skinDetection.preprocessImage(img, true);
            images.push(processedImage);

            // One-hot encoding untuk label
            const label = tf.oneHot(labels[i], skinDetection.MODEL_CONFIG.numClasses);
            processedLabels.push(label);
        }

        return {
            images: images,
            labels: processedLabels
        };
    } catch (error) {
        console.error('Error saat memuat dataset:', error);
        throw new Error('Gagal memuat dataset.');
    }
}

// Fungsi untuk memulai proses training
async function startTraining(trainingData, validationData) {
    try {
        // Buat progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'progress mb-3';
        progressBar.innerHTML = `
            <div class="progress-bar" role="progressbar" style="width: 0%">
                0%
            </div>
        `;
        document.getElementById('trainingProgress').appendChild(progressBar);

        // Buat area untuk metrics
        const metricsDiv = document.createElement('div');
        metricsDiv.className = 'training-metrics';
        document.getElementById('trainingProgress').appendChild(metricsDiv);

        // Buat model baru
        const model = await skinDetection.createModel();

        // Training callback untuk update progress
        const updateProgress = (progress) => {
            const percent = (progress.epoch / progress.totalEpochs) * 100;
            progressBar.querySelector('.progress-bar').style.width = `${percent}%`;
            progressBar.querySelector('.progress-bar').textContent = `${percent.toFixed(1)}%`;

            metricsDiv.innerHTML = `
                <div class="alert alert-info">
                    <strong>Epoch ${progress.epoch}/${progress.totalEpochs}</strong><br>
                    Training Loss: ${progress.trainLoss.toFixed(4)}<br>
                    Training Accuracy: ${(progress.trainAcc * 100).toFixed(2)}%<br>
                    Validation Loss: ${progress.valLoss.toFixed(4)}<br>
                    Validation Accuracy: ${(progress.valAcc * 100).toFixed(2)}%
                </div>
            `;
        };

        // Mulai training
        await skinDetection.trainModel(model, trainingData, validationData, updateProgress);

        // Simpan model
        await skinDetection.saveModel(model);

        // Tampilkan pesan sukses
        document.getElementById('trainingProgress').innerHTML += `
            <div class="alert alert-success">
                Training selesai! Model telah disimpan dan siap digunakan.
            </div>
        `;

        return model;
    } catch (error) {
        document.getElementById('trainingProgress').innerHTML += `
            <div class="alert alert-danger">
                Error: ${error.message}
            </div>
        `;
        throw error;
    }
}

// Export fungsi-fungsi
window.training = {
    loadDataset,
    startTraining
}; 