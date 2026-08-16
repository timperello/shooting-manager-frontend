// shooting-manager-frontend/src/components/ShootingList.jsx
import React, { useState } from 'react';
import { formatWon } from '../utils/formatters';
import '../styles/ShootingList.css';

function ShootingList({ shootings, onEdit, onDelete, onUpdate, editingId }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer les shootings
  const filtered = shootings.filter(shooting => {
    let passes = true;

    // Filtre par statut
    if (filter === 'paid') passes = passes && shooting.paye;
    if (filter === 'unpaid') passes = passes && !shooting.paye;

    // Filtre par recherche
    if (searchTerm) {
      passes = passes && shooting.nom.toLowerCase().includes(searchTerm.toLowerCase());
    }

    return passes;
  });

  const togglePaid = async (shooting) => {
    onUpdate(shooting.id, {
      ...shooting,
      paye: !shooting.paye
    });
  };

  return (
    <div className="shooting-list-container">
      <h2>📋 Mes Shootings</h2>

      {/* Filters */}
      <div className="list-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tous
          </button>
          <button
            className={`filter-btn ${filter === 'paid' ? 'active' : ''}`}
            onClick={() => setFilter('paid')}
          >
            ✅ Payés
          </button>
          <button
            className={`filter-btn ${filter === 'unpaid' ? 'active' : ''}`}
            onClick={() => setFilter('unpaid')}
          >
            ⏳ Impayés
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="results-info">
        {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>Aucun shooting trouvé 😢</p>
        </div>
      ) : (
        <div className="shootings-list">
          {filtered.map(shooting => (
            <div key={shooting.id} className={`shooting-card ${shooting.paye ? 'paid' : 'unpaid'}`}>
              {/* Card Header */}
              <div className="card-header">
                <div className="card-title-section">
                  <h3>{shooting.nom}</h3>
                  <div className="badges">
                    <span className={`badge ${shooting.categorie}`}>
                      {shooting.categorie === 'agence' ? '🏢 Agence' : '💵 Cash'}
                    </span>
                    <span
                      className="badge-type"
                      style={{
                        backgroundColor: `${shooting.type_couleur}20`,
                        color: shooting.type_couleur,
                        border: `2px solid ${shooting.type_couleur}`
                      }}
                    >
                      {shooting.type_nom}
                    </span>
                  </div>
                </div>
                <span className={`paid-badge ${shooting.paye ? 'paid' : 'unpaid'}`}>
                  {shooting.paye ? '✅ Payé' : '⏳ Impayé'}
                </span>
              </div>

              {/* Card Body */}
              <div className="card-body">
                <div className="info-row">
                  <span className="label">📅 Date:</span>
                  <span className="value">
                    {new Date(shooting.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="info-row">
                  <span className="label">💰 Montant brut:</span>
                  <span className="value">{formatWon(shooting.montant)}</span>
                </div>

                {shooting.categorie === 'agence' && (
                  <div className="info-row">
                    <span className="label">📊 Frais ({shooting.pourcentage_agence}%):</span>
                    <span className="value">
                      -{formatWon(shooting.montant * shooting.pourcentage_agence / 100)}
                    </span>
                  </div>
                )}

                <div className="info-row total">
                  <span className="label">💵 Montant final:</span>
                  <span className="value">{formatWon(shooting.montant_final)}</span>
                </div>

                {shooting.notes && (
                  <div className="info-row notes">
                    <span className="label">📝 Notes:</span>
                    <span className="value">{shooting.notes}</span>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="card-actions">
                <button
                  className={`btn-paid ${shooting.paye ? 'active' : ''}`}
                  onClick={() => togglePaid(shooting)}
                  title={shooting.paye ? 'Marquer comme impayé' : 'Marquer comme payé'}
                >
                  {shooting.paye ? '✅ Payé' : '⏳ Marquer payé'}
                </button>

                <button
                  className="btn-edit"
                  onClick={() => onEdit(shooting.id)}
                >
                  ✏️ Éditer
                </button>

                <button
                  className="btn-delete"
                  onClick={() => onDelete(shooting.id)}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ShootingList;