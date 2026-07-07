/** Legacy status value kept for backward compatibility with existing records */
const LEGACY_AWARDED_STATUS = 'Accepted';
const AWARDED_STATUS = 'Awarded';

const AWARDED_STATUSES = [AWARDED_STATUS, LEGACY_AWARDED_STATUS];

function isAwardedStatus(status) {
  return AWARDED_STATUSES.includes(status);
}

/** Normalize legacy Accepted to Awarded for API responses (optional) */
function normalizeProposalStatus(status) {
  if (status === LEGACY_AWARDED_STATUS) return AWARDED_STATUS;
  return status;
}

/** MongoDB aggregation: count proposals that are awarded (incl. legacy Accepted) */
const awardedCountAggregation = {
  $sum: {
    $cond: [{ $in: ['$status', AWARDED_STATUSES] }, 1, 0],
  },
};

module.exports = {
  AWARDED_STATUS,
  LEGACY_AWARDED_STATUS,
  AWARDED_STATUSES,
  isAwardedStatus,
  normalizeProposalStatus,
  awardedCountAggregation,
};
