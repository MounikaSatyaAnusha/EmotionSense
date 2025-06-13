// Face Emotion Analysis JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('start-camera');
    const captureBtn = document.getElementById('capture-btn');
    const stopBtn = document.getElementById('stop-camera');
    const cameraOverlay = document.getElementById('camera-overlay');
    const faceResults = document.getElementById('face-results');

    let stream = null;
    let analysisInterval = null;
    let isAnalyzing = false;

    // Event listeners
    startBtn.addEventListener('click', startCamera);
    captureBtn.addEventListener('click', captureEmotion);
    stopBtn.addEventListener('click', stopCamera);

    async function startCamera() {
        try {
            // Request camera access
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                } 
            });
            
            video.srcObject = stream;
            video.play();

            // Hide overlay and show controls
            cameraOverlay.style.display = 'none';
            startBtn.disabled = true;
            captureBtn.disabled = false;
            stopBtn.disabled = false;
            
            // Show results section
            faceResults.style.display = 'block';
            
            // Add camera active class for pulse effect
            video.parentElement.classList.add('camera-active');

            // Start real-time analysis
            startRealTimeAnalysis();

            showNotification('Camera started successfully!', 'success');

        } catch (error) {
            console.error('Error accessing camera:', error);
            showNotification('Unable to access camera. Please check permissions.', 'error');
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }

        // Stop analysis
        if (analysisInterval) {
            clearInterval(analysisInterval);
            analysisInterval = null;
        }

        // Reset UI
        video.srcObject = null;
        cameraOverlay.style.display = 'flex';
        startBtn.disabled = false;
        captureBtn.disabled = true;
        stopBtn.disabled = true;
        faceResults.style.display = 'none';
        
        // Remove camera active class
        video.parentElement.classList.remove('camera-active');

        isAnalyzing = false;
        showNotification('Camera stopped', 'info');
    }

    function startRealTimeAnalysis() {
        isAnalyzing = true;
        
        // Analyze every 2 seconds
        analysisInterval = setInterval(() => {
            if (isAnalyzing && video.videoWidth > 0) {
                analyzeCurrentFrame();
            }
        }, 2000);
    }

    function analyzeCurrentFrame() {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Simulate emotion analysis
        const analysis = simulateFaceEmotionAnalysis();
        updateRealTimeResults(analysis);
    }

    function captureEmotion() {
        if (!video.videoWidth) {
            showNotification('Camera not ready. Please wait.', 'warning');
            return;
        }

        // Capture current frame
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Analyze the captured frame
        const analysis = simulateFaceEmotionAnalysis();
        
        // Save to history
        saveToHistory('face', analysis.primaryEmotion, analysis.confidence);
        
        // Show capture feedback
        showNotification(`Captured: ${analysis.primaryEmotion} (${analysis.confidence}% confidence)`, 'success');
        
        // Flash effect
        const flash = document.createElement('div');
        flash.style.cssText = 
           ` position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            opacity: 0.8;
            z-index: 9999;
            pointer-events: none;`
        ;
        document.body.appendChild(flash);
        
        setTimeout(() => {
            document.body.removeChild(flash);
        }, 200);
    }

    function simulateFaceEmotionAnalysis() {
        // Simulate realistic emotion detection
        const emotions = ['happy', 'sad', 'angry', 'surprised', 'fear', 'neutral'];
        const weights = [0.3, 0.1, 0.1, 0.15, 0.05, 0.3]; // Higher chance for happy and neutral
        
        // Generate emotion scores
        const emotionScores = {};
        emotions.forEach((emotion, index) => {
            // Base score from weights with some randomness
            const baseScore = weights[index] * 100;
            const randomVariation = (Math.random() - 0.5) * 40; // ±20 variation
            emotionScores[emotion] = Math.max(0, Math.min(100, baseScore + randomVariation));
        });

        // Find primary emotion
        const primaryEmotion = Object.keys(emotionScores).reduce((a, b) => 
            emotionScores[a] > emotionScores[b] ? a : b
        );

        // Calculate confidence
        const confidence = Math.round(emotionScores[primaryEmotion]);

        return {
            primaryEmotion,
            confidence,
            emotionBreakdown: emotionScores
        };
    }

    function updateRealTimeResults(analysis) {
        // Update primary emotion display
        document.getElementById('detected-emotion-text').textContent = 
            analysis.primaryEmotion.charAt(0).toUpperCase() + analysis.primaryEmotion.slice(1);
        document.getElementById('detected-emotion-emoji').textContent = getEmotionEmoji(analysis.primaryEmotion);
        document.getElementById('face-confidence').textContent = `${analysis.confidence}%`;

        // Update emotion bars
        const emotionBars = document.querySelectorAll('#face-emotion-bars .emotion-bar');
        emotionBars.forEach(bar => {
            const emotionName = bar.querySelector('.emotion-name').textContent.toLowerCase().split(' ')[0];
            const barFill = bar.querySelector('.bar-fill');
            const percentText = bar.querySelector('.emotion-percent');
            
            if (analysis.emotionBreakdown[emotionName] !== undefined) {
                const score = Math.round(analysis.emotionBreakdown[emotionName]);
                barFill.style.width = `${score}%`;
                percentText.textContent = `${score}%`;
            }
        });

        // Add subtle animation to the primary emotion
        const emotionDisplay = document.querySelector('.emotion-display');
        emotionDisplay.style.transform = 'scale(1.05)';
        setTimeout(() => {
            emotionDisplay.style.transform = 'scale(1)';
        }, 200);
    }

    // Handle page visibility change to pause/resume analysis
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && isAnalyzing) {
            // Pause analysis when tab is not visible
            if (analysisInterval) {
                clearInterval(analysisInterval);
                analysisInterval = null;
            }
        } else if (!document.hidden && isAnalyzing && !analysisInterval) {
            // Resume analysis when tab becomes visible
            startRealTimeAnalysis();
        }
    });

    // Clean up when page is unloaded
    window.addEventListener('beforeunload', function() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });
});