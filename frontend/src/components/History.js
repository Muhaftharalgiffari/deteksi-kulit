export function renderHistory() {
    const history = document.createElement('div');

    history.innerHTML = `
    <h2 class="text-center mb-4">Riwayat Deteksi</h2>
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-body">
            <div id="emptyHistory" class="text-center py-5" style="display: none;">
              <i class="fas fa-history fa-3x text-muted mb-3"></i>
              <h5 class="text-muted">Belum ada riwayat deteksi</h5>
              <p>Riwayat deteksi akan muncul di sini setelah Anda melakukan deteksi gambar.</p>
              <a href="#detection" class="btn btn-primary mt-2">Mulai Deteksi</a>
            </div>
            <div id="historyContent">
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Hasil</th>
                      <th>Kepercayaan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="historyTable">
                    <!-- History items will be added here -->
                  </tbody>
                </table>
              </div>
              <div class="d-flex justify-content-end">
                <button id="clearHistoryBtn" class="btn btn-sm btn-outline-danger">
                  <i class="fas fa-trash-alt me-1"></i> Hapus Semua Riwayat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    // Add event listeners after attaching to DOM
    setTimeout(() => {
        initializeHistory();
    }, 0);

    return history;
}

function initializeHistory() {
    const historyTable = document.getElementById('historyTable');
    const emptyHistory = document.getElementById('emptyHistory');
    const historyContent = document.getElementById('historyContent');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    if (!historyTable || !clearHistoryBtn) return;

    // Handle clear history
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin menghapus semua riwayat deteksi?')) {
            localStorage.removeItem('detectionHistory');
            updateHistoryTable();
        }
    });

    // Redirect to detection page
    const detectionButton = document.querySelector('#emptyHistory .btn-primary');
    if (detectionButton) {
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
    }

    // Initialize the history table
    updateHistoryTable();
}

// This function is called from Detection.js when a new entry is added
function updateHistoryTable() {
    const historyTable = document.getElementById('historyTable');
    const emptyHistory = document.getElementById('emptyHistory');
    const historyContent = document.getElementById('historyContent');

    if (!historyTable) return;

    const history = JSON.parse(localStorage.getItem('detectionHistory') || '[]');

    if (history.length === 0) {
        if (emptyHistory) emptyHistory.style.display = 'block';
        if (historyContent) historyContent.style.display = 'none';
        return;
    }

    if (emptyHistory) emptyHistory.style.display = 'none';
    if (historyContent) historyContent.style.display = 'block';

    historyTable.innerHTML = '';

    history.forEach(entry => {
        const row = document.createElement('tr');
        const date = new Date(entry.date).toLocaleString();
        const result = entry.result || {};
        const confidence = result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A';

        row.innerHTML = `
      <td>${date}</td>
      <td>${result.explanation || 'Unknown'}</td>
      <td>${confidence}</td>
      <td>
        <button class="btn btn-sm btn-outline-info view-details" data-id="${entry.id}">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger delete-entry" data-id="${entry.id}">
          <i class="fas fa-times"></i>
        </button>
      </td>
    `;

        historyTable.appendChild(row);
    });

    // Add event listeners to the view and delete buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', () => {
            const id = parseInt(button.getAttribute('data-id'));
            viewHistoryDetails(id);
        });
    });

    document.querySelectorAll('.delete-entry').forEach(button => {
        button.addEventListener('click', () => {
            const id = parseInt(button.getAttribute('data-id'));
            deleteHistoryEntry(id);
        });
    });
}

function viewHistoryDetails(id) {
    const history = JSON.parse(localStorage.getItem('detectionHistory') || '[]');
    const entry = history.find(item => item.id === id);

    if (!entry) return;

    const result = entry.result || {};
    const confidence = result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A';
    const date = new Date(entry.date).toLocaleString();

    alert(`
    Detail Hasil Deteksi
    -------------------
    Tanggal: ${date}
    Diagnosa: ${result.explanation || 'Unknown'}
    Kepercayaan: ${confidence}
  `);
}

function deleteHistoryEntry(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus riwayat ini?')) return;

    let history = JSON.parse(localStorage.getItem('detectionHistory') || '[]');
    history = history.filter(item => item.id !== id);
    localStorage.setItem('detectionHistory', JSON.stringify(history));

    updateHistoryTable();
}

// Make the function available globally
window.updateHistoryTable = updateHistoryTable; 