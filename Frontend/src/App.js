import logo from "./logo.svg";
import { Router, Route, Routes } from "react-router-dom";
import Navbar from "./Screens/Navbar";
import Login from "./Screens/Login";
import Register from "./Screens/Register";
import HomePage from "./Screens/HomePage";
import ForgotPassword from "./Screens/ForgotPassword";
import Dashboard from "./Screens/Dashboard";
import { AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditProfile from "./Screens/EditProfile";

function App() {
  const { user } = useContext(AuthContext);
  return (
    <>
      <Navbar user={user} />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/editprofile" element={<EditProfile />} />
      </Routes>
    </>
  );
}

export default App;
