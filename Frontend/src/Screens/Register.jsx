import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Register.css";
const Registration = () => {
  const [role, setRole] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [zipCode, setZipCode] = useState("");

  const [registering, setRegistering] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:5000/register", {
        role: role.toLowerCase(),
        firstname: firstName,
        lastname: lastName,
        email,
        username,
        mobile_number: mobileNumber,
        password,
        address,
        state,
        city,
        country,
        zip_code: zipCode,
      });

      setRegistering(true);
      setErrors({});
    } catch (error) {
      console.error("Registration error:", error.response?.data);

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        console.error("Registration failed. Try again.");
      }
    }
  };

  return (
    <>
      {registering ? (
        <div className="body">
          <div className="register-success-container">
            <p className="text">Registered successfully! Please login now.</p>
            <button className="login-btn" onClick={() => navigate("/login")}>
              Go to Login
            </button>
          </div>
        </div>
      ) : (
        <div className="body">
          <div className="container">
            <h2>Registration</h2>
            <p>Role:</p>
            <div className="radio-container">
              <div className="radio-group">
                <input
                  type="radio"
                  value="owner"
                  checked={role === "owner"}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setErrors((prev) => ({ ...prev, role: null }));
                  }}
                />
                <p className="radio-label">Owner</p>
              </div>

              <div className="radio-group">
                <input
                  type="radio"
                  value="tenant"
                  checked={role === "tenant"}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setErrors((prev) => ({ ...prev, role: null }));
                  }}
                />
                <p className="radio-label">Tenant</p>
              </div>

              <div className="radio-group">
                <input
                  type="radio"
                  value="buyer"
                  checked={role === "buyer"}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setErrors((prev) => ({ ...prev, role: null }));
                  }}
                />
                <p className="radio-label">Buyer</p>
              </div>
            </div>
            {errors.role && <div className="error">{errors.role.msg}</div>}
            <p>First Name:</p>
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setErrors((prev) => ({ ...prev, firstname: null }));
              }}
              className={errors.firstname ? "input error-border" : "input"}
            />
            {errors.firstname && (
              <span className="error">{errors.firstname.msg}</span>
            )}
            <p>Last Name:</p>
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setErrors((prev) => ({ ...prev, lastname: null }));
              }}
              className={errors.lastname ? "input error-border" : "input"}
            />
            {errors.lastname && (
              <span className="error">{errors.lastname.msg}</span>
            )}
            <p>Email:</p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: null }));
              }}
              className={errors.email ? "input error-border" : "input"}
            />
            {errors.email && <span className="error">{errors.email.msg}</span>}
            <p>Username:</p>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors((prev) => ({ ...prev, username: null }));
              }}
              className={errors.username ? "input error-border" : "input"}
            />
            {errors.username && (
              <span className="error">{errors.username.msg}</span>
            )}
            <p>Mobile Number:</p>
            <input
              type="tel"
              placeholder="Mobile Number"
              value={mobileNumber}
              onChange={(e) => {
                setMobileNumber(e.target.value);
                setErrors((prev) => ({ ...prev, mobile_number: null }));
              }}
              className={errors.mobile_number ? "input error-border" : "input"}
            />
            {errors.mobile_number && (
              <span className="error">{errors.mobile_number.msg}</span>
            )}
            <p>Password:</p>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: null }));
              }}
              className={errors.password ? "input error-border" : "input"}
            />
            {errors.password && (
              <span className="error">{errors.password.msg}</span>
            )}
            <p>Address:</p>
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setErrors((prev) => ({ ...prev, address: null }));
              }}
              className={errors.address ? "input error-border" : "input"}
            />
            {errors.address && (
              <span className="error">{errors.address.msg}</span>
            )}
            <p>State:</p>
            <input
              type="text"
              placeholder="State"
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setErrors((prev) => ({ ...prev, state: null }));
              }}
              className={errors.state ? "input error-border" : "input"}
            />
            {errors.state && <span className="error">{errors.state.msg}</span>}
            <p>City:</p>
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setErrors((prev) => ({ ...prev, city: null }));
              }}
              className={errors.city ? "input error-border" : "input"}
            />
            {errors.city && <span className="error">{errors.city.msg}</span>}
            <p>Country:</p>
            <input
              type="text"
              placeholder="Country"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setErrors((prev) => ({ ...prev, country: null }));
              }}
              className={errors.country ? "input error-border" : "input"}
            />
            {errors.country && (
              <span className="error">{errors.country.msg}</span>
            )}
            <p>Zip Code:</p>
            <input
              type="text"
              placeholder="Zip Code"
              value={zipCode}
              onChange={(e) => {
                setZipCode(e.target.value);
                setErrors((prev) => ({ ...prev, zip_code: null }));
              }}
              className={errors.zip_code ? "input error-border" : "input"}
            />
            {errors.zip_code && (
              <span className="error">{errors.zip_code.msg}</span>
            )}
            <div className="button-container">
              <button className="register-btn" onClick={handleRegister}>
                Register
              </button>
            </div>

            <p className="login-text">
              Already have an account? <a href="/login">Login</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Registration;
