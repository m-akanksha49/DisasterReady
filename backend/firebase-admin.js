// backend/firebase-admin.js
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: "disasterready-e8597",
});

module.exports = admin;