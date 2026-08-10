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
  'Java', 'Python', 'SQL', 'Excel', 'Power BI', 'Tableau', 'React', 'Node.js',
  'TypeScript', 'JavaScript', 'C#', 'C++', 'C', 'AWS', 'Azure', 'GCP',
  'Docker', 'Kubernetes', 'Git', 'GitHub', 'Spring Boot', 'Django', 'Flask',
  'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Analysis', 'PostgreSQL',
  'MySQL', 'MongoDB', 'Angular', 'Vue', 'Linux', 'REST API', 'Microservices',
  'GraphQL', 'Spark', 'Kafka', 'Pandas', 'NumPy', 'DevOps', 'Jira', 'Agile',
  'System Design', 'Flutter', 'Swift', 'Android', 'Cybersecurity', 'HTML',
  'CSS', 'Tailwind',
];

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
  const categoryName = (raw.category && raw.category.label ? raw.category.label : 'IT & Tech').trim();
  const redirectUrl = raw.redirect_url || null;
  const createdDate = raw.created || new Date().toISOString();

  // Calculate posted days ago
  const createdTime = new Date(createdDate).getTime();
  const nowTime = Date.now();
  const postedDays = Math.max(0, Math.floor((nowTime - createdTime) / (1000 * 60 * 60 * 24)));

  // Extract skills dynamically based ONLY on actual presence in title or description
  const extractedSkills = SUPPORTED_SKILL_KEYWORDS.filter((sk) => {
    const escaped = sk.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(rawTitle) || regex.test(rawDesc);
  });

  // Extract requirements & responsibilities sentences dynamically from actual description
  const sentences = rawDesc.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 15);
  const reqKeywords = ['experience', 'degree', 'knowledge', 'proficient', 'skilled', 'ability', 'qualification', 'bachelor', 'master', 'years', 'must', 'strong', 'familiarity', 'background', 'required'];
  const respKeywords = ['develop', 'build', 'design', 'manage', 'maintain', 'create', 'lead', 'implement', 'support', 'optimize', 'collaborate', 'work', 'ensure', 'deliver', 'analyze', 'provide', 'drive', 'test', 'execute', 'responsibilit'];

  const matchedReqs = sentences.filter((s) => reqKeywords.some((k) => s.toLowerCase().includes(k))).slice(0, 5);
  const matchedResps = sentences.filter((s) => respKeywords.some((k) => s.toLowerCase().includes(k))).slice(0, 5);

  const id = String(raw.id || `adzuna-${idx + 1}-${Date.now()}`);

  return {
    id,
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
    salaryPredicted,
    package: salaryStr,
    salary: salaryStr,
    description: rawDesc,
    contractType,
    type: typeLabel,
    remote: isRemote,
    category: categoryName,
    redirectUrl,
    created: createdDate,
    country: raw.country || 'in',
    postedDays,
    deadline: `${postedDays + 14} days left`,
    skills: extractedSkills,
    requirements: matchedReqs,
    responsibilities: matchedResps,
    eligibility: 'Degree in CS, IT, Engineering, or related discipline',
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
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

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

  const endpoint = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&results_per_page=${resultsPerPage}${what ? `&what=${encodeURIComponent(what)}` : ''}${where ? `&where=${encodeURIComponent(where)}` : ''}&content-type=application/json`;

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[ADZUNA] Requesting URL: https://api.adzuna.com/v1/api/jobs/${country}/search/${page} (query="${what}", where="${where}")`);
  }

  return new Promise((resolve) => {
    const req = https.get(endpoint, { timeout: 8000 }, (res) => {
      let body = '';

      if (res.statusCode !== 200) {
        console.error(`[ADZUNA ERROR] HTTP ${res.statusCode} from Adzuna API`);
        return resolve({
          success: false,
          source: 'adzuna',
          message: `Adzuna API HTTP Error ${res.statusCode}`,
          jobs: [],
        });
      }

      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed && Array.isArray(parsed.results)) {
            const formatted = parsed.results.map((item, idx) => formatAdzunaJob(item, idx));
            saveJobsToStore(formatted);
            cacheMap.set(cacheKey, { timestamp: Date.now(), data: formatted });

            if (process.env.NODE_ENV !== 'production' && formatted.length > 0) {
              console.log('[ADZUNA LOG]', {
                query: what,
                country,
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
          return resolve({
            success: false,
            source: 'adzuna',
            message: 'Failed to parse response from Adzuna API.',
            jobs: [],
          });
        }
      });
    });

    req.on('error', (err) => {
      console.error('[ADZUNA NETWORK ERROR]', err.message);
      return resolve({
        success: false,
        source: 'adzuna',
        message: `Adzuna network error: ${err.message}`,
        jobs: [],
      });
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('[ADZUNA TIMEOUT] Request timed out after 8s.');
      return resolve({
        success: false,
        source: 'adzuna',
        message: 'Adzuna API request timed out.',
        jobs: [],
      });
    });
  });
}

/**
 * Retrieve Job by Unique Adzuna Job ID
 */
async function getJobByIdFromStore(id) {
  if (!id) return null;
  const strId = String(id);
  if (globalJobStore.has(strId)) {
    return globalJobStore.get(strId);
  }

  // Fetch fresh batch from Adzuna to populate globalJobStore
  const res = await fetchAdzunaJobs({ what: 'developer', resultsPerPage: 50 });
  if (res.success && globalJobStore.has(strId)) {
    return globalJobStore.get(strId);
  }

  const resAll = await fetchAdzunaJobs({ what: '', resultsPerPage: 50 });
  if (resAll.success && globalJobStore.has(strId)) {
    return globalJobStore.get(strId);
  }

  return null;
}

module.exports = {
  fetchAdzunaJobs,
  formatAdzunaJob,
  getCompanyDomain,
  getJobByIdFromStore,
  SUPPORTED_SKILL_KEYWORDS,
};
