#!/usr/bin/env node

/**
 * Google OAuth Configuration Test Script
 * This script helps validate your Google OAuth setup
 */

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple env parser
function loadEnvFile(filePath) {
    try {
        const envFile = readFileSync(filePath, 'utf8');
        const envVars = {};
        
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^#][^=]*?)=(.*)$/);
            if (match) {
                const [, key, value] = match;
                envVars[key.trim()] = value.trim().replace(/^["'](.*)["']$/, '$1');
            }
        });
        
        return envVars;
    } catch (error) {
        console.log('⚠️  Could not read .env.local file');
        return {};
    }
}

// Load environment variables
const envVars = loadEnvFile(path.join(__dirname, '.env.local'));

console.log('🔍 Google OAuth Configuration Test\n');

// Test required environment variables
const requiredEnvVars = {
    'GOOGLE_CLIENT_ID': envVars.GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': envVars.GOOGLE_CLIENT_SECRET,
    'NEXTAUTH_SECRET': envVars.NEXTAUTH_SECRET,
    'NEXTAUTH_URL': envVars.NEXTAUTH_URL,
    'NEXT_PUBLIC_APP_URL': envVars.NEXT_PUBLIC_APP_URL,
};

console.log('📋 Environment Variables Check:');
let allEnvVarsPresent = true;

Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (value) {
        // Mask sensitive values
        const displayValue = key.includes('SECRET') || key.includes('CLIENT_SECRET') 
            ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
            : value;
        console.log(`✅ ${key}: ${displayValue}`);
    } else {
        console.log(`❌ ${key}: Missing`);
        allEnvVarsPresent = false;
    }
});

console.log('\n🌐 URL Configuration Check:');

// Check URL consistency
const nextAuthUrl = envVars.NEXTAUTH_URL;
const publicAppUrl = envVars.NEXT_PUBLIC_APP_URL;

if (nextAuthUrl && publicAppUrl) {
    if (nextAuthUrl === publicAppUrl) {
        console.log(`✅ URLs are consistent: ${nextAuthUrl}`);
    } else {
        console.log(`⚠️  URL mismatch:`);
        console.log(`   NEXTAUTH_URL: ${nextAuthUrl}`);
        console.log(`   NEXT_PUBLIC_APP_URL: ${publicAppUrl}`);
    }
} else {
    console.log(`❌ Missing URL configuration`);
}

// Generate required Google Console configuration
console.log('\n🔧 Required Google Cloud Console Configuration:');
console.log('\n📍 Authorized JavaScript Origins:');
if (nextAuthUrl) {
    console.log(`   ${nextAuthUrl}`);
    if (nextAuthUrl !== 'http://localhost:3000') {
        console.log(`   http://localhost:3000`);
    }
}

console.log('\n🔀 Authorized Redirect URIs:');
if (nextAuthUrl) {
    console.log(`   ${nextAuthUrl}/api/auth/callback/google`);
    if (nextAuthUrl !== 'http://localhost:3000') {
        console.log(`   http://localhost:3000/api/auth/callback/google`);
    }
}

// Validate Google Client ID format
const clientId = envVars.GOOGLE_CLIENT_ID;
if (clientId) {
    const isValidFormat = clientId.includes('.apps.googleusercontent.com');
    if (isValidFormat) {
        console.log('\n✅ Google Client ID format appears valid');
    } else {
        console.log('\n❌ Google Client ID format seems incorrect');
        console.log('   Expected format: xxxxxxxxx.apps.googleusercontent.com');
    }
}

// Final assessment
console.log('\n📊 Overall Assessment:');
if (allEnvVarsPresent) {
    console.log('✅ All required environment variables are present');
    console.log('🚀 You can proceed with testing Google OAuth');
    console.log('\n💡 Next steps:');
    console.log('   1. Ensure Google Cloud Console is configured with the URLs above');
    console.log('   2. Deploy your changes to production');
    console.log('   3. Test Google login functionality');
} else {
    console.log('❌ Some environment variables are missing');
    console.log('📝 Please update your .env.local file with the missing values');
}

console.log('\n🔗 Helpful Links:');
console.log('   Google Cloud Console: https://console.cloud.google.com/');
console.log('   NextAuth.js Docs: https://next-auth.js.org/');
console.log('   Setup Guide: ./GOOGLE_OAUTH_SETUP_GUIDE.md');
