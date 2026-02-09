import React, { useContext } from "react";
import "./Navbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faUser } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = ({ user, hasShortlisted }) => {
  const location = useLocation();

  const { logout } = useContext(AuthContext);

  return (
    <header>
      <a
        href="/"
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <img src="/images/logo.png" alt="house" className="my-image" />
      </a>

      <nav>
        {!user && (
          <>
            {location.pathname === `/` ? (
              <div>
                <a href="/login">Login</a>
                <a href="/register">Register</a>
              </div>
            ) : null}
          </>
        )}

        {user && user.role === "owner" && (
          <>
            <div className="navsearch-container">
              <FontAwesomeIcon icon={faSearch} className="navsearch-icon" />

              <input type="text" placeholder="Search properties..." />
            </div>

            <div className="dropdown">
              <button className="navdropbtn">Property Owners</button>
              <div className="dropdown-content">
                <a href="/createProperty">Create Property</a>
                <a href="/propertylisting">Properties List</a>
                <a href="/bookinglisting">Booking List</a>
                <a href="/rentalAgreements">View Rental Agreements</a>
              </div>
            </div>
          </>
        )}

        {user && user.role === "tenant" && (
          <>
            <div className="navsearch-container">
              <FontAwesomeIcon icon={faSearch} className="navsearch-icon" />

              <input type="text" placeholder="Search properties..." />
            </div>

            <a
              href="/ShortlistedProperties"
              title="View Shortlisted Properties"
            >
              {hasShortlisted ? (
                <FontAwesomeIcon
                  icon={faHeartSolid}
                  style={{
                    color: "red",
                    cursor: "pointer",
                    fontSize: "23px",
                  }}
                />
              ) : (
                <FontAwesomeIcon
                  icon={faHeartRegular}
                  style={{
                    cursor: "pointer",
                    fontSize: "23px",
                    marginTop: "8px",
                  }}
                />
              )}
            </a>

            <div className="dropdown">
              <button className="navdropbtn">View Properties</button>
              <div className="dropdown-content">
                <a href="/propertylisting">Properties List</a>
                <a href="/bookinglisting">Booking List</a>
                <a href="/rentalAgreements">View Rental Agreements</a>
              </div>
            </div>
          </>
        )}

        {user && user.role === "buyer" && (
          <>
            <div className="navsearch-container">
              <FontAwesomeIcon icon={faSearch} className="navsearch-icon" />

              <input type="text" placeholder="Search properties..." />
            </div>

            <a
              href="/ShortlistedProperties"
              title="View Shortlisted Properties"
            >
              {hasShortlisted ? (
                <FontAwesomeIcon
                  icon={faHeartSolid}
                  style={{
                    color: "red",
                    cursor: "pointer",
                    fontSize: "23px",
                  }}
                />
              ) : (
                <FontAwesomeIcon
                  icon={faHeartRegular}
                  style={{
                    cursor: "pointer",
                    fontSize: "23px",
                    marginTop: "8px",
                  }}
                />
              )}
            </a>

            <div className="dropdown">
              <button className="navdropbtn">View Properties</button>
              <div className="dropdown-content">
                <a href="/propertylisting">Properties List</a>
                <a href="/bookinglisting">Booking List</a>
              </div>
            </div>
          </>
        )}

        {user && (
          <div className="dropdown">
            <button className="navdropbtn">
              <FontAwesomeIcon icon={faUser} /> Hi, {user.firstname}
            </button>
            <div className="dropdown-content">
              <a href="/editprofile">Edit Profile</a>
              <a href="/changePassword">Change Password</a>
              <a href="/">
                <p onClick={logout}>Logout</p>
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
