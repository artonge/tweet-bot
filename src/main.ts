import * as Twit from 'twit';

import { credentials } from './credentials';
import { log, success, error } from './log';


const SEARCHS: [string] = [
  "retweet a gagner",
  "retweet to win",
  "RT to win",
  "RT concours"
];

const FOLLOW_HISTORY: Array<number> = [];

const MIN_15 = 15 * 60 * 1000; // 15 min

const T: Twit = new Twit(credentials);

// A new unfollow batch every 15 min
setInterval(function() { unfollowBatch("tulipe_fragile") }, MIN_15);


var stream = T.stream('statuses/filter', <Twit.Params>{ track: SEARCHS });
stream.on('connected', ()=>success("connected"));
stream.on('reconnect', ()=>success("reconnect"));
stream.on('tweet', engage);
stream.on('disconnect', ()=>success("disconnect"));
stream.on('limit', (limit_object: any)=>success("disconnect" + limit_object.toString()));
stream.on('warning', (warning_object: any)=>success("disconnect" + warning_object.toString()));
stream.on('blocked', (blocked_object: any)=>success("disconnect" + blocked_object.toString()));


function canFollow(): boolean {
	if (FOLLOW_HISTORY.length > 15) { // If 15 requests have been made
		// Difference between latest request and now
		let time_diff: number = FOLLOW_HISTORY[0] - (new Date()).getTime();
		// If the latest request have been made less than 15 minutes ago, return false
		if (time_diff < MIN_15) return false;
	}

	return true;
}

function follow(user: Twit.Twitter.User) {
	if (user.following) { error("Allready following");   return; }
	if (!canFollow())   { /*error("Follow limit reached");*/ return; }

	T.post('friendships/create', <Twit.Params>{ user_id: user.id_str },  function(e: any, u: any, raw: any) {
		if (e) error(e);
		else FOLLOW_HISTORY.push((new Date()).getTime()); // Add the request in history
	});
}

function unfollow(user: Twit.Twitter.User) {
	const time_diff: number = (new Date()).getTime() - (new Date((<any>user).created_date)).getTime();
	if (time_diff < MIN_15) return; // Return if friendship was created less than 5 days agos

	T.post('friendships/destroy', <Twit.Params>{ user_id: user.id_str },  function(e: any, u: any, raw: any) {
		if (e) error(e);
	});
}

function unfollowBatch(name: string) {
	// log("Starting masse unfollow");
	T.get('friends/list', <Twit.Params>{ screen_name: name, include_user_entities: false, skip_status: true, count: 40 },  function(e: any, answer: any, raw: any) {
		if (e) error(e);
		else for (let user of <[Twit.Twitter.User]>answer.users) unfollow(user);
	});
}

function retweet(tweet: Twit.Twitter.Status) {
	T.post('statuses/retweet', { id: tweet.id_str },  function(e: any, t: any, raw: any) {
		if (e) error(e);
	});
}

function engage(tweet: Twit.Twitter.Status) {
	// Prevent useless engagement
	if (tweet.retweeted_status || // is a retweet
			tweet.quoted_status ||  // is a quote
			tweet.retweeted || // allready been retweeted,
			tweet.user.screen_name.search(/b(o|0)t/i) != -1 || // might be a bot spooter. Shit bag
			tweet.user.followers_count < 500 || // need to have a least 500 folowers
			tweet.user.followers_count < tweet.user.friends_count*1.5 || // need to have 0.5 more followers than subscriptions
			tweet.text.toLowerCase().search(/steam/i) != -1) return; // it's for a steam key

	setTimeout(()=> {
		success("Engage tweet " + tweet.id_str + " " + tweet.user.screen_name);
		retweet(tweet);
		follow(tweet.user);
	}, 1); // Engage 15 minutes later to act more like a normal person
}


console.log("Streaming started: ", SEARCHS);
