const crypto = require('crypto');
const { query } = require('../config/db');
const { extractTextFromBuffer, parseResumeSections } = require('../utils/pdfParser');
const { callGemini } = require('../services/geminiClient');

/**
 * Build personalized student profile prompt context using ONLY real database values.
 * NEVER injects hardcoded fallback values or fabricated profile data.
 */
async function getStudentProfileContext(userId) {
  if (!userId) return '';

  try {
    const students = await query('SELECT * FROM students WHERE user_id = ?', [userId]);
    if (!students || students.length === 0) return '';

    const s = students[0];
    const studentId = s.id;

    const skills = await query('SELECT name, level, category FROM skills WHERE student_id = ?', [studentId]);
    const projects = await query('SELECT name, `desc`, stack, link FROM projects WHERE student_id = ?', [studentId]);
    const certs = await query('SELECT name, issuer, year FROM certifications WHERE student_id = ?', [studentId]);
    const resumes = await query('SELECT parsed_content FROM resumes WHERE student_id = ? ORDER BY uploaded_at DESC LIMIT 1', [studentId]);

    const lines = ['LOGGED-IN STUDENT PROFILE:'];
    if (s.name) lines.push(`- Name: ${s.name}`);
    if (s.department) lines.push(`- Department: ${s.department}`);
    if (s.graduation_year) lines.push(`- Graduation Year: ${s.graduation_year}`);
    if (s.cgpa) lines.push(`- CGPA: ${s.cgpa}`);
    if (s.headline) lines.push(`- Headline: ${s.headline}`);
    if (s.bio) lines.push(`- Bio: ${s.bio}`);

    if (skills.length > 0) {
      lines.push(`- Technical Skills: ${skills.map((sk) => `${sk.name}${sk.level ? ` (${sk.level}%)` : ''}`).join(', ')}`);
    }
    if (projects.length > 0) {
      lines.push(`- Projects: ${projects.map((p) => `${p.name}${p.desc ? `: ${p.desc}` : ''}`).join('; ')}`);
    }
    if (certs.length > 0) {
      lines.push(`- Certifications: ${certs.map((c) => `${c.name}${c.issuer ? ` (${c.issuer})` : ''}`).join(', ')}`);
    }
    if (resumes[0]?.parsed_content) {
      lines.push(`- Resume Summary: ${resumes[0].parsed_content.slice(0, 800)}`);
    }

    return lines.length > 1 ? lines.join('\n') : '';
  } catch (error) {
    console.error('Error fetching student context:', error.message);
    return '';
  }
}

/**
 * 1. AI CAREER ADVISOR & CHAT: POST /api/ai/chat
 */
const chatWithAi = async (req, res, next) => {
  try {
    const { message, toolType = 'career-advisor', systemInstruction = '' } = req.body;
    const userId = req.user?.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const studentContext = await getStudentProfileContext(userId);

    let historyContext = '';
    if (userId) {
      const pastChats = await query(
        'SELECT question, response FROM ai_chats WHERE user_id = ? AND tool_type = ? ORDER BY created_at DESC LIMIT 5',
        [userId, toolType]
      );
      if (pastChats.length > 0) {
        historyContext = 'PREVIOUS CONVERSATION CONTEXT:\n' +
          pastChats.reverse().map((c) => `User: ${c.question}\nAI: ${c.response.slice(0, 200)}...`).join('\n\n');
      }
    }

    const fullSystemPrompt = `You are Campus Connect AI's Senior Career Advisor & Technical Mentor. Provide insightful, realistic, and highly practical career and placement advice.

${studentContext}

${historyContext}

${systemInstruction}`;

    const reply = await callGemini(message, fullSystemPrompt);

    if (userId && reply) {
      try {
        const chatId = 'chat-' + crypto.randomUUID();
        await query(
          'INSERT INTO ai_chats (id, user_id, tool_type, question, response) VALUES (?, ?, ?, ?, ?)',
          [chatId, userId, toolType, message, reply]
        );
      } catch (dbErr) {
        console.error('Failed to save AI chat history:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      source: 'google-gemini-2.0-flash',
      reply,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * 2. AI SKILL GAP ANALYSIS: POST /api/ai/skill-gap
 */
const analyzeSkillGap = async (req, res, next) => {
  try {
    const { targetRole = 'Full Stack Developer', company = 'Tier-1 Tech Company' } = req.body;
    const userId = req.user?.id;

    const studentContext = await getStudentProfileContext(userId);

    const prompt = `Perform a thorough, personalized Skill Gap Analysis for a student targeting the role "${targetRole}" at "${company}".

${studentContext}

Evaluate the student's current skills and profile against real-world expectations for this role.
Respond in clear, professional Markdown format detailing:
- Core Existing Strengths
- Critical Missing Technical & Domain Skills
- Step-by-Step Learning Roadmap (Weekly milestones)
- Recommended High-Impact Projects to Build
- Relevant Certifications
- Interview Preparation Advice`;

    const reply = await callGemini(prompt, 'You are an elite Placement Director and Senior Engineering Manager.');

    if (userId && reply) {
      try {
        const chatId = 'chat-' + crypto.randomUUID();
        await query(
          'INSERT INTO ai_chats (id, user_id, tool_type, question, response) VALUES (?, ?, ?, ?, ?)',
          [chatId, userId, 'skill-gap', `Skill Gap Analysis for ${targetRole} at ${company}`, reply]
        );
      } catch (dbErr) {
        console.error('Failed to save AI skill-gap chat history:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      source: 'google-gemini-2.0-flash',
      analysisText: reply,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * 3. AI RESUME ANALYZER: POST /api/ai/resume/analyze
 */
const analyzeResume = async (req, res, next) => {
  try {
    let resumeText = req.body.resumeText || '';
    let fileName = req.body.fileName || 'Uploaded_Resume.pdf';
    const targetRole = req.body.targetRole || 'Full Stack Developer';
    const userId = req.user?.id;

    if (req.file) {
      fileName = req.file.originalname;
      const extractedText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
      if (extractedText && extractedText.trim().length > 10) {
        resumeText = extractedText;
      }
    }

    // STRICT VALIDATION: If no readable resume text found, reject with HTTP 400
    if (!resumeText || !resumeText.trim() || resumeText.trim().length < 15) {
      return res.status(400).json({
        success: false,
        message: 'No readable resume content found. Please upload a valid PDF or DOCX file with text content.',
      });
    }

    const extractedInfo = parseResumeSections(resumeText);

    if (userId) {
      try {
        const students = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (students.length > 0) {
          await query('UPDATE resumes SET parsed_content = ? WHERE student_id = ?', [resumeText, students[0].id]);
        }
      } catch (err) {
        // Ignored
      }
    }

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) parser and Senior Technical Recruiter.
Analyze the candidate's resume text against the target job role "${targetRole}".
Respond ONLY with a raw, valid JSON object without any markdown formatting or code backticks.
The JSON object MUST contain the following exact keys:
{
  "atsScore": (integer between 0 and 100 based on keyword match, relevance, and formatting),
  "resumeScore": (integer between 0 and 100),
  "grammarScore": (integer between 0 and 100),
  "industryMatch": (integer between 0 and 100),
  "missingSkills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "resumeSummary": "concise summary of the resume evaluation",
  "improvementTips": ["actionable tip 1", "actionable tip 2"],
  "keywordAnalysis": {
    "presentKeywords": ["KEYWORD1", "KEYWORD2"],
    "missingKeywords": ["KEYWORD3", "KEYWORD4"]
  },
  "atsCompatibility": "High / Medium / Low status description",
  "formattingFeedback": ["feedback 1", "feedback 2"],
  "actionVerbs": ["VERB1", "VERB2"],
  "recommendedProjects": ["project idea 1", "project idea 2"],
  "recommendedCertifications": ["cert 1", "cert 2"]
}`;

    let rawReply = await callGemini(resumeText, systemPrompt);

    let parsedAnalysis = null;
    const cleanAndParseJson = (str) => {
      if (!str) return null;
      let cleaned = str.replace(/```json|```/gi, '').trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
      return JSON.parse(cleaned);
    };

    try {
      parsedAnalysis = cleanAndParseJson(rawReply);
    } catch (parseErr1) {
      console.warn('Initial Gemini ATS JSON parse failed, retrying with explicit JSON instruction...', parseErr1.message);
      try {
        const retryPrompt = `Fix and convert the following text into a single valid raw JSON object strictly matching the required ATS keys:\n\n${rawReply}`;
        const retryReply = await callGemini(retryPrompt, 'Respond ONLY with a valid raw JSON object starting with { and ending with }. Do not add markdown code fences.');
        parsedAnalysis = cleanAndParseJson(retryReply);
      } catch (parseErr2) {
        console.error('Gemini ATS JSON retry parse failed:', parseErr2.message);
        return res.status(502).json({
          success: false,
          message: 'Gemini AI failed to return valid structured ATS analysis JSON. Please try again.',
        });
      }
    }

    return res.status(200).json({
      success: true,
      source: 'google-gemini-2.0-flash-ats',
      fileName,
      targetRole,
      extractedInfo,
      analysis: parsedAnalysis,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * 4. PDF / DOCX PARSE & EXTRACT: POST /api/ai/resume/parse
 */
const parseResumeFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please attach a PDF or DOCX file.' });
    }

    const extractedText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'No readable resume content found.' });
    }

    const extractedInfo = parseResumeSections(extractedText);

    return res.status(200).json({
      success: true,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      extractedText,
      extractedInfo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. CHAT HISTORY: GET /api/ai/history/:toolType
 */
const getChatHistory = async (req, res, next) => {
  try {
    const { toolType = 'career-advisor' } = req.params;
    const userId = req.user.id;

    const chats = await query(
      'SELECT id, question, response, created_at FROM ai_chats WHERE user_id = ? AND tool_type = ? ORDER BY created_at ASC',
      [userId, toolType]
    );

    return res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE SINGLE CHAT RECORD: DELETE /api/ai/history/item/:id
 */
const deleteChatItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await query('DELETE FROM ai_chats WHERE id = ? AND user_id = ?', [id, userId]);

    return res.status(200).json({ success: true, message: 'Chat item deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * CLEAR ENTIRE CHAT HISTORY: DELETE /api/ai/history/clear/:toolType
 */
const clearChatHistory = async (req, res, next) => {
  try {
    const { toolType = 'career-advisor' } = req.params;
    const userId = req.user.id;

    await query('DELETE FROM ai_chats WHERE user_id = ? AND tool_type = ?', [userId, toolType]);

    return res.status(200).json({ success: true, message: 'Chat history cleared.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Career Roadmap
 */
const getCareerRoadmap = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const studentContext = await getStudentProfileContext(userId);

    const prompt = `Based on the candidate profile context below, generate a comprehensive, personalized career roadmap:\n${studentContext}`;
    const roadmapText = await callGemini(prompt, 'You are an elite Placement Advisor and Tech Recruiter.');

    return res.status(200).json({
      success: true,
      roadmapText,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = {
  chatCareerAdvisor: chatWithAi,
  chatWithAi,
  analyzeSkillGap,
  analyzeResume,
  parseResumeFile,
  getChatHistory,
  deleteChatItem,
  clearChatHistory,
  getCareerRoadmap,
};
