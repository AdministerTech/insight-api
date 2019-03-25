const BTCP2P = require('btcp2p').BTCP2P;
const async = require('async');
const Common = require('../lib/common');

const MNListPollInterval = 30 * 1000; // 30 seconds
const NodeDefaultOptions = {
  peerMagic: 'b1a6d7de',
  disableTransactions: true,
  protocolVersion: 70208,
  persist: false
};

function MasternodeService(options) {
  this.node = options.node;
  this.common = new Common({log: this.node.log});
  this.masternodeRepository = options.masternodeRepository;
  this.mnListFromNode = [];
}

MasternodeService.prototype.start = function(next) {
  let self = this;

  self.common.log.info('[MasternodeService] Start...');
  self.tryGetList();

  return next();
};

MasternodeService.prototype.tryGetList = function() {
  let self = this;
  const listPoll = setInterval(function() {
    const mnListHandler = function(error, result) {
      if (error) {
        self.common.log.info('[MasternodeService] error' + error);
      } else {
        if (result.length > 0) {
          self.mnListFromNode = result;
          self.common.log.info('[MasternodeService] got mn list. length: ' + self.mnListFromNode.length);
          self.updateMasternodeBasics();
          clearInterval(listPoll);
        }
      }
    }
    self.common.log.info('[MasternodeService] trying to get mn list');
    self.getMNList(mnListHandler);
  }, MNListPollInterval);
};

MasternodeService.prototype.updateMasternodeBasics = function() {
  let self = this;
  let promiseList = [];
  self.mnListFromNode.forEach(function(mn) {
    const vin = mn.vin.split('-');
    const outputHash = vin[0];
    const outputIndex = vin[1];
    const fullHost = mn.ip.split(':');
    const host = fullHost[0];
    const port = fullHost[1];
    const pubkey = mn.payee;
    const protocol = mn.protocol;
    const lastseen = mn.lastseen;
    const activeseconds = mn.activeseconds;

    promiseList.push(self.masternodeRepository.updateMasternodeBasics({
      outputHash,
      outputIndex,
      host,
      port,
      pubkey,
      protocol,
      lastseen,
      activeseconds
    }));
  });
  Promise.all(promiseList)
  .then(function(responses) {
    self.common.log.info('[MasternodeService] mns updated. count ' + responses.length);
    self.updateMasternodesP2P();
  })
  .catch(function(error) {
    self.common.log.info('[MasternodeService] error' + error);
  });
};

MasternodeService.prototype.updateMasternodeLastSeen = function() {

};

MasternodeService.prototype.updateMasternodesP2P = function() {
  let self = this;
  let p2pInfoPromises = [];
  self.mnListFromNode.forEach(function(mn) {
    const fullHost = mn.ip.split(':');
    const host = fullHost[0];
    const port = fullHost[1];
    const pubkey = mn.payee;
    p2pInfoPromises.push(self.getP2PInfo({
      host,
      port,
      pubkey
    }));
  });
  Promise.all(p2pInfoPromises)
  .then(function(responses) {
    responses.forEach(function(response) {
      self.common.log.info('[MasternodeService] p2p info ' + response);
    })
  })
  .catch(function(error) {
    self.common.log.info('[MasternodeService] p2p promise error' + error);
  })
};

/*
mnInfo {
  host: string
  port: number
  pubkey: string
}
*/
MasternodeService.prototype.getP2PInfo = function(mnInfo, timeout = 5000) {
  return new Promise(function(resolve, reject) {
    const connectOptions = Object.create(NodeDefaultOptions, {host: mnInfo.host, port: mnInfo.port});
    const mnConnection = new BTCP2P(connectOptions);
    let canConnect = false;
    let version = {};
    mnConnection.on('connect', function(e) {
      canConnect = true;
    });
    mnConnection.on('version', function(e) {
      version = Object.create(e, {pubkey: mnInfo.pubkey});
      mnConnection.client.end();
    });
    mnConnection.on('error', function(e) {
      resolve({
        canConnect,
        version: {
          pubkey: mnInfo.pubkey,
          error: e
        }
      });
    });
    mnConnection.on('disconnect', function(e) {
      resolve({
        canConnect,
        version
      });
    });
    setTimeout(function() {
      if (!canConnect) {
        resolve({
          canConnect,
          version: {
            pubkey: mnInfo.pubkey,
            error: 'timeout'
          }
        });
      }
    }, timeout);
  })
};

MasternodeService.prototype.updateMasternodeBalance = function() {

};

MasternodeService.prototype.updateMasternodeLastPaid = function () {

};

MasternodeService.prototype.getMNList = function(callback) {
	this.node.services.ravend.getMNList(function(err, result){
		let MNList = result || [];
		if (err) {
			return callback(err);
		}
		callback(null,MNList);
	});
};

module.exports = MasternodeService;
