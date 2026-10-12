// shooting-manager-frontend/src/components/ExportForm.jsx
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import fontFile from '../fonts/NotoSansKR.ttf';
// eslint-disable-next-line no-unused-vars
import { formatWon } from '../utils/formatters';
import '../styles/ExportForm.css';
import htmlDocx from 'html-docx-js/dist/html-docx';

function ExportForm({ shootings, payments }) {
  const [exportType, setExportType] = useState('shootings');
  const [selectedMonthForActivity, setSelectedMonthForActivity] = useState('');
  const [selectedShootingsForActivity, setSelectedShootingsForActivity] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [format, setFormat] = useState('pdf');
  const [fontBase64, setFontBase64] = useState(null);
  const [showMonthlyTotal, setShowMonthlyTotal] = useState(false);
  const [showFinalTotal, setShowFinalTotal] = useState(false);

  useEffect(() => {
    const loadFont = async () => {
      try {
        const response = await fetch(fontFile);
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          setFontBase64(base64);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Erreur chargement police:', error);
      }
    };

    loadFont();
  }, []);

  const months = [
    { num: 0, name: 'Janvier' },
    { num: 1, name: 'Février' },
    { num: 2, name: 'Mars' },
    { num: 3, name: 'Avril' },
    { num: 4, name: 'Mai' },
    { num: 5, name: 'Juin' },
    { num: 6, name: 'Juillet' },
    { num: 7, name: 'Août' },
    { num: 8, name: 'Septembre' },
    { num: 9, name: 'Octobre' },
    { num: 10, name: 'Novembre' },
    { num: 11, name: 'Décembre' }
  ];

  const formatKoreanAmount = (value) => {
    const rounded = Math.round(value);
    return `${rounded.toLocaleString('ko-KR')}원`;
  };

  const formatKoreanDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const groupByMonth = (data, dateField = 'date') => {
    const grouped = {};
    data.forEach(item => {
      const date = new Date(item[dateField]);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return grouped;
  };

  const getMonthHeader = (monthKey) => {
    const [year, month] = monthKey.split('-');
    return `${year}년${month}월`;
  };

  const getMonthPeriod = () => {
    if (selectedMonths.length === 0) return '';
    const sortedMonths = [...selectedMonths].sort();
    const firstMonth = months[sortedMonths[0]].name;
    const lastMonth = months[sortedMonths[sortedMonths.length - 1]].name;
    return `${firstMonth} - ${lastMonth}`;
  };

  const getFilteredData = () => {
    if (selectedMonths.length === 0) return [];

    if (exportType === 'shootings') {
      return shootings.filter(shooting => {
        const shootingMonth = new Date(shooting.date).getMonth();
        return selectedMonths.includes(shootingMonth);
      });
    } else {
      return payments.filter(payment => {
        const paymentMonth = new Date(payment.date_paiement).getMonth();
        return selectedMonths.includes(paymentMonth);
      });
    }
  };

  // ✅ EXPORT EXCEL
  const exportToExcel = () => {
    const data = getFilteredData();
    
    if (data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      exportType === 'shootings'
        ? data.map(s => ({
            'Name': s.nom,
            'Date': formatKoreanDate(s.date),
            'Type': s.type_nom,
            'Amount': formatKoreanAmount(s.montant),
            'Amount Post Taxes': formatKoreanAmount(s.montant_final)
          }))
        : data.flatMap(p => 
            (p.shootings || []).map(s => ({
              'Name': s.nom,
              'Date': formatKoreanDate(s.date),
              'Type': s.type_nom,
              'Amount': formatKoreanAmount(s.montant),
              'Amount Post Taxes': formatKoreanAmount(s.montant_final)
            }))
          )
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      exportType === 'shootings' ? 'Shootings' : 'Paiements'
    );

    const filename = `${exportType === 'shootings' ? 'shootings' : 'paiements'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // ✅ EXPORT PDF
  const exportToPDF = () => {
    if (!fontBase64) {
      alert('Police en cours de chargement... Réessaye dans 1 seconde');
      return;
    }

    const data = getFilteredData();
    
    if (data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const doc = new jsPDF();
    
    doc.addFont(`data:font/ttf;base64,${fontBase64}`, 'NotoSansKR', 'normal');
    doc.setFont('NotoSansKR');
    
    let isFirstPage = true;
    let grandTotalBefore = 0;
    let grandTotalAfter = 0;

    if (exportType === 'shootings') {
      const dataByMonth = groupByMonth(data, 'date');
      const sortedMonths = Object.keys(dataByMonth).sort();

      sortedMonths.forEach((monthKey) => {
        if (!isFirstPage) {
          doc.addPage();
        }
        isFirstPage = false;

        const monthData = dataByMonth[monthKey];
        const monthHeader = getMonthHeader(monthKey);
        
        doc.setFontSize(16);
        doc.setTextColor(59, 130, 246);
        doc.text(monthHeader, 14, 15);
        
        doc.setTextColor(0, 0, 0);
        
        const tableData = monthData.map(s => [
          s.nom,
          formatKoreanDate(s.date),
          s.type_nom || '-',
          formatKoreanAmount(s.montant),
          formatKoreanAmount(s.montant_final)
        ]);

        const monthTotalBefore = monthData.reduce((sum, s) => sum + s.montant, 0);
        const monthTotalAfter = monthData.reduce((sum, s) => sum + s.montant_final, 0);
        grandTotalBefore += monthTotalBefore;
        grandTotalAfter += monthTotalAfter;

        if (showMonthlyTotal) {
          tableData.push([
            'TOTAL',
            '',
            '',
            formatKoreanAmount(monthTotalBefore),
            formatKoreanAmount(monthTotalAfter)
          ]);
        }

        autoTable(doc, {
          head: [[
            'Name\n이름',
            'Date\n날짜',
            'Type\n타입',
            'Amount\n금액',
            'Amount Post Taxes\n세후금액'
          ]],
          body: tableData,
          startY: 25,
          margin: 14,
          theme: 'grid',
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
            font: 'NotoSansKR'
          },
          bodyStyles: {
            fontSize: 9,
            textColor: 0,
            font: 'NotoSansKR'
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251]
          }
        });
      });
    } else {
      const dataByPaymentMonth = {};
      
      data.forEach(payment => {
        const paymentDate = new Date(payment.date_paiement);
        const year = paymentDate.getFullYear();
        const month = String(paymentDate.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        
        if (!dataByPaymentMonth[key]) {
          dataByPaymentMonth[key] = [];
        }
        
        if (payment.shootings && Array.isArray(payment.shootings)) {
          dataByPaymentMonth[key].push(...payment.shootings);
        }
      });

      const sortedMonths = Object.keys(dataByPaymentMonth).sort();

      sortedMonths.forEach((monthKey) => {
        if (!isFirstPage) {
          doc.addPage();
        }
        isFirstPage = false;

        const monthData = dataByPaymentMonth[monthKey];
        const monthHeader = getMonthHeader(monthKey);
        
        doc.setFontSize(16);
        doc.setTextColor(16, 185, 129);
        doc.text(monthHeader, 14, 15);
        
        doc.setTextColor(0, 0, 0);
        
        const tableData = monthData.map(s => [
          s.nom,
          formatKoreanDate(s.date),
          s.type_nom || '-',
          formatKoreanAmount(s.montant),
          formatKoreanAmount(s.montant_final)
        ]);

        const monthTotalBefore = monthData.reduce((sum, s) => sum + s.montant, 0);
        const monthTotalAfter = monthData.reduce((sum, s) => sum + s.montant_final, 0);
        grandTotalBefore += monthTotalBefore;
        grandTotalAfter += monthTotalAfter;

        if (showMonthlyTotal) {
          tableData.push([
            'TOTAL',
            '',
            '',
            formatKoreanAmount(monthTotalBefore),
            formatKoreanAmount(monthTotalAfter)
          ]);
        }

        autoTable(doc, {
          head: [[
            'Name\n이름',
            'Date\n날짜',
            'Type\n타입',
            'Amount\n금액',
            'Amount Post Taxes\n세후금액'
          ]],
          body: tableData,
          startY: 25,
          margin: 14,
          theme: 'grid',
          headStyles: {
            fillColor: [16, 185, 129],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
            font: 'NotoSansKR'
          },
          bodyStyles: {
            fontSize: 9,
            textColor: 0,
            font: 'NotoSansKR'
          }
        });
      });
    }

    if (showFinalTotal) {
      doc.addPage();
      const periodText = getMonthPeriod();
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text(`Total Final : ${periodText}`, 14, 15);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      
      const finalTableData = [
        ['Total Before Taxes', '세금 전 총액', formatKoreanAmount(grandTotalBefore)],
        ['Total After Taxes', '세후 총액', formatKoreanAmount(grandTotalAfter)]
      ];

      autoTable(doc, {
        body: finalTableData,
        startY: 30,
        margin: 14,
        theme: 'plain'
      });
    }

    const filename = `${exportType === 'shootings' ? 'shootings' : 'paiements'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const toggleMonth = (monthNum) => {
    setSelectedMonths(prev =>
      prev.includes(monthNum)
        ? prev.filter(m => m !== monthNum)
        : [...prev, monthNum]
    );
  };

  const toggleShootingSelection = (id) => {
    setSelectedShootingsForActivity(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const generateActivityPlanODT = () => {
    const chosenShootings = shootings.filter(s => selectedShootingsForActivity.includes(s.id));
    
    if (chosenShootings.length === 0) {
      alert('Veuillez cocher au moins un shooting');
      return;
    }

    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Activity Plan</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; }
        h2 { text-decoration: underline; font-size: 16px; margin-bottom: 5px; }
        .subtitle { font-weight: bold; font-size: 14px; margin-bottom: 30px; text-decoration: underline; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 5px; }
        th, td { border: 1px solid #333; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #d1d5db; }
        .ref { text-align: left; font-size: 12px; margin-bottom: 40px; font-weight: bold; }
        .item-block { text-align: left; margin-bottom: 30px; }
      </style>
      </head>
      <body>
        <h2>Activity Plan and Proof of Scheduled Activities 2023</h2>
        <div class="subtitle">Angeloni Luciana Maria (Lucy)</div>
    `;

    chosenShootings.forEach((s, index) => {
      const dateFormatted = s.date ? s.date.split('T')[0].replace(/-/g, '/') : '';
      htmlContent += `
        <div class="item-block">
          <p><strong>${index + 1})</strong></p>
          <table>
            <tr>
              <th>Brand Name</th>
              <th>Project Name</th>
              <th>Role</th>
              <th>Date</th>
              <th>Location</th>
            </tr>
            <tr>
              <td>${s.brand_name || '-'}</td>
              <td>${s.project_name || '-'}</td>
              <td>${s.role || '-'}</td>
              <td>${dateFormatted}</td>
              <td>${s.location || '-'}</td>
            </tr>
          </table>
          <div class="ref">Reference: </div>
        </div>
      `;
    });

    htmlContent += `</body></html>`;

    const converted = htmlDocx.asBlob(htmlContent);
    const url = URL.createObjectURL(converted);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `Activity_Plan_${new Date().getFullYear()}.odt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleExport = () => {
    if (selectedMonths.length === 0) {
      alert('Sélectionne au moins un mois');
      return;
    }

    if (format === 'pdf') {
      exportToPDF();
    } else if (format === 'excel') {
      exportToExcel();
    }
  };

  return (
    <div className="export-form-container">
      <h2>📥 Exporter les données & Activity Plan</h2>

      <div className="export-form">
        {/* Choix du type d'export incluant Activity Plan */}
        <div className="form-section">
          <h3>1️⃣ Type d'export</h3>
          <div className="radio-group">
            <label>
              <input type="radio" value="shootings" checked={exportType === 'shootings'} onChange={() => setExportType('shootings')} />
              Shootings 
            </label>
            <label>
              <input type="radio" value="payments" checked={exportType === 'payments'} onChange={() => setExportType('payments')} />
              Paiements
            </label>
            <label>
              <input type="radio" value="activity-plan" checked={exportType === 'activity-plan'} onChange={() => setExportType('activity-plan')} />
              Activity Plan (Visa)
            </label>
          </div>
        </div>

        {/* SECTION SPÉCIFIQUE ACTIVITY PLAN */}
        {exportType === 'activity-plan' ? (
          <div className="form-section">
            <h3>📅 Sélectionner un mois pour l'Activity Plan</h3>
            <select 
              value={selectedMonthForActivity} 
              onChange={(e) => {
                setSelectedMonthForActivity(e.target.value);
                setSelectedShootingsForActivity([]);
              }}
              style={{ padding: '8px', width: '100%', marginBottom: '15px' }}
            >
              <option value="">-- Choisir un mois --</option>
              {months.map(m => (
                <option key={m.num} value={m.num}>{m.name}</option>
              ))}
            </select>

            {selectedMonthForActivity !== '' && (
              <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                <h4>Cochez les shoots à inclure :</h4>
                {shootings
                  .filter(s => new Date(s.date).getMonth() === parseInt(selectedMonthForActivity))
                  .map(s => (
                    <label key={s.id} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedShootingsForActivity.includes(s.id)}
                        onChange={() => toggleShootingSelection(s.id)}
                        style={{ marginRight: '8px' }}
                      />
                      {s.nom} ({s.date ? s.date.split('T')[0] : ''}) - {s.brand_name || 'Sans marque'}
                    </label>
                  ))}
              </div>
            )}

            <div className="export-actions" style={{ marginTop: '20px' }}>
              <button onClick={generateActivityPlanODT} className="btn-export">
                ✨ Générer l'Activity Plan (.odt)
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Sélection des mois */}
            <div className="form-section">
              <h3>2️⃣ Quels mois ?</h3>
              <div className="months-grid">
                {months.map(month => (
                  <label key={month.num} className="month-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedMonths.includes(month.num)}
                      onChange={() => toggleMonth(month.num)}
                    />
                    <span>{month.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Format d'export */}
            <div className="form-section">
              <h3>3️⃣ Format ?</h3>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    value="pdf"
                    checked={format === 'pdf'}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  📄 PDF (formaté par mois)
                </label>
                <label>
                  <input
                    type="radio"
                    value="excel"
                    checked={format === 'excel'}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                  📊 Excel
                </label>
              </div>
              {format === 'pdf' && !fontBase64 && (
                <p style={{ color: '#F59E0B', fontSize: '0.9rem' }}>
                  ⏳ Police coréenne en cours de chargement...
                </p>
              )}
            </div>

            {/* Options de totaux (PDF uniquement) */}
            {format === 'pdf' && (
              <div className="form-section">
                <h3>4️⃣ Options</h3>
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={showMonthlyTotal}
                      onChange={(e) => setShowMonthlyTotal(e.target.checked)}
                    />
                    Total mensuel
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={showFinalTotal}
                      onChange={(e) => setShowFinalTotal(e.target.checked)}
                    />
                    Total final
                  </label>
                </div>
              </div>
            )}

            {/* Bouton export */}
            <div className="export-actions">
              <button 
                onClick={handleExport} 
                className="btn-export"
                disabled={format === 'pdf' && !fontBase64}
              >
                ✅ Exporter ({selectedMonths.length} mois)
              </button>
            </div>

            {/* Aperçu */}
            {selectedMonths.length > 0 && (
              <div className="export-preview">
                <h4>📊 Aperçu</h4>
                {exportType === 'shootings' ? (
                  <p>
                    {shootings.filter(s => selectedMonths.includes(new Date(s.date).getMonth())).length} shoots à exporter
                  </p>
                ) : (
                  <p>
                    {payments.filter(p => selectedMonths.includes(new Date(p.date_paiement).getMonth())).length} paiements à exporter
                    {(() => {
                      const filteredPayments = payments.filter(p => selectedMonths.includes(new Date(p.date_paiement).getMonth()));
                      const totalShootings = filteredPayments.reduce((sum, p) => sum + (p.shootings?.length || 0), 0);
                      return totalShootings > 0 ? ` (${totalShootings} shoots associés)` : ' (aucun shoot associé)';
                    })()}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ExportForm;