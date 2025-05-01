const validator = require('validator');

const validateAuth = {
  register: (req, res, next) => {
    const { name, email, password } = req.body;

    let errors = [];

    // Validation des entrées
    if (!validator.isLength(name, { min: 2, max: 50 })) {
      errors.push('Le nom doit contenir entre 2 et 50 caractères');
    }

    if (!validator.isEmail(email)) {
      errors.push('Email invalide');
    }

    if (!validator.isLength(password, { min: 64, max: 64 })) {
      errors.push('Format de hash SHA256 invalide');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }

    // Sanitize inputs
    req.sanitizedInputs = {
      name: validator.escape(name.trim()),
      email: validator.normalizeEmail(email.toLowerCase()),
      password: password // déjà hashé
    };

    next();
  }
};

module.exports = validateAuth;