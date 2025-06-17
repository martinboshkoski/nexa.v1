const express = require("express");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Import sample data
const sampleNews = require("./data/news.json");
const sampleInvestments = require("./data/investments.json");
const sampleUsers = require("./data/users.json");
const sampleCompanies = require("./data/companies.json");

// MongoDB Connection URI
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/nexa";

// DANGEROUS: Force reset database function (use only for fresh development)
async function forceResetDatabase() {
  let client;

  try {
    console.log("🚨 FORCE RESET MODE: This WILL delete ALL data including users!");
    
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    // Clear ALL collections
    await db.collection("news").deleteMany({});
    await db.collection("investments").deleteMany({});
    await db.collection("users").deleteMany({});
    await db.collection("companies").deleteMany({});

    console.log("🗑️  ALL data cleared (including users)");

    // Insert sample data
    if (sampleNews.length > 0) {
      await db.collection("news").insertMany(sampleNews);
      console.log(`Inserted ${sampleNews.length} news items`);
    }

    if (sampleInvestments.length > 0) {
      await db.collection("investments").insertMany(sampleInvestments);
      console.log(`Inserted ${sampleInvestments.length} investment opportunities`);
    }

    if (sampleCompanies.length > 0) {
      await db.collection("companies").insertMany(sampleCompanies);
      console.log(`Inserted ${sampleCompanies.length} companies`);
    }

    // Insert sample users with hashed passwords
    if (sampleUsers.length > 0) {
      const usersWithHashedPasswords = await Promise.all(
        sampleUsers.map(async (user) => ({
          ...user,
          password: await bcrypt.hash(user.password, 10),
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      );

      await db.collection("users").insertMany(usersWithHashedPasswords);
      console.log(`Inserted ${sampleUsers.length} users`);
    }

    console.log("Database FORCE RESET completed successfully");
    console.log("⚠️  All previous user data has been permanently deleted!");
  } catch (error) {
    console.error("Error during force reset:", error);
  } finally {
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
    }
  }
}

// Only run if called with --force flag
if (process.argv.includes('--force')) {
  forceResetDatabase();
} else {
  console.log("🛡️  SAFETY MODE: This script requires --force flag to run");
  console.log("💡 Usage: node force-reset-db.js --force");
  console.log("⚠️  WARNING: This will delete ALL data including real users!");
}
