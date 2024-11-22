const {
  CHALLENGE_TYPE_EMAIL,
  CHALLENGE_TYPE_PHONE,
  USERS_ACTION_ACTIVATE,
  USERS_ACTION_DISPOSABLE_PASSWORD,
  USERS_ACTION_REGISTER,
  USERS_ACTION_RESET,
  USERS_ACTION_UPDATE_USERNAME,
  USERS_ACTION_VERIFY_CONTACT,
} = require('../constants');

/**
 * This is the configuration used for https://github.com/makeomatic/ms-token
 * This allows to create email / phone challenges for activation of accounts
 * or some other sensitive actions
 * @type {Object}
 */
exports.tokenManager = {
  backend: {
    name: 'redis',
    prefix: 'tmanager!1.0.0',
  },
  encrypt: {
    algorithm: 'aes256',
    sharedSecret: 'replace-shared-secret-with-32-by',
    // must be 256bit / 32 bytes for aes256 ^
  },
};

/**
 * Specific settings for email/phone tokens
 * @type {Object}
 */
exports.token = {
  [CHALLENGE_TYPE_EMAIL]: {
    secret: {
      encrypt: true,
      type: 'uuid',
    },
    throttle: 2 * 60 * 60, // dont send emails more than once in 2 hours
    ttl: 4 * 60 * 60, // do not let password to be reset with expired codes
  },
  [CHALLENGE_TYPE_PHONE]: {
    secret: {
      length: 4,
      type: 'number',
    },
    throttle: 5 * 60, // dont send sms more than once in 5 minutes
    ttl: 10 * 60,
    regenerate: true,
  },
  erase: true,
};

/**
 * Phone challenge settings
 * @type {Object}
 */
exports.phone = {
  account: 'replace-with-your-account',
  messages: {
    [USERS_ACTION_ACTIVATE]: '%s is your activation code',
    [USERS_ACTION_DISPOSABLE_PASSWORD]: '%s is your disposable password',
    [USERS_ACTION_REGISTER]: '%s is your password',
    [USERS_ACTION_RESET]: '%s is your code for reset password',
    [USERS_ACTION_UPDATE_USERNAME]: '%s is your code for update username',
    [USERS_ACTION_VERIFY_CONTACT]: '%s is your verification code',
  },
  route: 'phone.message.predefined',
  publishOptions: {},
  waitChallenge: false,
};

/**
 * User contacts settings
 * @type {Object}
 */
exports.contacts = {
  max: 5,
  onlyOneVerifiedEmail: true,
  allowRemoveFirstContact: true,
};
