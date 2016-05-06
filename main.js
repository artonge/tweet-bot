var fs      = require('fs');
var http    = require('http');
var Promise = require('promise');
var Twitter = require('twitter-node-client').Twitter;

var credentials = require('./credentials.js').credentials;


function log(text, file) {
  return; // prevent log, to remove if debug
  file = file || "log.json";

  file = "logs/"+file;

  if (typeof text === "object") text = JSON.stringify(text);

  fs.appendFile(file, "-------------------" + new Date() + "-------------------\n");
  fs.appendFile(file, text + "\n");

}
function success(text) { log(text, "success.json"); }
function error  (text) { log(text, "error.json"  ); }


log("Session Started...");


var twitter = new Twitter(credentials);



function follow(user) {
  twitter.postCreateFriendship({user_id : user.id}, error, success);
}

function retweet(tweet) {
  twitter.postCustomApiCall('/statuses/retweet/'+tweet.id_str+'.json', undefined, error, success);
}

function engage(tweet) {
  if (!tweet.retweeted) retweet(tweet);

  if (tweet.text.search(/follow/i) === 0) follow(tweet.user);
}



var SEARCHS = [
  'retweet "a gagner" -rt -vote',
  'retweet to win -rt -vote'
];

var d = new Date();
var SINCE_DATE = " since:"+d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();


SEARCHS.forEach(function(search) {

  twitter.getSearch({"q" : search + SINCE_DATE, "count" : 30}, error, function(results)
  {
    var count = 0;

    results = JSON.parse(results);

    results.statuses.forEach(function(tweet, i, a)
    {
      if (i > 0 && tweet.user.id === a[i-1].user.id) return;

      count++;
      engage(tweet);

      log(tweet.created_at, tweet.text);
    });

    log(count + " tweets engaged");
  });
});
