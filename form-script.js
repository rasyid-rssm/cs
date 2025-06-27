document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('laporan-form');
    const submitButton = form.querySelector('button[type="submit"]');
    const formStatus = document.getElementById('form-status');
    
    const fileInput = document.getElementById('upload-foto'); // Gunakan ID baru
    const fileUploadDefaultText = document.getElementById('file-upload-default-text');
    const fileNameDisplay = document.getElementById('file-name-display');

    // === URL INI HANYA CONTOH. AKAN KITA DAPATKAN DI LANGKAH BERIKUTNYA ===
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbws6-S-EJTdP613Ks9ZumVj6Yp_d8B2v8KTsmOy9VJ5ZaD06yl6NNCZGgzYHD3xRdPFYg/exec';
    // ======================================================================

    // Fungsi untuk menampilkan nama file yang dipilih (seperti sebelumnya)
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

        // Tampilkan status "loading" dan nonaktifkan tombol
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Mengirim...
        `;
        formStatus.innerHTML = '';

        const file = fileInput.files[0];

        // Jika ada file yang diupload, proses filenya dulu
        if (file) {
            const reader = new FileReader();
            reader.onloadend = function () {
                // Setelah file selesai dibaca, kirim data + file
                const fileData = reader.result;
                const payload = createPayload(fileData, file.name, file.type);
                sendData(payload);
            };
            reader.readAsDataURL(file); // Membaca file sebagai Base64
        } else {
            // Jika tidak ada file, langsung kirim data saja
            const payload = createPayload();
            sendData(payload);
        }
    });

    // Fungsi untuk mengumpulkan semua data dari form
    function createPayload(fileData = null, fileName = null, fileType = null) {
        const formData = new FormData(form);
        const payload = {};
        
        // Mengubah FormData menjadi objek biasa
        for (let [key, value] of formData.entries()) {
            payload[key] = value;
        }

        // Tambahkan data file jika ada
        if (fileData) {
            payload.fileData = fileData; // Data Base64
            payload.fileName = fileName;
            payload.fileType = fileType;
        }

        return payload;
    }
    
    // Fungsi untuk mengirim data ke Google Apps Script
    function sendData(payload) {
        fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Google Apps Script butuh header ini untuk POST
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.result === 'success') {
                // Jika berhasil, arahkan ke halaman terima kasih
                window.location.href = 'thankyou.html';
            } else {
                // Jika gagal, tampilkan pesan error
                throw new Error(data.message || 'Terjadi kesalahan yang tidak diketahui.');
            }
        })
        .catch(error => {
            // Tangani error jaringan atau dari server
            formStatus.innerHTML = `<div class="alert alert-danger" role="alert"><strong>Error:</strong> ${error.message}</div>`;
            // Kembalikan tombol ke keadaan semula
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit';
        });
    }
});