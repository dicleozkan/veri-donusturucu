// Global değişkenler
let uploadedFile = null;
let uploadedFilename = null;
let selectedOutputPath = null;
let videoDuration = 0;

// Backend URL'i - doğrudan tanımla
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:8080' 
    : 'https://resim-isleme-api.onrender.com'; // Production backend URL

// Debug için backend URL'ini konsola yazdır
console.log('Backend URL:', BACKEND_URL);
console.log('Current hostname:', window.location.hostname);

// DOM elementleri
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewVideo = document.getElementById('previewVideo');
const videoSource = document.getElementById('videoSource');
const videoInfo = document.getElementById('videoInfo');
const timeSection = document.getElementById('timeSection');
const outputSection = document.getElementById('outputSection');
const statusSection = document.getElementById('statusSection');
const resultsSection = document.getElementById('resultsSection');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');

// Time input elements
const startMinutes = document.getElementById('startMinutes');
const startSeconds = document.getElementById('startSeconds');
const endMinutes = document.getElementById('endMinutes');
const endSeconds = document.getElementById('endSeconds');
const timePreview = document.getElementById('timePreview');
const frameCount = document.getElementById('frameCount');

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    setupDragAndDrop();
    setupFileInput();
    setupTimeInputs();
    loadDefaultOutputPath();
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

// Zaman input'larını ayarla
function setupTimeInputs() {
    const timeInputs = [startMinutes, startSeconds, endMinutes, endSeconds];
    timeInputs.forEach(input => {
        input.addEventListener('input', updateTimePreview);
    });
}

// Zaman önizlemesini güncelle
function updateTimePreview() {
    const startTime = (parseInt(startMinutes.value) || 0) * 60 + (parseInt(startSeconds.value) || 0);
    const endTime = (parseInt(endMinutes.value) || 0) * 60 + (parseInt(endSeconds.value) || 0);
    
    const duration = endTime - startTime;
    
    // Seçilen interval değerlerini al
    const selectedIntervals = getSelectedIntervals();
    let totalFrames = 0;
    
    if (selectedIntervals.length > 0) {
        selectedIntervals.forEach(interval => {
            totalFrames += Math.floor(duration / interval);
        });
    }
    
    timePreview.textContent = `Seçilen aralık: ${formatTime(startTime)} - ${formatTime(endTime)} (${duration} saniye)`;
    frameCount.textContent = `Tahmini frame sayısı: ${totalFrames}`;
}

// Zamanı formatla
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Dosya işleme
function handleFile(file) {
    // Dosya türü kontrolü
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/wmv'];
    if (!allowedTypes.includes(file.type)) {
        showError('Lütfen geçerli bir video dosyası seçin (MP4, AVI, MOV, MKV, WMV)');
        return;
    }

    // Dosya boyutu kontrolü (100MB)
    if (file.size > 100 * 1024 * 1024) {
        showError('Dosya boyutu 100MB\'dan küçük olmalıdır');
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
        videoSource.src = e.target.result;
        previewVideo.load();
        previewSection.style.display = 'block';
        
        // Video yüklendiğinde süreyi al
        previewVideo.addEventListener('loadedmetadata', function() {
            videoDuration = previewVideo.duration;
            const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
            videoInfo.textContent = `Dosya: ${file.name} | Boyut: ${sizeInMB} MB | Süre: ${formatTime(videoDuration)} | Tür: ${file.type}`;
            
            // Bitiş zamanını video süresine ayarla
            endMinutes.value = Math.floor(videoDuration / 60);
            endSeconds.value = Math.floor(videoDuration % 60);
            updateTimePreview();
        });
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
            outputSection.style.display = 'block';
            showSuccess('Video başarıyla yüklendi!');
        } else {
            showError(data.error || 'Video yükleme hatası');
        }
    } catch (error) {
        showError('Sunucu bağlantı hatası: ' + error.message);
    }
}

// Video işleme
async function processVideo() {
    if (!uploadedFilename) {
        showError('Lütfen önce bir video yükleyin');
        return;
    }

    const startTime = (parseInt(startMinutes.value) || 0) * 60 + (parseInt(startSeconds.value) || 0);
    const endTime = (parseInt(endMinutes.value) || 0) * 60 + (parseInt(endSeconds.value) || 0);
    const outputFolder = document.getElementById('outputFolder').value.trim() || 'video_frames';
    
    // Seçilen seçenekleri al
    const selectedOptions = getSelectedVideoOptions();
    
    if (startTime >= endTime) {
        showError('Başlangıç zamanı bitiş zamanından küçük olmalıdır');
        return;
    }
    
    if (endTime > videoDuration) {
        showError('Bitiş zamanı video süresinden büyük olamaz');
        return;
    }

    // İşlem durumunu göster
    showProcessingStatus();
    
    // İşlem butonunu devre dışı bırak
    processBtn.disabled = true;
    processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';

    try {
        const response = await fetch(`${BACKEND_URL}/process_video`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: uploadedFilename,
                output_folder: outputFolder,
                custom_output_path: selectedOutputPath,
                start_time: startTime,
                end_time: endTime,
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
        processBtn.innerHTML = '<i class="fas fa-play"></i> Frame\'leri Çıkar';
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
    document.getElementById('timeRange').textContent = `${formatTime(data.start_time)}-${formatTime(data.end_time)}`;
    
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
                document.getElementById('outputPathDisplay').textContent = folderPath + '/';
                selectedOutputPath = folderPath;
                
                // Kullanıcıya bilgi ver
                showSuccess('Klasör seçildi: ' + folderPath);
            }
        }
    };
    
    input.click();
}

// Seçilen interval değerlerini al
function getSelectedIntervals() {
    const intervals = [];
    const checkboxes = document.querySelectorAll('input[name="interval_values"]:checked');
    checkboxes.forEach(checkbox => {
        intervals.push(parseFloat(checkbox.value));
    });
    return intervals;
}

// Seçilen video işleme seçeneklerini al
function getSelectedVideoOptions() {
    return {
        time_enabled: document.getElementById('time_enabled').checked,
        interval_enabled: document.getElementById('interval_enabled').checked,
        intervals: getSelectedIntervals()
    };
}

// Özel interval ekle
function addCustomInterval() {
    const customValue = document.getElementById('custom_interval').value;
    if (customValue && !isNaN(customValue)) {
        const interval = parseFloat(customValue);
        if (interval >= 0.1 && interval <= 10.0) {
            // Yeni checkbox oluştur
            const container = document.querySelector('.preset-values');
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" name="interval_values" value="${interval}" checked> ${interval} saniye`;
            container.appendChild(label);
            
            // Input'u temizle
            document.getElementById('custom_interval').value = '';
            
            // Önizlemeyi güncelle
            updateTimePreview();
        } else {
            showError('Interval değeri 0.1 ile 10.0 arasında olmalıdır');
        }
    } else {
        showError('Geçerli bir değer girin');
    }
}

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

// Başarı mesajı göster
function showSuccess(message) {
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