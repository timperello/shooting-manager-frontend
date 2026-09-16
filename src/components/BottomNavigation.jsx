import React from 'react';
import '../styles/BottomNavigation.css';
import DashboardIcon from '../icons/Dashboard.svg';
import PlusIcon from '../icons/Plus.svg';
import ShootingListIcon from '../icons/ShootingList.svg';
import PaymentListIcon from '../icons/PaymentList.svg';
import ExportIcon from '../icons/Export.svg';

function BottomNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, title: 'Dashboard' },
    { id: 'new', label: 'New', icon: PlusIcon, title: 'New' },
    { id: 'shootings', label: 'Shootings', icon: ShootingListIcon, title: 'Shootings' },
    { id: 'payments', label: 'Payments', icon: PaymentListIcon, title: 'Payments' },
    { id: 'export', label: 'Export', icon: ExportIcon, title: 'Export' }
  ];

  return (
    <nav className="bottom-navigation">
      <div className="nav-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            title={tab.title}
            aria-label={tab.label}
          >
            <img src={tab.icon} alt={tab.label} className="nav-icon" />
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default BottomNavigation;