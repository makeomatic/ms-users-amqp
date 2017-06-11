const is = require('is');
const assert = require('assert');
const forEach = require('lodash/forEach');
const defaults = require('lodash/defaults');
const strategies = require('./providers');

// helpers
const isArray = Array.isArray;
const stringToArray = (scope, scopeSeparator) => (isArray(scope) ? scope : scope.split(scopeSeparator));
const hapiOauthHandler = (request, reply) => {
  const redirectUri = request.response.redirectUri;

  // redirect if redirectURI is present
  if (redirectUri) {
    return reply.redirect(redirectUri);
  }

  return reply.continue();
};

/**
 * This function initiates bell plugin strategies on hapi.js webserver
 * @param {Hapi} server
 * @param {Objecr} config
 */
module.exports = function OauthHandler(server, config) {
  assert.ok(config.oauth, 'oauth configuration must be present');
  assert.ok(config.oauth.providers, 'oauth configuration must include providers');

  server.ext('onPreResponse', hapiOauthHandler);

  forEach(config.oauth.providers, (options, name) => {
    const strategy = strategies[name];

    if (options.enabled === false) {
      return;
    }

    if (!strategy) {
      throw new Error(`OAuth: unknown strategy ${name}`);
    }

    let provider;
    const defaultOptions = strategy.options;
    const { scope, fields, profileHandler, scopeSeparator, apiVersion, enabled, retryOnMissingPermissions, ...rest } = options;

    // make sure runtime params are allowed in we want to retry as we need to defined dynamic
    // redirect params
    if (retryOnMissingPermissions === true) {
      rest.allowRuntimeProviderParams = true;
    }

    if (defaultOptions) {
      const configuredOptions = {
        name,
        scope: stringToArray(scope),
        scopeSeparator,
      };

      if (is.fn(defaultOptions)) {
        provider = defaultOptions({ ...configuredOptions, apiVersion, fields, profileHandler });
      } else {
        provider = defaults(configuredOptions, defaultOptions);
      }
    } else {
      // use bell defaults
      provider = name;
    }

    server.auth.strategy(name, 'bell', { provider, ...rest });
  });

  return server;
};
