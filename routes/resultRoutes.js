const express = require('express');
const router = express.Router();

// GET request for the result page
router.post('/result', (req, res) => {
    console.log('Serving the Result page');
    try {
        const vulnerabilities = req.body.vulnerabilities;
        res.render('result', { vulnerabilities }); // Render the 'result.ejs' view with vulnerabilities data
    } catch (error) {
        console.error('Error serving the Result page:', error.message);
        console.error(error.stack);
        res.status(500).send('An error occurred while trying to display the Result page.');
    }
});

module.exports = router;
