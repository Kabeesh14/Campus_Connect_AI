const pdfModule = require('pdf-parse');
const mammoth = require('mammoth');

const parsePdfBuffer = typeof pdfModule === 'function' ? pdfModule : (pdfModule.default || pdfModule);

/**
 * Extract plain text from PDF, DOCX, or TXT buffer
 * Throws structured error if text cannot be extracted or file is unreadable.
 * NEVER returns fabricated resume text or fake skills.
 */
async function extractTextFromBuffer(buffer, mimeType = '', originalName = '') {
  let extractedText = '';
  const nameLower = originalName.toLowerCase();

  const isDocx =
    mimeType.includes('officedocument.wordprocessingml') ||
    mimeType.includes('msword') ||
    nameLower.endsWith('.docx') ||
    nameLower.endsWith('.doc');

  const isImage =
    mimeType.startsWith('image/') ||
    nameLower.endsWith('.jpg') ||
    nameLower.endsWith('.jpeg') ||
    nameLower.endsWith('.png');

  const isTxt = mimeType.includes('text/plain') || nameLower.endsWith('.txt');

  if (isImage) {
    const error = new Error('Unable to extract text from uploaded image resume. OCR is unavailable for image formats.');
    error.statusCode = 400;
    error.reason = 'unreadable_image';
    throw error;
  }

  try {
    if (isDocx) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || '';
    } else if (isTxt) {
      extractedText = buffer.toString('utf-8');
    } else {
      if (typeof parsePdfBuffer === 'function') {
        const pdfData = await parsePdfBuffer(buffer);
        extractedText = pdfData.text || '';
      } else {
        const error = new Error('PDF parsing engine unavailable.');
        error.statusCode = 500;
        throw error;
      }
    }
  } catch (error) {
    if (error.statusCode) throw error;
    console.error('File parsing error:', error.message);
    const parseErr = new Error('Unable to parse document. The file may be encrypted, corrupted, or formatted incorrectly.');
    parseErr.statusCode = 400;
    parseErr.reason = 'unreadable_document';
    throw parseErr;
  }

  const cleanText = extractedText.trim();
  if (!cleanText || cleanText.length < 10) {
    const emptyErr = new Error('No readable text content found in the uploaded file.');
    emptyErr.statusCode = 400;
    emptyErr.reason = 'empty_document';
    throw emptyErr;
  }

  return cleanText;
}

/**
 * Parse structured sections from extracted resume text
 * NEVER fabricates default education, experience, or certifications.
 */
function parseResumeSections(text = '') {
  if (!text || typeof text !== 'string') {
    return {
      name: '',
      email: '',
      phone: '',
      education: '',
      skills: [],
      projects: '',
      experience: '',
      certifications: '',
      technologies: [],
      rawText: '',
    };
  }

  const cleanText = text.replace(/\r\n/g, '\n');

  // Extract Email
  const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  // Extract Phone
  const phoneMatch = cleanText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  // Extract Name
  const lines = cleanText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  let name = lines.length > 0 ? lines[0] : '';
  if (name.includes('@') || name.length > 40) {
    name = lines[1] && !lines[1].includes('@') ? lines[1] : '';
  }

  // Tech keywords scanner
  const techKeywords = [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express',
    'Python', 'Java', 'C++', 'C#', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB',
    'Redis', 'HTML', 'CSS', 'Tailwind', 'Git', 'Docker', 'Kubernetes',
    'AWS', 'GCP', 'Azure', 'REST API', 'GraphQL', 'Machine Learning',
    'Data Analytics', 'Power BI', 'Pandas', 'NumPy', 'Scikit-Learn',
    'TensorFlow', 'PyTorch', 'System Design', 'Data Structures', 'Algorithms',
  ];

  const lowerText = cleanText.toLowerCase();
  const detectedSkills = techKeywords.filter((tech) =>
    lowerText.includes(tech.toLowerCase())
  );

  const extractSection = (headingRegex) => {
    const sectionLines = [];
    let capturing = false;
    for (const line of lines) {
      if (headingRegex.test(line)) {
        capturing = true;
        continue;
      }
      if (capturing) {
        if (/^(education|skills|experience|projects|certifications|awards|summary|objective)/i.test(line) && !headingRegex.test(line)) {
          break;
        }
        sectionLines.push(line);
      }
    }
    return sectionLines.join(' ').trim();
  };

  const education = extractSection(/education|academic|qualification/i);
  const experience = extractSection(/experience|employment|work history|internship/i);
  const projectsSection = extractSection(/projects|key projects|personal projects/i);
  const certificationsSection = extractSection(/certifications|certificates|courses/i);

  return {
    name,
    email,
    phone,
    education: education ? education.slice(0, 500) : '',
    skills: detectedSkills,
    projects: projectsSection ? projectsSection.slice(0, 500) : '',
    experience: experience ? experience.slice(0, 500) : '',
    certifications: certificationsSection ? certificationsSection.slice(0, 300) : '',
    technologies: detectedSkills.slice(0, 15),
    rawText: cleanText,
  };
}

module.exports = {
  extractTextFromBuffer,
  parseResumeSections,
};
