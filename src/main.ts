import * as Twit from 'twit'
const stathat = require('stathat')

import logger from './log'
import { connect, registerUnfollower, engage } from './helpers'


// Start streaming tweets
const stream = connect([
  "retweet gagne follow"   , "RT gagne follow"   ,
  "retweet gagner follow"  , "RT gagner follow"  ,
  "retweet win follow"     , "RT win follow"     ,
  "retweet concours follow", "RT concours follow"
])
stream.on('tweet', engage)

stream.on('connect'   , ()=> logger.info("connecting..."))
stream.on('connected' , ()=> logger.info("connected"))
stream.on('reconnect' , ()=> logger.info("reconnecting..."))
stream.on('disconnect', (disconnect_object: any)=> logger.info(`disconnected - JSON.stringify(disconnect_object)`))

stream.on('limit'  , (limit_object:   any)=> logger.warn( `limit   - ${JSON.stringify(limit_object  )}`))
stream.on('warning', (warning_object: any)=> logger.warn( `warning - ${JSON.stringify(warning_object)}`))
stream.on('blocked', (blocked_object: any)=> logger.warn( `blocked - ${JSON.stringify(blocked_object)}`))

stream.on('error', logger.error)

registerUnfollower()
