import React from "react";
import "./HomePage.css";

const Home = () => {
  return (
    <>
      <div className="body">
        <div className="welcome-container">
          <h2 className="home-title">Welcome to the House Hunt</h2>
          <h3 className="home-subtitle">Find your perfect home.</h3>

          <div className="radio-container">
            <input type="radio" name="property_status" value="buy" />
            <label>Buy</label>

            <input type="radio" name="property_status" value="rent" />
            <label>Rent</label>
          </div>

          <div className="homesearch-container">
            <input
              type="text"
              name="search"
              placeholder="Search by city, state, address, etc."
              className="search-input"
            />
            <button type="submit" className="btn">
              Search
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
