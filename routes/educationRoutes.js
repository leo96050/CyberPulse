const express = require('express');
const router = express.Router();

// GET request for the Education page
router.get('/education', (req, res) => {
  console.log('Serving the education page');
  try {
    res.render('education'); // Render the 'education.ejs' view
  } catch (error) {
    console.error('Error serving the education page:', error.message);
    console.error(error.stack);
    res.status(500).send('An error occurred while trying to display the education page.');
  }
});

module.exports = router;
