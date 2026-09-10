const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (e) {
    res.status(400).json({ error: 'Validation failed', details: e.errors });
  }
};
module.exports = { validate };
