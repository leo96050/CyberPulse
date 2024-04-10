const express = require('express');
const router = express.Router();

// GET request for the Index page
router.get('/index', (req, res) => {
  console.log('Serving the index page');
  try {
    res.render('index'); // Render the 'index.ejs' view
  } catch (error) {
    console.error('Error serving the index page:', error.message);
    console.error(error.stack);
    res.status(500).send('An error occurred while trying to display the index page.');
  }
});

module.exports = router;
