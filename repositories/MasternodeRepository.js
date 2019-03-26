const MasternodeStats = require('../models/MasternodeStats');
const async = require('async');

function MasternodeRepository() {
  this.mnCache = [];
}

function getMasternodePubkey(pubkey) {
  return MasternodeStats.findOne({MasternodePubkey: pubkey}, {MasternodePubkey: 1}).exec()
}

  /*
  mnInfo {
    outputHash: string
    outputIndex: number
    host: string
    port: number
    pubkey: string
  }
  */
MasternodeRepository.prototype.updateMasternodeBasics = function(mnInfo) {
  return MasternodeStats.update({MasternodePubkey: mnInfo.pubkey}, {$set: {
    MasternodeOutputHash: mnInfo.outputHash,
    MasternodeOutputIndex: mnInfo.outputIndex,
    MasternodeIP: mnInfo.host,
    MasternodePort: mnInfo.port,
    MasternodePubkey: mnInfo.pubkey,
    MasternodeProtocol: mnInfo.protocol,
    MasternodeLastSeen: mnInfo.lastseen,
    MasternodeActiveSeconds: mnInfo.activeseconds
  }}, {upsert: true}).exec()
}

MasternodeRepository.prototype.updateMasternodeLastSeen = function(pubkey, lastSeen) {
  return MasternodeStats.update({MasternodePubkey: pubkey}, {$set: {MasternodeLastSeen: lastSeen}}).exec()
}

/*
  mnInfo {
    protocol: number,
    version: string
    canConnect: boolean,
    subver: string
    }
  }
*/
MasternodeRepository.prototype.updateMasternodeP2P = function(mnInfo) {
  const next = Date.now() + 86400 * 1000;
  return MasternodeStats.update({MasternodePubkey: mnInfo.pubkey}, {$set: {
    MasternodeDaemonVersion: mnInfo.version,
    Portcheck: {
      Result: (mnInfo.canConnect) ? 'open': 'closed',
      SubVer: mnInfo.subver,
      NextCheck: next
    }
  }}).exec()
}

MasternodeRepository.prototype.updateMasternodeBalance = function(pubkey, balance) {
  return MasternodeStats.update({MasternodePubkey: pubkey}, {$set: {
    Balance: {
      Value: balance,
      LastUpdate: Date.now()
    }
  }}).exec()
}

MasternodeRepository.prototype.updateMasternodeLastPaid = function(pubkey, block, time, amount) {
  return MasternodeStats.update({MasternodePubkey: pubkey}, {$set: {
    LastPaidFromBlocks: {
      MNLastPaidBlock: block,
      MNLastPaidTime: time,
      MNLastPaidAmount, amount
    }
  }}).exec()
}

MasternodeRepository.prototype.updateInternalCache = function() {
  let self = this;
  MasternodeStats.find({}, {_id: 0, __v: 0}).exec()
  .then(function(results) {
    self.mnCache = results;
  })
  .catch(function(error) {
    // error in find all, not likely
  });
}

module.exports = MasternodeRepository;
