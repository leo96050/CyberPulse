const express = require('express');
const router = express.Router();

// GET request for the About page
router.get('/about', (req, res) => {
  console.log('Serving the About page');
  try {
    res.render('about'); // Render the 'about.ejs' view
  } catch (error) {
    console.error('Error serving the About page:', error.message);
    console.error(error.stack);
    res.status(500).send('An error occurred while trying to display the About page.');
  }
});

module.exports = router;