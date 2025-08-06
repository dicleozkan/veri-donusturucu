const fs = require('fs');
const path = require('path');

// Environment variables'ı HTML'e inject et
function injectEnvironmentVariables() {
    try {
        const htmlPath = path.join(__dirname, 'static', 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // BACKEND_URL'i replace et
        const backendUrl = process.env.BACKEND_URL || 'https://resim-isleme-api.onrender.com';
        html = html.replace(/%%BACKEND_URL%%/g, backendUrl);
        
        fs.writeFileSync(htmlPath, html);
        console.log('Environment variables injected successfully');
        console.log('Backend URL:', backendUrl);
    } catch (error) {
        console.error('Error injecting environment variables:', error);
        process.exit(1);
    }
}

injectEnvironmentVariables(); 