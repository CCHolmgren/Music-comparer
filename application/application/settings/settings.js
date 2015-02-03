/**
 * Created by Chrille on 2014-12-18.
 */
var crypto = require("crypto");
var request = require("request");
var apikeys = require("./api_keys");
var Q = require("q");

var md5sum = crypto.createHash("md5");

/*
 Represents the methods that Spotify exposes via its public api docs
 */
var Spotify = {
    search_url: "https://api.spotify.com/v1/search?q=",
    // Meant to represents the artist endpoints.
    artist: {
        album_url: ["https://api.spotify.com/v1/artists/", "/albums"],
        artist_details_url: "https://api.spotify.com/v1/artists/",

        search: function (query) {
            return Q.Promise(function (resolve, reject) {
                request(Spotify.search_url + query + "&type=artist" + "&client_id=" + apikeys.api_keys.spotify.client_id, function (error, response, body) {
                    if (!error) {
                        resolve(body);
                    } else {
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
                var parsed_data = JSON.parse(data);
                console.log("Typeof data: ", typeof data);
                if (parsed_data && parsed_data.artists && parsed_data.artists.items[0] && parsed_data.artists.items[0].id) {
                    console.log("ID of artist: ", parsed_data.artists.items[0].id || "");
                    return Spotify.artist.get_details(JSON.parse(data).artists.items[0].id || "");
                } else {
                    throw new Error("The ID wasn't there");
                    return Q.Promise(function (resolve, reject, notify) {
                        reject("The ID wasn't there");
                    });
                }
            });
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
    },
    album: {
        search: function (query, callback) {
            request(Spotify.search_url + query + "&type=album", function (error, response, body) {
                callback(body, error, response);
            });
        }
    },
    playlist: {
        search: function (query, callback) {
            request(Spotify.search_url + query + "&type=playlist", function (error, response, body) {
                callback(body, error, response);
            });
        }
    },
    search: function (query, type, callback) {
        request(Spotify.search_url + query + "&type=" + type, function (error, response, body) {
            callback(body, error, response);
        });
    }
};
var getLastFMURL = function (method, artist, api_key, format) {
    format = format || "json";
    return "http://ws.audioscrobbler.com/2.0/?method=" + method + "&artist=" + artist + "&api_key=" + api_key + "&format=" + format;
};

/*
 Represents the api methods that Lastfm exposes
 */
var LastFM = {
    base_url: "http://ws.audioscrobbler.com/2.0/",
    artist: {
        artist_info_url: ["http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=", "&api_key=", "&format=json"],
        artist_top_tags_url: ["http://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=", "&api_key=", "&format=json"],
        artist_top_albums_url: ["http://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=", "&api_key=", "&format=json"],
        get_info: function () {
            return LastFM.artist.getInfo.apply(undefined, arguments);
        },
        getInfo: function (artist_name) {

            return Q.Promise(function (resolve, reject) {
                request(getLastFMURL("artist.getinfo", artist_name, apikeys.api_keys.lastfm.api_key),
                    function (error, response, body) {
                        if (!error) {
                            resolve(body);
                        } else {
                            reject(error);
                        }
                    });
            });
        },
        /*
         Returns the top tags of an artist
         */
        getTopTags: function (artist_name) {
            return Q.Promise(function (resolve, reject) {
                request(getLastFMURL("artist.gettoptags", artist_name, apikeys.api_keys.lastfm.api_key),
                    function (error, reponse, body) {
                        if (!error) {
                            resolve(body);
                        } else {
                            reject(error);
                        }
                    });
            });
        },
        /*
         Returns the top albums of an artist
         */
        getTopAlbums: function (artist_name) {
            return Q.Promise(function (resolve, reject) {
                request(getLastFMURL("artist.gettopalbums", artist_name, apikeys.api_keys.lastfm.api_key),
                    function (error, reponse, body) {
                        if (!error) {
                            resolve(body);
                        } else {
                            reject(error);
                        }
                    });
            });
        }
    },
    auth: {
        get_session_url: ["http://ws.audioscrobbler.com/2.0/?token=", "&api_key=", "&method=auth.getSession&format=json&api_sig="],
        /*
         Get session key from lastfm.
         */
        getSession: function (token) {
            return Q.Promise(function (resolve, reject) {
                request(LastFM.auth.get_session_url[0] + token + LastFM.auth.get_session_url[1] + apikeys.api_keys.lastfm.api_key + LastFM.auth.get_session_url[2] + getSignature(apikeys.api_keys.lastfm.api_key,
                        "auth.getSession",
                        token,
                        apikeys.api_keys.lastfm.secret),
                    function (error, response, body) {
                        if (!error) {
                            resolve(body);
                        } else {
                            reject(error);
                        }
                    });
            });
        }
    },
    user: {
        getRecentStations: function (user) {

        }
    }
};

/*
 Returns the signature of a method given an api_key, method, token and secret. This is used for calls to protected sources on lastfms api
 */
function getSignature(api_key, method, token, secret) {
    console.log(arguments);
    var sig = "";
    sig += "api_key" + api_key;
    sig += "method" + method;
    sig += "token" + token;
    sig += secret;
    return crypto.createHash("md5").update(sig, "utf8").digest("hex");
}

module.exports.LastFM = LastFM;
module.exports.Spotify = Spotify;