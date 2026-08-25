const https = require('https');

// In-memory cache for Adzuna API responses (15 minutes TTL)
const cacheMap = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;
const globalJobStore = new Map();

/**
 * Infer domain from company name for Clearbit logo API
 */
function getCompanyDomain(companyName) {
  if (!companyName || typeof companyName !== 'string') return 'company.com';
  const clean = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const knownDomains = {
    google: 'google.com',
    microsoft: 'microsoft.com',
    amazon: 'amazon.com',
    apple: 'apple.com',
    meta: 'meta.com',
    facebook: 'facebook.com',
    netflix: 'netflix.com',
    ibm: 'ibm.com',
    oracle: 'oracle.com',
    salesforce: 'salesforce.com',
    tata: 'tcs.com',
    tcs: 'tcs.com',
    infosys: 'infosys.com',
    wipro: 'wipro.com',
    accenture: 'accenture.com',
    cognizant: 'cognizant.com',
    capgemini: 'capgemini.com',
    zoho: 'zoho.com',
    flipkart: 'flipkart.com',
    swiggy: 'swiggy.com',
    zomato: 'zomato.com',
    paytm: 'paytm.com',
    uber: 'uber.com',
    stripe: 'stripe.com',
    atlassian: 'atlassian.com',
  };

  if (knownDomains[clean]) return knownDomains[clean];
  return `${clean || 'company'}.com`;
}

const SUPPORTED_SKILL_KEYWORDS = [
  // Tech & Software Development
  'Java', 'Python', 'JavaScript', 'TypeScript', 'C++', 'C#', 'C',
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'GraphQL', 'REST API',
  'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Spring Boot', 'Spring', 'Django', 'Flask',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'GitHub', 'Linux',
  'HTML', 'CSS', 'Tailwind', 'DevOps', 'Jira', 'Agile', 'System Design',
  'Flutter', 'Swift', 'Android', 'Cybersecurity', 'Golang', 'Go', 'PHP', 'Ruby', 'R', 'Scala', 'Kotlin', 'Rust', 'Redis',
  'Elasticsearch', 'CI/CD', 'Microservices',

  // Data & Analytics
  'Excel', 'Power BI', 'Tableau', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch',
  'Machine Learning', 'Deep Learning', 'Statistics', 'Data Analysis', 'Data Visualization', 'ETL', 'Data Engineering', 'NLP', 'Spark', 'Hadoop',

  // Business & Management
  'Business Analysis', 'Business Intelligence', 'Requirements Analysis', 'Product Management', 'Project Management', 'Operations', 'Supply Chain', 'ERP', 'CRM', 'Scrum',

  // Finance & Accounting
  'Financial Analysis', 'Accounting', 'Financial Modeling', 'SAP', 'Tally', 'Taxation', 'Auditing', 'Budgeting',

  // Marketing & Sales
  'Digital Marketing', 'SEO', 'SEM', 'Google Analytics', 'Content Marketing', 'Social Media Marketing', 'Copywriting', 'Email Marketing', 'Brand Management',

  // Design
  'Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'UI/UX', 'Graphic Design', 'User Experience', 'User Interface', 'Wireframing', 'Prototyping',

  // HR & Administration
  'Recruitment', 'Talent Acquisition', 'Human Resources', 'Payroll', 'Employee Relations',
];

/**
 * Centralized deterministic skill extraction function analyzing title & description
 */
function extractJobSkills(title = '', description = '') {
  const combinedText = `${title} ${description}`.trim();
  if (!combinedText) return [];

  const textLower = combinedText.toLowerCase();
  const foundSkills = [];

  for (const skill of SUPPORTED_SKILL_KEYWORDS) {
    const skLower = skill.toLowerCase();
    let isFound = false;

    if (skLower === 'c++') {
      isFound = /c\+\+/i.test(textLower) || /\bcpp\b/i.test(textLower);
    } else if (skLower === 'c#') {
      isFound = /c#/i.test(textLower) || /\bcsharp\b/i.test(textLower);
    } else if (skLower === 'c') {
      // Strict contextual matching for C language (never match random prose 'c' or 'c/o')
      isFound = /\b(c\s+programming|c\s+language|c\s+developer|c\/c\+\+|embedded\s+c|ansi\s+c|c\s+coding)\b/i.test(textLower);
    } else if (skLower === 'r') {
      // Strict contextual matching for R language (never match 'R & D' or random 'r')
      isFound = /\b(r\s+programming|r\s+language|r\s+developer|rstudio|r\s+stats|r\/python|python\s+and\s+r|r\s+and\s+python|r\s+analytics)\b/i.test(textLower);
    } else if (skLower === 'go') {
      // Strict contextual matching for Go language
      isFound = /\b(golang|go\s+programming|go\s+language|go\s+developer|go\s+backend)\b/i.test(textLower);
    } else if (/[^a-z0-9]/i.test(skLower)) {
      isFound = textLower.includes(skLower);
    } else {
      const regex = new RegExp(`\\b${skLower.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i');
      isFound = regex.test(textLower);
    }

    if (isFound && !foundSkills.includes(skill)) {
      foundSkills.push(skill);
    }
  }

  return foundSkills;
}

/**
 * Generate stable, deterministic Adzuna Job ID
 */
function generateStableJobId(raw, idx = 0) {
  if (raw.id) return String(raw.id);
  const cleanCompany = (raw.company?.display_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanTitle = (raw.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanLoc = (raw.location?.display_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanCreated = String(raw.created || '').replace(/[^a-z0-9]/g, '');
  const hash = `${cleanCompany}-${cleanTitle}-${cleanLoc}-${cleanCreated}`.slice(0, 80);
  return hash ? `adzuna-${hash}` : `adzuna-job-${idx + 1}`;
}

/**
 * Format raw Adzuna job object into standard application schema
 */
function formatAdzunaJob(raw, idx = 0) {
  const rawTitle = (raw.title || 'Software Engineer').replace(/<[^>]*>/g, '').trim();
  const companyName = (raw.company && raw.company.display_name ? raw.company.display_name : 'Company Not Specified').trim();
  const domain = getCompanyDomain(companyName);
  const companyLogo = `https://logo.clearbit.com/${domain}`;

  const initials = companyName.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'CO';
  const svgInitialsAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%236366F1"/><text x="50" y="55" font-family="sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;

  const locationName = (raw.location && raw.location.display_name ? raw.location.display_name : 'Location Not Disclosed').trim();
  const salaryMin = raw.salary_min != null ? Math.round(raw.salary_min) : null;
  const salaryMax = raw.salary_max != null ? Math.round(raw.salary_max) : null;
  const salaryPredicted = Boolean(raw.salary_is_predicted);

  let salaryStr = 'Salary Not Disclosed';
  if (salaryMin !== null && salaryMax !== null) {
    if (salaryMin > 50000) {
      salaryStr = `₹${(salaryMin / 100000).toFixed(1)}L - ₹${(salaryMax / 100000).toFixed(1)}L / yr`;
    } else {
      salaryStr = `$${Math.round(salaryMin / 1000)}k - $${Math.round(salaryMax / 1000)}k / yr`;
    }
  } else if (salaryMin !== null) {
    salaryStr = salaryMin > 50000 ? `From ₹${(salaryMin / 100000).toFixed(1)}L / yr` : `From $${Math.round(salaryMin / 1000)}k / yr`;
  } else if (salaryMax !== null) {
    salaryStr = salaryMax > 50000 ? `Up to ₹${(salaryMax / 100000).toFixed(1)}L / yr` : `Up to $${Math.round(salaryMax / 1000)}k / yr`;
  }

  const rawDesc = (raw.description || '').replace(/<[^>]*>/g, '').trim();
  const contractTypeRaw = (raw.contract_type || raw.contract_time || 'full_time').toLowerCase();

  let contractType = 'full_time';
  let typeLabel = 'Full Time';
  if (contractTypeRaw.includes('part') || contractTypeRaw.includes('part_time')) {
    contractType = 'part_time';
    typeLabel = 'Part Time';
  } else if (contractTypeRaw.includes('intern') || rawDesc.toLowerCase().includes('intern')) {
    contractType = 'internship';
    typeLabel = 'Internship';
  } else if (contractTypeRaw.includes('contract')) {
    contractType = 'contract';
    typeLabel = 'Contract';
  }

  const isRemote = rawDesc.toLowerCase().includes('remote') || rawTitle.toLowerCase().includes('remote') || locationName.toLowerCase().includes('remote');

  // Extract category dynamically from Adzuna response (never hardcode "IT Jobs")
  let categoryName = 'Category Not Specified';
  if (typeof raw.category === 'string' && raw.category.trim()) {
    categoryName = raw.category.trim();
  } else if (raw.category && typeof raw.category === 'object') {
    categoryName = (raw.category.label || raw.category.display_name || raw.category.tag || 'Category Not Specified').trim();
  }

  const redirectUrl = raw.redirect_url || null;
  const createdDate = raw.created || new Date().toISOString();

  // Calculate posted days ago
  const createdTime = new Date(createdDate).getTime();
  const nowTime = Date.now();
  const postedDays = Math.max(0, Math.floor((nowTime - createdTime) / (1000 * 60 * 60 * 24)));

  // Extract skills dynamically based ONLY on actual presence in title or description
  const extractedSkills = extractJobSkills(rawTitle, rawDesc);

  // Extract requirements & responsibilities sentences dynamically from actual description
  const sentences = rawDesc.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 15);
  const reqKeywords = ['experience', 'degree', 'knowledge', 'proficient', 'skilled', 'ability', 'qualification', 'bachelor', 'master', 'years', 'must', 'strong', 'familiarity', 'background', 'required'];
  const respKeywords = ['develop', 'build', 'design', 'manage', 'maintain', 'create', 'lead', 'implement', 'support', 'optimize', 'collaborate', 'work', 'ensure', 'deliver', 'analyze', 'provide', 'drive', 'test', 'execute', 'responsibilit'];

  const matchedReqs = sentences.filter((s) => reqKeywords.some((k) => s.toLowerCase().includes(k))).slice(0, 5);
  const matchedResps = sentences.filter((s) => respKeywords.some((k) => s.toLowerCase().includes(k))).slice(0, 5);

  const adzunaJobId = generateStableJobId(raw, idx);

  if (idx === 0 && process.env.NODE_ENV !== 'production') {
    console.log('[ADZUNA INSPECT FIRST JOB]', {
      id: adzunaJobId,
      title: rawTitle,
      company: companyName,
      descriptionLength: rawDesc.length,
      category: categoryName,
      extractedSkills,
    });
  }

  const categoryTag = raw.category?.tag || null;

  return {
    id: adzunaJobId,
    adzunaJobId: adzunaJobId,
    source: 'adzuna',
    title: rawTitle,
    role: rawTitle,
    company: companyName,
    companyLogo,
    logo: companyLogo,
    defaultLogo: svgInitialsAvatar,
    location: locationName,
    salaryMin,
    salaryMax,
    salaryIsPredicted: salaryPredicted,
    salaryPredicted,
    package: salaryStr,
    salary: salaryStr,
    description: rawDesc || 'Description not available.',
    contractType,
    contractTime: raw.contract_time || contractType,
    type: typeLabel,
    remote: isRemote,
    category: categoryName,
    categoryTag,
    redirectUrl,
    created: raw.created || null,
    country: raw.country || 'in',
    postedDays: isNaN(postedDays) ? null : postedDays,
    skills: extractedSkills,
    requirements: matchedReqs,
    responsibilities: matchedResps,
    originalAdzunaJob: raw,
  };
}

/**
 * Save jobs to memory store
 */
function saveJobsToStore(jobsList) {
  if (Array.isArray(jobsList)) {
    jobsList.forEach((j) => {
      if (j && j.id) {
        globalJobStore.set(String(j.id), j);
      }
    });
  }
}

/**
 * Primary Adzuna API Fetcher (No Fake / Mock Fallbacks)
 */
async function fetchAdzunaJobs({ what = '', where = '', country = 'in', page = 1, resultsPerPage = 50 } = {}) {
  const appId = process.env.ADZUNA_APP_ID || '142eeeb0';
  const appKey = process.env.ADZUNA_APP_KEY || 'b84c8be92cf357ed7cd18c26bb7a36cb';

  const cacheKey = `${country}_${page}_${what}_${where}`.toLowerCase();
  const cached = cacheMap.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ADZUNA] query="${what}" location="${where}" country="${country}" page=${page} (CACHED ${cached.data.length} jobs)`);
    }
    return { success: true, source: 'adzuna', jobs: cached.data, total: cached.data.length };
  }

  if (!appId || !appKey) {
    console.error('[ADZUNA ERROR] ADZUNA_APP_ID or ADZUNA_APP_KEY is missing in environment variables.');
    return {
      success: false,
      source: 'adzuna',
      message: 'Adzuna API credentials (ADZUNA_APP_ID / ADZUNA_APP_KEY) are missing on the server.',
      jobs: [],
    };
  }

  const countriesToTry = Array.from(new Set([country, 'gb', 'us', 'in']));

  for (const targetCountry of countriesToTry) {
    const endpoint = `https://api.adzuna.com/v1/api/jobs/${targetCountry}/search/${page}?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&results_per_page=${resultsPerPage}${what ? `&what=${encodeURIComponent(what)}` : ''}${where ? `&where=${encodeURIComponent(where)}` : ''}&content-type=application/json`;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ADZUNA] Requesting URL: https://api.adzuna.com/v1/api/jobs/${targetCountry}/search/${page} (query="${what}", where="${where}")`);
    }

    const resObj = await new Promise((resolve) => {
      const req = https.get(endpoint, { timeout: 8000 }, (res) => {
        let body = '';

        if (res.statusCode !== 200) {
          console.error(`[ADZUNA ERROR] HTTP ${res.statusCode} from Adzuna API (${targetCountry})`);
          return resolve({ success: false, statusCode: res.statusCode });
        }

        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed && Array.isArray(parsed.results) && parsed.results.length > 0) {
              const formatted = parsed.results.map((item, idx) => formatAdzunaJob(item, idx));
              saveJobsToStore(formatted);
              cacheMap.set(cacheKey, { timestamp: Date.now(), data: formatted });

              if (process.env.NODE_ENV !== 'production' && formatted.length > 0) {
                console.log('[ADZUNA LOG]', {
                  query: what,
                  country: targetCountry,
                  page,
                  results: formatted.length,
                  firstJobId: formatted[0].id,
                  firstJobTitle: formatted[0].title,
                  firstJobCompany: formatted[0].company,
                });
              }

              return resolve({
                success: true,
                source: 'adzuna',
                jobs: formatted,
                total: parsed.count || formatted.length,
              });
            }

            return resolve({
              success: true,
              source: 'adzuna',
              jobs: [],
              total: 0,
            });
          } catch (e) {
            console.error('[ADZUNA PARSE ERROR]', e.message);
            return resolve({ success: false });
          }
        });
      });

      req.on('error', (err) => {
        console.error('[ADZUNA NETWORK ERROR]', err.message);
        return resolve({ success: false });
      });

      req.on('timeout', () => {
        req.destroy();
        console.error('[ADZUNA TIMEOUT] Request timed out after 8s.');
        return resolve({ success: false });
      });
    });

    if (resObj && resObj.success && resObj.jobs && resObj.jobs.length > 0) {
      return resObj;
    }
  }

  return {
    success: false,
    source: 'adzuna',
    message: 'Unable to fetch jobs from Adzuna.',
    jobs: [],
  };
}

/**
 * Retrieve Job by Unique Adzuna Job ID
 */
async function getJobByIdFromStore(id) {
  if (!id) return null;
  const strId = String(id);

  // 1. Direct lookup in globalJobStore
  if (globalJobStore.has(strId)) {
    return globalJobStore.get(strId);
  }

  // 2. Lookup in cacheMap entries
  for (const cacheItem of cacheMap.values()) {
    if (cacheItem && Array.isArray(cacheItem.data)) {
      const found = cacheItem.data.find((j) => String(j.id) === strId || String(j.adzunaJobId) === strId);
      if (found) {
        globalJobStore.set(strId, found);
        return found;
      }
    }
  }

  // 3. Fallback targeted Adzuna searches to locate and populate globalJobStore
  const searchQueries = ['', 'developer', 'engineer', 'manager', 'analyst', 'software'];
  for (const q of searchQueries) {
    const res = await fetchAdzunaJobs({ what: q, resultsPerPage: 50 });
    if (res.success && globalJobStore.has(strId)) {
      return globalJobStore.get(strId);
    }
  }

  return null;
}

module.exports = {
  fetchAdzunaJobs,
  formatAdzunaJob,
  getCompanyDomain,
  getJobByIdFromStore,
  extractJobSkills,
  SUPPORTED_SKILL_KEYWORDS,
};
