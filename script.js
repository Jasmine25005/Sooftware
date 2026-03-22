// Global variables
let questions = [];
let userAnswers = [];
let answerStatus = [];
let currentIndex = 0;
let activeChapter = "All";

// DOM Elements
let correctCountEl, wrongCountEl, percentageEl, answeredCountEl;
let questionTextEl, optionsContainer, explanationBox, explanationTextEl;
let currentChapterEl, chaptersListEl, questionsGridEl;
let prevBtn, nextBtn;

// Fetch questions from JSON file
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        questions = await response.json();
        
        // Initialize arrays
        userAnswers = new Array(questions.length).fill(null);
        answerStatus = new Array(questions.length).fill(false);
        
        // Setup UI after loading
        setupEventListeners();
        renderChapters();
        renderStats();
        renderCurrentQuestion();
        renderQuestionsGrid();
        
    } catch (error) {
        console.error('Error loading questions:', error);
        document.getElementById('questionText').innerHTML = 'Error loading questions. Make sure questions.json file exists.';
    }
}

// Setup DOM element references
function setupEventListeners() {
    correctCountEl = document.getElementById('correctCount');
    wrongCountEl = document.getElementById('wrongCount');
    percentageEl = document.getElementById('percentageValue');
    answeredCountEl = document.getElementById('answeredCount');
    questionTextEl = document.getElementById('questionText');
    optionsContainer = document.getElementById('optionsContainer');
    explanationBox = document.getElementById('explanationBox');
    explanationTextEl = document.getElementById('explanationText');
    currentChapterEl = document.getElementById('currentChapter');
    chaptersListEl = document.getElementById('chaptersList');
    questionsGridEl = document.getElementById('questionsGrid');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            renderCurrentQuestion();
            renderQuestionsGrid();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentIndex < questions.length - 1) {
            currentIndex++;
            renderCurrentQuestion();
            renderQuestionsGrid();
        }
    });
}

// Calculate statistics
function computeStats() {
    let correct = 0;
    let answered = 0;
    
    for (let i = 0; i < questions.length; i++) {
        if (answerStatus[i]) {
            answered++;
            if (userAnswers[i] === questions[i].correct) {
                correct++;
            }
        }
    }
    
    let wrong = answered - correct;
    let percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    
    return { correct, wrong, answered, percentage };
}

// Render statistics panel
function renderStats() {
    const stats = computeStats();
    correctCountEl.textContent = stats.correct;
    wrongCountEl.textContent = stats.wrong;
    percentageEl.textContent = `${stats.percentage}%`;
    answeredCountEl.textContent = `${stats.answered}/${questions.length}`;
}

// Get unique chapters from questions
function getChapters() {
    const chapters = ['All', ...new Set(questions.map(q => q.category))];
    return chapters;
}

// Render chapters list in left panel
function renderChapters() {
    const chapters = getChapters();
    const chapterCounts = {};
    
    questions.forEach(q => {
        chapterCounts[q.category] = (chapterCounts[q.category] || 0) + 1;
    });
    
    chaptersListEl.innerHTML = chapters.map(chapter => {
        let displayName = chapter;
        if (chapter === 'All') {
            displayName = '📖 All Chapters';
        } else {
            displayName = chapter.replace('Chapter ', '📘 Ch ');
        }
        const count = chapter === 'All' ? questions.length : chapterCounts[chapter];
        
        return `
            <button class="chapter-btn ${activeChapter === chapter ? 'active' : ''}" data-chapter="${chapter}">
                <span>${displayName}</span>
                <span class="chapter-count">${count}</span>
            </button>
        `;
    }).join('');
    
    // Add click handlers
    document.querySelectorAll('.chapter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeChapter = btn.dataset.chapter;
            renderChapters();
            
            // Find first question in selected chapter
            let newIndex = 0;
            if (activeChapter !== 'All') {
                const firstInChapter = questions.findIndex(q => q.category === activeChapter);
                if (firstInChapter !== -1) {
                    newIndex = firstInChapter;
                }
            }
            currentIndex = newIndex;
            renderCurrentQuestion();
            renderQuestionsGrid();
        });
    });
}

// Render current question with options
function renderCurrentQuestion() {
    if (!questions.length) return;
    
    const question = questions[currentIndex];
    const isAnswered = answerStatus[currentIndex];
    const selectedOpt = userAnswers[currentIndex];
    
    // Update chapter badge
    currentChapterEl.textContent = `📘 ${question.category}`;
    
    // Question text
    questionTextEl.textContent = question.text;
    
    // Render options
    optionsContainer.innerHTML = question.options.map((opt, idx) => {
        let extraClass = '';
        if (isAnswered) {
            if (idx === question.correct) {
                extraClass = 'correct-highlight';
            } else if (idx === selectedOpt && selectedOpt !== question.correct) {
                extraClass = 'wrong-highlight';
            }
        }
        return `
            <div class="option ${extraClass} ${isAnswered ? 'disabled-opt' : ''}" data-opt-index="${idx}">
                ${String.fromCharCode(65 + idx)}. ${opt}
            </div>
        `;
    }).join('');
    
    // Show/hide explanation
    if (isAnswered) {
        const isCorrect = selectedOpt === question.correct;
        const explanationText = question.explanation || 'No explanation available.';
        explanationTextEl.innerHTML = explanationText;
        explanationBox.style.display = 'block';
        
        // Add correct/wrong indicator to explanation
        if (isCorrect) {
            explanationTextEl.innerHTML = `✅ Correct! ${explanationText}`;
        } else {
            const correctAnswer = question.options[question.correct];
            explanationTextEl.innerHTML = `❌ Wrong. The correct answer is: ${correctAnswer}<br><br>💡 ${explanationText}`;
        }
    } else {
        explanationBox.style.display = 'none';
    }
    
    // Add click handlers for options
    if (!isAnswered) {
        document.querySelectorAll('.option').forEach(optDiv => {
            optDiv.addEventListener('click', () => {
                if (answerStatus[currentIndex]) return;
                const chosen = parseInt(optDiv.dataset.optIndex);
                userAnswers[currentIndex] = chosen;
                answerStatus[currentIndex] = true;
                renderStats();
                renderCurrentQuestion();
                renderQuestionsGrid();
            });
        });
    }
}

// Render all questions grid in right panel
function renderQuestionsGrid() {
    if (!questions.length) return;
    
    // Filter questions based on active chapter
    let filteredQuestions = questions;
    if (activeChapter !== 'All') {
        filteredQuestions = questions.filter(q => q.category === activeChapter);
    }
    
    const filteredIndices = [];
    filteredQuestions.forEach(q => {
        const originalIndex = questions.findIndex(orig => orig.id === q.id);
        filteredIndices.push(originalIndex);
    });
    
    questionsGridEl.innerHTML = filteredQuestions.map((q, idx) => {
        const originalIdx = filteredIndices[idx];
        const status = answerStatus[originalIdx];
        const isCorrect = status && userAnswers[originalIdx] === q.correct;
        let statusIcon = '';
        
        if (status) {
            statusIcon = `<span class="q-status ${isCorrect ? 'correct-dot' : 'wrong-dot'}">${isCorrect ? '✓' : '✗'}</span>`;
        } else {
            statusIcon = `<span class="q-status">?</span>`;
        }
        
        // Truncate long question text
        let questionPreview = q.text;
        if (questionPreview.length > 55) {
            questionPreview = questionPreview.substring(0, 52) + '...';
        }
        
        return `
            <div class="q-item ${originalIdx === currentIndex ? 'active-question' : ''}" data-qidx="${originalIdx}">
                <span>Q${q.id}. ${questionPreview}</span>
                ${statusIcon}
            </div>
        `;
    }).join('');
    
    // Add click handlers
    document.querySelectorAll('.q-item').forEach(el => {
        el.addEventListener('click', () => {
            currentIndex = parseInt(el.dataset.qidx);
            renderCurrentQuestion();
            renderQuestionsGrid();
        });
    });
}

// Initialize the quiz
loadQuestions();
