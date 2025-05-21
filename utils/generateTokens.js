// utils/generateTokens.js
import crypto from 'crypto';

export function generateToken() {
    const token = crypto.randomBytes(32).toString('hex');
    console.log('generateToken produced:', token);
    return token;
}