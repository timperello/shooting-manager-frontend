// shooting-manager-frontend/src/components/PaymentList.jsx
import React, { useState } from 'react';
import { formatWon } from '../utils/formatters';
import '../styles/PaymentList.css';

function PaymentList({ payments, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!payments || payments.length === 0) {
    return <div className="no-data">Aucun paiement enregistré</div>;
  }

  return (
    <div className="payment-list-container">
      <h2>💳 Liste des paiements</h2>

      <div className="payments-list">
        {payments.map(payment => (
          <div key={payment.id} className="payment-card">
            <div
              className="payment-header"
              onClick={() => toggleExpand(payment.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="payment-info">
                <span className="payment-date">
                  📅 {new Date(payment.date_paiement).toLocaleDateString('fr-FR')}
                </span>
                <span className="payment-amount">
                  {formatWon(payment.montant)}
                </span>
              </div>
              <span className="expand-icon">
                {expandedId === payment.id ? '▼' : '▶'}
              </span>
            </div>

            {expandedId === payment.id && (
              <div className="payment-details">
                <div className="details-content">
                  <p><strong>Nombre de shoots :</strong> {payment.nombre_shoots}</p>
                  
                  {payment.shootings && payment.shootings.length > 0 && (
                    <div className="shoots-list">
                      <strong>Shoots associés :</strong>
                      <ul>
                        {payment.shootings.map(shoot => (
                          <li key={shoot.id}>{shoot.nom}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onDelete(payment.id)}
                  className="btn-delete"
                  title="Supprimer ce paiement"
                >
                  🗑️ Supprimer
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PaymentList;