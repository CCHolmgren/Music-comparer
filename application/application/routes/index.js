var express = require('express');
var router = express.Router();
var request = require('request');
var spotify = require('../settings/settings').Spotify;
var crypto = require('crypto');
var Q = require('q');

var redis = require('redis'),
    client = redis.createClient();

/* GET home page. */
router.get('/', function (req, res) {
    console.log(req.cookies);
    if (req.cookies.username && req.cookies.hmac) {
        Q.ninvoke(client, "get", [req.cookies.username]).then(
            function (result_username) {
                console.log(result_username);
                var json = JSON.parse(result_username);
                var hmac = crypto.createHash("md5").update(json.session.name + json.session.key, "utf8").digest("hex");
                console.log(req.cookies);
                console.log(hmac);

                if (hmac === req.cookies.hmac) {
                    return Q.ninvoke(client, "lrange", "latestsearches", -5, - 1);
                } else {
                    throw new Error("hmac not matching");
                }
            }
        ).then(function (result) {
                res.render('index', {
                    title: 'Music comparer',
                    latestsearches: result,
                    authenticated: true,
                    username: req.cookies.username
                });
            }).catch(function (error) {
                console.log(error);
                res.cookie("username", "", {expires: new Date(1), httpOnly: true});
                res.cookie("hmac", "", {expires: new Date(1), httpOnly: true});
                res.render("error", {error: new Error("Your cookies seems to be wrong, try to login again.")});
            });
        /*client.get(req.cookies.username, function (error_username, result_username) {
            if (error_username) {

            } else {

                var json = JSON.parse(result_username);
                var hmac = crypto.createHash("md5").update(json.session.name + json.session.key, "utf8").digest("hex");
                if (hmac === req.cookies.hmac) {
                    client.lrange("latestsearches", -5, -1, function (error, result) {
                        console.log(arguments);
                        res.render('index', {
                            title: 'Music comparer',
                            latestsearches: result,
                            authenticated: true,
                            username: req.cookies.username
                        });
                    });
                }
                else {
                    res.cookie("username", "", {expires: new Date(1), httpOnly: true});
                    res.cookie("hmac", "", {expires: new Date(1), httpOnly: true});
                    res.render("error", {error: new Error("Your cookies seems to be wrong, try to login again.")});
                }
            }
        });*/
    } else {
        client.lrange("latestsearches", -5, -1, function (error, result) {
            console.log(arguments);
            res.render('index', {
                title: 'Music comparer',
                latestsearches: result,
                authenticated: false,
                username: null
            });
        });
    }
});

module.exports = router;
