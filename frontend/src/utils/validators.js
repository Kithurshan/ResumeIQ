export const validateEmail = (email) => {
  if (!email) {
    return 'Email is required.';
  }
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    return 'Enter a valid work email.';
  }
  return '';
};

export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required.';
  }
  return '';
};

export const validateStrongPassword = (password) => {
  if (!password) {
    return 'Password is required.';
  }

  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return 'Password must contain: 8 characters, Uppercase, Lowercase, Number, and Special Character.';
  }

  return '';
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return 'Confirm your password.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return '';
};
