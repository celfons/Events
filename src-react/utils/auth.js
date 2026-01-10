// Token management utilities
const TOKEN_EXPIRATION_HOURS = 24;

export function saveToken(token, user) {
  const expirationTime = Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('tokenExpiration', expirationTime.toString());
}

export function getToken() {
  const token = localStorage.getItem('token');
  const expirationTime = localStorage.getItem('tokenExpiration');

  if (!token || !expirationTime) {
    return null;
  }

  // Check if token has expired
  if (Date.now() > parseInt(expirationTime)) {
    clearAuthData();
    return null;
  }

  return token;
}

export function clearAuthData() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('tokenExpiration');
}

export function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function isTokenValid() {
  return getToken() !== null;
}

export function isSuperuser() {
  const user = getUser();
  return user && user.role === 'superuser';
}
