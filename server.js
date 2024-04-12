const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const axios = require('axios'); 

const authRoutes = require('./routes/authRoutes');
const aboutRoutes = require('./routes/aboutRoutes');
const securityRoutes = require('./routes/securityRoutes'); 
const resultRoutes = require('./routes/resultRoutes');
const indexRoutes = require('./routes/indexRoutes');
const rateRoutes = require('./routes/rateRoutes'); 
const educationRoutes = require('./routes/educationRoutes'); // Import the educationRoutes module

require('dotenv').config();

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  console.error("Error: config environment variables not set. Please create/edit .env configuration file.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.DATABASE_URL)
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((err) => {
    console.error(`Database connection error: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  });

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DATABASE_URL }),
  }),
);

app.use((req, res, next) => {
  const sess = req.session;
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

app.use(authRoutes);
app.use(aboutRoutes);
app.use(securityRoutes);
app.use(resultRoutes);
app.use(indexRoutes);
app.use(rateRoutes); 
app.use(educationRoutes); // Use the educationRoutes middleware

app.get("/", (req, res) => {
  res.render("glow");
});

app.post('/redirect', (req, res) => {
  res.redirect("/index");
});

app.post('/scan', (req, res) => {
    let url = req.body.url;

    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    axios.get(url)
        .then(response => {
            const headers = response.headers;
            const vulnerabilities = checkVulnerabilities(headers);

            if (vulnerabilities.length === 0) {
                res.send('No vulnerabilities found.');
                return;
            }

            res.render('results', { vulnerabilities });
        })
        .catch(error => {
            res.send(`Error scanning ${url}: ${error.message}`);
        });
});

app.use((req, res, next) => {
  res.status(404).send("Page not found.");
});

app.use((err, req, res, next) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

function checkVulnerabilities(headers) {
    let vulnerabilities = [];

    if (!headers['x-frame-options'] || (headers['x-frame-options'] !== 'DENY' && headers['x-frame-options'] !== 'SAMEORIGIN')) {
      vulnerabilities.push({
          name: 'Clickjacking',
          description: 'Missing or misconfigured X-Frame-Options header.',
          risk: 'Medium',
          evidence: 'X-Frame-Options header is not set to DENY or SAMEORIGIN.'
      });
  }

  if (!headers['content-security-policy'] || !headers['content-security-policy'].includes('script-src')) {
      vulnerabilities.push({
          name: 'Cross-site Scripting (XSS)',
          description: 'Missing or misconfigured Content-Security-Policy header for script-src.',
          risk: 'High',
          evidence: 'Content-Security-Policy header does not contain script-src directive.'
      });
  }

  // Other vulnerability checks...

  return vulnerabilities;
}
