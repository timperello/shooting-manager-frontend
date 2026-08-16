// shooting-manager-frontend/src/components/NewOption.jsx
import React from 'react';
import '../styles/NewOption.css';

function NewOption({ onSelectShooting, onSelectPayment }) {
  return (
    <div className="new-option-container">
      <h2>➕ Qu'est-ce que tu veux ajouter ?</h2>
      <p className="subtitle">Choisis ce que tu veux enregistrer</p>

      <div className="options-grid">
        {/* Option Shooting */}
        <div className="option-card shooting-card" onClick={onSelectShooting}>
          <div className="option-icon">🎬</div>
          <h3>Nouveau Shooting</h3>
          <p>Enregistre un nouveau shoot et ses détails</p>
          <button className="option-btn">Créer un shoot</button>
        </div>

        {/* Option Paiement */}
        <div className="option-card payment-card" onClick={onSelectPayment}>
          <div className="option-icon">💳</div>
          <h3>Nouveau Paiement</h3>
          <p>Enregistre le paiement de tes shootings</p>
          <button className="option-btn">Créer un paiement</button>
        </div>
      </div>
    </div>
  );
}

export default NewOption;