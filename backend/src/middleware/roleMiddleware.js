/**
 * roleMiddleware
 * ──────────────
 * Factory that returns middleware restricting route access to specific roles.
 *
 * Usage:
 *   router.get('/secret', protect, requireRole('admin'), handler);
 *   router.post('/tender', protect, requireRole('admin', 'companyUser'), handler);
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = { requireRole };
