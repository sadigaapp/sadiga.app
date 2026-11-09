import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PRD } from '../types';

export function formatDate(s: string): string {
  if (!s) return '-';
  if (/^\d{4}-\d\d-\d\d$/.test(s)) {
    return s.split('-').reverse().join('/');
  }
  return s;
}

const BLN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function tglIndo(s?: string): string {
  const d = s ? new Date(s + 'T00:00:00') : new Date();
  return `${d.getDate()} ${BLN[d.getMonth()]} ${d.getFullYear()}`;
}

export function escapeHtml(s: any): string {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c] || c));
}

// Generate F4 Table PDF
export function exportTableF4Pdf(title: string, headers: string[], rows: (string | number)[][], metadata?: {
  kelas?: string;
  mapel?: string;
  periode?: string;
  creator?: string;
}) {
  const doc = new jsPDF({
    unit: 'mm',
    format: [215, 330] // Standard Indonesian Folio/F4 paper size
  });
  const W = 215;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(27, 85, 88);
  doc.text('SADIGA - Sistem Administrasi Digital Granada', W / 2, 16, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(22, 40, 42);
  doc.text('Laporan ' + title, W / 2, 23, { align: 'center' });

  // Metadata Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(93, 113, 115);
  const metaParts: string[] = [];
  if (metadata?.kelas) metaParts.push(`Kelas: ${metadata.kelas}`);
  if (metadata?.mapel) metaParts.push(`Mapel: ${metadata.mapel}`);
  if (metadata?.periode) metaParts.push(`Periode: ${metadata.periode}`);
  doc.text(metaParts.join('    ') || `Dicetak pada: ${tglIndo()}`, W / 2, 29, { align: 'center' });

  // Divider
  doc.setDrawColor(27, 85, 88);
  doc.setLineWidth(0.6);
  doc.line(15, 32, W - 15, 32);

  // Table
  autoTable(doc, {
    startY: 36,
    margin: { left: 15, right: 15, bottom: 25 },
    head: [headers],
    body: rows,
    headStyles: {
      fillColor: [27, 85, 88],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2,
      textColor: [22, 40, 42],
      overflow: 'linebreak'
    },
    alternateRowStyles: {
      fillColor: [238, 245, 245]
    }
  });

  // Footer & Signature
  let y = (doc as any).lastAutoTable.finalY + 12;
  if (y > 280) {
    doc.addPage();
    y = 30;
  }

  const tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFontSize(8.5);
  doc.text('Dicetak: ' + tgl, W - 15, y, { align: 'right' });
  doc.text('Mengetahui,', 30, y + 6);
  doc.text('Pembuat Laporan,', W - 55, y + 6);
  doc.text('(.............................)', 30, y + 28);
  doc.text('(' + (metadata?.creator || 'Administrator') + ')', W - 55, y + 28);

  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Halaman ${i} dari ${n} - Dokumen Resmi SADIGA`, W / 2, 324, { align: 'center' });
  }

  doc.save(`Laporan_${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// Generate F4 Landscape PDF for Class Ledger
export function exportLegerF4LandscapePdf(legerData: any) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [215, 330] // Folio/F4 paper size: 330mm width x 215mm height in landscape
  });

  const W = 330;
  const H = 215;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(27, 85, 88);
  doc.text('SADIGA - SISTEM ADMINISTRASI DIGITAL GRANADA', W / 2, 13, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(22, 40, 42);
  doc.text(`LEGER NILAI HASIL BELAJAR KELAS ${legerData.kelas || ''}`, W / 2, 19, { align: 'center' });

  // Metadata Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(93, 113, 115);
  const metaParts: string[] = [];
  if (legerData.periode) metaParts.push(`Semester: ${legerData.periode}`);
  if (legerData.sekolah?.tahun) metaParts.push(`Tahun Ajaran: ${legerData.sekolah.tahun}`);
  if (legerData.wali?.nama) metaParts.push(`Wali Kelas: ${legerData.wali.nama}`);
  metaParts.push(`Dicetak: ${tglIndo()}`);
  doc.text(metaParts.join('     |     '), W / 2, 24.5, { align: 'center' });

  // Divider
  doc.setDrawColor(27, 85, 88);
  doc.setLineWidth(0.5);
  doc.line(10, 27, W - 10, 27);

  const mapels = legerData.mapels || [];
  const headers = [
    'No',
    'NISG',
    'Nama Santri',
    ...mapels.map((m: any) => m.nama.length > 13 ? m.nama.slice(0, 11) + '..' : m.nama),
    'Total',
    'Rata',
    'H',
    'S',
    'I',
    'A',
    '% Hdr',
    'Poin',
    'Tahfizh'
  ];

  const body = (legerData.rows || []).map((r: any, idx: number) => [
    idx + 1,
    r.nis,
    r.siswa,
    ...mapels.map((m: any) => r.scores[m.nama] !== null ? r.scores[m.nama] : '-'),
    r.total,
    r.average !== null ? r.average : '-',
    r.hadir ?? 0,
    r.sakit ?? 0,
    r.izin ?? 0,
    r.alfa ?? 0,
    r.presensiPct !== null ? `${r.presensiPct}%` : '-',
    r.netPoin >= 0 ? `+${r.netPoin}` : r.netPoin,
    r.ziyadahAyat > 0 ? `${r.ziyadahAyat} ay` : '-'
  ]);

  // Add Summary row (Rata-Rata Kelas)
  if (legerData.rows && legerData.rows.length > 0) {
    body.push([
      '',
      '',
      'RATA-RATA KELAS',
      ...mapels.map((m: any) => legerData.subjectStats?.[m.nama]?.avg ?? '-'),
      '-',
      legerData.classStats?.classAvg ?? '-',
      '-', '-', '-', '-', '-',
      '-',
      '-'
    ]);
  }

  autoTable(doc, {
    startY: 30,
    margin: { left: 10, right: 10, bottom: 22 },
    head: [headers],
    body,
    headStyles: {
      fillColor: [27, 85, 88],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: 1.5
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.2,
      textColor: [22, 40, 42],
      overflow: 'linebreak'
    },
    alternateRowStyles: {
      fillColor: [243, 248, 248]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 16 },
      2: { cellWidth: 46 }
    }
  });

  // Footer & Signature
  let y = (doc as any).lastAutoTable.finalY + 8;
  if (y > 175) {
    doc.addPage();
    y = 25;
  }

  doc.setFontSize(8);
  doc.setTextColor(22, 40, 42);

  // Left Signature: Kepala Madrasah / Mudir
  doc.text('Mengetahui,', 25, y);
  doc.text('Kepala Madrasah / Mudir,', 25, y + 4.5);
  doc.text(`( ${legerData.sekolah?.kepsek || '...........................................'} )`, 25, y + 22);
  doc.text(`NIPY: ${legerData.sekolah?.nipy || '...........................................'}`, 25, y + 26);

  // Right Signature: Wali Kelas
  const rightX = W - 75;
  doc.text(`${legerData.sekolah?.kota || 'Granada'}, ${tglIndo()}`, rightX, y);
  doc.text(`Wali Kelas ${legerData.kelas || ''},`, rightX, y + 4.5);
  doc.text(`( ${legerData.wali?.nama || '...........................................'} )`, rightX, y + 22);
  doc.text(`NIPY: ${legerData.wali?.nipy || '...........................................'}`, rightX, y + 26);

  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Halaman ${i} dari ${n} • Leger Nilai Kelas ${legerData.kelas} (Folio / F4 Landscape 330 x 215 mm) • Dokumen Resmi SADIGA`,
      W / 2,
      H - 6,
      { align: 'center' }
    );
  }

  doc.save(`Leger_Nilai_Kelas_${(legerData.kelas || '').replace(/\s+/g, '_')}_F4_Landscape.pdf`);
}

// Generate Printable HTML for Leger in F4 Landscape
export function printLegerF4LandscapeWindow(legerData: any) {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Mohon izinkan pop-up peramban untuk mencetak leger.');
    return;
  }

  const mapels = legerData.mapels || [];
  const rows = legerData.rows || [];
  const stats = legerData.classStats;
  const subStats = legerData.subjectStats || {};
  const sk = legerData.sekolah || {};
  const wali = legerData.wali || {};

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Leger Nilai Kelas ${escapeHtml(legerData.kelas)} - F4 Landscape</title>
  <style>
    @page {
      size: 330mm 215mm landscape;
      margin: 8mm 10mm 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 7.5pt;
      line-height: 1.25;
      color: #111;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .kop {
      text-align: center;
      border-bottom: 2px solid #1B5558;
      padding-bottom: 5px;
      margin-bottom: 8px;
    }
    .kop h1 {
      margin: 0 0 2px;
      font-size: 11pt;
      font-weight: bold;
      color: #1B5558;
      letter-spacing: 0.5px;
    }
    .kop h2 {
      margin: 0 0 4px;
      font-size: 10pt;
      font-weight: bold;
      color: #222;
    }
    .kop p {
      margin: 0;
      font-size: 7.5pt;
      color: #555;
    }
    .meta-table {
      width: 100%;
      margin-bottom: 6px;
      font-size: 7.5pt;
    }
    .meta-table td {
      padding: 1px 4px;
    }
    table.leger {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 7pt;
    }
    table.leger th, table.leger td {
      border: 1px solid #777;
      padding: 2.5px 2px;
      text-align: center;
    }
    table.leger th {
      background-color: #E9F2F2;
      color: #1B5558;
      font-weight: bold;
    }
    table.leger tr:nth-child(even) td {
      background-color: #F8FAFA;
    }
    table.leger td.nama {
      text-align: left;
      padding-left: 4px;
      font-weight: 500;
    }
    table.leger td.nis {
      font-family: monospace;
    }
    table.leger tr.summary td {
      background-color: #E2EDED !important;
      font-weight: bold;
      color: #1B5558;
    }
    .sig-block {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 7.5pt;
      page-break-inside: avoid;
    }
    .sig-col {
      width: 200px;
      text-align: center;
    }
    .sig-space {
      height: 40px;
    }
    .sig-name {
      font-weight: bold;
      text-decoration: underline;
    }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="kop">
    <h1>${escapeHtml(sk.nama || 'SISTEM ADMINISTRASI DIGITAL GRANADA (SADIGA)')}</h1>
    <h2>LEGER NILAI HASIL BELAJAR PESERTA DIDIK</h2>
    <p>${escapeHtml(sk.alamat || '')} ${escapeHtml(sk.kota || '')}</p>
  </div>

  <table class="meta-table">
    <tr>
      <td width="10%"><strong>Kelas</strong></td>
      <td width="30%">: ${escapeHtml(legerData.kelas || '-')}</td>
      <td width="12%"><strong>Tahun Ajaran</strong></td>
      <td width="20%">: ${escapeHtml(sk.tahun || '-')}</td>
      <td width="10%"><strong>Wali Kelas</strong></td>
      <td width="18%">: ${escapeHtml(wali.nama || '-')}</td>
    </tr>
    <tr>
      <td><strong>Semester</strong></td>
      <td>: ${escapeHtml(legerData.periode || '-')}</td>
      <td><strong>Ketuntasan</strong></td>
      <td>: &ge; ${escapeHtml(stats?.tuntasLimit || 75)}</td>
      <td><strong>Dicetak</strong></td>
      <td>: ${tglIndo()}</td>
    </tr>
  </table>

  <table class="leger">
    <thead>
      <tr>
        <th rowspan="2" width="22">No</th>
        <th rowspan="2" width="45">NISG</th>
        <th rowspan="2" style="min-width: 120px;">Nama Santri</th>
        <th colspan="${mapels.length}">Mata Pelajaran</th>
        <th colspan="2">Nilai Akhir</th>
        <th colspan="5">Kehadiran (Presensi)</th>
        <th colspan="2">Catatan Khusus</th>
      </tr>
      <tr>
        ${mapels.map((m: any) => `<th title="${escapeHtml(m.nama)}">${escapeHtml(m.nama.length > 11 ? m.nama.slice(0, 10) + '..' : m.nama)}</th>`).join('')}
        <th width="32">Total</th>
        <th width="32">Rata</th>
        <th width="22">H</th>
        <th width="22">S</th>
        <th width="22">I</th>
        <th width="22">A</th>
        <th width="28">% Hdr</th>
        <th width="32">Poin</th>
        <th width="38">Tahfizh</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((r: any, idx: number) => `
        <tr>
          <td>${idx + 1}</td>
          <td class="nis">${escapeHtml(r.nis)}</td>
          <td class="nama">${escapeHtml(r.siswa)}</td>
          ${mapels.map((m: any) => {
            const sc = r.scores[m.nama];
            return `<td>${sc !== null && sc !== undefined ? sc : '-'}</td>`;
          }).join('')}
          <td style="font-weight:bold;">${r.total}</td>
          <td style="font-weight:bold; background-color:#EBF3F3;">${r.average !== null ? r.average : '-'}</td>
          <td style="color:#1B5558; font-weight:600;">${r.hadir ?? 0}</td>
          <td>${r.sakit ?? 0}</td>
          <td>${r.izin ?? 0}</td>
          <td>${r.alfa ?? 0}</td>
          <td>${r.presensiPct !== null ? r.presensiPct + '%' : '-'}</td>
          <td style="font-weight:600;">${r.netPoin >= 0 ? '+' + r.netPoin : r.netPoin}</td>
          <td>${r.ziyadahAyat > 0 ? r.ziyadahAyat + ' ay' : '-'}</td>
        </tr>
      `).join('')}
      <tr class="summary">
        <td colspan="3" style="text-align:right; padding-right:8px;">RATA-RATA KELAS</td>
        ${mapels.map((m: any) => `<td>${subStats[m.nama]?.avg ?? '-'}</td>`).join('')}
        <td>-</td>
        <td style="background-color:#D5E8E8;">${stats?.classAvg ?? '-'}</td>
        <td colspan="5">-</td>
        <td colspan="2">-</td>
      </tr>
    </tbody>
  </table>

  <div class="sig-block">
    <div class="sig-col">
      <div>Mengetahui,</div>
      <div>Kepala Madrasah / Mudir</div>
      <div class="sig-space"></div>
      <div class="sig-name">${escapeHtml(sk.kepsek || '...........................................')}</div>
      <div>NIPY: ${escapeHtml(sk.nipy || '...........................................')}</div>
    </div>
    <div class="sig-col">
      <div>${escapeHtml(sk.kota || 'Granada')}, ${tglIndo()}</div>
      <div>Wali Kelas ${escapeHtml(legerData.kelas || '')}</div>
      <div class="sig-space"></div>
      <div class="sig-name">${escapeHtml(wali.nama || '...........................................')}</div>
      <div>NIPY: ${escapeHtml(wali.nipy || '...........................................')}</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
}

// Generate Printable HTML for Rapor
export function openRaporPrintWindow(D: any) {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Mohon izinkan pop-up peramban untuk mencetak rapor.');
    return;
  }

  const pd = D.tipe === 'pondok';
  const judul = pd ? 'LAPORAN PERKEMBANGAN KEGIATAN PONDOK' : 'PENCAPAIAN KOMPETENSI PESERTA DIDIK';
  const L = 'ABCDEFGHIJ';
  const sk = D.sekolah || {};

  const css = `
    @page {
      size: 215mm 330mm;
      margin: 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font: 10pt/1.35 Arial, Helvetica, sans-serif;
      color: #000;
      margin: 0;
      background: #fff;
    }
    .pg {
      page-break-after: always;
      position: relative;
    }
    .pg:last-child {
      page-break-after: auto;
    }
    h1 {
      font-size: 13pt;
      text-align: center;
      margin: 0 0 8px;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 3px 0 10px;
    }
    th, td {
      border: 1px solid #000;
      padding: 3px 5px;
      vertical-align: top;
    }
    th {
      background: #e4efef;
      font-weight: bold;
    }
    .hd td {
      border: 0;
      padding: 1px 4px;
    }
    .c {
      text-align: center;
    }
    .sec {
      font-weight: 700;
      margin: 8px 0 2px;
    }
    .d {
      white-space: pre-line;
      text-align: justify;
    }
    tr {
      page-break-inside: avoid;
    }
    .box {
      border: 1px solid #000;
      padding: 6px;
      min-height: 46px;
      white-space: pre-line;
      text-align: justify;
    }
    .sg {
      display: flex;
      justify-content: space-between;
      margin-top: 14px;
      text-align: center;
      page-break-inside: avoid;
    }
    .sg > div {
      width: 45%;
    }
    .sp {
      height: 54px;
    }
    .mb {
      height: 6px;
      background: #d9e3e3;
      border-radius: 3px;
      margin-top: 3px;
    }
    .mb i {
      display: block;
      height: 100%;
      background: #1B5558;
      border-radius: 3px;
    }
    .np {
      position: fixed;
      right: 16px;
      top: 16px;
      padding: 10px 18px;
      background: #1B5558;
      color: #fff;
      border: 0;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .np:hover {
      background: #143f41;
    }
    @media print {
      .np {
        display: none !important;
      }
    }
  `;

  const nm = (n?: string, p?: string) => `<b><u>${escapeHtml(n || '.........................')}</u></b>${p ? '<br>NIPY. ' + escapeHtml(p) : ''}`;
  const th = (a: [string, string?][]) => `<tr>${a.map(x => `<th ${x[1] ? `style="width:${x[1]}"` : ''}>${x[0]}</th>`).join('')}</tr>`;

  const miG = (g: any) => g.nama === 'Multiple Intelligences' ? {
    nama: g.nama,
    mi: 1,
    rows: g.rows.slice().sort((a: any, b: any) => PRD.indexOf(a.predikat) - PRD.indexOf(b.predikat))
  } : g;

  const miTop = (g: any) => {
    const t = g.rows.filter((r: any) => PRD.indexOf(r.predikat) < 2).slice(0, 3).map((r: any) => r.subjek.replace('Kecerdasan ', ''));
    return t.length ? `<div style="margin:2px 0 4px">Kecerdasan yang paling menonjol: <b>${escapeHtml(t.join(', '))}</b>.</div>` : '';
  };

  const miBar = (p: string) => {
    const w = [100, 75, 50, 25][Math.max(0, PRD.indexOf(p as any))] || 25;
    return `<div class="mb"><i style="width:${w}%"></i></div>`;
  };

  const pages = (D.santri || []).map((s: any) => {
    let n = 0;
    const sec = (t: string) => `<div class="sec">${L[n++]}. ${t}</div>`;
    const hd = `
      <h1>${judul}</h1>
      <table class="hd">
        <tr>
          <td style="width:16%">Nama Sekolah</td>
          <td colspan="3">: ${escapeHtml(sk.nama)}</td>
        </tr>
        <tr>
          <td>Alamat</td>
          <td colspan="3">: ${escapeHtml(sk.alamat)}</td>
        </tr>
        <tr>
          <td>Nama Santri/i</td>
          <td style="width:36%">: ${escapeHtml(s.nama)}</td>
          <td style="width:18%;white-space:nowrap">NISG</td>
          <td>: ${escapeHtml(s.nisg)}</td>
        </tr>
        <tr>
          <td>Kelas</td>
          <td>: ${escapeHtml(D.kelas)}</td>
          <td>NISN</td>
          <td>: ${escapeHtml(s.nisn)}</td>
        </tr>
        <tr>
          <td>Semester</td>
          <td>: ${escapeHtml(D.semester)}</td>
          <td style="white-space:nowrap">Tahun Pelajaran</td>
          <td>: ${escapeHtml(D.tahun)}</td>
        </tr>
      </table>
    `;

    const grp = pd
      ? (s.kategori?.length ? s.kategori.map(miG).map((g: any) =>
          sec(escapeHtml(g.nama)) + (g.mi ? miTop(g) : '') + `
          <table>
            <thead>${th([['No', '28px'], ['Mata Pelajaran', '24%'], ['Predikat', '19%'], ['Deskripsi']])}</thead>
            <tbody>
              ${g.rows.map((r: any, i: number) => `
                <tr>
                  <td class="c">${i + 1}</td>
                  <td>${escapeHtml(r.subjek)}</td>
                  <td class="c"><b>${escapeHtml(r.predikat)}</b>${g.mi ? miBar(r.predikat) : ''}</td>
                  <td class="d">${escapeHtml(r.deskripsi)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `).join('') + '<div style="font-size:9pt;margin-bottom:6px">Predikat: Berkembang Sangat Baik, Berkembang Sesuai Harapan, Mulai Berkembang, Belum Berkembang.</div>'
        : sec('Perkembangan') + '<div class="box">Belum ada data perkembangan.</div>')
      : (s.kelompok?.length ? s.kelompok.map((g: any) =>
          sec(escapeHtml(g.nama)) + `
          <table>
            <thead>${th([['No', '28px'], ['Mata Pelajaran', '26%'], ['Nilai', '46px'], ['Deskripsi']])}</thead>
            <tbody>
              ${g.rows.map((r: any, i: number) => `
                <tr>
                  <td class="c">${i + 1}</td>
                  <td>${escapeHtml(r.mapel)}</td>
                  <td class="c"><b>${escapeHtml(r.nilai)}</b></td>
                  <td class="d">${escapeHtml(r.deskripsi)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `).join('') : sec('Nilai') + '<div class="box">Belum ada nilai akhir.</div>');

    const none = '<tr><td class="c">-</td><td>-</td><td>-</td><td>-</td></tr>';
    const ek = pd ? '' : sec('Ekstrakurikuler') + `
      <table>
        <thead>${th([['No', '28px'], ['Kegiatan'], ['Nilai', '70px'], ['Keterangan']])}</thead>
        <tbody>
          ${s.ekskul?.length ? s.ekskul.map((e: any, i: number) => `
            <tr>
              <td class="c">${i + 1}</td>
              <td>${escapeHtml(e.kegiatan)}</td>
              <td class="c">${escapeHtml(e.nilai)}</td>
              <td class="d">${escapeHtml(e.keterangan)}</td>
            </tr>
          `).join('') : none}
        </tbody>
      </table>
    `;

    const pr = pd ? '' : sec('Prestasi') + `
      <table>
        <thead>${th([['No', '28px'], ['Jenis Prestasi'], ['Keterangan']])}</thead>
        <tbody>
          ${s.prestasi?.length ? s.prestasi.map((e: any, i: number) => `
            <tr>
              <td class="c">${i + 1}</td>
              <td>${escapeHtml(e.kegiatan)}</td>
              <td class="d">${escapeHtml(e.keterangan)}</td>
            </tr>
          `).join('') : '<tr><td class="c">-</td><td>-</td><td>-</td></tr>'}
        </tbody>
      </table>
    `;

    const kh = pd ? '' : sec('Ketidakhadiran') + `
      <table style="width:55%">
        <thead>${th([['Ketidakhadiran'], ['Jumlah', '90px']])}</thead>
        <tbody>
          <tr><td>Sakit</td><td class="c">${escapeHtml(s.sakit)} hari</td></tr>
          <tr><td>Izin</td><td class="c">${escapeHtml(s.izin)} hari</td></tr>
          <tr><td>Alfa</td><td class="c">${escapeHtml(s.alfa)} hari</td></tr>
        </tbody>
      </table>
    `;

    const cw = pd ? '' : sec('Catatan Wali Kelas') + `<div class="box">${escapeHtml(s.catatan)}</div>`;
    const to = pd ? '' : sec('Tanggapan Orang Tua / Wali') + '<div class="box" style="min-height:54px"></div>';

    const sg = `
      <div class="sg">
        <div>
          Mengetahui,<br>Orang Tua / Wali
          <div class="sp"></div>
          (.........................)
        </div>
        <div>
          ${escapeHtml(sk.kota ? sk.kota + ', ' : '')}${tglIndo(sk.tanggal)}<br>Wali Kelas
          <div class="sp"></div>
          ${nm(D.wali?.nama, D.wali?.nipy)}
        </div>
      </div>
      <div class="sg" style="justify-content:center">
        <div>
          Mengetahui,<br>Kepala Sekolah
          <div class="sp"></div>
          ${nm(sk.kepsek, sk.nipy)}
        </div>
      </div>
    `;

    return `<div class="pg">${hd}${grp}${ek}${pr}${kh}${cw}${to}${sg}</div>`;
  });

  w.document.open();
  w.document.write(`
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(judul)} - ${escapeHtml(D.kelas)}</title>
        <style>${css}</style>
      </head>
      <body>
        <button class="np" onclick="window.print()">Cetak / Simpan PDF (F4)</button>
        ${pages.join('')}
      </body>
    </html>
  `);
  w.document.close();
  setTimeout(() => {
    w.focus();
  }, 500);
}

// Generate Printable Cards for Parent/Student Accounts
export function openAccountCardsPrintWindow(accounts: { nama: string; kelas: string; username: string; password?: string }[], appUrl?: string) {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Mohon izinkan pop-up peramban untuk mencetak kartu akun.');
    return;
  }

  const valid = accounts.filter(a => a.password);
  const cardsHtml = valid.map(r => `
    <div class="k">
      <h4>Akun SADIGA - Orang Tua / Santri</h4>
      <table>
        <tr><td style="width:110px">Nama Santri</td><td>: ${escapeHtml(r.nama)}</td></tr>
        <tr><td>Kelas</td><td>: ${escapeHtml(r.kelas)}</td></tr>
        <tr><td>Nama Pengguna</td><td>: <b>${escapeHtml(r.username)}</b></td></tr>
        <tr><td>Kata Sandi Awal</td><td>: <b>${escapeHtml(r.password)}</b></td></tr>
      </table>
      <div class="note">
        ${appUrl ? `Alamat: <b>${escapeHtml(appUrl)}</b><br>` : ''}
        Kata sandi wajib diganti saat pertama kali masuk ke sistem.
      </div>
    </div>
  `).join('');

  w.document.open();
  w.document.write(`
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Kartu Akun SADIGA - Orang Tua / Santri</title>
        <style>
          @page {
            size: 215mm 330mm;
            margin: 12mm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            color: #000;
            margin: 0;
            background: #fff;
          }
          .k {
            display: inline-block;
            width: 48%;
            border: 1px dashed #333;
            border-radius: 6px;
            padding: 12px;
            margin: 0 1% 14px 0;
            vertical-align: top;
            page-break-inside: avoid;
            box-sizing: border-box;
          }
          h4 {
            margin: 0 0 8px;
            color: #1B5558;
            font-size: 12pt;
            border-bottom: 1px solid #1B5558;
            padding-bottom: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td {
            padding: 3px 0;
            font-size: 10pt;
          }
          .note {
            font-size: 9pt;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px dotted #bbb;
            color: #444;
          }
          .np {
            position: fixed;
            right: 16px;
            top: 16px;
            padding: 10px 18px;
            background: #1B5558;
            color: #fff;
            border: 0;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
          }
          @media print {
            .np {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <button class="np" onclick="window.print()">Cetak Kartu Akun</button>
        ${cardsHtml}
      </body>
    </html>
  `);
  w.document.close();
  setTimeout(() => {
    w.focus();
  }, 500);
}
