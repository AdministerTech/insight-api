const Common = require('../lib/common');

function MasternodeService(options) {
  this.node = options.node;
  this.common = new Common({log: this.node.log});
}

MasternodeService.prototype.start = function(next) {
  var self = this;

  this.common.log.info('[MasternodeService] Start...');

  return next()
}

MasternodeService.prototype.updateMasternodeBasics = function() {
  // get
}

MasternodeService.prototype.updateMasternodeLastSeen = function() {

}

MasternodeService.prototype.updateMasternodeP2P = function() {

}

MasternodeService.prototype.updateMasternodeBalance = function() {

}

MasternodeService.prototype.updateMasternodeLastPaid = function () {

}

module.exports = MasternodeService;
