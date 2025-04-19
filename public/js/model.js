// Model Configuration
const MODEL_CONFIG = {
    inputShape: [224, 224, 3],
    numClasses: 7,
    learningRate: 0.001,
    batchSize: 32,
    epochs: 50
};

// Kelas penyakit kulit yang akan dideteksi (sesuai dengan HAM10000 dataset)
const SKIN_CLASSES = [
    'Actinic Keratoses (AKIEC)',
    'Basal Cell Carcinoma (BCC)',
    'Benign Keratosis (BKL)',
    'Dermatofibroma (DF)',
    'Melanoma (MEL)',
    'Melanocytic Nevi (NV)',
    'Vascular Lesions (VASC)'
];

// Deskripsi untuk setiap kelas penyakit
const SKIN_CLASS_DESCRIPTIONS = {
    'Actinic Keratoses (AKIEC)': 'Lesi kulit yang disebabkan oleh paparan sinar matahari berlebihan. Berpotensi berkembang menjadi kanker kulit.',
    'Basal Cell Carcinoma (BCC)': 'Jenis kanker kulit yang paling umum. Biasanya tumbuh perlahan dan jarang menyebar.',
    'Benign Keratosis (BKL)': 'Pertumbuhan kulit jinak yang umum terjadi. Biasanya muncul seiring bertambahnya usia.',
    'Dermatofibroma (DF)': 'Tumor kulit jinak yang umum. Biasanya muncul di kaki dan berwarna coklat.',
    'Melanoma (MEL)': 'Jenis kanker kulit yang paling berbahaya. Dapat menyebar ke organ lain jika tidak diobati.',
    'Melanocytic Nevi (NV)': 'Tahi lalat normal. Pertumbuhan kulit yang jinak.',
    'Vascular Lesions (VASC)': 'Kelainan pembuluh darah di kulit. Termasuk angioma dan lesi vaskular lainnya.'
};

// Membuat model CNN dari awal menggunakan TensorFlow.js
async function createModel() {
    try {
        console.log('Membuat model CNN...');
        const model = tf.sequential();

        // Input Layer + First Convolutional Block
        model.add(tf.layers.conv2d({
            inputShape: MODEL_CONFIG.inputShape,
            filters: 32,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
        }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
        model.add(tf.layers.dropout({ rate: 0.25 }));

        // Second Convolutional Block
        model.add(tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
        }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
        model.add(tf.layers.dropout({ rate: 0.25 }));

        // Third Convolutional Block
        model.add(tf.layers.conv2d({
            filters: 128,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
        }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
        model.add(tf.layers.dropout({ rate: 0.25 }));

        // Fourth Convolutional Block
        model.add(tf.layers.conv2d({
            filters: 256,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
        }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
        model.add(tf.layers.dropout({ rate: 0.25 }));

        // Flatten layer untuk mengubah feature maps ke vector
        model.add(tf.layers.flatten());

        // Dense layers untuk klasifikasi
        model.add(tf.layers.dense({
            units: 512,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.dropout({ rate: 0.5 }));

        model.add(tf.layers.dense({
            units: 256,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.dropout({ rate: 0.5 }));

        // Output layer
        model.add(tf.layers.dense({
            units: MODEL_CONFIG.numClasses,
            activation: 'softmax'
        }));

        // Compile model dengan optimizer Adam
        model.compile({
            optimizer: tf.train.adam(MODEL_CONFIG.learningRate),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        console.log('Model CNN berhasil dibuat');
        return model;
    } catch (error) {
        console.error('Error saat membuat model:', error);
        throw new Error('Gagal membuat model CNN. Silakan coba lagi.');
    }
}

// Fungsi untuk data augmentation
function augmentImage(tensor) {
    return tf.tidy(() => {
        // Random flip horizontal
        if (Math.random() > 0.5) {
            tensor = tf.image.flipLeftRight(tensor);
        }

        // Random brightness
        tensor = tf.image.adjustBrightness(tensor, Math.random() * 0.2 - 0.1);

        // Random contrast
        tensor = tf.image.adjustContrast(tensor, Math.random() * 0.2 + 0.9);

        // Random rotation (+-15 degrees)
        const angle = Math.random() * 30 - 15;
        tensor = tf.image.rotateWithOffset(tensor, angle * Math.PI / 180);

        return tensor;
    });
}

// Fungsi untuk preprocessing gambar
async function preprocessImage(imageElement, augment = false) {
    return tf.tidy(() => {
        try {
            // Konversi gambar ke tensor
            let tensor = tf.browser.fromPixels(imageElement);

            // Resize gambar ke ukuran yang diharapkan (224x224 untuk MobileNet)
            tensor = tf.image.resizeBilinear(tensor, [224, 224]);

            // Normalisasi nilai pixel ke range [-1, 1] sesuai dengan MobileNet
            tensor = tensor.toFloat();
            tensor = tensor.sub(127.5);
            tensor = tensor.div(127.5);

            // Tambahkan dimensi batch
            return tensor.expandDims(0);
        } catch (error) {
            console.error('Error saat preprocessing gambar:', error);
            throw new Error('Gagal memproses gambar. Silakan coba gambar lain.');
        }
    });
}

// Fungsi untuk training model
async function trainModel(model, trainingData, validationData, progressCallback) {
    try {
        const trainX = tf.data.array(trainingData.images);
        const trainY = tf.data.array(trainingData.labels);
        const valX = tf.data.array(validationData.images);
        const valY = tf.data.array(validationData.labels);

        const trainDataset = tf.data.zip({ xs: trainX, ys: trainY })
            .shuffle(1000)
            .batch(MODEL_CONFIG.batchSize);

        const valDataset = tf.data.zip({ xs: valX, ys: valY })
            .batch(MODEL_CONFIG.batchSize);

        await model.fitDataset(trainDataset, {
            epochs: MODEL_CONFIG.epochs,
            validationData: valDataset,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    if (progressCallback) {
                        progressCallback({
                            epoch: epoch + 1,
                            totalEpochs: MODEL_CONFIG.epochs,
                            trainLoss: logs.loss,
                            trainAcc: logs.acc,
                            valLoss: logs.val_loss,
                            valAcc: logs.val_acc
                        });
                    }
                }
            }
        });

        return model;
    } catch (error) {
        console.error('Error saat training model:', error);
        throw new Error('Gagal melakukan training model.');
    }
}

// Fungsi untuk melakukan prediksi
async function predict(model, imageElement) {
    try {
        const processedImage = await preprocessImage(imageElement, false);
        const predictions = await model.predict(processedImage).data();
        return Array.from(predictions); // Langsung kembalikan array prediksi
    } catch (error) {
        console.error('Error saat melakukan prediksi:', error);
        throw new Error('Gagal melakukan prediksi. Silakan coba lagi.');
    }
}

// Fungsi untuk menyimpan model
async function saveModel(model) {
    try {
        await model.save('indexeddb://skin-disease-model');
        console.log('Model berhasil disimpan');
    } catch (error) {
        console.error('Error saat menyimpan model:', error);
        throw new Error('Gagal menyimpan model.');
    }
}

// Fungsi untuk memuat model
async function loadTrainedModel() {
    try {
        // Load model yang sudah dikonversi ke format TensorFlow.js
        const model = await tf.loadLayersModel('/model/model.json');

        // Jika gagal load model yang sudah ada, buat model baru
        if (!model) {
            console.log('Membuat model baru...');
            return await createModel();
        }

        console.log('Model berhasil dimuat');
        return model;
    } catch (error) {
        console.error('Error saat memuat model:', error);
        console.log('Membuat model baru sebagai fallback...');
        return await createModel();
    }
}

// Export fungsi-fungsi yang dibutuhkan
window.skinDetection = {
    createModel,
    trainModel,
    predict,
    saveModel,
    loadTrainedModel,
    SKIN_CLASSES,
    SKIN_CLASS_DESCRIPTIONS,
    MODEL_CONFIG
}; 