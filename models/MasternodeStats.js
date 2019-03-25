const mongoose = require('mongoose');

const masternodeStatsSchema = new mongoose.Schema({
  MasternodeOutputHash: {
    type: String,
    required: true,
    index: true
  },
  MasternodeOutputIndex: {
    type: Number,
    required: true
  },
  MasternodeIP: {
    type: String,
    required: true
  },
  MasternodeTor: {
    type: String
  },
  MasternodePort: {
    type: Number,
    required: true
  },
  MasternodePubkey: {
    type: String,
    required: true
  },
  MasternodeProtocol: {
    type: Number
  },
  MasternodeLastSeen: {
    type: Number
  },
  MasternodeActiveSeconds: {
    type: Number
  },
  MasternodeLastPaid: {
    type: Number
  },
  ActiveCount: {
    type: Number
  },
  InactiveCount: {
    type: Number
  },
  UnlistedCount: {
    type: Number
  },
  MasternodeLastPaidBlock: {
    type: String
  },
  MasternodeDaemonVersion: {
    type: String
  },
  MasternodeSentinelVersion: {
    type: String
  },
  MasternodeSentinelState: {
    type: String
  },
  LastPaidFromBlocks: {
    MNLastPaidBlock: {
      type: Number
    },
    MNLastPaidTime: {
      type: Number
    },
    MNLastPaidAmount: {
      type: Number
    }
  },
  Portcheck: {
    Result: {
      type: String
    },
    SubVer: {
      type: String
    },
    NextCheck: {
      type: Number
    },
    ErrorMessage: {
      type: String
    },
    Country: {
      type: String
    },
    CountryCode: {
      type: String
    }
  },
  Balance: {
    Value: {
      type: Number
    },
    LastUpdate: {
      type: Number
    }
  }
});

const MasternodeStats = mongoose.model('MasternodeStats', masternodeStatsSchema);

module.exports = MasternodeStats;
