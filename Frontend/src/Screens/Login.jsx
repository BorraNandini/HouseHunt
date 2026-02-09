import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  console.log("Errors state:", errors);
  const navigate = useNavigate();

  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:5000/login", {
        email: email,
        password: password,
      });

      login({
        userData: response.data.user,
        token: response.data.token,
      });

      setErrors({});
      navigate("/dashboard");
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        console.error("Login failed. Try again.");
      }
    }
  };

  return (
    <div className="body">
      <div className="Container">
        <h2>Login</h2>

        <div className="input-wrapper">
          <p>Email:</p>
          <input
            // className="input-field"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: null }));
            }}
            className={errors.email ? "input error-border" : "input-feild"}
          />

          {errors.email && <p className="error">{errors.email.msg}</p>}
          <p>Password:</p>

          <input
            className={errors.password ? "input error-border" : "input-feild"}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: null }));
            }}
          />
          {errors.password && <p className="error">{errors.password.msg}</p>}
        </div>

        <div className="button-container">
          <button className="login-btn" onClick={handleLogin}>
            Login
          </button>
        </div>

        <p className="forgotpassword">
          <a href="/forgotpassword">Forgot Password?</a>
        </p>

        <p className="register-link">
          Don't have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
