// Token management with 24-hour expiration
const TOKEN_EXPIRATION_HOURS = 24;

function saveToken(token, user) {
    const expirationTime = Date.now() + (TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('tokenExpiration', expirationTime.toString());
}

function getToken() {
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

function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiration');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function isTokenValid() {
    return getToken() !== null;
}

function isSuperuser() {
    const user = getUser();
    return user && user.role === 'superuser';
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        saveToken,
        getToken,
        clearAuthData,
        getUser,
        isTokenValid,
        isSuperuser,
        TOKEN_EXPIRATION_HOURS
    };
}
