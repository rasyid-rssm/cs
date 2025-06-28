document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('laporan-form');
    const submitButton = form.querySelector('button[type="submit"]');
    const formStatus = document.getElementById('form-status');
    
    const fileInput = document.getElementById('upload-foto');
    const fileUploadDefaultText = document.getElementById('file-upload-default-text');
    const fileNameDisplay = document.getElementById('file-name-display');
    const fileArea = document.getElementById('file-upload-area');

    // Ganti dengan URL Web App Anda dari Google Apps Script
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbws6-S-EJTdP613Ks9ZumVj6Yp_d8B2v8KTsmOy9VJ5ZaD06yl6NNCZGgzYHD3xRdPFYg/exec';

    // Fungsi untuk menampilkan nama file yang dipilih
    if (fileInput && fileUploadDefaultText && fileNameDisplay) {
        fileInput.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                fileUploadDefaultText.style.display = 'none';
                fileNameDisplay.textContent = 'File terpilih: ' + this.files[0].name;
                fileNameDisplay.style.display = 'block';
            } else {
                fileUploadDefaultText.style.display = 'block';
                fileNameDisplay.style.display = 'none';
                fileNameDisplay.textContent = '';
            }
        });
    }

    // Fungsi utama saat form di-submit
    form.addEventListener('submit', function (e) {
        e.preventDefault(); // Mencegah form mengirim data secara tradisional

        // [PERUBAHAN] Validasi Wajib Upload Foto di sisi klien
        if (fileInput.files.length === 0) {
            formStatus.innerHTML = `<div class="alert alert-danger" role="alert"><strong>Error:</strong> Mohon upload foto sebagai bukti.</div>`;
            // Memberikan umpan balik visual dengan menggoyangkan area upload
            fileArea.style.borderColor = '#dc3545'; // Merah
            fileArea.classList.add('shake-animation');
            setTimeout(() => {
                fileArea.classList.remove('shake-animation');
                fileArea.style.borderColor = ''; // Kembali normal
            }, 600);
            return; // Hentikan proses submit jika tidak ada file
        }

        // Tampilkan status "loading" dan nonaktifkan tombol
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Mengirim...
        `;
        formStatus.innerHTML = '';

        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onloadend = function () {
            const fileData = reader.result;
            const payload = createPayload(fileData, file.name, file.type);
            sendData(payload);
        };
        reader.readAsDataURL(file);
    });

    // Fungsi untuk mengumpulkan semua data dari form
    function createPayload(fileData, fileName, fileType) {
        const formData = new FormData(form);
        const payload = {};
        for (let [key, value] of formData.entries()) {
            payload[key] = value;
        }
        payload.fileData = fileData;
        payload.fileName = fileName;
        payload.fileType = fileType;
        return payload;
    }
    
    // Fungsi untuk mengirim data ke Google Apps Script
    function sendData(payload) {
        fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.result === 'success') {
                window.location.href = 'thankyou.html';
            } else {
                throw new Error(data.message || 'Terjadi kesalahan yang tidak diketahui.');
            }
        })
        .catch(error => {
            formStatus.innerHTML = `<div class="alert alert-danger" role="alert"><strong>Error:</strong> ${error.message}</div>`;
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit';
        });
    }
});
