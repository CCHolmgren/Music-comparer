/**
 * Created by Chrille on 2014-12-18.
 */
var crypto = require("crypto");
var request = require("request");
var apikeys = require("./api_keys");
var Q = require("q");

var md5sum = crypto.createHash("md5");

var _Spotify = function (api_key, secret) {
    this.api_key = api_key;
    this.secret = secret;
    this.search_url = "https://api.spotify.com/v1/search?q=";
    this.artist = {
        album_url: ["https://api.spotify.com/v1/artists/", "/albums"],
        artist_details_url: "https://api.spotify.com/v1/artists/",

        search: function (query) {
            return Q.Promise(function (resolve, reject, notify) {
                request(this.search_url + query + "&type=artist" + "&client_id=" + apikeys.api_keys.spotify.client_id, function (error, response, body) {
                    if (!error) {
                        resolve(body);
                    }
                    else {
                        reject(error);
                    }
                });
            });
        },
        get_albums: function (artist_id, callback) {
            request(this.artist.album_url.join(artist_id), function (error, response, body) {
                callback(body, error, response);
            });
        },
        get_details_without_artist_before: function (artist_name, callback) {
            //console.log("get_details_without_artist_before");
            return this.artist.search(artist_name).then(function (data) {
                    //console.log(data);
                    console.log(typeof data);
                    console.log(JSON.parse(data).artists.items[0].id);
                    return this.artist.get_details(JSON.parse(data).artists.items[0].id);
                }
            );
        },
        get_details: function (artist_id, callback) {
            console.log("Artist id: ", artist_id);
            //console.log(Spotify.artist.artist_details_url + artist_id);
            console.log(this.artist.artist_details_url + artist_id);
            return Q.Promise(function (resolve, reject, notify) {
                request(this.artist.artist_details_url + artist_id + "?client_id=" + apikeys.api_keys.spotify.client_id, function (error, repsonse, body) {
                    console.log("We got to the callback!");
                    if (!error) {
                        console.log("Calling resolve for: ", body);
                        resolve(body);
                    } else {
                        reject(error);
                    }
                });
            });

        }
    }
};
_Spotify.prototype.search = function (query, type, callback) {
    request(this.search_url + query + "&type=" + type, function (error, response, body) {
        callback(body, error, response);
    });
};

var Spotify = {
        search_url: "https://api.spotify.com/v1/search?q=",
        // Meant to represents the artist endpoints.
        artist: {
            album_url: ["https://api.spotify.com/v1/artists/", "/albums"],
            artist_details_url: "https://api.spotify.com/v1/artists/",

            search: function (query) {
                return Q.Promise(function (resolve, reject, notify) {
                    request(Spotify.search_url + query + "&type=artist" + "&client_id=" + apikeys.api_keys.spotify.client_id, function (error, response, body) {
                        if (!error) {
                            resolve(body);
                        }
                        else {
                            reject(error);
                        }
                    });
                });
            },
            get_albums: function (artist_id, callback) {
                request(Spotify.artist.album_url.join(artist_id), function (error, response, body) {
                    callback(body, error, response);
                });
            },
            get_details_without_artist_before: function (artist_name, callback) {
                //console.log("get_details_without_artist_before");
                return Spotify.artist.search(artist_name).then(function (data) {
                        //console.log(data);
                        console.log(typeof data);
                        console.log(JSON.parse(data).artists.items[0].id);
                        return Spotify.artist.get_details(JSON.parse(data).artists.items[0].id);
                    }
                );
            },
            get_details: function (artist_id, callback) {
                console.log("Artist id: ", artist_id);
                //console.log(Spotify.artist.artist_details_url + artist_id);
                console.log(Spotify.artist.artist_details_url + artist_id);
                return Q.Promise(function (resolve, reject, notify) {
                    request(Spotify.artist.artist_details_url + artist_id + "?client_id=" + apikeys.api_keys.spotify.client_id, function (error, repsonse, body) {
                        console.log("We got to the callback!");
                        if (!error) {
                            console.log("Calling resolve for: ", body);
                            resolve(body);
                        } else {
                            reject(error);
                        }
                    });
                });

            }
        },
        track: {
            search: function (query, callback) {
                request(Spotify.search_url + query + "&type=track", function (error, response, body) {
                    callback(body, error, response);
                });
            }
        }
        ,
        album: {
            search: function (query, callback) {
                request(Spotify.search_url + query + "&type=album", function (error, response, body) {
                    callback(body, error, response);
                });
            }
        }
        ,
        playlist: {
            search: function (query, callback) {
                request(Spotify.search_url + query + "&type=playlist", function (error, response, body) {
                    callback(body, error, response);
                });
            }
        }
        ,
        search: function (query, type, callback) {
            request(Spotify.search_url + query + "&type=" + type, function (error, response, body) {
                callback(body, error, response);
            });
        }
    }
    ;
var LastFM = {
    base_url: "http://ws.audioscrobbler.com/2.0/",
    artist: {
        artist_info_url: ["http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=", "&api_key=", "&format=json"],
        get_info: function (artist_name) {
            console.log("get_info");
            console.log(LastFM.artist.artist_info_url[0] + artist_name + LastFM.artist.artist_info_url[1] + apikeys.api_keys.lastfm.api_key + LastFM.artist.artist_info_url[2]);

            return Q.Promise(function (resolve, reject, notify) {
                request(LastFM.artist.artist_info_url[0]
                    + artist_name
                    + LastFM.artist.artist_info_url[1]
                    + apikeys.api_keys.lastfm.api_key
                    + LastFM.artist.artist_info_url[2],
                    function (error, response, body) {
                        console.log("Inside get_info for lastfm");
                        if (!error) {
                            console.log("Resolved for", body);
                            resolve(body);
                        }
                        else {
                            reject(error);
                        }
                    });
            });
        }
    },
    auth: {
        get_session_url: ["http://ws.audioscrobbler.com/2.0/?token=", "&api_key=", "&method=auth.getSession&format=json&api_sig="],
        getSession: function (token) {
            console.log("Getting the session");
            return Q.Promise(function (resolve, reject, notify) {
                console.log("Do we get here?");
                console.log(LastFM.auth.get_session_url[0]
                + token
                + LastFM.auth.get_session_url[1]
                + apikeys.api_keys.lastfm.api_key
                + LastFM.auth.get_session_url[2]
                + getSignature(apikeys.api_keys.lastfm.api_key,
                    "auth.getSession",
                    token,
                    apikeys.api_keys.lastfm.secret));
                request(LastFM.auth.get_session_url[0]
                    + token
                    + LastFM.auth.get_session_url[1]
                    + apikeys.api_keys.lastfm.api_key
                    + LastFM.auth.get_session_url[2]
                    + getSignature(apikeys.api_keys.lastfm.api_key,
                        "auth.getSession",
                        token,
                        apikeys.api_keys.lastfm.secret),
                    function (error, response, body) {
                        if (!error) {
                            resolve(body);
                        }
                        else {
                            reject(error);
                        }
                    });
            })
        }
    },
    user: {
        getRecentStations: function (user) {

        }
    }
};

function getSignature(api_key, method, token, secret) {
    console.log(arguments);
    var sig = "";
    sig += "api_key" + api_key;
    sig += "method" + method;
    sig += "token" + token;
    sig += secret;
    return crypto.createHash("md5").update(sig, "utf8").digest("hex");

    console.log("Getting the md5sum");
    console.log(arguments);
    var md5 = md5sum.update(encodeURIComponent("apikey" + api_key + "method" + method + "token" + token + secret)).digest("hex");
    console.log(md5);
    return md5;
}

module.exports.LastFM = LastFM;
module.exports.Spotify = Spotify;
module.exports._Spotify = _Spotify;