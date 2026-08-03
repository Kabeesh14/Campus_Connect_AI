/**
 * Security & Protection Middleware Layer for Campus Connect AI
 */

// Memory rate limiting store
const rateLimitStore = new Map();

/**
 * Cleanup expired IP records from Map to prevent memory leaks
 */
function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

// Periodically clean up rate limiter memory every 5 minutes
setInterval(cleanupExpiredRecords, 5 * 60 * 1000).unref();

/**
 * Basic Rate Limiting Middleware (120 requests per minute per IP)
 */
const rateLimiter = (options = { windowMs: 60 * 1000, max: 120 }) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    // Perform opportunistic cleanup if store exceeds 500 entries
    if (rateLimitStore.size > 500) {
      cleanupExpiredRecords();
    }

    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + options.windowMs });
      return next();
    }

    const clientRecord = rateLimitStore.get(ip);

    if (now > clientRecord.resetTime) {
      clientRecord.count = 1;
      clientRecord.resetTime = now + options.windowMs;
      return next();
    }

    clientRecord.count += 1;
    if (clientRecord.count > options.max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down and try again in a minute.',
      });
    }

    next();
  };
};

/**
 * Security Headers Middleware
 */
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

/**
 * Recursive XSS Sanitization Helper
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  let clean = str;

  // Attempt decoding URI components once for safety check
  try {
    clean = decodeURIComponent(clean);
  } catch (e) {}

  // Strip dangerous tags: script, iframe, object, embed, svg
  clean = clean.replace(/<\s*(script|iframe|object|embed|svg)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  clean = clean.replace(/<\s*(script|iframe|object|embed|svg)[^>]*\/?>/gi, '');

  // Strip event handlers (e.g. onload=, onerror=)
  clean = clean.replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // Strip javascript: pseudo-protocol
  clean = clean.replace(/javascript\s*:/gi, '');

  return clean;
}

function sanitizeValue(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') return sanitizeString(val);
  if (Array.isArray(val)) return val.map((item) => sanitizeValue(item));
  if (typeof val === 'object') {
    const sanitizedObj = {};
    for (const [key, prop] of Object.entries(val)) {
      sanitizedObj[key] = sanitizeValue(prop);
    }
    return sanitizedObj;
  }
  return val;
}

/**
 * Recursive Input Sanitization Middleware
 */
const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
};

module.exports = {
  rateLimiter,
  securityHeaders,
  sanitizeInputs,
};
