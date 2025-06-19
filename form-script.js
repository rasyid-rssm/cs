document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('input_10');
    const fileUploadDefaultText = document.getElementById('file-upload-default-text');
    const fileNameDisplay = document.getElementById('file-name-display');

    // Pastikan semua elemen ada sebelum menambahkan event listener
    if (fileInput && fileUploadDefaultText && fileNameDisplay) {
        fileInput.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                // Sembunyikan teks default
                fileUploadDefaultText.style.display = 'none';
                // Tampilkan nama file yang dipilih
                fileNameDisplay.textContent = 'File terpilih: ' + this.files[0].name;
                fileNameDisplay.style.display = 'block';
            } else {
                // Jika tidak ada file, kembalikan ke semula
                fileUploadDefaultText.style.display = 'block';
                fileNameDisplay.style.display = 'none';
                fileNameDisplay.textContent = '';
            }
        });
    }
});