const crypto = require('crypto');

// Human-readable ID for display purposes only (e.g. REG-2026-00482)
const generateRegistrationId = (sequenceNumber) => {
  const year = new Date().getFullYear();
  const paddedNumber = String(sequenceNumber).padStart(5, '0');
  return `REG-${year}-${paddedNumber}`;
};

// Random, non-guessable token — this is what actually goes inside the QR code
const generateQrToken = () => {
  return crypto.randomBytes(24).toString('base64url');
};

// Human-readable, unique certificate ID (e.g. CERT-2026-00182)
const generateCertificateId = (sequenceNumber) => {
  const year = new Date().getFullYear();
  const paddedNumber = String(sequenceNumber).padStart(5, '0');
  return `CERT-${year}-${paddedNumber}`;
};

module.exports = { generateRegistrationId, generateQrToken, generateCertificateId };