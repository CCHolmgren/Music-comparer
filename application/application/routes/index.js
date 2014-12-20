var express = require('express');
var router = express.Router();
var request = require('request');
var spotify = require('../settings/settings').Spotify;

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', {title: 'Express'});
});

router.post('/', function (req, res) {
    console.log("Did we get here?");
    spotify.search(req.body.query, req.body.type, function (result) {
        result = JSON.parse(result);
        console.log(typeof result);
        res.render('index', {title: 'Express', result: result});
    });
});

module.exports = router;
