/**
 * Created by Chrille on 2014-12-18.
 */
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
    res.render('artist', {});
});

module.exports = router;
