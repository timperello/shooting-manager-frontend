// shooting-manager-frontend/src/components/PaymentForm.jsx
import React, { useState } from 'react';
import { formatWon } from '../utils/formatters';
import '../styles/PaymentForm.css';

function PaymentForm({ shootings, onSubmit }) {
  // Pré-sélectionner la date d'aujourd'hui
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [selectedShootings, setSelectedShootings] = useState([]);
  const [date_paiement, setDate] = useState(getTodayDate());

  const handleToggleShooting = (id) => {
    setSelectedShootings(prev =>
      prev.includes(id)
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    );
  };

  const totalMontant = shootings
    .filter(s => selectedShootings.includes(s.id))
    .reduce((sum, s) => sum + s.montant_final, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!date_paiement || selectedShootings.length === 0) {
      alert('Sélectionne une date et au moins un shooting');
      return;
    }

    onSubmit({
      date_paiement,
      shooting_ids: selectedShootings
    });

    setSelectedShootings([]);
    setDate(getTodayDate());
  };

  return (
    <div className="payment-form-container">
      <h2>💳 Nouveau Paiement</h2>

      <form onSubmit={handleSubmit} className="payment-form">
        {/* Date */}
        <div className="form-group">
          <label htmlFor="date">Date du paiement *</label>
          <input
            type="date"
            id="date"
            value={date_paiement}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Sélection shootings */}
        <div className="form-group">
          <label>Sélectionne les shootings à payer *</label>
          <div className="shootings-selector">
            {shootings.length === 0 ? (
              <p className="no-unpaid">Aucun shooting impayé</p>
            ) : (
              shootings.map(shooting => (
                <div
                  key={shooting.id}
                  className={`shooting-checkbox ${selectedShootings.includes(shooting.id) ? 'selected' : ''}`}
                  onClick={() => handleToggleShooting(shooting.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedShootings.includes(shooting.id)}
                    onChange={() => {}}
                  />
                  <div className="shooting-info">
                    <span className="name">{shooting.nom}</span>
                    <span className="date">{new Date(shooting.date).toLocaleDateString('fr-FR')}</span>
                    <span className="amount">{formatWon(shooting.montant_final)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Résumé */}
        {selectedShootings.length > 0 && (
          <div className="payment-summary">
            <div className="summary-item">
              <span>Nombre de shoots</span>
              <strong>{selectedShootings.length}</strong>
            </div>
            <div className="summary-item">
              <span>Montant total</span>
              <strong>{formatWon(totalMontant)}</strong>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="form-actions">
          <button type="submit" className="btn-submit">
            ✅ Enregistrer le paiement
          </button>
        </div>
      </form>
    </div>
  );
}

export default PaymentForm;