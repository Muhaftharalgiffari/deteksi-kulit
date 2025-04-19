export function renderContact() {
    const contact = document.createElement('div');

    contact.innerHTML = `
    <h2 class="text-center mb-4">Hubungi Kami</h2>
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <form id="contactForm">
              <div class="mb-3">
                <label class="form-label">Nama</label>
                <input type="text" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Pesan</label>
                <textarea class="form-control" rows="5" required></textarea>
              </div>
              <button type="submit" class="btn btn-primary">Kirim Pesan</button>
            </form>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-4">Informasi Kontak</h4>
            <div class="d-flex mb-3">
              <div class="flex-shrink-0">
                <i class="fas fa-map-marker-alt text-primary me-3" style="font-size: 1.5rem;"></i>
              </div>
              <div>
                <h5 class="mb-0">Alamat</h5>
                <p class="text-muted mb-0">Jl. Pattimura No. 123, Jakarta Selatan</p>
              </div>
            </div>
            <div class="d-flex mb-3">
              <div class="flex-shrink-0">
                <i class="fas fa-phone-alt text-primary me-3" style="font-size: 1.5rem;"></i>
              </div>
              <div>
                <h5 class="mb-0">Telepon</h5>
                <p class="text-muted mb-0">+62 21 12345678</p>
              </div>
            </div>
            <div class="d-flex mb-3">
              <div class="flex-shrink-0">
                <i class="fas fa-envelope text-primary me-3" style="font-size: 1.5rem;"></i>
              </div>
              <div>
                <h5 class="mb-0">Email</h5>
                <p class="text-muted mb-0">info@skincancerdetection.id</p>
              </div>
            </div>
            <hr>
            <h5 class="mb-3">Ikuti Kami</h5>
            <div class="d-flex">
              <a href="#" class="me-3 text-primary" style="font-size: 1.5rem;">
                <i class="fab fa-facebook"></i>
              </a>
              <a href="#" class="me-3 text-primary" style="font-size: 1.5rem;">
                <i class="fab fa-twitter"></i>
              </a>
              <a href="#" class="me-3 text-primary" style="font-size: 1.5rem;">
                <i class="fab fa-instagram"></i>
              </a>
              <a href="#" class="me-3 text-primary" style="font-size: 1.5rem;">
                <i class="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    // Add event listener to form
    setTimeout(() => {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Pesan Anda telah terkirim! Kami akan segera menghubungi Anda.');
                e.target.reset();
            });
        }
    }, 0);

    return contact;
} 