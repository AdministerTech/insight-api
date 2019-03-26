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
  self.masternodeRepository.updateInternalCache();
  self.tryGetList();
  return next();
};

MasternodeService.prototype.tryGetList = function() {
  let self = this;
  const listPoll = setInterval(function() {
    const mnListHandler = function(error, result) {
      if (error) {
        self.common.log.info('[MasternodeService] error ' + error);
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
    self.common.log.info('[MasternodeService] error ' + error);
  });
};

MasternodeService.prototype.updateMasternodesP2P = function() {
  let self = this;
  let p2pInfoPromises = [];

  const sequentialPromises = function(promises, success, error) {
    let index = 0;
    const executePromise = function(promise, success, error) {
      await promise.then(function(response) {
        self.common.log.info('[MasternodeService] got p2p response: ' + response.client + response.host);
        self.updateP2PinDB(response);
      })
      .catch(function(error) {
        self.common.log.info('[MasternodeService] p2p promise error ' + error);
      })
      .finally(function() {
        if (index < promises.length - 1) {
          index++;
          executePromise(promises[index]);
        }
      });
    }

    executePromise(promises[index]);
  }

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

  sequentialPromises(p2pInfoPromises);
};



MasternodeService.prototype.updateP2PinDB = function(response) {
  let self = this;
  let promises = [];

  // p2pResponses.forEach(function(response) {
  //   self.common.log.info('[MasternodeService] client: ' + response.client);
  //   promises.push();
  // });
  // Promise.all(promises)
  // .then(function(responses) {
  //   //success
  //   self.masternodeRepository.updateInternalCache();
  // })
  // .catch(function(error) {
  //   //fail
  //   self.common.log.info('[MasternodeService] error ' + error);
  // });


  self.masternodeRepository.updateMasternodeP2P({
    pubkey: response.pubkey,
    version: (response.canConnect) ? String(response.version) : '',
    canConnect: response.canConnect,
    subver: (response.canConnect) ? response.client : ''
  })
  .then(function(result) {
    self.masternodeRepository.updateInternalCache();
  })
  .catch(function(error) {
    self.common.log.info('[MasternodeService] error ' + error);
  })
}

/*
mnInfo {
  host: string
  port: number
  pubkey: string
}
*/
MasternodeService.prototype.getP2PInfo = function(mnInfo, timeout = 3000) {
  let self = this;
  return new Promise(function(resolve, reject) {
    const connectOptions = Object.assign({}, NodeDefaultOptions, {host: mnInfo.host, port: mnInfo.port});
    const mnConnection = new BTCP2P(connectOptions);
    let canConnect = false;
    let version = {};
    mnConnection.on('connect', function(e) {
      canConnect = true;
      self.common.log.info('[MasternodeService] connected to: ' + connectOptions.host);
    });
    mnConnection.on('version', function(e) {
      version = Object.assign({}, e, {pubkey: mnInfo.pubkey});
      mnConnection.client.end();
      self.common.log.info('[MasternodeService] got version: ' + connectOptions.host + ' client: ' + version.client);
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
      self.common.log.info('[MasternodeService] disconnected from: ' + connectOptions.host);
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
