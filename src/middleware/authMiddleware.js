const jwt = require('jsonwebtoken');

// Bypasses token checking for database testing
const authenticateToken = (req, res, next) => {
  // Hardcoded mock user with a String ID to match your Prisma schema
  req.user = { 
    id: "43b9de8a-f494-4372-b013-545589657b10", 
    role: "admin" 
  };
  
  return next(); // Stop right here and move straight to the controller!
};

// Restricts access to specific roles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    return next(); // Bypass role restrictions for testing
  };
};


module.exports = { authenticateToken, authorizeRoles };