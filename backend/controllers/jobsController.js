const { fetchAdzunaJobs, getCompanyDomain } = require('../services/adzunaService');

/**
 * Get All Live Jobs (with optional search, location, category, contractType, minMatch)
 */
const getJobs = async (req, res, next) => {
  try {
    const {
      search = '',
      q = '',
      location = 'all',
      where = '',
      minMatch = 0,
      sortBy = 'match',
      category = 'all',
      contractType = 'all',
      remote = 'all',
      page = 1,
    } = req.query;

    const queryTerm = (search || q || '').trim();
    const locTerm = (location !== 'all' ? location : where).trim();

    const rawJobs = await fetchAdzunaJobs({
      what: queryTerm || 'software developer',
      where: locTerm === 'all' ? '' : locTerm,
      country: 'in',
      page: parseInt(page, 10) || 1,
      resultsPerPage: 50,
    });

    let filtered = rawJobs.filter((j) => {
      let matchesSearch = true;
      if (queryTerm) {
        const qt = queryTerm.toLowerCase();
        matchesSearch = j.title.toLowerCase().includes(qt) ||
          j.company.toLowerCase().includes(qt) ||
          j.description.toLowerCase().includes(qt) ||
          j.skills.some((s) => s.toLowerCase().includes(qt));
      }

      let matchesLoc = true;
      if (locTerm && locTerm.toLowerCase() !== 'all') {
        matchesLoc = j.location.toLowerCase().includes(locTerm.toLowerCase());
      }

      let matchesMinMatch = true;
      if (minMatch) {
        matchesMinMatch = (j.match || 80) >= parseInt(minMatch, 10);
      }

      let matchesCategory = true;
      if (category && category.toLowerCase() !== 'all') {
        matchesCategory = j.category.toLowerCase().includes(category.toLowerCase());
      }

      let matchesType = true;
      if (contractType && contractType.toLowerCase() !== 'all') {
        matchesType = j.contractType.toLowerCase().includes(contractType.toLowerCase());
      }

      let matchesRemote = true;
      if (remote === 'true' || remote === true) {
        matchesRemote = j.remote === true;
      }

      return matchesSearch && matchesLoc && matchesMinMatch && matchesCategory && matchesType && matchesRemote;
    });

    if (sortBy === 'match') {
      filtered.sort((a, b) => (b.match || 0) - (a.match || 0));
    } else {
      filtered.sort((a, b) => (a.postedDays || 0) - (b.postedDays || 0));
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      jobs: filtered,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search Live Jobs Specific Route
 */
const searchJobs = async (req, res, next) => {
  return getJobs(req, res, next);
};

/**
 * Get Specific Job By ID
 */
const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allJobs = await fetchAdzunaJobs({ what: '', where: '' });
    const job = allJobs.find((j) => String(j.id) === String(id)) || allJobs[0];

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Jobs for a Specific Company
 */
const getCompanyJobs = async (req, res, next) => {
  try {
    const companyParam = req.params.company || req.query.company || '';
    const cleanCompany = companyParam.trim().toLowerCase();

    const allJobs = await fetchAdzunaJobs({ what: cleanCompany || 'developer', where: '' });
    const companyJobs = allJobs.filter((j) => !cleanCompany || j.company.toLowerCase().includes(cleanCompany));

    return res.status(200).json({
      success: true,
      count: companyJobs.length,
      jobs: companyJobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Dynamic Companies Aggregated from Live Jobs
 */
const getCompanies = async (req, res, next) => {
  try {
    const allJobs = await fetchAdzunaJobs({ what: 'developer', where: '' });
    const companyMap = new Map();

    allJobs.forEach((j) => {
      const name = j.company;
      if (!companyMap.has(name)) {
        const domain = getCompanyDomain(name);
        const logo = j.companyLogo || `https://logo.clearbit.com/${domain}`;
        companyMap.set(name, {
          id: `c-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name,
          domain,
          logo,
          defaultLogo: j.defaultLogo,
          industry: j.category || 'Information Technology',
          location: j.location,
          salary: j.package,
          hiring: true,
          openRoles: 1,
          rating: (4.2 + (name.length % 7) * 0.1).toFixed(1),
          deadlineDays: j.postedDays + 14,
          latestHiring: j.role,
          jobs: [j],
          stats: [
            { label: 'Open Positions', value: '1+' },
            { label: 'Avg Package', value: j.package },
            { label: 'Location', value: j.location },
            { label: 'Work Mode', value: j.remote ? 'Remote' : 'On-site' },
          ],
          culture: ['Flexible Hours', 'Innovation Focused', 'Learning Stipend'],
          benefits: ['Health Insurance', 'Performance Bonus', 'Remote Work Options'],
          process: [
            { step: 'Application Review', detail: 'Screening by recruitment team' },
            { step: 'Technical Interview', detail: 'Coding and system architecture' },
            { step: 'Culture Fit', detail: 'Final round with engineering manager' },
          ],
          gallery: [
            'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=600',
            'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=600',
          ],
        });
      } else {
        const existing = companyMap.get(name);
        existing.openRoles += 1;
        existing.jobs.push(j);
        existing.stats[0].value = `${existing.openRoles}+`;
      }
    });

    const companiesList = Array.from(companyMap.values());

    return res.status(200).json({
      success: true,
      count: companiesList.length,
      companies: companiesList,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  searchJobs,
  getJobById,
  getCompanyJobs,
  getCompanies,
};
