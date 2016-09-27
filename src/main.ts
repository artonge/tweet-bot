import * as Twit from 'twit';

import { credentials } from './credentials';
import { log } from './log';


const SEARCHS: [string] = [
  "retweet gagne follow"   , "RT gagne follow"   ,
  "retweet gagner follow"  , "RT gagner follow"  ,
  "retweet win follow"     , "RT win follow"     ,
  "retweet concours follow", "RT concours follow"
];

const FOLLOW_HISTORY: Array<number> = [];

const MIN_15 = 15 * 60 * 1000; // 15 min

const T: Twit = new Twit(credentials);

// A new unfollow batch every 15 min
// TODO - Apparently created_date is not the date of creation of the friendship but the one of the user
// setInterval(function() { unfollowBatch("tulipe_fragile") }, MIN_15);


let stream = T.stream('statuses/filter', <Twit.Params>{ track: SEARCHS });
stream.on('tweet', engage);

stream.on('connect'  , ()=>log.timeline("connecting..."));
stream.on('connected', ()=>log.timeline("connected"));
stream.on('reconnect', ()=>log.timeline("reconnecting..."));
stream.on('disconnect', (disconnect_object: any)=>log.timeline(`disconnected - JSON.stringify(disconnect_object)`));

stream.on('limit'     , (limit_object:      any)=>log.warning( `limit   - ${JSON.stringify(limit_object  )}`));
stream.on('warning'   , (warning_object:    any)=>log.warning( `warning - ${JSON.stringify(warning_object)}`));
stream.on('blocked'   , (blocked_object:    any)=>log.warning( `blocked - ${JSON.stringify(blocked_object)}`));

stream.on('error', log.error);


function canFollow(): boolean {
	FOLLOW_HISTORY.shift();

	// If the latest request have been made more than 15 minutes ago, it's true
	function olderThan15Min(time: number) { return time - (new Date()).getTime() > MIN_15; }

	// Remove follows that are older than 15min.
	while (olderThan15Min(FOLLOW_HISTORY[0])) FOLLOW_HISTORY.shift();

	return FOLLOW_HISTORY.length < 15; // If FOLLOW_HISTORY contains 15 items, then none of them are more than 15min old
}

function follow(user: Twit.Twitter.User) {
	if (!canFollow()) return;

	T.post('friendships/create', <Twit.Params>{ user_id: user.id_str },  function(e: any, u: any, raw: any) {
		if (e) log.error(e);
		else FOLLOW_HISTORY.push((new Date()).getTime()); // Add the request in history
	});
}

function unfollow(user: Twit.Twitter.User) {
	const time_diff: number = (new Date()).getTime() - (new Date((<any>user).created_date)).getTime();
	if (time_diff < 1000*60*60*24*200) return; // Return if friendship was created less than 200 days agos

	T.post('friendships/destroy', <Twit.Params>{ user_id: user.id_str },  function(e: any, u: any, raw: any) {
		if (e) log.error(e);
	});
}

function unfollowBatch(name: string) {
	// log("Starting masse unfollow");
	T.get('friends/list', <Twit.Params>{ screen_name: name, include_user_entities: false, skip_status: true, count: 40 },  function(e: any, answer: any, raw: any) {
		if (e) log.error(e);
		else for (let user of <[Twit.Twitter.User]>answer.users) unfollow(user);
	});
}

function retweet(tweet: Twit.Twitter.Status) {
	T.post('statuses/retweet', { id: tweet.id_str },  function(e: any, t: any, raw: any) {
		if (e) log.error(e);
	});
}

function favorite(tweet: Twit.Twitter.Status) {
	T.post('favorites/create', { id: tweet.id_str },  function(e: any, t: any, raw: any) {
		if (e) log.error(e);
	});
}

function engage(tweet: Twit.Twitter.Status) {
	// Prevent useless engagement
	if (tweet.retweeted_status || // is a retweet
			tweet.quoted_status ||  // is a quote
			tweet.retweeted || // allready been retweeted
			tweet.in_reply_to_status_id || // is a reply
			tweet.user.screen_name.search(/b(o|0)t/i) != -1 || // might be a bot spooter. Shit bag
			tweet.text.search(/bet/i) != -1 || // probably an ad for betting site
			tweet.user.followers_count < 2000 || // need to have a least 500 folowers
			tweet.user.followers_count < tweet.user.friends_count*1.5 || // need to have 0.3 more followers than subscriptions
			tweet.text.search(/steam/i) != -1) return; // it's for a steam key

	log.engagement("Engage tweet " + tweet.id_str + " " + tweet.user.screen_name + " | " + tweet.user.follow_request_sent);
	setTimeout(()=> {
		retweet(tweet);
		follow(tweet.user);
		if (tweet.text.search(/favorite/i) != -1) favorite(tweet); // Favorite tweet if needed
	}, MIN_15); // Engage 15 minutes later to act more like a normal person
}


console.log("Streaming started: ", SEARCHS);
