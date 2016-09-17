"use strict";
var Twitter = require('twitter');
var credentials_1 = require('./credentials');
var log_1 = require('./log');
var SEARCHS = [
    "retweet 'a gagner' OR 'à gagner' -vote -steam",
    "retweet to win -vote -steam",
    "RT concours -steam -vote"
];
var FOLLOW_HISTORY = [];
var WINDOW_DURATION = 15 * 60 * 1000;
var t_client = new Twitter(credentials_1.credentials);
setInterval(function () { unfollowBatch("tulipe_fragile"); }, WINDOW_DURATION);
var stream = t_client.stream('statuses/filter', { track: SEARCHS.join(',') });
stream.on('data', engage);
stream.on('error', log_1.error);
function isTweet(object) {
    return typeof object.contributors == "object"
        && typeof object.id_str == "string"
        && typeof object.text == "string";
}
function canFollow() {
    if (FOLLOW_HISTORY.length > 15) {
        var time_diff = FOLLOW_HISTORY[0] - (new Date()).getTime();
        if (time_diff < WINDOW_DURATION)
            return false;
    }
    FOLLOW_HISTORY.push((new Date()).getTime());
    return true;
}
function follow(user) {
    if (!canFollow())
        return;
    t_client.post('friendships/create', { user_id: user.id }, function (e, user, raw) {
        if (e)
            log_1.error(e);
        else
            log_1.log("Followed user");
    });
}
function unfollow(user) {
    console.log("Unfollowing", user.id);
    t_client.post('friendships/destroy', { user_id: user.id }, function (e, user, raw) {
        if (e)
            log_1.error(e);
        else
            log_1.log("Unfollowed user");
    });
}
function unfollowBatch(name) {
    console.log("Starting masse unfollow");
    t_client.get('friends/list', { screen_name: name }, function (e, answer, raw) {
        if (e)
            log_1.error(e);
        else
            for (var _i = 0, _a = answer.users; _i < _a.length; _i++) {
                var user = _a[_i];
                unfollow(user);
            }
    });
}
function retweet(tweet) {
    t_client.post('statuses/retweet', { id: tweet.id_str }, function (e, tweet, raw) {
        if (!e)
            log_1.log("Retweeted");
        else
            log_1.error(e);
    });
}
function engage(tweet) {
    log_1.log("Engage tweet");
    console.log("Engage tweet");
    if (!isTweet(tweet))
        return;
    if (tweet.retweeted_status)
        tweet = tweet.retweeted_status;
    if (tweet.quoted_status)
        tweet = tweet.quoted_status;
    if (!tweet.retweeted)
        retweet(tweet);
    if (tweet.text.search(/follow/i) != -1)
        follow(tweet.user);
    log_1.log("Done");
}
log_1.log("Streaming started");
