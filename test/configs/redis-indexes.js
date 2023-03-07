/**
 * Provides configuration for searching redis indexes
 * @type {Array} Array of objects: filterKey without prefix, audience list, fields [field, type, attributes]
*/

exports.redisIndexDefinitions = [
  // Index Name: {ms-users}-metadata-*.localhost-idx
  // Index Filter: metadata!*.localhost
  {
    filterKey: 'metadata',
    audience: ['*.localhost'],
    fields: [
      ['id', 'TAG', 'SORTABLE'],
      ['username', 'TEXT', 'NOSTEM', 'SORTABLE'],
      ['firstName', 'TEXT', 'NOSTEM', 'SORTABLE'],
      ['lastName', 'TEXT', 'NOSTEM', 'SORTABLE'],
    ],
    multiWords: ['username'],
  },
  // Index Name: {ms-users}-test-api-idx
  // Index Filter: test!api
  {
    filterKey: 'test',
    audience: ['api'],
    fields: [
      ['id', 'TEXT', 'NOSTEM', 'SORTABLE'],
      ['email', 'TEXT', 'NOSTEM', 'SORTABLE'],
      ['level', 'NUMERIC', 'SORTABLE'],
    ],
    multiWords: ['email'],
  },
];
