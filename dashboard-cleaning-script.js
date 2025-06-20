// !!! PENTING: Ganti URL di bawah dengan URL Web App BARU Anda dari Langkah 1 !!!
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbws6-S-EJTdP613Ks9ZumVj6Yp_d8B2v8KTsmOy9VJ5ZaD06yl6NNCZGgzYHD3xRdPFYg/exec';
// !!! -------------------------------------------------------------------- !!!

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('table-body');
    const loadingDiv = document.getElementById('loading');
    const searchBox = document.getElementById('search-box');
    const totalHariIniEl = document.getElementById('total-hari-ini');
    const totalSemuaEl = document.getElementById('total-semua');
    
    // Inisialisasi Modal Bootstrap untuk foto
    const fotoModal = new bootstrap.Modal(document.getElementById('fotoModal'));
    const modalImage = document.getElementById('modal-image');

    let allData = [];

    function renderTable(data) {
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data untuk ditampilkan.</td></tr>';
            return;
        }

        // Urutkan data dari yang terbaru
        // PERUBAHAN: Menggunakan 'Submission Date' bukan 'Timestamp'
        data.sort((a, b) => new Date(b['Submission Date']) - new Date(a['Submission Date']));

        data.forEach(item => {
            const row = document.createElement('tr');
            
            // Format waktu agar mudah dibaca
            // PERUBAHAN: Menggunakan 'Submission Date' bukan 'Timestamp'
            const waktuLapor = new Date(item['Submission Date']).toLocaleString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            // Tombol untuk lihat foto (jika ada URL)
            const fotoButton = item['Upload Foto'] 
                ? `<button class="btn btn-outline-primary btn-sm btn-lihat-foto" data-url="${item['Upload Foto']}">Lihat</button>` 
                : 'Tidak ada';

            row.innerHTML = `
                <td>${waktuLapor}</td>
                <td>${item.Nama || '-'}</td>
                <td>${item.Lokasi || '-'}</td>
                <td>${item['Nomor Ruangan'] || '-'}</td>
                <td>${item['Jenis pembersihan yang dibutuhkan'] || '-'}</td>
                <td>${fotoButton}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function updateSummaryStats(data) {
        const today = new Date().setHours(0, 0, 0, 0);
        const permintaanHariIni = data.filter(item => {
            // PERUBAHAN: Menggunakan 'Submission Date' bukan 'Timestamp'
            const itemDate = new Date(item['Submission Date']).setHours(0, 0, 0, 0);
            return itemDate === today;
        }).length;
        
        totalHariIniEl.textContent = permintaanHariIni;
        totalSemuaEl.textContent = data.length;
    }

    // Event listener untuk tombol "Lihat" foto
    tableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-lihat-foto')) {
            const imageUrl = event.target.dataset.url;
            modalImage.src = imageUrl;
            fotoModal.show();
        }
    });

    fetch(WEB_APP_URL)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                allData = result.data;
                renderTable(allData);
                updateSummaryStats(allData);
            } else {
                tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger"><b>Error:</b> ${result.message}</td></tr>`;
            }
        })
        .catch(error => {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Gagal memuat data. Periksa koneksi atau URL Web App. Error: ${error.message}</td></tr>`;
        })
        .finally(() => {
            loadingDiv.style.display = 'none';
        });

    searchBox.addEventListener('keyup', () => {
        const searchTerm = searchBox.value.toLowerCase();
        const filteredData = allData.filter(item =>
            (item.Nama || '').toLowerCase().includes(searchTerm) ||
            (item.Lokasi || '').toLowerCase().includes(searchTerm) ||
            (item['Nomor Ruangan'] || '').toString().toLowerCase().includes(searchTerm)
        );
        renderTable(filteredData);
    });
});