var express = require('express');
var router = express.Router();
var request = require('request');
var spotify = require('../settings/settings').Spotify;
var crypto = require("crypto");


var redis = require('redis'),
    client = redis.createClient();

/* GET home page. */
router.get('/', function (req, res) {
    console.log(req.cookies);
    if(req.cookies.username && req.cookies.hmac){
        client.get(req.cookies.username, function(error_username, result_username){
            if(error_username){
                res.cookie("username", "", {expires: new Date(1), httpOnly: true});
                res.cookie("hmac", "", {expires: new Date(1), httpOnly: true});
                res.render("error", {error: new Error("Your cookies seems to be wrong, try to login again.")});
            } else {
                var json = JSON.parse(result_username);
                var hmac = crypto.createHash("md5").update(json.session.name+json.session.key, "utf8").digest("hex");
                if(hmac === req.cookies.hmac){
                    client.lrange("latestsearches", -5, -1, function(error, result){
                        console.log(arguments);
                        res.render('index', {title: 'Music comparer', latestsearches: result, authenticated: true, username: req.cookies.username});
                    });
                }
                else {
                    res.cookie("username", "", {expires: new Date(1), httpOnly: true});
                    res.cookie("hmac", "", {expires: new Date(1), httpOnly: true});
                    res.render("error", {error: new Error("Your cookies seems to be wrong, try to login again.")});
                }

            }
        });
    }else {
        client.lrange("latestsearches", -5, -1, function(error, result){
            console.log(arguments);
            res.render('index', {title: 'Music comparer', latestsearches: result, authenticated: false, username: null});
        });
    }

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
