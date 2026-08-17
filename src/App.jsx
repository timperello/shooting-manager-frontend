// shooting-manager-frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ShootingForm from './components/ShootingForm';
import ShootingList from './components/ShootingList';
import PaymentForm from './components/PaymentForm';
import PaymentList from './components/PaymentList';
import NewOption from './components/NewOption';
import ExportForm from './components/ExportForm';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log(process.env.REACT_APP_API_URL);
function App() {
  const [shootings, setShooting] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [payments, setPayments] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // Fetch tous les shootings, stats et types
  const fetchData = async () => {
    try {
      setLoading(true);
      const [shootingRes, paymentsRes, statsRes, typesRes] = await Promise.all([
        fetch(`${API_URL}/shootings`),
        fetch(`${API_URL}/payments`),
        fetch(`${API_URL}/stats/current-month`),
        fetch(`${API_URL}/types`)
      ]);

      const shootingData = await shootingRes.json();
      const paymentsData = await paymentsRes.json();
      const statsData = await statsRes.json();
      const typesData = await typesRes.json();

      setShooting(shootingData);
      setPayments(paymentsData);
      setStats(statsData);
      setTypes(typesData);
    } catch (error) {
      console.error('Erreur fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddShooting = async (formData) => {
    try {
      const response = await fetch(`${API_URL}/shootings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchData();
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Erreur création:', error);
    }
  };

  const handleUpdateShooting = async (id, formData) => {
    try {
      const response = await fetch(`${API_URL}/shootings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchData();
        setEditingId(null);
        setActiveTab('list-shootings');
      }
    } catch (error) {
      console.error('Erreur update:', error);
    }
  };

  const handleDeleteShooting = async (id) => {
    if (window.confirm('Supprimer ce shooting ?')) {
      try {
        await fetch(`${API_URL}/shootings/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  const handleAddPayment = async (formData) => {
    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchData();
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Erreur création paiement:', error);
    }
  };

  const handleDeletePayment = async (id) => {
    if (window.confirm('Supprimer ce paiement ?')) {
      try {
        await fetch(`${API_URL}/payments/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  const handleAddType = async (newType) => {
    try {
      const response = await fetch(`${API_URL}/types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newType)
      });

      if (response.ok) {
        const data = await response.json();
        setTypes([...types, data]);
      }
    } catch (error) {
      console.error('Erreur création type:', error);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>📸 Shooting Manager</h1>
          <p className="tagline">Gère tes shoots, suis ton argent</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>

        <button
          className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          ➕ Nouveau
        </button>

        <button
          className={`tab-btn ${activeTab === 'list-shootings' ? 'active' : ''}`}
          onClick={() => setActiveTab('list-shootings')}
        >
          📋 Shoots
        </button>

        <button
          className={`tab-btn ${activeTab === 'list-payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('list-payments')}
        >
          💳 Paiements
        </button>

        <button
          className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          📥 Exporter
        </button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {loading && <div className="loading">Chargement...</div>}

        {!loading && activeTab === 'dashboard' && (
          <Dashboard stats={stats} shootings={shootings} payments={payments} />
        )}

        {!loading && activeTab === 'new' && (
          <NewOption
            onSelectShooting={() => setActiveTab('new-shooting')}
            onSelectPayment={() => setActiveTab('new-payment')}
          />
        )}

        {!loading && activeTab === 'new-shooting' && !editingId && (
          <ShootingForm 
            onSubmit={handleAddShooting}
            types={types}
            onAddType={handleAddType}
          />
        )}

        {!loading && activeTab === 'new-payment' && (
          <PaymentForm
            shootings={shootings.filter(s => !s.paye)}
            onSubmit={handleAddPayment}
          />
        )}

        {!loading && activeTab === 'list-shootings' && (
          <ShootingList
            shootings={shootings}
            types={types}
            onEdit={(id) => {
              setEditingId(id);
              setActiveTab('new-shooting');
            }}
            onDelete={handleDeleteShooting}
            onUpdate={handleUpdateShooting}
            editingId={editingId}
          />
        )}

        {!loading && activeTab === 'list-payments' && (
          <PaymentList
            payments={payments}
            onDelete={handleDeletePayment}
          />
        )}

        {!loading && activeTab === 'export' && (
          <ExportForm
            shootings={shootings}
            payments={payments}
          />
        )}

        {!loading && editingId && activeTab === 'new-shooting' && (
          <ShootingForm
            onSubmit={(data) => {
              handleUpdateShooting(editingId, data);
            }}
            initialData={shootings.find(s => s.id === editingId)}
            isEditing={true}
            types={types}
            onAddType={handleAddType}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>🌟 Built with React & Node.js | v1.0</p>
      </footer>
    </div>
  );
}

export default App;