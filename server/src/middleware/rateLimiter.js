import rateLimit from 'express-rate-limit';

export const createSessionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many session creation requests. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const joinSessionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Strict anti brute-force protection
  message: { error: 'Too many share code verification attempts. Please wait 1 minute before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 600, // Allows fast parallel chunk streaming
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});
