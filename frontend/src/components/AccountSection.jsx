import React from 'react';
import { FaUser, FaEnvelope, FaBuilding } from 'react-icons/fa';

const AccountSection = ({ user }) => {
  return (
    <div className="account-section">
      <h3>Account Information</h3>
      <div className="account-info">
        <div className="info-item">
          <FaUser className="info-icon" />
          <span>{user.full_name}</span>
        </div>
        <div className="info-item">
          <FaEnvelope className="info-icon" />
          <span>{user.email}</span>
        </div>
        {user.company && (
          <div className="info-item">
            <FaBuilding className="info-icon" />
            <span>{user.company}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSection; 