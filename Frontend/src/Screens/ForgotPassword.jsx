import React, { useState } from "react";
import "./ForgotPassword.css";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newpassword, setNewPassword] = useState("");
  const [confirmpassword, setConfrimPassword] = useState("");
  const [showModel, setShowModel] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  console.log("error", errors);

  console.log("new password", newpassword);

  const handleOtp = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/forgot-password",
        {
          email,
        },
      );

      toast.success("OTP sent to your email!", {
        position: "top-right",
        autoClose: 2000,
        top: 30,
      });

      setShowModel(true);
      setErrors({});
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        setShowModel(false);
      } else {
        toast.error("Server error");
      }
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/reset-password",
        {
          otp,
          newPassword: newpassword,
          confirmPassword: confirmpassword,
        },
      );
      toast.success("Password Reset Successful!", {
        position: "top-right",
        autoClose: 2000,
        top: 30,
      });
      setErrors({});

      navigate("/login");
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error("Server error");
      }
    }
  };
  return (
    <div className="body">
      <div className="ForgotPassword-container">
        {!showModel ? (
          <div>
            <h2>Forgot Password</h2>
            <div className="inputWrapper">
              <p className="text">
                Enter your email address to reset your password:
              </p>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: null }));
                }}
                className={errors.email ? "input error-border" : "input-feild"}
                required
              />
              {errors.email && <p className="error">{errors.email.msg}</p>}
            </div>
          </div>
        ) : (
          <div>
            <p>Enter OTP:</p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setErrors((prev) => ({ ...prev, otp: null }));
              }}
              className={errors.otp ? "input error-border" : "input-feild"}
              required
            />
            {errors.otp && <p className="error">{errors.otp.msg}</p>}

            <p>Enter new password :</p>
            <input
              type="password"
              placeholder="Enter New Password"
              value={newpassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors((prev) => ({ ...prev, newPassword: null }));
              }}
              className={
                errors.newPassword ? "input error-border" : "input-field"
              }
              required
            />
            {errors.newPassword && (
              <p className="error">{errors.newPassword.msg}</p>
            )}

            <p>Confirm password :</p>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmpassword}
              onChange={(e) => {
                setConfrimPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: null }));
              }}
              className={
                errors.confirmPassword ? "input error-border" : "input-field"
              }
              required
            />
            {errors.confirmPassword && (
              <p className="error">{errors.confirmPassword.msg}</p>
            )}
          </div>
        )}

        <div className="buttonContainer">
          {!showModel ? (
            <button className="resetBtn" onClick={handleOtp}>
              Send OTP
            </button>
          ) : (
            <button className="resetBtn" onClick={handleReset}>
              Reset Password
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
