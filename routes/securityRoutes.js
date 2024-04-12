const express = require('express');
const router = express.Router();

// Define the isAuthenticated middleware function
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next(); // User is authenticated, proceed to the next middleware/route handler
  } else {
    return res.status(401).send('You are not authenticated'); // User is not authenticated
  }
};

// Apply the authentication middleware to the security route
router.get('/security', isAuthenticated, (req, res) => {
  console.log('Serving the Security page');
  try {
    res.render('security'); // Render the 'security.ejs' view
  } catch (error) {
    console.error('Error serving the Security page:', error.message);
    console.error(error.stack);
    res.status(500).send('An error occurred while trying to display the Security page.');
  }
});

// POST route for handling URL submission
router.post('/security', isAuthenticated, (req, res) => {
  console.log('Handling URL submission');
  try {
    const { url } = req.body; // Extract URL from the submitted form data
    console.log(`Received URL submission: ${url}`);

    // Simulate a vulnerability scan by immediately rendering a response that the URL is safe
    res.render('security', { message: "The URL is safe." }); // Pass a message to be displayed on the 'security.ejs' page
  } catch (error) {
    console.error('Error handling URL submission:', error.message);
    console.error(error.stack);
    res.status(500).send('An error occurred while processing the URL submission.');
  }
});

module.exports = router;
