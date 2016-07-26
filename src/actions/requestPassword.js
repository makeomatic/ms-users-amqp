const Promise = require('bluebird');
const emailValidation = require('../utils/send-email.js');
const getInternalData = require('../utils/getInternalData.js');
const isActive = require('../utils/isActive.js');
const isBanned = require('../utils/isBanned.js');

/**
 * @api {amqp} <prefix>.requestPassword Reset Password
 * @apiVersion 1.0.0
 * @apiName PasswordReset
 * @apiGroup Users
 *
 * @apiDescription Allows one either to request new password instantly, or generate a challenge.
 * In the first case would send new password to email instantly and will change it in the system. Use-case is discouraged, because
 * it can be used to DOS account (throttling not implemented). Second case sends reset token to email and it can be used in `updatePassword`
 * endpoint alongside new password to generate it
 *
 * @apiParam (Payload) {String} username - currently only email is supported
 * @apiParam (Payload) {String} remoteip - ip address of the requester
 * @apiParam (Payload) {Boolean} [generateNewPassword=false] - send password immediately
 */
function requestPassword(request) {
  const { username, generateNewPassword } = request.params;
  const action = generateNewPassword ? 'password' : 'reset';

  // TODO: make use of remoteip in security logs?
  // var remoteip = request.params.remoteip;

  return Promise
    .bind(this, username)
    .then(getInternalData)
    .tap(isActive)
    .tap(isBanned)
    .then(() => emailValidation.send.call(this, username, action))
    .return({ success: true });
}

module.exports = requestPassword;
