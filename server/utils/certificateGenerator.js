const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const FONTS_DIR = path.join(__dirname, '..', 'assets', 'fonts');

const typeText = {
  participation: 'for participating in',
  completion: 'for successfully completing',
  winner: 'for outstanding achievement in',
};

const typeHeading = {
  participation: 'CERTIFICATE OF PARTICIPATION',
  completion: 'CERTIFICATE OF COMPLETION',
  winner: 'CERTIFICATE OF ACHIEVEMENT',
};

const typeSubheading = {
  participation: 'OF PARTICIPATION',
  completion: 'OF COMPLETION',
  winner: 'OF ACHIEVEMENT',
};

const typeParagraph = {
  participation: 'Presented in recognition of sincere participation and enthusiastic involvement in the event. Your curiosity, dedication, and willingness to learn have added meaningful value to this experience. This certificate celebrates your active engagement, valuable contribution, and the spirit of learning demonstrated throughout the event.',
  completion: 'Presented in recognition of the successful completion of all requirements of the program. Your consistent effort, dedication, and commitment to learning have contributed to this achievement. This certificate celebrates your perseverance, discipline, and the valuable progress made throughout the duration of the program.',
  winner: 'Presented in recognition of outstanding performance and remarkable achievement in the event. Your dedication, determination, and pursuit of excellence have set an inspiring example for others. This certificate celebrates your well-deserved success, exceptional contribution, and the commitment that led to this memorable accomplishment.',
};

const themes = {
  classicGold: { background: '#fdfcf8', dark: '#1a1a2e', accent: '#c9a227', text: '#444444' },
  emerald: { background: '#f7faf8', dark: '#0b3d2e', accent: '#2e8b57', text: '#3a3a3a' },
  royalBurgundy: { background: '#fdf7f7', dark: '#4a1620', accent: '#8c2f39', text: '#3a3a3a' },
};

const registerFonts = (doc) => {
  doc.registerFont('Heading', path.join(FONTS_DIR, 'PlayfairDisplay-Bold.ttf'));
  doc.registerFont('Body', path.join(FONTS_DIR, 'PlayfairDisplay-Regular.ttf'));
  doc.registerFont('Script', path.join(FONTS_DIR, 'GreatVibes-Regular.ttf'));
};

const drawSeal = (doc, cx, cy, r, theme) => {
  doc.circle(cx, cy, r).fill(theme.accent);
  doc.circle(cx, cy, r - 5).lineWidth(1).stroke(theme.background);
  doc.font('Body').fontSize(7).fillColor(theme.background)
    .text('CERTIFIED', cx - r, cy - 6, { width: r * 2, align: 'center' });
};

const drawMedal = (doc, cx, cy, r, theme) => {
  doc.circle(cx, cy, r + 6).fill(theme.dark);
  doc.circle(cx, cy, r).fill(theme.accent);
  doc.circle(cx, cy, r - 6).lineWidth(1).stroke(theme.background);

  const points = 5;
  const outerR = r - 14;
  const innerR = outerR * 0.45;
  const star = [];
  for (let i = 0; i < points * 2; i++) {
    const rad = (Math.PI / points) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? outerR : innerR;
    star.push([cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)]);
  }
  doc.polygon(...star).fill(theme.background);

  [-1, 1].forEach((side) => {
    doc.save();
    doc.translate(cx + side * (r + 4), cy + r + 6);
    doc.rotate(side * 30);
    doc.ellipse(0, 0, 5, 12).fill(theme.accent);
    doc.restore();
  });
};

// ---------- Layout 1: Ribbon Elegant ----------
const drawRibbonElegant = (doc, data, theme) => {
  const { W, H, participantName, certificateType, eventTitle, formattedDate, signatureName, signatureDesignation, certificateId, qrBuffer } = data;

  doc.rect(0, 0, W, H).fill(theme.background);
  doc.rect(0, 0, 100, H).fill(theme.dark);
  doc.rect(100, 0, 6, H).fill(theme.accent);

  doc.rect(126, 26, W - 152, H - 66).lineWidth(1).stroke(theme.accent);

  const cx = 100, cw = W - 100;

  drawSeal(doc, 55, H - 78, 34, theme);

  doc.font('Heading').fontSize(24).fillColor(theme.dark)
    .text(typeHeading[certificateType] || typeHeading.participation, cx, 75, { width: cw, align: 'center', characterSpacing: 1 });
  doc.moveTo(cx + cw / 2 - 55, 111).lineTo(cx + cw / 2 + 55, 111).lineWidth(1).stroke(theme.accent);

  doc.font('Body').fontSize(12).fillColor(theme.text)
    .text('This certificate is proudly presented to', cx, 138, { width: cw, align: 'center' });

  doc.font('Script').fontSize(44).fillColor(theme.dark)
    .text(participantName, cx, 158, { width: cw, align: 'center' });

  doc.font('Body').fontSize(12).fillColor(theme.text)
    .text(typeText[certificateType] || typeText.participation, cx, 228, { width: cw, align: 'center' });

  doc.font('Heading').fontSize(18).fillColor(theme.dark)
    .text(eventTitle, cx, 251, { width: cw, align: 'center' });

  doc.font('Body').fontSize(11).fillColor(theme.text)
    .text(formattedDate, cx, 284, { width: cw, align: 'center' });

  if (signatureName) {
    doc.font('Heading').fontSize(13).fillColor(theme.dark).text(signatureName, cx + 40, H - 108, { width: 220 });
    doc.moveTo(cx + 40, H - 86).lineTo(cx + 260, H - 86).lineWidth(0.75).stroke('#999');
    doc.font('Body').fontSize(9).fillColor('#777').text(signatureDesignation || 'Organizer', cx + 40, H - 78, { width: 220 });
  }

  const qrSize = 55;
  doc.image(qrBuffer, W - 150 - qrSize, H - 120, { width: qrSize, height: qrSize });
  doc.font('Body').fontSize(7).fillColor('#999').text('Scan to verify', W - 150 - qrSize, H - 60, { width: qrSize, align: 'center' });

  doc.font('Body').fontSize(8).fillColor('#999').text(`Certificate ID: ${certificateId}`, cx + 50, H - 64);
};

// ---------- Layout 2: Header Block ----------
const drawModernBadge = (doc, data, theme) => {
  const { W, H, participantName, certificateType, eventTitle, formattedDate, signatureName, signatureDesignation, certificateId, qrBuffer } = data;

  const headerHeight = 150;
  const margin = 24;

  doc.rect(0, 0, W, H).fill(theme.background);

  doc.rect(margin, margin, W - margin * 2, headerHeight).fill(theme.dark);
  doc.rect(margin, margin, W - margin * 2, H - margin * 2).lineWidth(1.5).stroke(theme.accent);

  doc.font('Script').fontSize(52).fillColor(theme.background)
  .text('Certificate', 0, margin + 16, { width: W, align: 'center' });
doc.font('Body').fontSize(16).fillColor(theme.background)
  .text(typeSubheading[certificateType] || typeSubheading.participation, 0, margin + 84, {
    width: W, align: 'center', characterSpacing: 4,
  });

  const badgeCenterY = margin + headerHeight;
  drawSeal(doc, W - 150, badgeCenterY, 42, theme);

  const bodyTop = badgeCenterY + 55;

  doc.font('Heading').fontSize(26).fillColor(theme.dark)
    .text(participantName, 90, bodyTop, { width: W - 180, align: 'center' });
  const nameWidth = Math.min(doc.widthOfString(participantName) + 20, W - 180);
  doc.moveTo(W / 2 - nameWidth / 2, bodyTop + 34).lineTo(W / 2 + nameWidth / 2, bodyTop + 34).lineWidth(0.75).stroke('#999');

  doc.font('Body').fontSize(12).fillColor(theme.text)
    .text(`${typeText[certificateType] || typeText.participation} ${eventTitle}`, 90, bodyTop + 46, { width: W - 180, align: 'center' });

  doc.font('Body').fontSize(11).fillColor(theme.text)
  .text(typeParagraph[certificateType] || typeParagraph.participation, 120, bodyTop + 74, { width: W - 240, align: 'center', lineGap: 3 });

const footerTop = bodyTop + 220;

  doc.font('Body').fontSize(9).fillColor('#888').text(formattedDate, 0, footerTop, { width: W, align: 'center' });

  if (signatureName) {
    doc.font('Script').fontSize(22).fillColor(theme.dark).text(signatureName, 90, footerTop + 22, { width: 200 });
    doc.moveTo(90, footerTop + 50).lineTo(290, footerTop + 50).lineWidth(0.75).stroke('#999');
    doc.font('Body').fontSize(8).fillColor('#777').text(signatureDesignation || 'Organizer', 90, footerTop + 58, { width: 200 });
  }

  const qrSize = 50;
  doc.image(qrBuffer, W - 200, footerTop + 18, { width: qrSize, height: qrSize });
  doc.font('Body').fontSize(7).fillColor('#999').text(`Certificate ID: ${certificateId}`, W - 230, footerTop + 72, { width: 110, align: 'center' });
};

// ---------- Layout 3: Diagonal Ribbon ----------
const drawOrnateBorder = (doc, data, theme) => {
  const { W, H, participantName, certificateType, eventTitle, formattedDate, signatureName, signatureDesignation, certificateId, qrBuffer } = data;

  doc.rect(0, 0, W, H).fill(theme.background);

  doc.polygon([0, 0], [W * 0.16, 0], [W * 0.34, H], [0, H]).fill(theme.dark);
doc.polygon([W * 0.16, 0], [W * 0.16 + 14, 0], [W * 0.34 + 14, H], [W * 0.34, H]).fill(theme.accent);

drawMedal(doc, 184, 140, 42, theme);

const contentX = 300;
const contentW = W - contentX - 50;

doc.font('Heading').fontSize(24).fillColor(theme.dark)
  .text(typeHeading[certificateType] || typeHeading.participation, contentX, 78, { width: contentW, align: 'center' });
doc.moveTo(contentX + contentW / 2 - 55, 112).lineTo(contentX + contentW / 2 + 55, 112).lineWidth(1).stroke(theme.accent);

doc.font('Body').fontSize(11).fillColor(theme.text)
  .text('Proudly presented to', contentX, 136, { width: contentW, align: 'center' });

doc.font('Script').fontSize(42).fillColor(theme.accent)
  .text(participantName, contentX, 172, { width: contentW, align: 'center' });

doc.font('Body').fontSize(10).fillColor(theme.text)
  .text(`${typeText[certificateType] || typeText.participation} ${eventTitle}. ${typeParagraph[certificateType] || typeParagraph.participation}`, contentX + 20, 246, {
    width: contentW - 40, align: 'center', lineGap: 2,
  });

doc.font('Heading').fontSize(11).fillColor(theme.dark)
  .text(formattedDate, contentX, 326, { width: contentW, align: 'center' });

const footerY = 460;

  if (signatureName) {
    doc.font('Heading').fontSize(11).fillColor(theme.dark).text(signatureName, contentX + 20, footerY, { width: 180 });
    doc.moveTo(contentX + 20, footerY + 22).lineTo(contentX + 200, footerY + 22).lineWidth(0.75).stroke('#999');
    doc.font('Body').fontSize(8).fillColor('#777').text(signatureDesignation || 'Organizer', contentX + 20, footerY + 28, { width: 180 });
  }

  const qrSize = 55;
  doc.image(qrBuffer, W - 100 - qrSize, footerY - 10, { width: qrSize, height: qrSize });
  doc.font('Body').fontSize(7).fillColor('#999').text('Scan to verify', W - 100 - qrSize, footerY + 48, { width: qrSize, align: 'center' });

  doc.font('Body').fontSize(7).fillColor('#999').text(`Certificate ID: ${certificateId}`, contentX + 20, footerY + 62);
};

const layoutRenderers = {
  ribbonElegant: drawRibbonElegant,
  modernBadge: drawModernBadge,
  ornateBorder: drawOrnateBorder,
};

const generateCertificatePDF = async ({
  participantName,
  eventTitle,
  eventDate,
  certificateId,
  certificateType = 'participation',
  designTheme = 'classicGold',
  layoutStyle = 'ribbonElegant',
  signatureName,
  signatureDesignation,
}) => {
  const qrBuffer = await QRCode.toBuffer(certificateId, { margin: 1 });
  const theme = themes[designTheme] || themes.classicGold;
  const renderer = layoutRenderers[layoutStyle] || layoutRenderers.ribbonElegant;

  const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    registerFonts(doc);

    renderer(doc, {
      W: doc.page.width,
      H: doc.page.height,
      participantName,
      certificateType,
      eventTitle,
      formattedDate,
      signatureName,
      signatureDesignation,
      certificateId,
      qrBuffer,
    }, theme);

    doc.end();
  });
};

module.exports = generateCertificatePDF;