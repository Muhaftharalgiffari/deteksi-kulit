export function renderHome() {
    const home = document.createElement('div');

    home.innerHTML = `
    <div class="row align-items-center min-vh-75">
      <div class="col-md-6">
        <h1 class="display-4 mb-4 animate__animated animate__fadeInLeft">
          Deteksi Kanker Kulit dengan AI
        </h1>
        <p class="lead mb-4 animate__animated animate__fadeInLeft animate__delay-1s">
          Gunakan teknologi AI canggih untuk mendeteksi berbagai jenis kanker kulit secara cepat dan akurat.
        </p>
        <a href="#detection" class="btn btn-primary btn-lg animate__animated animate__fadeInLeft animate__delay-2s">
          Mulai Deteksi
        </a>
      </div>
      <div class="col-md-6">
        <img src="https://source.unsplash.com/random/600x400/?skin,health" 
          class="img-fluid rounded shadow animate__animated animate__fadeInRight" 
          alt="Skin Health">
      </div>
    </div>
  `;

    // Link to detection page
    const detectionButton = home.querySelector('.btn-primary');
    detectionButton.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById('detection').classList.add('active');

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#detection') {
                link.classList.add('active');
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    return home;
} 