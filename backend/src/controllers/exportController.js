const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const exportDocument = async (req, res) => {
  try {
    const { questions, format } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Questions array is required.' });
    }
    
    if (!format || !['docx', 'pdf'].includes(format.toLowerCase())) {
      return res.status(400).json({ error: 'Format must be either "docx" or "pdf".' });
    }

    const exportFormat = format.toLowerCase();
    
    // Create temporary files for input JSON and output document
    const tempDir = os.tmpdir();
    const sessionId = crypto.randomBytes(8).toString('hex');
    const inputJsonPath = path.join(tempDir, `export_input_${sessionId}.json`);
    const outputDocPath = path.join(tempDir, `QuestionBank_${sessionId}.${exportFormat}`);

    // Write questions to the temporary JSON file
    fs.writeFileSync(inputJsonPath, JSON.stringify({ questions }, null, 2), 'utf-8');

    // Determine the path to the python script
    const pythonScriptPath = path.join(__dirname, '../services/export_service.py');

    // Spawn the Python process
    // Use 'python' or 'python3' depending on the environment, we'll try 'python' first
    const pythonProcess = spawn('python', [pythonScriptPath, exportFormat, inputJsonPath, outputDocPath]);

    let pythonErrorMsg = '';

    pythonProcess.stderr.on('data', (data) => {
      pythonErrorMsg += data.toString();
    });

    pythonProcess.on('close', (code) => {
      // Clean up input JSON
      if (fs.existsSync(inputJsonPath)) {
        fs.unlinkSync(inputJsonPath);
      }

      if (code !== 0) {
        console.error(`Python export script failed with code ${code}. Error: ${pythonErrorMsg}`);
        return res.status(500).json({ error: 'Failed to generate document.', details: pythonErrorMsg });
      }

      // Check if output file exists
      if (!fs.existsSync(outputDocPath)) {
        return res.status(500).json({ error: 'Generated document not found.' });
      }

      // Set headers and send the file
      const statsModel = require('../models/statsModel');
      statsModel.incrementExports();

      const contentType = exportFormat === 'pdf' 
        ? 'application/pdf' 
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=QuestionBank.${exportFormat}`);
      
      const fileStream = fs.createReadStream(outputDocPath);
      fileStream.pipe(res);

      // Clean up output document after streaming
      fileStream.on('end', () => {
        if (fs.existsSync(outputDocPath)) {
          fs.unlinkSync(outputDocPath);
        }
      });

      fileStream.on('error', (err) => {
        console.error('Error streaming file to client:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file.' });
        }
        if (fs.existsSync(outputDocPath)) {
          fs.unlinkSync(outputDocPath);
        }
      });
    });

  } catch (error) {
    console.error('Error in export controller:', error);
    res.status(500).json({ error: 'Internal server error during export.', details: error.message });
  }
};

module.exports = {
  exportDocument
};
