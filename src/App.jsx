// shooting-manager-frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import BottomNavigation from './components/BottomNavigation';
import Dashboard from './components/Dashboard';
import ShootingForm from './components/ShootingForm';
import ShootingList from './components/ShootingList';
import PaymentForm from './components/PaymentForm';
import PaymentList from './components/PaymentList';
import NewOption from './components/NewOption';
import ExportForm from './components/ExportForm';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [shootings, setShooting] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [payments, setPayments] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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

  // Détecter mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Charger les données au démarrage
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
        setActiveTab('shootings');
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

  const renderContent = () => {
    if (loading) {
      return <div className="loading">Chargement...</div>;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard stats={stats} shootings={shootings} payments={payments} />
        );

      case 'new':
        return (
          <NewOption
            onSelectShooting={() => setActiveTab('new-shooting')}
            onSelectPayment={() => setActiveTab('new-payment')}
          />
        );

      case 'new-shooting':
        return (
          <ShootingForm
            onSubmit={handleAddShooting}
            types={types}
            onAddType={handleAddType}
          />
        );

      case 'new-payment':
        return (
          <PaymentForm
            shootings={shootings.filter((s) => !s.paye)}
            onSubmit={handleAddPayment}
          />
        );

      case 'shootings':
        return (
          <ShootingList
            shootings={shootings}
            types={types}
            onEdit={(id) => {
              setEditingId(id);
              setActiveTab('edit-shooting');
            }}
            onDelete={handleDeleteShooting}
            onUpdate={handleUpdateShooting}
            editingId={editingId}
          />
        );

      case 'edit-shooting':
        return editingId ? (
          <ShootingForm
            onSubmit={(data) => {
              handleUpdateShooting(editingId, data);
            }}
            initialData={shootings.find((s) => s.id === editingId)}
            isEditing={true}
            types={types}
            onAddType={handleAddType}
          />
        ) : null;

      case 'payments':
        return (
          <PaymentList payments={payments} onDelete={handleDeletePayment} />
        );

      case 'export':
        return <ExportForm shootings={shootings} payments={payments} />;

      default:
        return (
          <Dashboard stats={stats} shootings={shootings} payments={payments} />
        );
    }
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-content">
          <h1>Shooting Manager</h1>
          <p className="tagline">Gère tes shoots, suis ton argent</p>
        </div>
      </header>

      {/* NAVIGATION TABS (Desktop only) */}
      {!isMobile && (
        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>

          <button
            className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            Nouveau
          </button>

          <button
            className={`tab-btn ${activeTab === 'shootings' ? 'active' : ''}`}
            onClick={() => setActiveTab('shootings')}
          >
            Shoots
          </button>

          <button
            className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Paiements
          </button>

          <button
            className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Exporter
          </button>
        </nav>
      )}

      {/* MAIN CONTENT */}
      <main className="main-content">{renderContent()}</main>

      {/* FOOTER */}
      <footer className="app-footer">
        <p>Built with React & Supabase | v2.0</p>
      </footer>

      {/* BOTTOM NAVIGATION (Mobile only) */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;