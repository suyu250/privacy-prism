const puppeteer = require('puppeteer');
const config = require('../config/config');

/**
 * Generate a styled PDF report from analysis results
 * @param {object} analysisData - The analysis results
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generatePDF(analysisData) {
  let browser = null;

  try {
    const { content, results, timestamp } = analysisData;

    // Create HTML template for the PDF
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Prism Analysis Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #2c3e50;
      padding: 40px;
      background: #ffffff;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #667eea;
    }

    .header h1 {
      font-size: 36px;
      color: #667eea;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .header .subtitle {
      font-size: 16px;
      color: #7f8c8d;
      margin-bottom: 5px;
    }

    .header .timestamp {
      font-size: 14px;
      color: #95a5a6;
    }

    .content-section {
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .content-section h2 {
      font-size: 18px;
      color: #34495e;
      margin-bottom: 10px;
    }

    .content-section .content-text {
      font-size: 14px;
      color: #555;
      max-height: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dimension {
      margin-bottom: 35px;
      page-break-inside: avoid;
    }

    .dimension-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
    }

    .dimension-number {
      font-size: 24px;
      font-weight: bold;
      margin-right: 15px;
      min-width: 40px;
    }

    .dimension-title {
      font-size: 20px;
      font-weight: 600;
    }

    .dimension-content {
      padding: 20px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e1e8ed;
      font-size: 14px;
      line-height: 1.8;
      color: #34495e;
    }

    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #ecf0f1;
      text-align: center;
      font-size: 12px;
      color: #95a5a6;
    }

    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 Privacy Prism</h1>
    <div class="subtitle">Privacy Risk Analysis Report</div>
    <div class="timestamp">Generated on ${timestamp}</div>
  </div>

  <div class="content-section">
    <h2>Analyzed Content</h2>
    <div class="content-text">
      ${escapeHtml(content.substring(0, 500))}${content.length > 500 ? '...' : ''}
    </div>
  </div>

  <div class="dimension">
    <div class="dimension-header">
      <div class="dimension-number">1</div>
      <div class="dimension-title">Exposure</div>
    </div>
    <div class="dimension-content">
      ${escapeHtml(results.exposure || 'No analysis available')}
    </div>
  </div>

  <div class="dimension">
    <div class="dimension-header">
      <div class="dimension-number">2</div>
      <div class="dimension-title">Inference</div>
    </div>
    <div class="dimension-content">
      ${escapeHtml(results.inference || 'No analysis available')}
    </div>
  </div>

  <div class="dimension page-break">
    <div class="dimension-header">
      <div class="dimension-number">3</div>
      <div class="dimension-title">Audience & Consequences</div>
    </div>
    <div class="dimension-content">
      ${escapeHtml(results.audience || 'No analysis available')}
    </div>
  </div>

  <div class="dimension">
    <div class="dimension-header">
      <div class="dimension-number">4</div>
      <div class="dimension-title">Platforms & Rules</div>
    </div>
    <div class="dimension-content">
      ${escapeHtml(results.platforms || 'No analysis available')}
    </div>
  </div>

  <div class="dimension">
    <div class="dimension-header">
      <div class="dimension-number">5</div>
      <div class="dimension-title">Amplification</div>
    </div>
    <div class="dimension-content">
      ${escapeHtml(results.amplification || 'No analysis available')}
    </div>
  </div>

  <div class="dimension">
    <div class="dimension-header">
      <div class="dimension-number">6</div>
      <div class="dimension-title">Manipulability</div>
    </div>
    <div class="dimension-content">
      ${escapeHtml(results.manipulability || 'No analysis available')}
    </div>
  </div>

  <div class="footer">
    <p>This report was generated by Privacy Prism - An AI-powered privacy risk analysis tool</p>
    <p>© ${new Date().getFullYear()} Privacy Prism. All rights reserved.</p>
  </div>
</body>
</html>
    `;

    // Launch browser and generate PDF
    browser = await puppeteer.launch(config.puppeteerOptions);
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();
    
    return pdfBuffer;

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

/**
 * Helper function to escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

module.exports = {
  generatePDF
};

