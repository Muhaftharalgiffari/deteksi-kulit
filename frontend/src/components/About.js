export function renderAbout() {
    const about = document.createElement('div');

    about.innerHTML = `
    <h2 class="text-center mb-4">Tentang Kami</h2>
    <div class="row mb-5">
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-body text-center">
            <i class="fas fa-robot feature-icon"></i>
            <h3>Teknologi AI</h3>
            <p>Menggunakan model deep learning yang dilatih dengan ribuan gambar untuk deteksi yang akurat.</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-body text-center">
            <i class="fas fa-shield-alt feature-icon"></i>
            <h3>Keamanan</h3>
            <p>Data Anda aman dan terenkripsi. Kami tidak menyimpan gambar yang diupload.</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-body text-center">
            <i class="fas fa-clock feature-icon"></i>
            <h3>Hasil Cepat</h3>
            <p>Dapatkan hasil deteksi dalam hitungan detik untuk diagnosis awal yang cepat.</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row mt-5">
      <div class="col-md-6">
        <h3 class="mb-4">Jenis Kanker Kulit yang Dapat Dideteksi</h3>
        <div class="accordion" id="skinCancerAccordion">
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#akiec">
                Actinic Keratosis (akiec)
              </button>
            </h2>
            <div id="akiec" class="accordion-collapse collapse show" data-bs-parent="#skinCancerAccordion">
              <div class="accordion-body">
                <p>Lesi pra-kanker yang muncul sebagai bercak kasar dan bersisik. Sering terjadi pada kulit yang sering terpapar sinar matahari. Dapat berkembang menjadi karsinoma sel skuamosa jika tidak diobati.</p>
              </div>
            </div>
          </div>
          
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#bcc">
                Basal Cell Carcinoma (bcc)
              </button>
            </h2>
            <div id="bcc" class="accordion-collapse collapse" data-bs-parent="#skinCancerAccordion">
              <div class="accordion-body">
                <p>Jenis kanker kulit paling umum. Muncul sebagai benjolan mengkilap atau luka yang tidak sembuh. Jarang bermetastasis, tetapi dapat merusak jaringan sekitarnya jika tidak diobati.</p>
              </div>
            </div>
          </div>
          
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#bkl">
                Benign Keratosis (bkl)
              </button>
            </h2>
            <div id="bkl" class="accordion-collapse collapse" data-bs-parent="#skinCancerAccordion">
              <div class="accordion-body">
                <p>Pertumbuhan jinak yang muncul sebagai bercak coklat dengan permukaan berminyak. Termasuk keratosis seboroik dan lentigo solar. Tidak berbahaya dan tidak memerlukan pengobatan kecuali untuk alasan kosmetik.</p>
              </div>
            </div>
          </div>
          
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#df">
                Dermatofibroma (df)
              </button>
            </h2>
            <div id="df" class="accordion-collapse collapse" data-bs-parent="#skinCancerAccordion">
              <div class="accordion-body">
                <p>Benjolan keras dan jinak dengan warna coklat hingga kemerahan. Biasanya muncul pada tungkai dan dapat bertahan seumur hidup. Umumnya tidak memerlukan pengobatan.</p>
              </div>
            </div>
          </div>
          
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#mel">
                Melanoma (mel)
              </button>
            </h2>
            <div id="mel" class="accordion-collapse collapse" data-bs-parent="#skinCancerAccordion">
              <div class="accordion-body">
                <p>Jenis kanker kulit paling berbahaya. Berasal dari sel melanosit yang memproduksi pigmen. Dapat muncul sebagai tahi lalat baru atau perubahan pada tahi lalat yang sudah ada. Dapat menyebar dengan cepat ke organ lain jika tidak diobati.</p>
              </div>
            </div>
          </div>
          
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#nv">
                Melanocytic Nevus (nv)
              </button>
            </h2>
            <div id="nv" class="accordion-collapse collapse" data-bs-parent="#skinCancerAccordion">
              <div class="accordion-body">
                <p>Tahi lalat jinak dengan warna dan bentuk yang teratur. Umumnya tidak berbahaya, tetapi perubahan pada bentuk, warna, atau ukuran harus diperiksa oleh dokter.</p>
              </div>
            </div>
          </div>
          
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#vasc">
                Vascular Lesion (vasc)
              </button>
            </h2>
            <div id="vasc" class="accordion-collapse collapse" data-bs-parent="#skinCancerAccordion">
              <div class="accordion-body">
                <p>Kelainan pembuluh darah yang muncul sebagai bercak merah atau ungu. Termasuk hemangioma, angioma cherry, dan telangiektasia. Umumnya jinak dan tidak memerlukan pengobatan kecuali untuk alasan kosmetik.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <h3 class="mb-4">Teknologi yang Digunakan</h3>
        <div class="card mb-4">
          <div class="card-body">
            <h4 class="card-title">Deep Learning Convolutional Neural Network</h4>
            <p>Kami menggunakan arsitektur CNN khusus yang dioptimalkan untuk deteksi kanker kulit, dengan akurasi tinggi dalam mengklasifikasikan 7 jenis kondisi kulit berbeda.</p>
            <div class="text-center mb-3">
              <img src="https://miro.medium.com/v2/resize:fit:720/format:webp/1*LnStIhRb2QUKVNyyPOiEzA.png" 
                   alt="CNN Architecture" class="img-fluid rounded" style="max-height: 200px;">
            </div>
            <h5>Fitur Model:</h5>
            <ul>
              <li>Pretrained dengan dataset HAM10000 yang berisi lebih dari 10.000 gambar dermatoskopi</li>
              <li>Preprocessing gambar lanjutan untuk meningkatkan fitur visual</li>
              <li>Augmentasi data untuk meningkatkan generalisasi</li>
              <li>Transfer learning dengan arsitektur MobileNet</li>
            </ul>
          </div>
        </div>
        
        <div class="alert alert-warning">
          <h5><i class="fas fa-exclamation-triangle me-2"></i> Penting!</h5>
          <p class="mb-0">Aplikasi ini hanya untuk tujuan edukasi dan bantuan diagnosa awal. Selalu konsultasikan dengan dokter spesialis kulit untuk diagnosis yang akurat.</p>
        </div>
      </div>
    </div>
  `;

    return about;
} 