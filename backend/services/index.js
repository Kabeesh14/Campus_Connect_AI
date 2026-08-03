/**
 * CampusConnect AI Backend Services Register
 */

const { extractTextFromBuffer, parseResumeSections } = require('../utils/pdfParser');

module.exports = {
  resumeService: {
    extractTextFromBuffer,
    parseResumeSections,
  },
};
