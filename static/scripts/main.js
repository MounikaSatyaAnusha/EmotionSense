// Main JavaScript for EmotionSense++

// Navigation function
function navigateTo(page) {
    window.location.href = page;
}

// Initialize stats on homepage
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        initializeStats();
    }
});

function initializeStats() {
    // Get stats from localStorage
    const history = JSON.parse(localStorage.getItem('emotionHistory') || '[]');
    
    // Update total analyses
    const totalAnalyses = history.length;
    document.getElementById('total-analyses').textContent = totalAnalyses;
    
    // Count happy detections
    const happyDetections = history.filter(item => 
        item.emotion.toLowerCase().includes('happy') || 
        item.emotion.toLowerCase().includes('joy')
    ).length;
    document.getElementById('happy-detections').textContent = happyDetections;
    
    // Animate numbers
    animateNumber('total-analyses', totalAnalyses);
    animateNumber('happy-detections', happyDetections);
}

function animateNumber(elementId, targetNumber) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let currentNumber = 0;
    const increment = Math.ceil(targetNumber / 20);
    const timer = setInterval(() => {
        currentNumber += increment;
        if (currentNumber >= targetNumber) {
            currentNumber = targetNumber;
            clearInterval(timer);
        }
        element.textContent = currentNumber;
    }, 50);
}

// Utility function to save analysis to history
function saveToHistory(type, emotion, confidence, content = '') {
    const history = JSON.parse(localStorage.getItem('emotionHistory') || '[]');
    const analysis = {
        id: Date.now(),
        type: type, // 'text' or 'face'
        emotion: emotion,
        confidence: confidence,
        content: content,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString()
    };
    
    history.unshift(analysis); // Add to beginning
    
    // Keep only last 100 analyses
    if (history.length > 100) {
        history.splice(100);
    }
    
    localStorage.setItem('emotionHistory', JSON.stringify(history));
}

// Utility function to get emotion emoji
function getEmotionEmoji(emotion) {
    const emojiMap = {
        'happy': '😊',
        'joy': '😄',
        'sad': '😢',
        'angry': '😠',
        'fear': '😨',
        'surprise': '😲',
        'neutral': '😐',
        'disgust': '🤢',
        'excited': '🤩',
        'love': '😍',
        'frustrated': '😤',
        'worried': '😟'
    };
    
    const lowerEmotion = emotion.toLowerCase();
    for (const [key, emoji] of Object.entries(emojiMap)) {
        if (lowerEmotion.includes(key)) {
            return emoji;
        }
    }
    return '😐'; // default neutral
}

// Utility function to get emotion color
function getEmotionColor(emotion) {
    const colorMap = {
        'happy': '#f39c12',
        'joy': '#f39c12',
        'sad': '#3498db',
        'angry': '#e74c3c',
        'fear': '#9b59b6',
        'surprise': '#f39c12',
        'neutral': '#95a5a6',
        'disgust': '#27ae60',
        'excited': '#e67e22',
        'love': '#e91e63',
        'frustrated': '#e74c3c',
        'worried': '#9b59b6'
    };
    
    const lowerEmotion = emotion.toLowerCase();
    for (const [key, color] of Object.entries(colorMap)) {
        if (lowerEmotion.includes(key)) {
            return color;
        }
    }
    return '#95a5a6'; // default neutral
}

// Add smooth scrolling for navigation
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

// Add loading states for buttons
function addLoadingState(button, originalText) {
    button.disabled = true;
    button.innerHTML = `<span class="loading"></span> Processing...`;
    
    return function removeLoadingState() {
        button.disabled = false;
        button.innerHTML = originalText;
    };
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    // Set background color based on type
    const colors = {
        'info': '#3498db',
        'success': '#2ecc71',
        'warning': '#f39c12',
        'error': '#e74c3c'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Export data function
function exportData() {
    const history = JSON.parse(localStorage.getItem('emotionHistory') || '[]');
    
    if (history.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    // Convert to CSV
    const headers = ['Date', 'Type', 'Emotion', 'Confidence', 'Content'];
    const csvContent = [
        headers.join(','),
        ...history.map(item => [
            item.date,
            item.type,
            item.emotion,
            `${item.confidence}%`,
            `"${(item.content || '').replace(/"/g, '""')}"`
        ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emotion-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
}