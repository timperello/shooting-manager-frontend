// shooting-manager-frontend/src/components/ExportForm.jsx
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import fontFile from '../fonts/NotoSansKR.ttf';
import { formatWon } from '../utils/formatters';
import '../styles/ExportForm.css';

function ExportForm({ shootings, payments }) {
  const [exportType, setExportType] = useState('shootings');
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

        // Calculer les totaux mensuels
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
          },
          didDrawCell: function(data) {
            if (data.row.index === tableData.length - 1 && showMonthlyTotal) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [229, 231, 235];
            }
          },
          columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' }
          }
        });
      });
    } else {
      // Export paiements - grouper par DATE DE PAIEMENT
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

        // Calculer les totaux mensuels
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
          },
          alternateRowStyles: {
            fillColor: [240, 253, 250]
          },
          didDrawCell: function(data) {
            if (data.row.index === tableData.length - 1 && showMonthlyTotal) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [217, 243, 230];
            }
          },
          columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' }
          }
        });
      });
    }

    // ✅ PAGE TOTAL FINAL
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
        theme: 'plain',
        bodyStyles: {
          fontSize: 11,
          textColor: 0,
          font: 'NotoSansKR'
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold', textColor: [59, 130, 246] },
          1: { halign: 'center', fontStyle: 'bold', textColor: [59, 130, 246] },
          2: { halign: 'right', fontStyle: 'bold', textColor: [0, 0, 0] }
        }
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
      <h2>📥 Exporter les données</h2>

      <div className="export-form">
        {/* Type d'export */}
        <div className="form-section">
          <h3>1️⃣ Quel type de données ?</h3>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="shootings"
                checked={exportType === 'shootings'}
                onChange={(e) => setExportType(e.target.value)}
              />
              📋 Shootings
            </label>
            <label>
              <input
                type="radio"
                value="payments"
                checked={exportType === 'payments'}
                onChange={(e) => setExportType(e.target.value)}
              />
              💳 Paiements (shootings associés)
            </label>
          </div>
        </div>

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
    </div>
  );
}

export default ExportForm;