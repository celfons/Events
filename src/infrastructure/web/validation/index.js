/**
 * Central export point for all validation schemas
 */

const eventSchemas = require('./eventSchemas');
const registrationSchemas = require('./registrationSchemas');
const authSchemas = require('./authSchemas');
const userSchemas = require('./userSchemas');

module.exports = {
  ...eventSchemas,
  ...registrationSchemas,
  ...authSchemas,
  ...userSchemas
};
