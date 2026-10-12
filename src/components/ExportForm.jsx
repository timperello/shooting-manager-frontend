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
  const [expandedMonths, setExpandedMonths] = useState({}); // Pour les menus dépliants style accordéon
  const [selectedShootingsForActivity, setSelectedShootingsForActivity] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [format, setFormat] = useState('pdf');
  const [fontBase64, setFontBase64] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [showMonthlyTotal, setShowMonthlyTotal] = useState(false);
  // eslint-disable-next-line no-unused-vars
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
    XLSX.utils.book_append_sheet(workbook, worksheet, exportType === 'shootings' ? 'Shootings' : 'Paiements');
    XLSX.writeFile(workbook, `${exportType === 'shootings' ? 'shootings' : 'paiements'}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      Object.keys(dataByMonth).sort().forEach((monthKey) => {
        if (!isFirstPage) doc.addPage();
        isFirstPage = false;

        const monthData = dataByMonth[monthKey];
        doc.setFontSize(16);
        doc.setTextColor(59, 130, 246);
        doc.text(getMonthHeader(monthKey), 14, 15);
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
          tableData.push(['TOTAL', '', '', formatKoreanAmount(monthTotalBefore), formatKoreanAmount(monthTotalAfter)]);
        }

        autoTable(doc, {
          head: [['Name\n이름', 'Date\n날짜', 'Type\n타입', 'Amount\n금액', 'Amount Post Taxes\n세후금액']],
          body: tableData,
          startY: 25,
          margin: 14,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 9, halign: 'center', font: 'NotoSansKR' },
          bodyStyles: { fontSize: 9, textColor: 0, font: 'NotoSansKR' }
        });
      });
    }

    if (showFinalTotal) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text(`Total Final : ${getMonthPeriod()}`, 14, 15);
      
      autoTable(doc, {
        body: [
          ['Total Before Taxes', '세금 전 총액', formatKoreanAmount(grandTotalBefore)],
          ['Total After Taxes', '세후 총액', formatKoreanAmount(grandTotalAfter)]
        ],
        startY: 30,
        margin: 14,
        theme: 'plain'
      });
    }

    doc.save(`shootings_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const toggleMonth = (monthNum) => {
    setSelectedMonths(prev =>
      prev.includes(monthNum) ? prev.filter(m => m !== monthNum) : [...prev, monthNum]
    );
  };

  const toggleAccordion = (monthNum) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthNum]: !prev[monthNum]
    }));
  };

  const toggleShootingSelection = (id) => {
    setSelectedShootingsForActivity(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  // ✅ GENERATION ACTIVITY PLAN (.doc/.odt propre sans corruption)
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
        <h2>Activity Plan and Proof of Scheduled Activities ${new Date().getFullYear()}</h2>
        <div class="subtitle">PERELLO Timothée Janus Albert</div>
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

    // Utilisation de l'extension .doc pour garantir l'ouverture sans erreur de corruption
    const converted = htmlDocx.asBlob(htmlContent);
    const url = URL.createObjectURL(converted);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `Activity_Plan_${new Date().getFullYear()}.doc`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleExport = () => {
    if (selectedMonths.length === 0) {
      alert('Sélectionne au moins un mois');
      return;
    }
    if (format === 'pdf') exportToPDF();
    else if (format === 'excel') exportToExcel();
  };

  return (
    <div className="export-form-container">
      <h2>📥 Exporter les données & Activity Plan</h2>

      <div className="export-form">
        {/* Type d'export */}
        <div className="form-section">
          <h3>1️⃣ Type d'export</h3>
          <div className="radio-group">
            <label>
              <input type="radio" value="shootings" checked={exportType === 'shootings'} onChange={() => setExportType('shootings')} />
              📋 Shootings classiques
            </label>
            <label>
              <input type="radio" value="payments" checked={exportType === 'payments'} onChange={() => setExportType('payments')} />
              💳 Paiements
            </label>
            <label>
              <input type="radio" value="activity-plan" checked={exportType === 'activity-plan'} onChange={() => setExportType('activity-plan')} />
              📄 Activity Plan (Visa)
            </label>
          </div>
        </div>

        {/* SECTION ACTIVITY PLAN AVEC ACCORDÉONS DÉPLIANTS PAR MOIS */}
        {exportType === 'activity-plan' ? (
          <div className="form-section">
            <h3>📅 Sélectionner les shoots par mois</h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '15px' }}>
              Clique sur un mois pour le déplier, puis coche les shootings à inclure dans le rapport.
            </p>

            <div className="accordion-container">
              {months.map(m => {
                const monthShootings = shootings.filter(s => new Date(s.date).getMonth() === m.num);
                const isExpanded = expandedMonths[m.num];

                return (
                  <div key={m.num} style={{ marginBottom: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', overflow: 'hidden' }}>
                    {/* En-tête cliquable du mois */}
                    <div 
                      onClick={() => toggleAccordion(m.num)}
                      style={{ padding: '12px 15px', background: '#f9fafb', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}
                    >
                      <span>📅 {m.name} ({monthShootings.length} shoots)</span>
                      <span>{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {/* Contenu dépliant */}
                    {isExpanded && (
                      <div style={{ padding: '12px 15px', borderTop: '1px solid #e5e7eb' }}>
                        {monthShootings.length === 0 ? (
                          <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>Aucun shooting ce mois-ci.</p>
                        ) : (
                          monthShootings.map(s => (
                            <label key={s.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedShootingsForActivity.includes(s.id)}
                                onChange={() => toggleShootingSelection(s.id)}
                                style={{ marginRight: '10px', width: '16px', height: '16px' }}
                              />
                              <span><strong>{s.nom}</strong> ({s.date ? s.date.split('T')[0] : ''}) - <span style={{ color: '#4b5563' }}>{s.brand_name || 'Sans marque'}</span></span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="export-actions" style={{ marginTop: '20px' }}>
              <button onClick={generateActivityPlanODT} className="btn-export">
                ✨ Générer l'Activity Plan (.doc)
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Sélection des mois pour PDF / Excel */}
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
            </div>

            {/* Bouton export */}
            <div className="export-actions">
              <button onClick={handleExport} className="btn-export">
                ✅ Exporter ({selectedMonths.length} mois)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExportForm;