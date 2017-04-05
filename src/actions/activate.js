const Errors = require('common-errors');
const noop = require('lodash/noop');
const nthArg = require('lodash/nthArg');
const Promise = require('bluebird');
const redisKey = require('../utils/key.js');
const jwt = require('../utils/jwt.js');
const { getUserId, getInternalData } = require('../utils/userData');
const handlePipeline = require('../utils/pipelineError.js');
const {
  USERS_INDEX,
  USERS_DATA,
  USERS_PUBLIC_INDEX,
  USERS_ACTIVE_FLAG,
  USERS_ID_FIELD,
  USERS_ALIAS_FIELD,
  USERS_USERNAME_FIELD,
  USERS_ACTION_ACTIVATE,
} = require('../constants.js');

// cache error
const Forbidden = new Errors.HttpStatusError(403, 'invalid token');
const Inactive = new Errors.HttpStatusError(412, 'expired token, please request a new email');
const Active = new Errors.HttpStatusError(409, 'account is already active, please use sign in form');

/**
 * Helper to determine if something is true
 */
function throwBasedOnStatus(status) {
  if (status === 'true') {
    throw Active;
  }

  throw Inactive;
}

/**
 * Verifies that account is active
 */
function isAccountActive(userId) {
  const { service: { redis } } = this;
  const userKey = redisKey(userId, USERS_DATA);
  return redis
    .hget(userKey, USERS_ACTIVE_FLAG)
    .then(throwBasedOnStatus);
}

/**
 * Modifies error from the token
 */
function RethrowForbidden(e) {
  this.log.warn({ token: this.token, userId: this.userId, args: e.args }, 'failed to activate', e.message);

  // remap error message
  // and possibly status code
  if (!e.args) {
    throw Forbidden;
  }

  return Promise
    .bind(this, e.args.id)
    // if it's active will throw 409, otherwise 412
    .then(isAccountActive);
}

/**
 * Verifies validity of token
 */
function verifyToken(userId) {
  let args;
  const { token, service } = this;
  const action = USERS_ACTION_ACTIVATE;
  const opts = { erase: this.erase };

  if (userId) {
    args = {
      action,
      token,
      id: userId,
    };
  } else {
    args = token;
    opts.control = { action };
  }

  return this.service
    .tokenManager
    .verify(args, opts)
    .bind({ log: service.log, redis: service.redis, token, userId })
    .catch(RethrowForbidden)
    .get('id');
}

/**
 * Activates account after it was verified
 * @param  {Object} data internal user data
 * @return {Promise}
 */
function activateAccount(data) {
  const userId = data[USERS_ID_FIELD];
  const alias = data[USERS_ALIAS_FIELD];
  const userKey = redisKey(userId, USERS_DATA);

  // WARNING: `persist` is very important, otherwise we will lose user's information in 30 days
  // set to active & persist
  const pipeline = this.redis
    .pipeline()
    .hget(userKey, USERS_ACTIVE_FLAG)
    .hset(userKey, USERS_ACTIVE_FLAG, 'true')
    .persist(userKey)
    .sadd(USERS_INDEX, userId);

  if (alias) {
    pipeline.sadd(USERS_PUBLIC_INDEX, userId);
  }

  return pipeline
    .exec()
    .then(handlePipeline)
    .spread((isActive) => {
      if (isActive === 'true') {
        throw new Errors.HttpStatusError(417, `Account ${userId} was already activated`);
      }
    })
    .return(userId);
}

/**
 * Invokes available hooks
 */
function hook(userId) {
  return this.service.hook('users:activate', userId, { audience: this.audience });
}

/**
 * @api {amqp} <prefix>.activate Activate User
 * @apiVersion 1.0.0
 * @apiName ActivateUser
 * @apiGroup Users
 *
 * @apiDescription This method allows one to activate user by 3 means:
 * 1) When only `username` is provided, no verifications will be performed and user will be set
 *    to active. This case is used when admin activates a user.
 * 2) When only `token` is provided that means that token is encrypted and would be verified.
 *    This case is used when user completes verification challenge.
 * 3) This case is similar to the previous, but used both `username` and `token` for
 *    verification. Use this when the token isn't decrypted.
 * Success response contains user object.
 *
 * @apiParam (Payload) {String} username - id of the user
 * @apiParam (Payload) {String} token - verification token
 * @apiParam (Payload) {String} [remoteip] - not used, but is reserved for security log in the future
 * @apiParam (Payload) {String} [audience] - additional metadata will be pushed there from custom hooks
 *
 */
function activateAction({ params }) {
  // TODO: add security logs
  // var remoteip = request.params.remoteip;
  const { token, username } = params;
  const { log, config, redis } = this;
  const audience = params.audience || config.defaultAudience;

  log.debug('incoming request params %j', params);

  // basic context
  const ctx = {
    token,
    audience,
    service: this,
    erase: config.token.erase,
  };

  return Promise
    .bind(this, username)
    .then(username ? getUserId : noop)
    .bind(ctx)
    .then(token ? verifyToken : nthArg(0))
    .bind(this)
    .then(getInternalData)
    .then(activateAccount)
    .bind(ctx)
    .tap(hook)
    .bind(this)
    .then(userId => [userId, audience])
    .spread(jwt.login);
}

module.exports = activateAction;
