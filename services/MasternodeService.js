const Common = require('../lib/common');

const MNListPollInterval = 30 * 1000; // 30 seconds

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

    self.masternodeRepository.updateMasternodeBasics({
      outputHash,
      outputIndex,
      host,
      port,
      pubkey,
      protocol,
      lastseen,
      activeseconds
    }).then(function(response) {
      self.common.log.info('[MasternodeService] mn updated ' + pubkey);
    }).catch(function(error) {
      self.common.log.info('[MasternodeService] error' + error);
    });
  });
};

MasternodeService.prototype.updateMasternodeLastSeen = function() {

};

MasternodeService.prototype.updateMasternodeP2P = function() {

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
