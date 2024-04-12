const express = require('express');
const router = express.Router();

// GET request for the Rate Us page
router.get('/rate', (req, res) => {
  console.log('Serving the Rate Us page');
  try {
    res.render('rate'); // Render the 'rate.ejs' view
  } catch (error) {
    console.error('Error serving the Rate Us page:', error.message);
    console.error(error.stack);
    res.status(500).send('An error occurred while trying to display the Rate Us page.');
  }
});

module.exports = router;
