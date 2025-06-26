// !!! PENTING: Ganti URL di bawah dengan URL Web App BARU Anda dari Langkah 1 !!!
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbws6-S-EJTdP613Ks9ZumVj6Yp_d8B2v8KTsmOy9VJ5ZaD06yl6NNCZGgzYHD3xRdPFYg/exec';
// !!! -------------------------------------------------------------------- !!!

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('table-body');
    const loadingDiv = document.getElementById('loading');
    const searchBox = document.getElementById('search-box');
    const totalHariIniEl = document.getElementById('total-hari-ini');
    const totalSemuaEl = document.getElementById('total-semua');
    const paginationNav = document.getElementById('pagination-nav');
    
    const fotoModal = new bootstrap.Modal(document.getElementById('fotoModal'));
    const modalImage = document.getElementById('modal-image');

    let allData = [];
    let filteredData = [];
    let currentPage = 1;
    const rowsPerPage = 10;

    // Fungsi untuk memberi warna pada status
    function getStatusBadge(status) {
        if (!status) return `<span class="badge bg-secondary">N/A</span>`;
        let badgeClass = 'bg-secondary';
        if (status.toLowerCase().includes('diterima')) badgeClass = 'bg-info text-dark';
        if (status.toLowerCase().includes('ditugaskan')) badgeClass = 'bg-primary';
        if (status.toLowerCase().includes('selesai')) badgeClass = 'bg-success';
        return `<span class="badge ${badgeClass}">${status}</span>`;
    }

    function renderTable(dataToRender) {
        tableBody.innerHTML = '';
        if (dataToRender.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Tidak ada data untuk ditampilkan.</td></tr>`;
            return;
        }

        // Logika Paginasi: potong data sesuai halaman saat ini
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedData = dataToRender.slice(startIndex, endIndex);

        paginatedData.forEach(item => {
            const row = document.createElement('tr');
            
            const waktuLapor = new Date(item['Submission Date']).toLocaleString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const fotoButton = item['Upload Foto'] 
                ? `<button class="btn btn-outline-primary btn-sm btn-lihat-foto" data-url="${item['Upload Foto']}">Lihat</button>` 
                : 'Tidak ada';

            row.innerHTML = `
                <td>${waktuLapor}</td>
                <td>${item.Nama || '-'}</td>
                <td>${item.Lokasi || '-'}</td>
                <td>${item['Detail Ruangan'] || '-'}</td>
                <td>${item['Jenis pembersihan yang dibutuhkan'] || '-'}</td>
                <td>${getStatusBadge(item.Status)}</td>
                <td>${fotoButton}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function setupPagination(dataToPaginate) {
        const paginationList = paginationNav.querySelector('.pagination');
        paginationList.innerHTML = '';
        const pageCount = Math.ceil(dataToPaginate.length / rowsPerPage);

        if (pageCount <= 1) return; // Tidak perlu paginasi jika hanya 1 halaman

        // Tombol "Previous"
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" tabindex="-1" aria-disabled="true">Previous</a>`;
        prevLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                renderTable(filteredData);
                setupPagination(filteredData);
            }
        });
        paginationList.appendChild(prevLi);

        // Tombol Halaman
        for (let i = 1; i <= pageCount; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            pageLi.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                renderTable(filteredData);
                setupPagination(filteredData);
            });
            paginationList.appendChild(pageLi);
        }

        // Tombol "Next"
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === pageCount ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
        nextLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < pageCount) {
                currentPage++;
                renderTable(filteredData);
                setupPagination(filteredData);
            }
        });
        paginationList.appendChild(nextLi);
    }

    function updateSummaryStats(data) {
        const today = new Date().setHours(0, 0, 0, 0);
        const permintaanHariIni = data.filter(item => {
            const itemDate = new Date(item['Submission Date']).setHours(0, 0, 0, 0);
            return itemDate === today;
        }).length;
        
        totalHariIniEl.textContent = permintaanHariIni;
        totalSemuaEl.textContent = data.length;
    }

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
                allData = result.data.sort((a, b) => new Date(b['Submission Date']) - new Date(a['Submission Date']));
                filteredData = allData;
                updateSummaryStats(allData);
                renderTable(filteredData);
                setupPagination(filteredData);
            } else {
                tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger"><b>Error:</b> ${result.message}</td></tr>`;
            }
        })
        .catch(error => {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Gagal memuat data. Error: ${error.message}</td></tr>`;
        })
        .finally(() => {
            loadingDiv.style.display = 'none';
        });

    searchBox.addEventListener('keyup', () => {
        const searchTerm = searchBox.value.toLowerCase();
        filteredData = allData.filter(item =>
            (item.Nama || '').toLowerCase().includes(searchTerm) ||
            (item.Lokasi || '').toLowerCase().includes(searchTerm) ||
            (item['Detail Ruangan'] || '').toString().toLowerCase().includes(searchTerm) ||
            (item.Status || '').toLowerCase().includes(searchTerm)
        );
        currentPage = 1; // Kembali ke halaman pertama setiap kali ada pencarian baru
        renderTable(filteredData);
        setupPagination(filteredData);
    });
});