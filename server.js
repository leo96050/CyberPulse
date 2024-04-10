// Load environment variables
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require('body-parser');
const session = require("express-session");
const MongoStore = require('connect-mongo');
const axios = require('axios'); // Import axios for making HTTP requests

const authRoutes = require("./routes/authRoutes");
const aboutRoutes = require('./routes/aboutRoutes');
const securityRoutes = require('./routes/securityRoutes'); // Added security routes
const resultRoutes = require('./routes/resultRoutes');
const indexRoutes = require('./routes/indexRoutes');

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  console.error("Error: config environment variables not set. Please create/edit .env configuration file.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Setting the templating engine to EJS
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static("public"));

// Database connection
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error(`Database connection error: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  });

// Session configuration with connect-mongo
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DATABASE_URL }),
  }),
);

app.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// Logging session creation and destruction
app.use((req, res, next) => {
  const sess = req.session;
  // Make session available to all views
  res.locals.session = sess;
  if (!sess.views) {
    sess.views = 1;
    console.log("Session created at: ", new Date().toISOString());
  } else {
    sess.views++;
    console.log(
      `Session accessed again at: ${new Date().toISOString()}, Views: ${sess.views}, User ID: ${sess.userId || '(unauthenticated)'}`,
    );
  }
  next();
});

// Authentication Routes
app.use(authRoutes);

// About Routes
app.use(aboutRoutes);

// Security Routes - Added use of security routes
app.use(securityRoutes);

app.use(resultRoutes);

app.use(indexRoutes);



// Root path response - Render glow.ejs
app.get("/", (req, res) => {
  res.render("glow");
});

// Route handler for button click in glow.ejs
app.post('/redirect', (req, res) => {
  // Redirect to index.ejs
  res.redirect("/index");
});

// Form submission route to scan for vulnerabilities
app.post('/scan', (req, res) => {
    let url = req.body.url;

    // Prepend "https://" if it's not already present
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    // Make HTTP request using axios
    axios.get(url)
        .then(response => {
            const headers = response.headers;
            const vulnerabilities = checkVulnerabilities(headers);

            if (vulnerabilities.length === 0) {
                res.send('No vulnerabilities found.');
                return;
            }

            // Render the 'results.ejs' view with vulnerabilities data
            res.render('results', { vulnerabilities });
        })
        .catch(error => {
            res.send(`Error scanning ${url}: ${error.message}`);
        });
});

// If no routes handled the request, it's a 404
app.use((req, res, next) => {
  res.status(404).send("Page not found.");
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Function to check vulnerabilities
function checkVulnerabilities(headers) {
    let vulnerabilities = [];

    // Your vulnerability check logic goes here
    // Clickjacking
    if (!headers['x-frame-options'] || (headers['x-frame-options'] !== 'DENY' && headers['x-frame-options'] !== 'SAMEORIGIN')) {
      vulnerabilities.push({
          name: 'Clickjacking',
          description: 'Missing or misconfigured X-Frame-Options header.',
          risk: 'Medium',
          evidence: 'X-Frame-Options header is not set to DENY or SAMEORIGIN.'
      });
  }

  // Cross-site Scripting (XSS)
  if (!headers['content-security-policy'] || !headers['content-security-policy'].includes('script-src')) {
      vulnerabilities.push({
          name: 'Cross-site Scripting (XSS)',
          description: 'Missing or misconfigured Content-Security-Policy header for script-src.',
          risk: 'High',
          evidence: 'Content-Security-Policy header does not contain script-src directive.'
      });
  }

  // Content Sniffing
  if (!headers['x-content-type-options'] || headers['x-content-type-options'] !== 'nosniff') {
      vulnerabilities.push({
          name: 'Content Sniffing',
          description: 'Missing or misconfigured X-Content-Type-Options header.',
          risk: 'Low',
          evidence: 'X-Content-Type-Options header is not set to nosniff.'
      });
  }

  // Insecure Mixed Content
  if (headers['content-security-policy'] && !headers['content-security-policy'].includes('block-all-mixed-content')) {
      vulnerabilities.push({
          name: 'Insecure Mixed Content',
          description: 'Missing or misconfigured Content-Security-Policy header to block all mixed content.',
          risk: 'Medium',
          evidence: 'Content-Security-Policy header does not contain block-all-mixed-content directive.'
      });
  }

  // Reflected XSS
  if (!headers['x-xss-protection'] || headers['x-xss-protection'] !== '1; mode=block') {
      vulnerabilities.push({
          name: 'Reflected XSS',
          description: 'Missing or misconfigured X-XSS-Protection header.',
          risk: 'High',
          evidence: 'X-XSS-Protection header is not set to 1; mode=block.'
      });
  }

  // HSTS (Strict-Transport-Security)
  if (!headers['strict-transport-security'] || !headers['strict-transport-security'].includes('includeSubDomains')) {
      vulnerabilities.push({
          name: 'HSTS',
          description: 'Missing or misconfigured Strict-Transport-Security header with includeSubDomains directive.',
          risk: 'High',
          evidence: 'Strict-Transport-Security header does not include includeSubDomains directive.'
      });
  }

  // Cache Control
  if (!headers['cache-control'] || (!headers['cache-control'].includes('no-store') && !headers['cache-control'].includes('no-cache'))) {
      vulnerabilities.push({
          name: 'Cache Control',
          description: 'Missing or misconfigured Cache-Control header with no-store or no-cache directives.',
          risk: 'Medium',
          evidence: 'Cache-Control header does not include no-store or no-cache directives.'
      });
  }

  // Server Info
  if (headers['server'] || headers['x-powered-by'] || headers['via']) {
      vulnerabilities.push({
          name: 'Server Information Leakage',
          description: 'Presence of Server, X-Powered-By, or Via headers.',
          risk: 'Low',
          evidence: 'Server, X-Powered-By, or Via headers are present in the response.'
      });
  }

  // Open Redirects
  if (!headers['referrer-policy'] || headers['referrer-policy'] !== 'no-referrer-when-downgrade') {
      vulnerabilities.push({
          name: 'Open Redirects',
          description: 'Missing or misconfigured Referrer-Policy header.',
          risk: 'Medium',
          evidence: 'Referrer-Policy header is not set to no-referrer-when-downgrade.'
      });
  }

  // Information Disclosure
  if (!headers['feature-policy'] || !headers['feature-policy'].includes('geolocation')) {
      vulnerabilities.push({
          name: 'Information Disclosure',
          description: 'Missing or misconfigured Feature-Policy header for geolocation.',
          risk: 'Medium',
          evidence: 'Feature-Policy header does not include geolocation directive.'
      });
  }

  // Insecure Cookies
  if (headers['set-cookie'] && !headers['set-cookie'].includes('SameSite')) {
      vulnerabilities.push({
          name: 'Insecure Cookies',
          description: 'Missing or misconfigured SameSite attribute in Set-Cookie header.',
          risk: 'High',
          evidence: 'Set-Cookie header does not include SameSite attribute.'
      });
  }
  
    return vulnerabilities;
}
