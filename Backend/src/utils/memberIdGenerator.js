const { AdminModel } = require("../Admin/admin.model");
const { MasterAdminModel } = require("../MasterAdmin/masterAdmin.model");
const { farmerModel } = require("../Farmer/farmer.model");

/**
 * Generate Next Master Admin Member ID: MI-MST-001, MI-MST-002...
 */
const generateMasterAdminMemberId = async () => {
  const masters = await MasterAdminModel.find({ memberId: { $regex: /^MI-MST-/i } })
    .select("memberId")
    .lean();

  let maxNum = 0;
  for (const m of masters) {
    if (m.memberId) {
      const match = m.memberId.match(/^MI-MST-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  if (maxNum === 0) {
    const total = await MasterAdminModel.countDocuments();
    maxNum = total;
  }

  const nextNum = maxNum + 1;
  return `MI-MST-${String(nextNum).padStart(3, "0")}`;
};

/**
 * Generate Next Dairy Admin Member ID: MI-DA-001, MI-DA-002...
 */
const generateDairyAdminMemberId = async () => {
  const admins = await AdminModel.find({ memberId: { $regex: /^MI-DA-/i } })
    .select("memberId")
    .lean();

  let maxNum = 0;
  for (const a of admins) {
    if (a.memberId) {
      const match = a.memberId.match(/^MI-DA-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  if (maxNum === 0) {
    const total = await AdminModel.countDocuments();
    maxNum = total;
  }

  const nextNum = maxNum + 1;
  return `MI-DA-${String(nextNum).padStart(3, "0")}`;
};

/**
 * Generate Self-Farmer Member ID for Dairy Admin: MI-DAS-001 (matches Dairy Admin MI-DA-001)
 */
const generateAdminSelfFarmerMemberId = (adminMemberId) => {
  if (adminMemberId) {
    const match = adminMemberId.match(/^MI-DA-(\d+)/i);
    if (match) {
      return `MI-DAS-${match[1]}`;
    }
  }
  return "MI-DAS-001";
};

/**
 * Generate Next Farmer Member ID: MI-FAR-0001, MI-FAR-0002...
 */
const generateFarmerMemberId = async () => {
  const farmers = await farmerModel.find({ memberId: { $regex: /^MI-FAR-/i } })
    .select("memberId")
    .lean();

  let maxNum = 0;
  for (const f of farmers) {
    if (f.memberId) {
      const match = f.memberId.match(/^MI-FAR-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  if (maxNum === 0) {
    // If legacy MI-### exists, check highest number
    const legacyFarmers = await farmerModel.find().select("memberId").lean();
    for (const f of legacyFarmers) {
      if (f.memberId) {
        const match = f.memberId.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  return `MI-FAR-${String(nextNum).padStart(4, "0")}`;
};

module.exports = {
  generateMasterAdminMemberId,
  generateDairyAdminMemberId,
  generateAdminSelfFarmerMemberId,
  generateFarmerMemberId,
};
