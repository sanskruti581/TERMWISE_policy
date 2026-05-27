import { extractActorRoles } from './actorRoleExtractor.js';

const inferRelationship = (roles) => {
  const roleKeys = new Set((roles?.roles || []).map((r) => r.key));
  const has = (k) => roleKeys.has(k);

  // Directional hints via common verbs/phrasing (best-effort)
  // We keep this deterministic and lightweight.
  if ((has('lender') || has('borrower')) && (has('borrower') || has('lender'))) {
    if (has('borrower') && has('lender')) return { key: 'lender-borrower', label: 'Lender ↔ Borrower', direction: 'both' };
  }

  if (has('university') && (has('contractor') || has('vendor'))) {
    return {
      key: 'university-contractor/vendor',
      label: 'University ↔ Contractor/Vendor',
      direction: 'university-oversight'
    };
  }

  if ((has('employer') || has('company') || has('platform')) && has('employee')) {
    return { key: 'employer-employee', label: 'Employer ↔ Employee', direction: 'employer-oversight' };
  }

  if ((has('platform') || has('dataProcessor') || has('dataController')) && has('user')) {
    return { key: 'platform-user', label: 'Platform ↔ User', direction: 'platform-controls' };
  }

  if (has('purchaser') && (has('vendor') || has('contractor'))) {
    return { key: 'purchaser-vendor', label: 'Purchaser ↔ Vendor', direction: 'purchaser-entitlement' };
  }

  if ((has('vendor') || has('contractor')) && has('purchaser')) {
    return { key: 'purchaser-vendor', label: 'Purchaser ↔ Vendor', direction: 'vendor-performance' };
  }

  return { key: 'unknown', label: 'Unknown relationship', direction: 'unknown' };
};

export const extractRelationshipSemantics = (text) => {
  const actor = extractActorRoles(text);
  const relationship = inferRelationship(actor);

  return {
    ...actor,
    relationship
  };
};

