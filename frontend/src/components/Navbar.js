export function renderNavbar() {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar navbar-expand-lg navbar-dark';

    navbar.innerHTML = `
    <div class="container">
      <a class="navbar-brand" href="#home">
        <i class="fas fa-heartbeat me-2"></i>Skin Cancer Detection
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a class="nav-link active" href="#home">Beranda</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#detection">Deteksi</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#history">Riwayat</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#about">Tentang</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#contact">Kontak</a>
          </li>
        </ul>
      </div>
    </div>
  `;

    return navbar;
} 