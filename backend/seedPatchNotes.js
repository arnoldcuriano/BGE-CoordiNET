const mongoose = require('mongoose');
const PatchNote = require('./models/PatchNote');
const path = require('path');

// Load environment variables
console.log('Current working directory:', process.cwd());
const dotenvPath = path.resolve(__dirname, '.env');
console.log('Loading .env from:', dotenvPath);
require('dotenv').config({ path: dotenvPath });

// Debug environment variables
console.log('MONGO_URI:', process.env.MONGO_URI);
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is undefined. Please check your .env file.');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
}).then(() => console.log('MongoDB Connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedPatchNotes = async () => {
  try {
    // Clear existing patch notes
    await PatchNote.deleteMany();
    console.log('Cleared existing patch notes');

    // Define patch notes data
    const patchNotes = [
      {
        title: 'Version 1.2.1 - May 22, 2025',
        content: `
          <h3>Patch Overview</h3>
          <p>This update addresses critical fixes and introduces minor improvements to enhance user experience and system reliability.</p>
          <h4>Fixes:</h4>
          <ul>
            <li><strong>Fixed PatchNotes Reference in App.js:</strong> Resolved a compilation error by correcting the PatchNotes component reference and adding the missing import in App.js.</li>
            <li><strong>Fixed ErrorBoundary Import in PlaceholderPage:</strong> Corrected the import path for ErrorBoundary in PlaceholderPage.js to resolve a module not found error during build.</li>
          </ul>
          <h4>Upcoming Fixes:</h4>
          <ul>
            <li><strong>Remove Development Console Logs:</strong> Clean up console logs related to S3 uploads, user authentication, email notifications, and theme switching to improve performance and security.</li>
            <li><strong>Remove Unused Modules:</strong> Remove unused dependencies and modules (e.g., unused middleware, outdated packages) to reduce bundle size and improve load times.</li>
            <li><strong>Optimize Email Sending:</strong> Refactor email sending functions to handle errors more gracefully and reduce latency in user approval and rejection workflows.</li>
          </ul>
          <h4>Upcoming Features:</h4>
          <ul>
            <li><strong>System Dashboard:</strong> A comprehensive dashboard displaying key system metrics, user activity, and project statuses to provide a quick overview for administrators.</li>
            <li><strong>Projects & Inventory Systems:</strong> Enhanced project management and inventory tracking systems to streamline workflows and resource allocation for teams.</li>
            <li><strong>Quick Tools Suite:</strong> A collection of productivity tools to simplify daily tasks, including:
              <ul>
                <li>QR Code Generator: Create QR codes for links, contacts, or custom data.</li>
                <li>Linktree Alternative: Build a single page to share multiple links.</li>
                <li>Image Compressor to WebP: Convert and compress images to WebP format for faster loading.</li>
                <li>Text Utilities: Includes word counter, case converter (camelCase, snake_case, etc.), remove duplicates/empty lines.</li>
                <li>PDF Merger/Splitter: Merge multiple PDFs or split a PDF into individual pages.</li>
              </ul>
            </li>
          </ul>
        `,
        published: true,
        publishedBy: null, 
        publishedAt: new Date('2025-05-22'),
      },
      {
        title: 'Version 1.2.0 - May 15, 2025',
        content: `
          <h3>Patch Overview</h3>
          <p>This release introduces significant improvements to user account management and UI consistency.</p>
          <h4>Fixes:</h4>
          <ul>
            <li><strong>Password Update Fix in Account Settings:</strong> Resolved an issue where the new password was not accepted during login after updating via Account Settings. Fixed double-hashing by bypassing the pre-save hook.</li>
          </ul>
          <h4>Features:</h4>
          <ul>
            <li><strong>Profile Picture Upload with S3 Integration:</strong> Added the ability to upload profile pictures in Profile Settings, integrated with AWS S3 for secure storage.</li>
            <li><strong>Green Light Hover Effects:</strong> Implemented consistent green light hover effects (#34A853) across Profile Settings and Super Admin Dashboard for a cohesive user experience.</li>
            <li><strong>Custom Snackbar for Feedback:</strong> Replaced alerts with bottom-right CustomSnackbar in Profile Settings and Account Settings for better user feedback.</li>
          </ul>
        `,
        published: true,
        publishedBy: null,
        publishedAt: new Date('2025-05-15'),
      },
      {
        title: 'Version 1.1.0 - May 1, 2025',
        content: `
          <h3>Patch Overview</h3>
          <p>Initial release with core features and user authentication.</p>
          <h4>Features:</h4>
          <ul>
            <li><strong>User Authentication System:</strong> Implemented user signup, login, and password reset functionality with email verification.</li>
            <li><strong>Super Admin Dashboard:</strong> Added a dashboard for super admins to manage users and approve registrations.</li>
          </ul>
        `,
        published: true,
        publishedBy: null,
        publishedAt: new Date('2025-05-01'),
      },
    ];

    // Insert patch notes into the database
    await PatchNote.insertMany(patchNotes);
    console.log('Patch notes seeded successfully');

    // Close the database connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding patch notes:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedPatchNotes();