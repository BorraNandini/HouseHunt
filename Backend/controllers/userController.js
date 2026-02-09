const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const moment = require("moment");

const User = require("../models/User");
const userMiddleware = require("../Middleware/userMiddleware");
const blacklist = require("../helpers/Blacklist");

const JWT_SECRET = "jwt_secret_key";

exports.register = [
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("register", {
        errors: errors.array(),
        data: req.body,
      });
    }

    const {
      firstname,
      lastname,
      email,
      username,
      mobile_number,
      address,
      state,
      city,
      country,
      zip_code,
      password,
      role,
    } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        firstname,
        lastname,
        email,
        username,
        mobile_number,
        address,
        state,
        city,
        country,
        zip_code,
        password: hashedPassword,
        role,
      });

      res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
      console.error("Error details:", error);
      res
        .status(500)
        .json({ message: "Error registering user", error: error.message });
    }
  },
];

exports.login = [
  body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect Password" });
      }

      const payload = {
        userId: user.id,
        role: user.role,
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Error details:", error);
      res
        .status(500)
        .json({ message: "Error logging in", error: error.message });
    }
  },
];

exports.editProfile = [
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, mobile_number, address, image } = req.body;

    try {
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (email) {
        user.email = email;
      }

      if (mobile_number) {
        user.mobile_number = mobile_number;
      }

      if (address) {
        user.address = address;
      }

      if (req.file) {
        const image = req.file;
        user.image = `/uploads/${image.filename}`;
      }

      await user.save();

      res.status(200).json({
        message: "Profile updated successfully",
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          mobile_number: user.mobile_number,
          address: user.address,
          image: user.image,
        },
      });
    } catch (error) {
      console.error("Error details:", error);
      res
        .status(500)
        .json({ message: "Error updating profile", error: error.message });
    }
  },
];
exports.changePassword = [
  body("current_password")
    .notEmpty()
    .exists()
    .withMessage("Current password is required")
    .custom(async (value, { req }) => {
      if (!req.user) {
        throw new Error("User not authenticated");
      }

      const user = await User.findByPk(req.user.id);
      if (!user) {
        throw new Error("User not found");
      }

      const isMatch = await bcrypt.compare(value, user.password);
      if (!isMatch) {
        throw new Error("Incorrect current password");
      }
      return true;
    }),

  body("new_password")
    .notEmpty()
    .withMessage("New password is required")
    .bail()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .bail()
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .bail()
    .matches(/[0-9]/)
    .withMessage("New password must contain at least one number")
    .bail()
    .matches(/[\W_]/)
    .withMessage(
      "New password must contain at least one special character (e.g. @, #, $, etc.)"
    ),

  body("confirm_password")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error("New password and confirm password must match");
      }
      return true;
    }),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { current_password, new_password, confirm_password } = req.body;

    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);
      user.password = hashedPassword;

      await user.save();
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res
        .status(500)
        .json({ message: "Error updating password", error: error.message });
    }
  },
];

exports.forgotPassword = [
  body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const transporter = nodemailer.createTransport({
      host: "smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "4aed33d360731e",
        pass: "5c1d19075a612b",
      },
    });

    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res
          .status(400)
          .json({ message: "No user found with this email" });
      }
      const token = crypto.randomBytes(20).toString("hex");
      const expirationTime = new Date(Date.now() + 3600000);

      console.log("Generated token:", token);
      console.log("Expiration time:", expirationTime);

      const updatedUser = await user.update({
        reset_token: token,
        reset_token_expiry: expirationTime,
      });

      console.log("User after update:", updatedUser);

      const resetLink = `http://localhost:3000/api/resetPassword?token=${token}`;
      const mailOptions = {
        from: "swetha.kotuluru1@gmail.com",
        to: email,
        subject: "Password Reset Request",
        text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: "Password reset link sent" });
    } catch (error) {
      console.error("Error during password reset process:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
];

exports.resetPassword = [
  body("token").custom((value, { req }) => {
    if (!value || value.trim() === "") {
      throw new Error("Please enter a valid token");
    }
    return true;
  }),

  body("newPassword").custom((value, { req }) => {
    const errors = [];

    if (!value) {
      errors.push("Password is required");
    } else {
      if (value.length < 8) {
        errors.push("Password must be at least 8 characters long");
      }
      if (!/[A-Z]/.test(value)) {
        errors.push("Password must contain at least one uppercase letter");
      }
      if (!/[a-z]/.test(value)) {
        errors.push("Password must contain at least one lowercase letter");
      }
      if (!/[0-9]/.test(value)) {
        errors.push("Password must contain at least one number");
      }
      if (!/[\W_]/.test(value)) {
        errors.push(
          "Password must contain at least one special character (e.g. @, #, $, etc.)"
        );
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(" | "));
    }

    return true;
  }),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword, confirmPassword } = req.body;

    try {
      const user = await User.findOne({ where: { reset_token: token } });

      if (!user) {
        return res
          .status(400)
          .json({ message: "This token has already been used or is expired." });
      }
      if (newPassword !== confirmPassword) {
        return res
          .status(400)
          .json({ message: "Confirm password must match the new password" });
      }

      console.log("Token received:", token);
      console.log("User's token in DB:", user.reset_token);
      console.log("Token expiry in DB:", user.reset_token_expiry);

      const currentTime = moment.utc();
      const expiryTime = moment.utc(user.reset_token_expiry);

      console.log("Current Time (UTC):", currentTime.format());
      console.log("Expiry Time (UTC):", expiryTime.format());

      if (currentTime.isAfter(expiryTime)) {
        return res.status(400).json({ message: "Token has expired" });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      await user.update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      });

      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
];

exports.logout = async (req, res) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];

    if (token) {
      blacklist.push(token);

      return res.status(200).json({ message: "Successfully logged out." });
    } else {
      return res.status(400).json({ message: "No token provided." });
    }
  } catch (error) {
    console.error("Logout Error:", error);
    res
      .status(500)
      .json({ message: "Error logging out", error: error.message });
  }
};
