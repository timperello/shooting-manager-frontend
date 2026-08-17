// shooting-manager-frontend/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatWon } from '../utils/formatters';
import '../styles/Dashboard.css';

const API_URL = 'process.env.REACT_APP_API_URL' || 'http://localhost:5000/api';

function Dashboard({ stats, shootings, payments }) {
  const [timeline, setTimeline] = useState([]);
  const [paymentTimeline, setPaymentTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const [timelineRes, paymentsRes] = await Promise.all([
          fetch(`${API_URL}/stats/timeline`),
          fetch(`${API_URL}/stats/payments-timeline`)
        ]);

        const timelineData = await timelineRes.json();
        const paymentsData = await paymentsRes.json();

        setTimeline(timelineData || []);
        setPaymentTimeline(paymentsData || []);
      } catch (error) {
        console.error('Erreur fetch charts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [shootings, payments]);

  if (!stats) return <div>Aucune donnée</div>;

  // Montant généré ce mois (utilise la réponse du backend)
  const montantGenere = stats.montant_genere || 0;
  const montantAttente = stats.montant_attente || 0;

  // Dernier paiement
  const lastPayment = payments && payments.length > 0 ? payments[0] : null;
  const lastPaymentAmount = lastPayment ? lastPayment.montant : 0;
  const lastPaymentDate = lastPayment ? new Date(lastPayment.date_paiement).toLocaleDateString('fr-FR') : 'Aucun';

  return (
    <div className="dashboard">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-generated">
          <div className="kpi-label">💵 Généré ce mois</div>
          <div className="kpi-value">{formatWon(montantGenere)}</div>
          <div className="kpi-subtitle">{stats.nombre_shoots || 0} shoots</div>
        </div>

        <div className="kpi-card kpi-received">
          <div className="kpi-label">💰 Dernier paiement</div>
          <div className="kpi-value">{formatWon(lastPaymentAmount)}</div>
          <div className="kpi-subtitle">📅 {lastPaymentDate}</div>
        </div>

        <div className="kpi-card kpi-pending">
          <div className="kpi-label">⏳ En attente (total)</div>
          <div className="kpi-value">{formatWon(montantAttente)}</div>
          <div className="kpi-subtitle">{stats.shoots_impaye || 0} impayés</div>
        </div>
      </div>

      {/* Charts */}
      {!loading && (
        <div className="charts-grid">
          {/* Timeline Shootings */}
          <div className="chart-card">
            <h3>📅 Revenu shoots par mois</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="mois"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatWon(value)}
                />
                <Line
                  type="monotone"
                  dataKey="montant"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline Paiements */}
          <div className="chart-card">
            <h3>💳 Paiements reçus par mois</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={paymentTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="mois"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatWon(value)}
                />
                <Line
                  type="monotone"
                  dataKey="montant"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;