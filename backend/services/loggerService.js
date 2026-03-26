const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

// Ensure log directory exists locally so we can track it
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function getLogTimestamp() {
  return new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) + ' IST';
}

function formatError(error) {
  if (error instanceof Error) {
    return `${error.message}\nStack: ${error.stack}`;
  }
  return typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error);
}

class LoggerService {
  /**
   * Logs a standard informational message
   */
  info(context, message) {
    const logLine = `[INFO] [${getLogTimestamp()}] [${context}] ${message}\n`;
    console.log(`\x1b[36m[INFO]\x1b[0m [${context}] ${message}`);
    this._appendToFile('app.log', logLine);
  }

  /**
   * Logs a warning (e.g. quota limits nearing, minor retryable failure)
   */
  warn(context, message, data = null) {
    let logLine = `[WARN] [${getLogTimestamp()}] [${context}] ${message}`;
    if (data) logLine += ` | Data: ${JSON.stringify(data)}`;
    logLine += '\n';
    
    console.warn(`\x1b[33m[WARN]\x1b[0m [${context}] ${message}`);
    this._appendToFile('app.log', logLine);
  }

  /**
   * Logs a critical error or exception
   */
  error(context, message, err = null) {
    let logLine = `[ERROR] [${getLogTimestamp()}] [${context}] ${message}\n`;
    let consoleMsg = `\x1b[31m[ERROR]\x1b[0m [${context}] ${message}`;
    
    if (err) {
      const formattedErr = formatError(err);
      logLine += `Details: ${formattedErr}\n`;
      consoleMsg += `\n  -> ${err.message}`;
    }
    logLine += '--------------------------------------------------\n';

    console.error(consoleMsg);
    // Write errors to both the main app.log and a dedicated error.log
    this._appendToFile('app.log', logLine);
    this._appendToFile('error.log', logLine);
  }

  _appendToFile(filename, content) {
    try {
      const filePath = path.join(logDir, filename);
      fs.appendFileSync(filePath, content, 'utf8');
    } catch (fsErr) {
      console.error(`[LoggerService] Failed to write to log file: ${fsErr.message}`);
    }
  }
}

const logger = new LoggerService();
module.exports = logger;
