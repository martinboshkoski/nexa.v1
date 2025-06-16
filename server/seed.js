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

// Seed database function
async function seedDatabase() {
  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    // Clear existing collections
    await db.collection("news").deleteMany({});
    await db.collection("investments").deleteMany({});
    await db.collection("users").deleteMany({});
    await db.collection("companies").deleteMany({});

    // Insert sample data

    if (sampleNews.length > 0) {
      await db.collection("news").insertMany(sampleNews);
      console.log(`Inserted ${sampleNews.length} news items`);
    }

    if (sampleInvestments.length > 0) {
      await db.collection("investments").insertMany(sampleInvestments);
      console.log(
        `Inserted ${sampleInvestments.length} investment opportunities`
      );
    }

    if (sampleUsers.length > 0) {
      // Hash passwords before inserting
      const hashedUsers = await Promise.all(
        sampleUsers.map(async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
          return user;
        })
      );
      await db.collection("users").insertMany(hashedUsers);
      console.log(`Inserted ${sampleUsers.length} users`);
    }

    if (sampleCompanies.length > 0) {
      await db.collection("companies").insertMany(sampleCompanies);
      console.log(`Inserted ${sampleCompanies.length} companies`);
    }

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
    }
  }
}

// Run the seed function
seedDatabase();
