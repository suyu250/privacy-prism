const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const { extractTextFromURL } = require('./services/scraper');
const { analyzeContent } = require('./services/analyzer');
const { generatePDF } = require('./services/pdfGenerator');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    model: config.model,
    mode: config.analysisMode 
  });
});

// Main analysis endpoint with SSE streaming
app.post('/api/analyze', async (req, res) => {
  try {
    const { input, type } = req.body;

    // Validate input
    if (!input || !type) {
      return res.status(400).json({ 
        error: 'Missing required fields: input and type' 
      });
    }

    if (!['text', 'url'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be "text" or "url"' 
      });
    }

    let contentToAnalyze = input;

    // Set up SSE headers first (before any response is sent)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // If type is URL, scrape the content first
    if (type === 'url') {
      console.log(`Scraping URL: ${input}`);
      
      try {
        contentToAnalyze = await extractTextFromURL(input);
        console.log(`Successfully scraped ${contentToAnalyze.length} characters`);
        
        // Send extracted content to frontend for preview
        res.write(`data: ${JSON.stringify({
          type: 'extracted_content',
          content: contentToAnalyze
        })}\n\n`);
        
      } catch (scrapeError) {
        console.error('Scraping error:', scrapeError);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: scrapeError.message
        })}\n\n`);
        res.end();
        return;
      }
    }

    // Validate content length
    if (contentToAnalyze.length < 10) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: 'Content too short. Please provide at least 10 characters.'
      })}\n\n`);
      res.end();
      return;
    }

    if (contentToAnalyze.length > 50000) {
      contentToAnalyze = contentToAnalyze.substring(0, 50000);
      console.log('Content truncated to 50000 characters');
    }

    console.log(`Starting analysis (Mode ${config.analysisMode}) with model ${config.model}`);
    
    // Stream analysis results (res headers already set)
    await analyzeContent(contentToAnalyze, res, true);

  } catch (error) {
    console.error('Analysis error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error.message || 'Internal server error' 
      });
    }
  }
});

// PDF generation endpoint
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { content, results, timestamp } = req.body;

    // Validate input
    if (!content || !results) {
      return res.status(400).json({ 
        error: 'Missing required fields: content and results' 
      });
    }

    console.log('Generating PDF report...');

    const analysisData = {
      content,
      results,
      timestamp: timestamp || new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const pdfBuffer = await generatePDF(analysisData);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=privacy-analysis-${Date.now()}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
    console.log('PDF generated successfully');

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate PDF' 
    });
  }
});

// Serve frontend homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error' 
  });
});

// Start server
app.listen(config.port, () => {
  console.log('=================================');
  console.log('🔍 Privacy Prism Server Started');
  console.log('=================================');
  console.log(`Server running on: http://localhost:${config.port}`);
  console.log(`Model: ${config.model}`);
  console.log(`Analysis Mode: ${config.analysisMode === 'A' ? 'Single Call' : 'Multiple Calls'}`);
  console.log('=================================');
});

module.exports = app;

