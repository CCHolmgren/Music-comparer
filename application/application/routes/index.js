var express = require('express');
var router = express.Router();
var request = require('request');
var spotify = require('../settings/settings').Spotify;

var redis = require('redis'),
    client = redis.createClient();

/* GET home page. */
router.get('/', function (req, res) {
    client.lrange("latestsearches", -5, -1, function(error, result){
        console.log(arguments);
        res.render('index', {title: 'Music comparer', latestsearches: result});
    });
});

router.post('/', function (req, res) {
    console.log("Did we get here?");
    spotify.search(req.body.query, req.body.type, function (result) {
        result = JSON.parse(result);
        console.log(typeof result);
        res.render('index', {title: 'Music comparer', result: result});
    });
});

module.exports = router;
