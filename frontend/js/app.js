// ========================================
// Privacy Prism - Frontend Application
// ========================================

// State management
const state = {
  currentInput: '',
  currentType: 'text',
  analysisResults: {
    exposure: '',
    inference: '',
    audience: '',
    platforms: '',
    amplification: '',
    manipulability: ''
  },
  isAnalyzing: false,
  eventSource: null
};

// DOM Elements
const elements = {
  textInput: document.getElementById('textInput'),
  urlInput: document.getElementById('urlInput'),
  textArea: document.getElementById('textArea'),
  urlField: document.getElementById('urlField'),
  analyzeBtn: document.getElementById('analyzeBtn'),
  extractedContentSection: document.getElementById('extractedContentSection'),
  contentPreview: document.getElementById('contentPreview'),
  contentLength: document.getElementById('contentLength'),
  resultsSection: document.getElementById('resultsSection'),
  downloadBtn: document.getElementById('downloadBtn'),
  inputTypeRadios: document.querySelectorAll('input[name="inputType"]'),
  dimensionCards: {
    exposure: document.getElementById('dimension-exposure'),
    inference: document.getElementById('dimension-inference'),
    audience: document.getElementById('dimension-audience'),
    platforms: document.getElementById('dimension-platforms'),
    amplification: document.getElementById('dimension-amplification'),
    manipulability: document.getElementById('dimension-manipulability')
  }
};

// ========================================
// Event Listeners
// ========================================

// Input type toggle
elements.inputTypeRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    state.currentType = e.target.value;
    toggleInputType(e.target.value);
  });
});

// Analyze button
elements.analyzeBtn.addEventListener('click', handleAnalyze);

// Download button
elements.downloadBtn.addEventListener('click', handleDownload);

// ========================================
// Functions
// ========================================

/**
 * Toggle between text and URL input
 */
function toggleInputType(type) {
  if (type === 'text') {
    elements.textInput.classList.remove('hidden');
    elements.urlInput.classList.add('hidden');
  } else {
    elements.textInput.classList.add('hidden');
    elements.urlInput.classList.remove('hidden');
  }
}

/**
 * Handle analyze button click
 */
async function handleAnalyze() {
  // Get input based on type
  const input = state.currentType === 'text' 
    ? elements.textArea.value.trim() 
    : elements.urlField.value.trim();

  // Validate input
  if (!input) {
    showError('Please provide input content or URL');
    return;
  }

  if (state.currentType === 'url' && !isValidURL(input)) {
    showError('Please enter a valid URL (must start with http:// or https://)');
    return;
  }

  if (state.currentType === 'text' && input.length < 10) {
    showError('Text content is too short. Please provide at least 10 characters.');
    return;
  }

  // Start analysis
  state.currentInput = input;
  startAnalysis(input, state.currentType);
}

/**
 * Validate URL format
 */
function isValidURL(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * Show error message
 */
function showError(message) {
  // Remove existing error messages
  const existingError = document.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }

  // Create error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;

  // Insert before analyze button
  elements.analyzeBtn.parentNode.insertBefore(errorDiv, elements.analyzeBtn);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

/**
 * Start analysis process
 */
async function startAnalysis(input, type) {
  // Disable analyze button
  elements.analyzeBtn.disabled = true;
  elements.analyzeBtn.innerHTML = `
    <svg class="btn-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round"/>
    </svg>
    <span>ANALYZING...</span>
  `;
  state.isAnalyzing = true;

  // Show results section
  elements.resultsSection.classList.remove('hidden');
  elements.downloadBtn.classList.add('hidden');

  // Reset all dimension cards
  resetDimensionCards();

  // Scroll to results
  elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    // Send analysis request
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input, type })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }

    // Handle streaming response
    handleStreamingResponse(response);

  } catch (error) {
    console.error('Analysis error:', error);
    showError(error.message || 'Failed to analyze content. Please try again.');
    resetAnalyzeButton();
  }
}

/**
 * Reset dimension cards to initial state
 */
function resetDimensionCards() {
  Object.keys(elements.dimensionCards).forEach(key => {
    const card = elements.dimensionCards[key];
    const content = card.querySelector('.dimension-content');
    const spinner = card.querySelector('.loading-spinner');
    
    content.innerHTML = '<p class="placeholder-text">Waiting for analysis...</p>';
    content.classList.add('streaming');
    spinner.classList.remove('hidden');
    
    state.analysisResults[key] = '';
  });
}

/**
 * Handle streaming response from server
 */
async function handleStreamingResponse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentMode = null;
  let fullResponse = '';
  let extractedContent = ''; // Store extracted content for URL mode

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6);
          
          try {
            const data = JSON.parse(dataStr);
            
            if (data.type === 'error') {
              throw new Error(data.error);
            } else if (data.type === 'extracted_content') {
              // NEW: Display extracted content from URL
              extractedContent = data.content;
              displayExtractedContent(extractedContent);
            } else if (data.type === 'content') {
              // Mode A: Single combined response
              fullResponse += data.content;
              parseAndDisplayModeA(fullResponse);
            } else if (data.type === 'dimension_start') {
              // Mode B: Individual dimension start
              currentMode = data.dimension;
            } else if (data.type === 'dimension_content') {
              // Mode B: Individual dimension content
              updateDimensionContent(data.dimension, data.content, true);
            } else if (data.type === 'dimension_done') {
              // Mode B: Individual dimension complete
              markDimensionComplete(data.dimension);
            } else if (data.type === 'done') {
              // Analysis complete
              handleAnalysisComplete();
            }
          } catch (parseError) {
            console.error('Parse error:', parseError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Streaming error:', error);
    showError(error.message || 'Failed to receive analysis results');
    resetAnalyzeButton();
  }
}

/**
 * Display extracted content (for URL mode)
 */
function displayExtractedContent(content) {
  if (!content || state.currentType !== 'url') return;
  
  // Show extracted content section
  elements.extractedContentSection.classList.remove('hidden');
  
  // Update content length
  elements.contentLength.textContent = `${content.length} characters`;
  
  // Update preview text
  const previewElement = elements.contentPreview.querySelector('.preview-text');
  if (previewElement) {
    previewElement.textContent = content;
  }
  
  // Scroll to extracted content section
  setTimeout(() => {
    elements.extractedContentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

/**
 * Parse and display Mode A response (JSON format)
 */
function parseAndDisplayModeA(fullResponse) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Update each dimension
      Object.keys(parsed).forEach(key => {
        if (state.analysisResults.hasOwnProperty(key)) {
          updateDimensionContent(key, parsed[key], false);
          markDimensionComplete(key);
        }
      });
    }
  } catch (e) {
    // If parsing fails, wait for more data
    console.log('Waiting for complete JSON...');
  }
}

/**
 * Update dimension content
 */
function updateDimensionContent(dimension, content, append = false) {
  const card = elements.dimensionCards[dimension];
  if (!card) return;

  const contentDiv = card.querySelector('.dimension-content');
  
  if (append) {
    state.analysisResults[dimension] += content;
  } else {
    state.analysisResults[dimension] = content;
  }

  contentDiv.textContent = state.analysisResults[dimension];
  contentDiv.classList.add('streaming');
}

/**
 * Mark dimension as complete
 */
function markDimensionComplete(dimension) {
  const card = elements.dimensionCards[dimension];
  if (!card) return;

  const spinner = card.querySelector('.loading-spinner');
  const contentDiv = card.querySelector('.dimension-content');
  
  spinner.classList.add('hidden');
  contentDiv.classList.remove('streaming');
}

/**
 * Handle analysis completion
 */
function handleAnalysisComplete() {
  // Mark all dimensions as complete
  Object.keys(elements.dimensionCards).forEach(key => {
    markDimensionComplete(key);
  });

  // Enable download button
  elements.downloadBtn.classList.remove('hidden');

  // Reset analyze button
  resetAnalyzeButton();

  console.log('Analysis complete!');
}

/**
 * Reset analyze button to initial state
 */
function resetAnalyzeButton() {
  elements.analyzeBtn.disabled = false;
  elements.analyzeBtn.innerHTML = `
    <svg class="btn-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <polygon points="5,3 19,12 5,21" fill="currentColor"/>
    </svg>
    <span>INITIATE ANALYSIS</span>
    <svg class="btn-arrow" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12 L19 12 M13 6 L19 12 L13 18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  state.isAnalyzing = false;
}

/**
 * Handle PDF download
 */
async function handleDownload() {
  elements.downloadBtn.disabled = true;
  elements.downloadBtn.innerHTML = `
    <svg class="btn-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round"/>
    </svg>
    <span>GENERATING...</span>
  `;

  try {
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: state.currentInput,
        results: state.analysisResults,
        timestamp: timestamp
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    // Download the PDF
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacy-analysis-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    // Show success message
    showSuccess('PDF report downloaded successfully!');

  } catch (error) {
    console.error('PDF generation error:', error);
    showError('Failed to generate PDF. Please try again.');
  } finally {
    elements.downloadBtn.disabled = false;
    elements.downloadBtn.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3 L12 15 M8 11 L12 15 L16 11" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 17 L3 19 C3 20.1 3.9 21 5 21 L19 21 C20.1 21 21 20.1 21 19 L21 17" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
      <span>EXPORT PDF</span>
    `;
  }
}

/**
 * Show success message
 */
function showSuccess(message) {
  // Remove existing messages
  const existingMsg = document.querySelector('.success-message, .error-message');
  if (existingMsg) {
    existingMsg.remove();
  }

  // Create success message
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;

  // Insert at top of results section
  elements.resultsSection.insertBefore(successDiv, elements.resultsSection.firstChild);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

// ========================================
// Initialize
// ========================================

console.log('Privacy Prism initialized');
console.log('Ready for privacy analysis');

