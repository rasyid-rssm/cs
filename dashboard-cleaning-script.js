// !!! PENTING: Pastikan URL ini adalah URL Web App yang benar dari Google Apps Script Anda !!!
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbws6-S-EJTdP613Ks9ZumVj6Yp_d8B2v8KTsmOy9VJ5ZaD06yl6NNCZGgzYHD3xRdPFYg/exec';

document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const tableBody = document.getElementById('table-body');
    const loadingDiv = document.getElementById('loading');
    const searchBox = document.getElementById('search-box');
    const paginationNav = document.getElementById('pagination-nav');
    const fotoModal = new bootstrap.Modal(document.getElementById('fotoModal'));
    const modalImage = document.getElementById('modal-image');
    
    // --- Variabel State ---
    let allData = [];
    let filteredData = [];
    let currentPage = 1;
    const rowsPerPage = 10;
    let activeFilter = 'all'; // Filter aktif saat ini

    // --- Helper Functions ---

    // Mengubah warna badge status
    const getStatusBadge = (status) => {
        if (!status) return `<span class="badge bg-secondary">N/A</span>`;
        let badgeClass = 'bg-secondary';
        if (status.toLowerCase().includes('diterima')) badgeClass = 'bg-danger'; // Merah
        if (status.toLowerCase().includes('ditugaskan')) badgeClass = 'bg-info text-dark'; // Cyan
        if (status.toLowerCase().includes('selesai')) badgeClass = 'bg-primary'; // Biru
        return `<span class="badge ${badgeClass}">${status}</span>`;
    };

    /**
     * [PERBAIKAN FOTO] Mengubah URL pratinjau Google Drive menjadi URL gambar langsung
     * yang bisa ditampilkan di dalam tag <img>. Menggunakan format URL yang lebih andal.
     */
    const getDirectGdriveImageUrl = (gdriveUrl) => {
        if (!gdriveUrl) return null;
        // Ekstrak ID file dari berbagai format URL Google Drive
        const fileIdMatch = gdriveUrl.match(/[-\w]{25,}/);
        if (fileIdMatch) {
            const fileId = fileIdMatch[0];
            // Format URL ini secara langsung menunjuk ke konten gambar di server Google
            return `https://lh3.googleusercontent.com/d/${fileId}`;
        }
        return null;
    };

    const getFotoButton = (url) => {
        const directUrl = getDirectGdriveImageUrl(url);
        if (directUrl) {
            return `<button class="btn btn-outline-primary btn-sm btn-lihat-foto" data-url="${directUrl}">Lihat</button>`;
        }
        return `<button class="btn btn-outline-danger btn-sm btn-no-photo" disabled>Tidak Ada</button>`;
    };
    
    // Mengubah warna badge kepuasan
    const getKepuasanBadge = (kepuasan) => {
        if (!kepuasan || kepuasan.trim() === '') {
            return `<span class="badge bg-info text-dark">Belum Dinilai</span>`; // Cyan
        }
        let badgeClass = 'bg-secondary';
        if (kepuasan.toLowerCase().includes('sangat puas') || kepuasan.toLowerCase().includes('puas')) {
            badgeClass = 'bg-success'; // Hijau
        } else if (kepuasan.toLowerCase().includes('tidak puas') || kepuasan.toLowerCase().includes('sangat tidak puas')) {
            badgeClass = 'bg-danger'; // Merah
        }
        return `<span class="badge ${badgeClass}">${kepuasan}</span>`;
    };

    // Fungsi untuk mem-parsing format tanggal DD/MM/YYYY HH:mm:ss
    const parseAndFormatDate = (dateString) => {
        if (!dateString) return "Invalid Date";
        const parts = dateString.split(/[\s/:]+/); // Pisahkan berdasarkan spasi, /, atau :
        if (parts.length < 5) return "Invalid Date";
        // Format: day, month, year, hour, minute
        const [day, month, year, hour, minute] = parts;
        // Buat objek Date dengan format yang benar (tahun, bulan-1, hari, ...)
        const dateObj = new Date(year, month - 1, day, hour, minute);
        
        // Cek apakah tanggal valid
        if (isNaN(dateObj)) return "Invalid Date";

        // Format kembali ke string yang diinginkan
        return dateObj.toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }).replace(/\./g, ':'); // Ganti titik dengan titik dua untuk format waktu
    };
    
    // --- Fungsi Utama untuk Merender Tampilan ---
    function renderTable(dataToRender) {
        tableBody.innerHTML = '';
        if (dataToRender.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Tidak ada data untuk ditampilkan.</td></tr>`;
            return;
        }

        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedData = dataToRender.slice(startIndex, endIndex);

        paginatedData.forEach(item => {
            const row = document.createElement('tr');
            const waktuLapor = parseAndFormatDate(item['Submission Date']);

            row.innerHTML = `
                <td>${waktuLapor}</td>
                <td>${item.Nama || '-'}</td>
                <td>${item.Lokasi || '-'}</td>
                <td>${item['Jenis pembersihan yang dibutuhkan'] || '-'}</td>
                <td>${getStatusBadge(item.Status)}</td>
                <td>${getFotoButton(item['Upload Foto'])}</td>
                <td>${getKepuasanBadge(item.Kepuasan)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function setupPagination(dataToPaginate) {
        const paginationList = paginationNav.querySelector('.pagination');
        paginationList.innerHTML = '';
        const pageCount = Math.ceil(dataToPaginate.length / rowsPerPage);

        if (pageCount <= 1) return;

        const createPageItem = (text, page, isDisabled = false, isActive = false) => {
            const li = document.createElement('li');
            li.className = `page-item ${isDisabled ? 'disabled' : ''} ${isActive ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
            li.addEventListener('click', (e) => {
                e.preventDefault();
                if (!isDisabled) {
                    currentPage = page;
                    applyFiltersAndRender();
                }
            });
            return li;
        };

        paginationList.appendChild(createPageItem('Previous', currentPage - 1, currentPage === 1));
        for (let i = 1; i <= pageCount; i++) {
            paginationList.appendChild(createPageItem(i, i, false, i === currentPage));
        }
        paginationList.appendChild(createPageItem('Next', currentPage + 1, currentPage === pageCount));
    }

    function updateSummaryCards(data) {
        const todayString = new Date().toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'});
        
        const isPuas = (k) => k && (k.toLowerCase().includes('puas') || k.toLowerCase().includes('sangat puas'));
        const isTidakPuas = (k) => k && (k.toLowerCase().includes('tidak puas') || k.toLowerCase().includes('sangat tidak puas'));
        const isPerluPenanganan = (s) => s && (s.toLowerCase().includes('diterima') || s.toLowerCase().includes('ditugaskan'));

        document.getElementById('total-semua').textContent = data.length;
        document.getElementById('total-hari-ini').textContent = data.filter(item => item['Submission Date'].startsWith(todayString)).length;
        document.getElementById('total-penanganan').textContent = data.filter(item => isPerluPenanganan(item.Status)).length;
        document.getElementById('total-selesai').textContent = data.filter(item => item.Status && item.Status.toLowerCase().includes('selesai')).length;
        document.getElementById('total-puas').textContent = data.filter(item => isPuas(item.Kepuasan)).length;
        document.getElementById('total-tidak-puas').textContent = data.filter(item => isTidakPuas(item.Kepuasan)).length;
        document.getElementById('total-belum-dinilai').textContent = data.filter(item => !item.Kepuasan || item.Kepuasan.trim() === '').length;
    }
    
    function applyFiltersAndRender() {
        const searchTerm = searchBox.value.toLowerCase();
        let tempFilteredData = allData;

        // Filter berdasarkan kartu yang aktif
        switch (activeFilter) {
            case 'hari-ini':
                const todayString = new Date().toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'});
                tempFilteredData = allData.filter(item => item['Submission Date'].startsWith(todayString));
                break;
            case 'penanganan':
                tempFilteredData = allData.filter(item => item.Status && (item.Status.toLowerCase().includes('diterima') || item.Status.toLowerCase().includes('ditugaskan')));
                break;
            case 'selesai':
                tempFilteredData = allData.filter(item => item.Status && item.Status.toLowerCase().includes('selesai'));
                break;
            case 'puas':
                tempFilteredData = allData.filter(item => item.Kepuasan && (item.Kepuasan.toLowerCase().includes('puas') || item.Kepuasan.toLowerCase().includes('sangat puas')));
                break;
            case 'tidak-puas':
                tempFilteredData = allData.filter(item => item.Kepuasan && (item.Kepuasan.toLowerCase().includes('tidak puas') || item.Kepuasan.toLowerCase().includes('sangat tidak puas')));
                break;
            case 'belum-dinilai':
                tempFilteredData = allData.filter(item => !item.Kepuasan || item.Kepuasan.trim() === '');
                break;
            case 'all':
            default:
                tempFilteredData = allData;
        }

        // Filter berdasarkan kotak pencarian
        if (searchTerm) {
            tempFilteredData = tempFilteredData.filter(item =>
                (item.Nama || '').toLowerCase().includes(searchTerm) ||
                (item.Lokasi || '').toLowerCase().includes(searchTerm)
            );
        }

        filteredData = tempFilteredData;
        renderTable(filteredData);
        setupPagination(filteredData);
    }
    
    // --- Event Listeners ---
    tableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-lihat-foto')) {
            modalImage.src = event.target.dataset.url;
            fotoModal.show();
        }
    });

    searchBox.addEventListener('keyup', () => {
        currentPage = 1;
        applyFiltersAndRender();
    });

    document.querySelectorAll('.summary-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.summary-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            activeFilter = card.id.replace('filter-', '');
            currentPage = 1;
            searchBox.value = '';
            applyFiltersAndRender();
        });
    });
    
    document.getElementById('reset-filter').addEventListener('click', () => {
        document.querySelectorAll('.summary-card').forEach(c => c.classList.remove('active'));
        document.getElementById('filter-all').classList.add('active');
        activeFilter = 'all';
        currentPage = 1;
        searchBox.value = '';
        applyFiltersAndRender();
    });

    // --- Fetch Data Awal ---
    fetch(WEB_APP_URL)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(result => {
            if (result.status === 'success') {
                allData = result.data.sort((a, b) => {
                    const dateA = new Date(parseAndFormatDate(a['Submission Date']).replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
                    const dateB = new Date(parseAndFormatDate(b['Submission Date']).replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
                    return dateB - dateA;
                });
                updateSummaryCards(allData);
                applyFiltersAndRender();
            } else {
                tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger"><b>Error:</b> ${result.message}</td></tr>`;
            }
        })
        .catch(error => {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Gagal memuat data. Periksa koneksi atau URL Web App. Error: ${error.message}</td></tr>`;
        })
        .finally(() => {
            loadingDiv.style.display = 'none';
        });
});