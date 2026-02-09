import React, { useContext, useEffect, useState } from "react";
import "./Dashboard.css";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="dashboard-body">
      <div className="dashboard-container">
        <h2 className="title">Welcome to HouseHunt</h2>
        <p className="subText">
          You are successfully logged in, <strong>{user?.firstname} </strong>
        </p>
        <p className="role">
          Role is <strong> {user?.role}</strong>
        </p>
        {user && user?.role === "tenant" && (
          <>
            <h3 className="dashboard-subtitle">As a Tenant:</h3>
            <p className="dashboard-description">
              You can browse and view available properties and book them.
            </p>
          </>
        )}
        {user && user?.role === "buyer" && (
          <>
            <p className="dashboard-subtitle">As a Buyer:</p>
            <p className="dashboard-description">
              You have the ability to buy properties. Explore the listings and
              make your purchase.
            </p>
          </>
        )}

        {user && user?.role === "owner" && (
          <>
            <h4>As an Owner:</h4>
            <p>
              You can create, update, and manage your own property listings.
              Share your properties with potential tenants and buyers.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
export default Dashboard;
