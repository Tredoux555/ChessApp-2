#!/usr/bin/env node
/**
 * Database setup script for Railway
 * Run this after deployment to create database tables
 * Usage: node scripts/setup-db.js
 */

const { execSync } = require('child_process')

console.log('🚀 Setting up database schema...')

try {
  // Generate Prisma Client
  console.log('📦 Generating Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  
  // Push schema to database
  console.log('🗄️  Pushing database schema...')
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })
  
  console.log('✅ Database setup complete!')
} catch (error) {
  console.error('❌ Database setup failed:', error.message)
  process.exit(1)
}

