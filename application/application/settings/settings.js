/**
 * Created by Chrille on 2014-12-18.
 */
var request = require("request");
var apikeys = require("./api_keys");
var Q = require("q");

var Spotify = {
        search_url: "https://api.spotify.com/v1/search?q=",
        // Meant to represents the artist endpoints.
        artist: {
            album_url: ["https://api.spotify.com/v1/artists/", "/albums"],
            artist_details_url: "https://api.spotify.com/v1/artists/",

            search: function (query) {
                return Q.Promise(function (resolve, reject, notify) {
                    request(Spotify.search_url + query + "&type=artist", function (error, response, body) {
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
            get_details_without_artist_before: function(artist_name, callback){
                console.log("get_details_without_artist_before");
                return Spotify.artist.search(artist_name).then(function(data){
                        console.log(data);
                        return Spotify.artist.get_details(JSON.parse(data).artists.items[0].id);
                    }
                );
            },
            get_details: function (artist_id, callback) {
                //console.log("Artist id: ", artist_id);
                //console.log(Spotify.artist.artist_details_url + artist_id);
                return Q.Promise(function(resolve, reject, notify){
                    request(Spotify.artist.artist_details_url + artist_id, function (error, repsonse, body) {
                        if(!error){
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
    artist: {
        artist_info_url: ["http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=", "&api_key=", "&format=json"],
        get_info: function (artist_name) {
            console.log("get_info");
            //console.log(LastFM.artist.artist_info_url[0] + artist_name + LastFM.artist.artist_info_url[1] + apikeys.api_keys.lastfm.api_key + LastFM.artist.artist_info_url[2]);

            return Q.Promise(function (resolve, reject, notify) {
                request(LastFM.artist.artist_info_url[0]
                    + artist_name
                    + LastFM.artist.artist_info_url[1]
                    + apikeys.api_keys.lastfm.api_key
                    + LastFM.artist.artist_info_url[2],
                    function (error, response, body) {
                        if (!error) {
                            resolve(body);
                        }
                        else {
                            reject(error);
                        }
                    });
            });
        }
    }
}
module.exports.LastFM = LastFM;
module.exports.Spotify = Spotify;