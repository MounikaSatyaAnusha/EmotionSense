// Text Emotion Analysis JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const textInput = document.getElementById('text-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const clearBtn = document.getElementById('clear-btn');
    const resultsSection = document.getElementById('results-section');

    // Event listeners
    clearBtn.addEventListener('click', clearText);
    textInput.addEventListener('input', handleTextInput);

    const voiceBtn = document.getElementById('voiceBtn');
    

    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Sorry, your browser doesn't support speech recognition.");
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      voiceBtn.addEventListener('click', () => {
        recognition.start();
        voiceBtn.textContent = '🎙️ Listening...';
      });

    recognition.onresult = (event) => {
    const speechToText = event.results[0][0].transcript;
    textInput.value = speechToText;
    voiceBtn.textContent = '🎤 Voice';

    // Enable analyze button and auto-analyze
    analyzeBtn.disabled = false;
    analyzeText();
};


      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        voiceBtn.textContent = '🎤 Voice';
      };

      recognition.onend = () => {
        voiceBtn.textContent = '🎤 Voice';
      };
    }

    function handleTextInput() {
        const text = textInput.value.trim();
        analyzeBtn.disabled = text.length === 0;
    }

    function clearText() {
        textInput.value = '';
        resultsSection.style.display = 'none';
        analyzeBtn.disabled = true;
    }

    function analyzeText() {
        const text = textInput.value.trim();
        
        if (!text) {
            showNotification('Please enter some text to analyze', 'warning');
            return;
        }

        // Add loading state
        const originalText = analyzeBtn.innerHTML;
        const removeLoading = addLoadingState(analyzeBtn, originalText);

        // Simulate API call delay
        setTimeout(() => {
            const analysis = performTextAnalysis(text);
            displayResults(analysis);
            saveToHistory('text', analysis.primaryEmotion, analysis.confidence, text);
            removeLoading();
        }, 1500);
    }
    function performTextAnalysis(text) {
        // Simple emotion analysis based on keywords
        const emotionKeywords = {
            happy: ['happy', 'joy', 'excited', 'great', 'awesome', 'wonderful', 'amazing', 'fantastic', 'love', 'perfect', 'excellent', 'brilliant', 'delighted', 'thrilled', 'cheerful'],
            sad: ['sad', 'depressed', 'unhappy', 'miserable', 'disappointed', 'heartbroken', 'lonely', 'melancholy', 'gloomy', 'sorrowful', 'grief', 'despair'],
            angry: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'frustrated', 'rage', 'hate', 'disgusted', 'outraged', 'livid', 'enraged'],
            fear: ['scared', 'afraid', 'terrified', 'worried', 'anxious', 'nervous', 'panic', 'frightened', 'concerned', 'apprehensive', 'uneasy'],
            surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'bewildered', 'startled', 'unexpected', 'incredible', 'unbelievable'],
            neutral: ['okay', 'fine', 'normal', 'regular', 'usual', 'standard', 'typical', 'ordinary', 'average']
        };

        const lowerText = text.toLowerCase();
        const emotionScores = {};

        // Calculate scores for each emotion
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            let score = 0;
            keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = lowerText.match(regex);
                if (matches) {
                    score += matches.length;
                }
            });
            emotionScores[emotion] = score;
        }

        // Add some randomness for more realistic results
        Object.keys(emotionScores).forEach(emotion => {
            emotionScores[emotion] += Math.random() * 0.5;
        });

        // Find primary emotion
        const primaryEmotion = Object.keys(emotionScores).reduce((a, b) => 
            emotionScores[a] > emotionScores[b] ? a : b
        );

        // Calculate confidence (0-100)
        const totalScore = Object.values(emotionScores).reduce((sum, score) => sum + score, 0);
        const confidence = totalScore > 0 ? 
            Math.min(95, Math.max(60, Math.round((emotionScores[primaryEmotion] / totalScore) * 100))) : 
            70;

        // Normalize scores for display (0-100)
        const maxScore = Math.max(...Object.values(emotionScores));
        const normalizedScores = {};
        Object.keys(emotionScores).forEach(emotion => {
            normalizedScores[emotion] = maxScore > 0 ? 
                Math.round((emotionScores[emotion] / maxScore) * 100) : 
                Math.round(Math.random() * 30);
        });

        return {
            primaryEmotion,
            confidence,
            emotionBreakdown: normalizedScores,
            suggestions: generateSuggestions(primaryEmotion, confidence)
        };
    }

    function generateSuggestions(emotion, confidence) {
        const suggestions = {
            happy: [
                "Share your positive energy with others!",
                "Consider writing in a gratitude journal to maintain this mood.",
                "This is a great time to tackle challenging tasks."
            ],
            sad: [
                "It's okay to feel sad sometimes. Consider talking to someone you trust.",
                "Try engaging in activities that usually bring you joy.",
                "Remember that this feeling is temporary and will pass."
            ],
            angry: [
                "Take deep breaths and count to ten before responding.",
                "Consider physical exercise to help release tension.",
                "Try to identify the root cause of your anger."
            ],
            fear: [
                "Break down your worries into smaller, manageable parts.",
                "Practice relaxation techniques like deep breathing.",
                "Consider talking to someone about your concerns."
            ],
            surprise: [
                "Take a moment to process this unexpected situation.",
                "Use this energy to explore new opportunities.",
                "Share your excitement with others if it's positive news."
            ],
            neutral: [
                "This is a good time for reflection and planning.",
                "Consider setting new goals or trying something new.",
                "Neutral emotions can be a sign of inner balance."
            ]
        };

        return suggestions[emotion] || suggestions.neutral;
    }

    function displayResults(analysis) {
        // Show results section
        resultsSection.style.display = 'block';

        // Update primary emotion
        document.getElementById('primary-emotion').textContent = 
            analysis.primaryEmotion.charAt(0).toUpperCase() + analysis.primaryEmotion.slice(1);
        document.getElementById('primary-emoji').textContent = getEmotionEmoji(analysis.primaryEmotion);

        // Update confidence
        document.getElementById('confidence-fill').style.width = `${analysis.confidence}%`;
        document.getElementById('confidence-text').textContent = `${analysis.confidence}%`;

        // Update emotion breakdown
        const emotionBars = document.getElementById('emotion-bars');
        emotionBars.innerHTML = '';

        Object.entries(analysis.emotionBreakdown).forEach(([emotion, score]) => {
            const barHtml = `
                <div class="emotion-bar">
                    <span class="emotion-name">${emotion.charAt(0).toUpperCase() + emotion.slice(1)} ${getEmotionEmoji(emotion)}</span>
                    <div class="bar-container">
                        <div class="bar-fill ${emotion}" style="width: ${score}%"></div>
                    </div>
                    <span class="emotion-percent">${score}%</span>
                </div>
            `;
            emotionBars.innerHTML += barHtml;
        });

        // Update suggestions
        const suggestionsList = document.getElementById('suggestions-list');
        suggestionsList.innerHTML = '';

        analysis.suggestions.forEach(suggestion => {
            const suggestionHtml = `
                <div class="suggestion-item">
                    ${suggestion}
                </div>
            `;
            suggestionsList.innerHTML += suggestionHtml;
        });

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});

// Sample text function
function setSampleText(text) {
    document.getElementById('text-input').value = text;
    document.getElementById('analyze-btn').disabled = false;
    
    // Auto-analyze after setting sample text
    setTimeout(() => {
        document.getElementById('analyze-btn').click();
    }, 500);
}

