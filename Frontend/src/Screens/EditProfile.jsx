import React, { use, useState } from "react";
import "./EditProfile.css";
const [firstname, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [email, setEmail] = useState("");
const [mobile, setMobile] = useState("");
const [address, setAddress] = useState("");

const EditProfile = () => {
  return (
    <div className="edit-body">
      <div className="edit-container">
        <h1>Edit Profile</h1>
        <p>First Name :</p>
        <input type="text" value={firstname} />
      </div>
    </div>
  );
};

export default EditProfile;
