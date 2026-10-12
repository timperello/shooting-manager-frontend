// shooting-manager-frontend/src/components/ShootingForm.jsx
import React, { useState, useEffect } from 'react';
import { formatWon } from '../utils/formatters';
import '../styles/ShootingForm.css';

const TAX_RATE = 0.967;

function ShootingForm({ onSubmit, initialData = null, isEditing = false, types = [], onAddType }) {
  const [formData, setFormData] = useState({
    nom: '',
    date: '',
    montant: '',
    categorie: 'agence',
    pourcentage_agence: 15,
    type_id: types.length > 0 ? types[0].id : 1,
    notes: '',
    paye: false,
    brand_name: '',
    project_name: '',
    role: '',
    location: ''
  });

  const [showTypeForm, setShowTypeForm] = useState(false);
  const [newType, setNewType] = useState({
    nom: '',
    couleur: '#3B82F6'
  });
  const [montantFinal, setMontantFinal] = useState(0);

  useEffect(() => {
    if (types.length > 0 && !initialData) {
      setFormData(prev => ({
        ...prev,
        type_id: types[0].id
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types]);

  useEffect(() => {
    if (initialData) {
      let formattedDate = '';
      if (initialData.date) {
        const dateObj = new Date(initialData.date);
        formattedDate = dateObj.toISOString().split('T')[0];
      }

      setFormData({
        nom: initialData.nom || '',
        date: formattedDate,
        montant: initialData.montant || '',
        categorie: initialData.categorie || 'agence',
        pourcentage_agence: initialData.pourcentage_agence || 15,
        type_id: initialData.type_id || 1,
        notes: initialData.notes || '',
        paye: initialData.paye || false
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.montant) {
      let final = parseFloat(formData.montant);

      if (formData.categorie === 'agence') {
        const apresImpots = final * TAX_RATE;
        const fraisAgence = final * (formData.pourcentage_agence / 100);
        final = apresImpots - fraisAgence;
      }

      setMontantFinal(final);
    } else {
      setMontantFinal(0);
    }
  }, [formData.montant, formData.categorie, formData.pourcentage_agence]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAddType = async (e) => {
    e.preventDefault();

    if (!newType.nom.trim()) {
      alert('Ajoute un nom pour le type');
      return;
    }

    await onAddType(newType);
    setNewType({ nom: '', couleur: '#3B82F6' });
    setShowTypeForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nom || !formData.date || !formData.montant || !formData.type_id) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    onSubmit({
      ...formData,
      montant: parseFloat(formData.montant),
      pourcentage_agence: parseFloat(formData.pourcentage_agence),
      type_id: parseInt(formData.type_id)
    });

    if (!isEditing) {
      setFormData({
        nom: '',
        date: '',
        montant: '',
        categorie: 'agence',
        pourcentage_agence: 15,
        type_id: types.length > 0 ? types[0].id : 1,
        notes: '',
        paye: false
      });
    }
  };

  const montantBrut = parseFloat(formData.montant) || 0;
  let taxesDeductibles = 0;
  let fraisAgenceDeductibles = 0;

  if (formData.categorie === 'agence') {
    const apresImpots = montantBrut * TAX_RATE;
    taxesDeductibles = montantBrut - apresImpots;
    fraisAgenceDeductibles = montantBrut * (formData.pourcentage_agence / 100);
  }

  return (
    <div className="shooting-form-container">
      <h2>{isEditing ? '✏️ Éditer le shooting' : '➕ Nouveau shooting'}</h2>

      <form onSubmit={handleSubmit} className="shooting-form">
        {/* Nom */}
        <div className="form-group">
          <label htmlFor="nom">Nom du shooting *</label>
          <input
            type="text"
            id="nom"
            name="nom"
            placeholder="Ex: Fashion Week Campaign"
            value={formData.nom}
            onChange={handleChange}
            required
          />
        </div>

        {/* Date */}
        <div className="form-group">
          <label htmlFor="date">Date du tournage *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        {/* Montant */}
        <div className="form-group">
          <label htmlFor="montant">Montant (₩) *</label>
          <input
            type="number"
            id="montant"
            name="montant"
            placeholder="500000"
            value={formData.montant}
            onChange={handleChange}
            onWheel={(e) => e.preventDefault()}
            step="1000"
            required
          />
        </div>

        {/* Catégorie */}
        <div className="form-group">
          <label htmlFor="categorie">Catégorie *</label>
          <select
            id="categorie"
            name="categorie"
            value={formData.categorie}
            onChange={handleChange}
          >
            <option value="agence">Agence (taxes + frais)</option>
            <option value="cash">Cash (aucune déduction)</option>
          </select>
        </div>

        {/* % Agence */}
        {formData.categorie === 'agence' && (
          <div className="form-group">
            <label htmlFor="pourcentage_agence">Frais d'agence (%)</label>
            <input
              type="number"
              id="pourcentage_agence"
              name="pourcentage_agence"
              placeholder="15"
              value={formData.pourcentage_agence}
              onChange={handleChange}
              onWheel={(e) => e.preventDefault()}
              min="0"
              max="100"
              step="0.5"
            />
          </div>
        )}

        {/* Type de shooting */}
        <div className="form-group">
          <label htmlFor="type_id">Type de shooting *</label>
          <div className="type-select-container">
            <select
              id="type_id"
              name="type_id"
              value={formData.type_id}
              onChange={handleChange}
            >
              {types.map(type => (
                <option key={type.id} value={type.id}>
                  {type.nom}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowTypeForm(!showTypeForm)}
              className="btn-add-type"
              title="Créer un nouveau type"
            >
              +
            </button>
          </div>
        </div>

        {/* Formulaire ajouter type */}
        {showTypeForm && (
          <div className="type-form">
            <h4>Créer un nouveau type</h4>
            <div className="type-form-group">
              <input
                type="text"
                placeholder="Nom du type (ex: SNS Content)"
                value={newType.nom}
                onChange={(e) => setNewType({ ...newType, nom: e.target.value })}
              />
              <div className="color-picker">
                <label>Couleur :</label>
                <input
                  type="color"
                  value={newType.couleur}
                  onChange={(e) => setNewType({ ...newType, couleur: e.target.value })}
                />
                <span style={{ backgroundColor: newType.couleur, width: '30px', height: '30px', borderRadius: '4px' }}></span>
              </div>
            </div>
            <div className="type-form-actions">
              <button type="button" onClick={handleAddType} className="btn-create-type">
                Créer
              </button>
              <button type="button" onClick={() => setShowTypeForm(false)} className="btn-cancel-type">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Montant final */}
        <div className="form-group montant-final">
          <label>Montant final que tu reçois</label>
          <div className="montant-final-value">
            {formatWon(montantFinal)}
          </div>

          {montantBrut > 0 && formData.categorie === 'agence' && (
            <div className="deductions-breakdown">
              <p className="deduction-line">
                <span>Montant brut:</span>
                <span>{formatWon(montantBrut)}</span>
              </p>
              <p className="deduction-line">
                <span>- Taxes (3.3%):</span>
                <span>{formatWon(taxesDeductibles)}</span>
              </p>
              <p className="deduction-line">
                <span>- Frais agence ({formData.pourcentage_agence}%):</span>
                <span>{formatWon(fraisAgenceDeductibles)}</span>
              </p>
            </div>
          )}

          {montantBrut > 0 && formData.categorie === 'cash' && (
            <div className="deductions-breakdown">
              <p className="deduction-line cash-info">
                Aucune déduction - Tu reçois le montant intégral
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes">Notes (optionnel)</label>
          <textarea
            id="notes"
            name="notes"
            placeholder="Détails, frais..."
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Payé */}
        <div className="form-group checkbox-group">
          <label htmlFor="paye">
            <input
              type="checkbox"
              id="paye"
              name="paye"
              checked={formData.paye}
              onChange={handleChange}
            />
            <span>Marqué comme payé</span>
          </label>
        </div>

        {/* Nouveaux champs pour le visa / Activity Plan */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
          <h4 style={{ marginBottom: '10px', color: '#4b5563' }}>Informations Visa / Activity Plan (Optionnel)</h4>

          <div className="form-group">
            <label htmlFor="brand_name">Brand Name</label>
            <input type="text" id="brand_name" name="brand_name" placeholder="Ex: Samsung, VPAM" value={formData.brand_name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="project_name">Project Name</label>
            <input type="text" id="project_name" name="project_name" placeholder="Ex: Portable SSD T5" value={formData.project_name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <input type="text" id="role" name="role" placeholder="Ex: Sub, Main" value={formData.role} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input type="text" id="location" name="location" placeholder="Ex: Seoul" value={formData.location} onChange={handleChange} />
          </div>
        </div>


        {/* Buttons */}
        <div className="form-actions">
          <button type="submit" className="btn-submit">
            {isEditing ? '💾 Mettre à jour' : '✅ Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ShootingForm;