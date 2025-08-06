// Global değişkenler
let uploadedFile = null;
let uploadedFilename = null;
let selectedOutputPath = null;

// Backend URL'i - doğrudan tanımla
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:8080' 
    : 'https://resim-isleme-api.onrender.com'; // Production backend URL

// Debug için backend URL'ini konsola yazdır
console.log('Backend URL:', BACKEND_URL);

// DOM elementleri
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const imageInfo = document.getElementById('imageInfo');
const processingSection = document.getElementById('processingSection');
const statusSection = document.getElementById('statusSection');
const resultsSection = document.getElementById('resultsSection');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    setupDragAndDrop();
    setupFileInput();
});

// Drag and drop işlevselliği
function setupDragAndDrop() {
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
}

// Dosya input işlevselliği
function setupFileInput() {
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
}

// Dosya işleme
function handleFile(file) {
    // Dosya türü kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
        showError('Lütfen geçerli bir resim dosyası seçin (PNG, JPG, JPEG, GIF, BMP)');
        return;
    }

    // Dosya boyutu kontrolü (16MB)
    if (file.size > 16 * 1024 * 1024) {
        showError('Dosya boyutu 16MB\'dan küçük olmalıdır');
        return;
    }

    uploadedFile = file;
    
    // Önizleme göster
    showPreview(file);
    
    // Dosyayı sunucuya yükle
    uploadFile(file);
}

// Önizleme göster
function showPreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        previewSection.style.display = 'block';
        
        // Resim bilgilerini göster
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        imageInfo.textContent = `Dosya: ${file.name} | Boyut: ${sizeInMB} MB | Tür: ${file.type}`;
    };
    reader.readAsDataURL(file);
}

// Dosyayı sunucuya yükle
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${BACKEND_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            uploadedFilename = data.filename;
            processingSection.style.display = 'block';
            showSuccess('Dosya başarıyla yüklendi!');
        } else {
            showError(data.error || 'Dosya yükleme hatası');
        }
    } catch (error) {
        showError('Sunucu bağlantı hatası: ' + error.message);
    }
}

// Resim işleme
async function processImage() {
    if (!uploadedFilename) {
        showError('Lütfen önce bir resim yükleyin');
        return;
    }

    const outputFolder = document.getElementById('outputFolder').value.trim() || 'processed_images';
    
    // İşlem durumunu göster
    showProcessingStatus();
    
    // İşlem butonunu devre dışı bırak
    processBtn.disabled = true;
    processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';

    try {
        // Seçilen işlemleri topla
        const selectedOptions = getSelectedOptions();
        
        const response = await fetch(`${BACKEND_URL}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: uploadedFilename,
                output_folder: outputFolder,
                custom_output_path: selectedOutputPath,
                selected_options: selectedOptions
            })
        });

        const data = await response.json();

        if (data.success) {
            showResults(data);
        } else {
            showError(data.error || 'İşlem hatası');
        }
    } catch (error) {
        showError('Sunucu bağlantı hatası: ' + error.message);
    } finally {
        // İşlem butonunu tekrar etkinleştir
        processBtn.disabled = false;
        processBtn.innerHTML = '<i class="fas fa-play"></i> İşlemi Başlat';
    }
}

// İşlem durumunu göster
function showProcessingStatus() {
    statusSection.style.display = 'block';
    resultsSection.style.display = 'none';
    
    // Progress bar animasyonu
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = '0%';
    
    setTimeout(() => {
        progressFill.style.width = '30%';
    }, 500);
    
    setTimeout(() => {
        progressFill.style.width = '60%';
    }, 1500);
    
    setTimeout(() => {
        progressFill.style.width = '90%';
    }, 2500);
}

// Sonuçları göster
function showResults(data) {
    statusSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
    document.getElementById('resultsMessage').textContent = data.message;
    document.getElementById('processedCount').textContent = data.processed_count;
    
    // Download butonunu ayarla
    downloadBtn.onclick = () => downloadResults(data.zip_file);
}

// Sonuçları indir
function downloadResults(zipFile) {
    const link = document.createElement('a');
    link.href = `${BACKEND_URL}/download/${zipFile}`;
    link.download = zipFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Başarı mesajı göster
function showSuccess(message) {
    // Basit bir başarı göstergesi
    console.log('Başarı:', message);
}

// Hata modalını göster
function showError(message) {
    errorMessage.textContent = message;
    errorModal.style.display = 'flex';
}

// Hata modalını kapat
function closeErrorModal() {
    errorModal.style.display = 'none';
}

// Modal dışına tıklandığında kapat
errorModal.addEventListener('click', function(e) {
    if (e.target === errorModal) {
        closeErrorModal();
    }
});

// ESC tuşu ile modal kapatma
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && errorModal.style.display === 'flex') {
        closeErrorModal();
    }
});

// Sayfa yüklendiğinde animasyonlar
window.addEventListener('load', function() {
    // Smooth scroll için
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Klasör seçimi fonksiyonu
function selectOutputPath() {
    // Web tarayıcısında klasör seçimi için input oluştur
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.directory = true;
    
    input.onchange = function(e) {
        if (e.target.files.length > 0) {
            const selectedPath = e.target.files[0].path || e.target.files[0].webkitRelativePath;
            if (selectedPath) {
                // Sadece klasör yolunu al
                const folderPath = selectedPath.split('/').slice(0, -1).join('/');
                selectedOutputPath = folderPath;
                document.getElementById('outputPathDisplay').textContent = folderPath + '/';
                
                // Kullanıcıya bilgi ver
                showSuccess('Klasör seçildi: ' + folderPath);
            }
        }
    };
    
    input.click();
}

// Sayfa yüklendiğinde varsayılan yolu al
document.addEventListener('DOMContentLoaded', function() {
    loadDefaultOutputPath();
});

// Varsayılan çıktı yolunu yükle
async function loadDefaultOutputPath() {
    try {
        const response = await fetch(`${BACKEND_URL}/get_output_paths`);
        const data = await response.json();
        
        if (data.current_path) {
            document.getElementById('outputPathDisplay').textContent = data.current_path + '/';
            selectedOutputPath = data.current_path;
        }
    } catch (error) {
        console.log('Varsayılan yol yüklenemedi:', error);
    }
}

// Özel değer ekleme fonksiyonları
function addCustomZoom() {
    const input = document.getElementById('custom_zoom');
    const value = parseFloat(input.value);
    
    if (value && value >= 0.1 && value <= 5.0) {
        // Yeni checkbox oluştur
        const container = document.querySelector('.option-card:first-child .preset-values');
        const newLabel = document.createElement('label');
        newLabel.innerHTML = `<input type="checkbox" name="zoom_values" value="${value}" checked> ${value}x`;
        container.appendChild(newLabel);
        
        input.value = '';
        showSuccess(`Özel zoom değeri eklendi: ${value}x`);
    } else {
        showError('Lütfen geçerli bir zoom değeri girin (0.1 - 5.0)');
    }
}

function addCustomRotation() {
    const input = document.getElementById('custom_rotation');
    const value = parseInt(input.value);
    
    if (value && value >= 0 && value <= 360) {
        // Yeni checkbox oluştur
        const container = document.querySelector('.option-card:nth-child(2) .preset-values');
        const newLabel = document.createElement('label');
        newLabel.innerHTML = `<input type="checkbox" name="rotation_values" value="${value}" checked> ${value}°`;
        container.appendChild(newLabel);
        
        input.value = '';
        showSuccess(`Özel döndürme açısı eklendi: ${value}°`);
    } else {
        showError('Lütfen geçerli bir açı girin (0 - 360)');
    }
}

function addCustomBlur() {
    const input = document.getElementById('custom_blur');
    const value = parseInt(input.value);
    
    if (value && value >= 1 && value <= 50) {
        // Yeni checkbox oluştur
        const container = document.querySelector('.option-card:nth-child(4) .preset-values');
        const newLabel = document.createElement('label');
        newLabel.innerHTML = `<input type="checkbox" name="blur_values" value="${value}" checked> Özel (${value}x${value})`;
        container.appendChild(newLabel);
        
        input.value = '';
        showSuccess(`Özel bulanıklaştırma eklendi: ${value}x${value}`);
    } else {
        showError('Lütfen geçerli bir kernel boyutu girin (1 - 50)');
    }
}

function addCustomAugmentation() {
    const input = document.getElementById('custom_augmentation');
    const value = parseInt(input.value);
    
    if (value && value >= 1 && value <= 50) {
        // Yeni checkbox oluştur
        const container = document.querySelector('.option-card:nth-child(5) .preset-values');
        const newLabel = document.createElement('label');
        newLabel.innerHTML = `<input type="checkbox" name="augmentation_values" value="${value}" checked> Sigma: ${value}`;
        container.appendChild(newLabel);
        
        input.value = '';
        showSuccess(`Özel sigma değeri eklendi: ${value}`);
    } else {
        showError('Lütfen geçerli bir sigma değeri girin (1 - 50)');
    }
}

// Seçilen işlemleri topla
function getSelectedOptions() {
    const options = {
        zoom: {
            enabled: document.getElementById('zoom_enabled').checked,
            values: []
        },
        rotation: {
            enabled: document.getElementById('rotation_enabled').checked,
            values: []
        },
        flip: {
            enabled: document.getElementById('flip_enabled').checked,
            values: []
        },
        blur: {
            enabled: document.getElementById('blur_enabled').checked,
            values: []
        },
        augmentation: {
            enabled: document.getElementById('augmentation_enabled').checked,
            values: []
        }
    };
    
    // Zoom değerlerini topla
    if (options.zoom.enabled) {
        document.querySelectorAll('input[name="zoom_values"]:checked').forEach(checkbox => {
            options.zoom.values.push(parseFloat(checkbox.value));
        });
    }
    
    // Döndürme değerlerini topla
    if (options.rotation.enabled) {
        document.querySelectorAll('input[name="rotation_values"]:checked').forEach(checkbox => {
            options.rotation.values.push(parseInt(checkbox.value));
        });
    }
    
    // Ters çevirme değerlerini topla
    if (options.flip.enabled) {
        document.querySelectorAll('input[name="flip_values"]:checked').forEach(checkbox => {
            options.flip.values.push(parseInt(checkbox.value));
        });
    }
    
    // Bulanıklaştırma değerlerini topla
    if (options.blur.enabled) {
        document.querySelectorAll('input[name="blur_values"]:checked').forEach(checkbox => {
            options.blur.values.push(parseInt(checkbox.value));
        });
    }
    
    // Veri artırma değerlerini topla
    if (options.augmentation.enabled) {
        document.querySelectorAll('input[name="augmentation_values"]:checked').forEach(checkbox => {
            options.augmentation.values.push(parseInt(checkbox.value));
        });
    }
    
    return options;
}

// Utility fonksiyonlar
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
    const maxSize = 16 * 1024 * 1024; // 16MB
    
    if (!allowedTypes.includes(file.type)) {
        return 'Desteklenmeyen dosya türü. Lütfen PNG, JPG, JPEG, GIF veya BMP dosyası seçin.';
    }
    
    if (file.size > maxSize) {
        return 'Dosya boyutu çok büyük. Maksimum 16MB olmalıdır.';
    }
    
    return null;
} 