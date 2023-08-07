'use strict'
const jwt = require('jsonwebtoken');

function generateToken(userInfo) {
    if (!userInfo) { return null; }
    return jwt.sign(userInfo, process.env.JWT_SECRET, { expiresIn: '24h' });
}

function verifyToken(mobile_number, token) {
    return jwt.verify(token, process.env.JWT_SECRET, (error, response) => {
        if (error) { return { verified: false, message: 'Invalid token' } }
        if (response.mobile_number !== mobile_number) { return { verified: false, message: 'Invalid token' } }
        return { verified: true, message: 'Verified' }
    });
}

function verify(requestBody) {
    const { user, token } = requestBody;
    if (!user.mobile_number || !token) { return false };
    const verification = verifyToken(user.mobile_number, token);
    if (!verification.verified) { return false };
    return true;
}

module.exports = { generateToken, verify };