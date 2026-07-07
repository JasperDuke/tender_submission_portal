/** Legacy DB value – treated the same as Awarded in UI and counts */
export const LEGACY_AWARDED_STATUS = 'Accepted';
export const AWARDED_STATUS = 'Awarded';

export const AWARDED_STATUSES = [AWARDED_STATUS, LEGACY_AWARDED_STATUS] as const;

export function isAwardedStatus(status: string): boolean {
  return (AWARDED_STATUSES as readonly string[]).includes(status);
}

/** Map legacy Accepted → Awarded for display labels */
export function displayProposalStatus(status: string): string {
  return status === LEGACY_AWARDED_STATUS ? AWARDED_STATUS : status;
}

export function proposalStatusLabelKey(status: string): string {
  const display = displayProposalStatus(status);
  const known = ['Pending', 'Reviewed', 'Shortlisted', 'Awarded', 'Rejected'];
  return known.includes(display) ? `proposals.status${display}` : status;
}
