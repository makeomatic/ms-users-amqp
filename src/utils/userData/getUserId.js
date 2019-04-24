const getInternalData = require('./getInternalData');
const isBanned = require('../isBanned');

async function getUserId(username, verifyBanned = false) {
  const internalData = await getInternalData
    .call(this, username, verifyBanned === true);

  if (verifyBanned === true) {
    isBanned(verifyBanned);
  }

  return internalData.id;
}

module.exports = getUserId;
