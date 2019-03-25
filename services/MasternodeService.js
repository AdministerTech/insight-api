const Common = require('../lib/common');

function MasternodeService(options) {
  this.node = options.node;
  this.common = new Common({log: this.node.log});
}

MasternodeService.prototype.start = function(next) {
  let self = this;

  self.common.log.info('[MasternodeService] Start...');
  self.tryGetList();

  return next();
};

MasternodeService.prototype.tryGetList = function () {
  let self = this;
  let list = [];
  const listPoll = setInterval(function() {
    const mnListHandler = function(error, result) {
      if (error) {
        self.common.log.info('[MasternodeService] error' + error);
      } else {
        if (result.length > 0) {
          list = result;
          self.common.log.info('[MasternodeService] got mn list. length: ' + list.length);
          clearInterval(listPoll);
        }
      }
    }
    self.common.log.info('[MasternodeService] trying to get mn list');
    self.getMNList(mnListHandler);
  }, 5000);
};

MasternodeService.prototype.updateMasternodeBasics = function() {
  // get

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
