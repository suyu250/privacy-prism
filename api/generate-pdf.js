// Vercel Serverless Function for PDF generation
// Note: Using a lightweight approach instead of Puppeteer (which is too large for Vercel)

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, results, timestamp } = req.body;

    // Validate input
    if (!content || !results) {
      return res.status(400).json({ 
        error: 'Missing required fields: content and results' 
      });
    }

    console.log('[Vercel] Generating PDF report...');

    // For now, return a JSON response indicating PDF generation is not available on Vercel
    // In the future, this could be replaced with a lightweight PDF library like pdfkit
    res.status(501).json({
      error: 'PDF generation is not available in the deployed version due to Vercel limitations. Please use the browser\'s print function (Ctrl+P or Cmd+P) to save the results as PDF.',
      suggestion: 'Use browser Print to PDF feature',
      workaround: {
        step1: 'Press Ctrl+P (Windows) or Cmd+P (Mac)',
        step2: 'Select "Save as PDF" as the printer',
        step3: 'Click "Save" to download the PDF'
      }
    });

  } catch (error) {
    console.error('[Vercel] PDF generation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate PDF' 
    });
  }
};

