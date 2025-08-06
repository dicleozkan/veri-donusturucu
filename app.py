from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import cv2
import numpy as np
import os
import uuid
from werkzeug.utils import secure_filename
import zipfile
import io

app = Flask(__name__, static_folder='static')
CORS(app)  # CORS desteği ekle
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Upload klasörü oluştur
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'wmv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def allowed_video_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    if filename in ['style.css', 'script.js', 'video-script.js', 'resim.html', 'video.html']:
        return app.send_static_file(filename)
    return app.send_static_file('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Dosya seçilmedi'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Dosya seçilmedi'}), 400
    
    # Dosya türünü kontrol et (resim veya video)
    if file and (allowed_file(file.filename) or allowed_video_file(file.filename)):
        # Benzersiz dosya adı oluştur
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(filepath)
        
        return jsonify({
            'success': True,
            'filename': unique_filename,
            'message': 'Dosya başarıyla yüklendi'
        })
    
    return jsonify({'error': 'Geçersiz dosya türü'}), 400

@app.route('/process', methods=['POST'])
def process_image():
    data = request.get_json()
    filename = data.get('filename')
    output_folder = data.get('output_folder', 'processed_images')
    custom_output_path = data.get('custom_output_path', None)
    selected_options = data.get('selected_options', {})
    
    if not filename:
        return jsonify({'error': 'Dosya adı gerekli'}), 400
    
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'Dosya bulunamadı'}), 404
    
    # Çıktı klasörü oluştur
    if custom_output_path and os.path.exists(custom_output_path):
        # Kullanıcının seçtiği klasöre kaydet
        output_path = os.path.join(custom_output_path, output_folder)
    else:
        # Varsayılan processed klasörüne kaydet
        output_path = os.path.join(PROCESSED_FOLDER, output_folder)
    
    os.makedirs(output_path, exist_ok=True)
    
    try:
        # Resmi yükle
        image = cv2.imread(filepath)
        if image is None:
            return jsonify({'error': 'Resim yüklenemedi'}), 400
        
        processed_files = []
        
        # Zoom işlemi
        if selected_options.get('zoom', {}).get('enabled', True):
            zoom_values = selected_options.get('zoom', {}).get('values', [1.2, 1.5, 2.0])
            for i, zoom_factor in enumerate(zoom_values):
                height, width = image.shape[:2]
                zoomed_image = cv2.resize(image, (int(width * zoom_factor), int(height * zoom_factor)))
                zoomed_image = zoomed_image[(zoomed_image.shape[0] - height) // 2:(zoomed_image.shape[0] + height) // 2,
                               (zoomed_image.shape[1] - width) // 2:(zoomed_image.shape[1] + width) // 2]
                output_file = os.path.join(output_path, f"zoomed_image_{i}.jpg")
                cv2.imwrite(output_file, zoomed_image)
                processed_files.append(f"zoomed_image_{i}.jpg")

        # Rotation (döndürme) işlemi
        if selected_options.get('rotation', {}).get('enabled', True):
            rotation_values = selected_options.get('rotation', {}).get('values', [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360])
            for i, angle in enumerate(rotation_values):
                center = (image.shape[1] // 2, image.shape[0] // 2)
                rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1)
                rotated_image = cv2.warpAffine(image, rotation_matrix, (image.shape[1], image.shape[0]))
                output_file = os.path.join(output_path, f"rotated_image_{i}.jpg")
                cv2.imwrite(output_file, rotated_image)
                processed_files.append(f"rotated_image_{i}.jpg")

        # Flip (ters çevirme) işlemi
        if selected_options.get('flip', {}).get('enabled', True):
            flip_values = selected_options.get('flip', {}).get('values', [0, 1, -1])
            for i, flip_code in enumerate(flip_values):
                flipped_image = cv2.flip(image, flip_code)
                output_file = os.path.join(output_path, f"flipped_image_{i}.jpg")
                cv2.imwrite(output_file, flipped_image)
                processed_files.append(f"flipped_image_{i}.jpg")

        # De-texturize işlemi (bulanıklaştırma)
        if selected_options.get('blur', {}).get('enabled', True):
            blur_values = selected_options.get('blur', {}).get('values', [5, 15, 25])
            for i, kernel_size in enumerate(blur_values):
                de_texturized_image = cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)
                output_file = os.path.join(output_path, f"de_texturized_image_{i}.jpg")
                cv2.imwrite(output_file, de_texturized_image)
                processed_files.append(f"de_texturized_image_{i}.jpg")

        # Augmentation methods (veri arttırma)
        if selected_options.get('augmentation', {}).get('enabled', True):
            augmentation_values = selected_options.get('augmentation', {}).get('values', [5, 10, 15])
            for i, sigma in enumerate(augmentation_values):
                augmented_image = cv2.GaussianBlur(image, (0, 0), sigma)
                output_file = os.path.join(output_path, f"augmented_image_{i}.jpg")
                cv2.imwrite(output_file, augmented_image)
                processed_files.append(f"augmented_image_{i}.jpg")
        
        # ZIP dosyası oluştur
        zip_path = os.path.join(PROCESSED_FOLDER, f"{output_folder}.zip")
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for file in processed_files:
                file_path = os.path.join(output_path, file)
                zipf.write(file_path, file)
        
        return jsonify({
            'success': True,
            'message': f'{len(processed_files)} resim işlendi ve kaydedildi',
            'processed_count': len(processed_files),
            'zip_file': f"{output_folder}.zip"
        })
        
    except Exception as e:
        return jsonify({'error': f'İşlem sırasında hata: {str(e)}'}), 500

@app.route('/download/<filename>')
def download_file(filename):
    file_path = os.path.join(PROCESSED_FOLDER, filename)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    return jsonify({'error': 'Dosya bulunamadı'}), 404

@app.route('/process_video', methods=['POST'])
def process_video():
    data = request.get_json()
    filename = data.get('filename')
    output_folder = data.get('output_folder', 'video_frames')
    custom_output_path = data.get('custom_output_path', None)
    start_time = data.get('start_time', 0)
    end_time = data.get('end_time', 60)
    selected_options = data.get('selected_options', {})
    
    if not filename:
        return jsonify({'error': 'Dosya adı gerekli'}), 400
    
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'Dosya bulunamadı'}), 404
    
    # Çıktı klasörü oluştur
    if custom_output_path and os.path.exists(custom_output_path):
        output_path = os.path.join(custom_output_path, output_folder)
    else:
        output_path = os.path.join(PROCESSED_FOLDER, output_folder)
    
    os.makedirs(output_path, exist_ok=True)
    
    try:
        # Video dosyasını aç
        cap = cv2.VideoCapture(filepath)
        if not cap.isOpened():
            return jsonify({'error': 'Video dosyası açılamadı'}), 400
        
        # Video özelliklerini al
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps
        
        # Zaman aralığını frame'lere çevir
        start_frame = int(start_time * fps)
        end_frame = int(end_time * fps)
        
        processed_files = []
        frame_count = 0
        
        # Seçilen interval değerlerini al
        intervals = selected_options.get('intervals', [0.5])
        
        # Her interval için frame'leri çıkar
        for interval in intervals:
            frame_interval_frames = int(interval * fps)
            
            for frame_num in range(start_frame, end_frame, frame_interval_frames):
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
                ret, frame = cap.read()
                
                if ret:
                    # Frame'i kaydet
                    output_file = os.path.join(output_path, f"frame_{frame_count:04d}_interval_{interval}.jpg")
                    cv2.imwrite(output_file, frame)
                    processed_files.append(f"frame_{frame_count:04d}_interval_{interval}.jpg")
                    frame_count += 1
        
        cap.release()
        
        # ZIP dosyası oluştur
        zip_path = os.path.join(PROCESSED_FOLDER, f"{output_folder}.zip")
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for file in processed_files:
                file_path = os.path.join(output_path, file)
                zipf.write(file_path, file)
        
        return jsonify({
            'success': True,
            'message': f'{len(processed_files)} frame çıkarıldı ve kaydedildi',
            'processed_count': len(processed_files),
            'start_time': start_time,
            'end_time': end_time,
            'zip_file': f"{output_folder}.zip"
        })
        
    except Exception as e:
        return jsonify({'error': f'Video işleme hatası: {str(e)}'}), 500

@app.route('/get_output_paths', methods=['GET'])
def get_output_paths():
    """Kullanıcının seçebileceği çıktı konumlarını döndür"""
    import platform
    
    # İşletim sistemine göre varsayılan konumlar
    if platform.system() == 'Windows':
        default_paths = [
            os.path.expanduser('~/Desktop'),
            os.path.expanduser('~/Documents'),
            os.path.expanduser('~/Pictures'),
            os.path.expanduser('~/Downloads')
        ]
    else:
        default_paths = [
            os.path.expanduser('~/Desktop'),
            os.path.expanduser('~/Documents'),
            os.path.expanduser('~/Pictures'),
            os.path.expanduser('~/Downloads')
        ]
    
    # Mevcut processed klasörü
    current_path = os.path.abspath(PROCESSED_FOLDER)
    
    return jsonify({
        'current_path': current_path,
        'default_paths': default_paths,
        'system': platform.system()
    })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8080) 