import auth from './auth.js';

export const authAdminMiddleware = (req, res, next) => {
  auth(req, res, () => {
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Access denied: Admins only" });
    }
    next();
  });
};
