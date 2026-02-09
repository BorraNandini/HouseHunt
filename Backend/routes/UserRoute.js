const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "jwt_secret_key";
const blacklist = require("../helpers/Blacklist");

const {
  register,
  login,
  editProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
} = require("../controllers/userController");
const userMiddleware = require("../Middleware/userMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

router.get("/homePage", async (req, res) => {
  const search = req.query.search || "";
  const filter = req.query.filter || "";
  const property_status = req.query.property_status || "";

  res.cookie("search", search);
  res.cookie("filter", filter);
  res.cookie("property_status", property_status);

  const user = req.user || req.session.user;

  // [console.log("User in /homePage:", user);]

  let hasShortlisted = false;

  if (user && user.role !== "owner") {
    try {
      const shortlisted = await ShortlistedProperties.findOne({
        where: { user_id: user.id },
      });

      hasShortlisted = !!shortlisted;

      console.log("Shortlisted properties:", shortlisted);
    } catch (err) {
      console.error("Error checking shortlist:", err);
    }
  }

  res.render("homePage", {
    user,
    title: "HouseHunt",
    search,
    filter,
    property_status,
    hasShortlisted: true,
  });
});

router.get("/register", (req, res) => {
  const token =
    req.cookies.authToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded) {
        return res.redirect("/dashboard");
      }
    } catch (err) {}
  }

  const message = req.cookies.otp_message;
  res.render("register", {
    user: req.user || req.session.user,
    title: "register",
    errors: {},
    data: {},
  });
});

router.post(
  "/register",
  [
    body("firstname")
      .notEmpty()
      .withMessage("First name is required")
      .bail()
      .matches(/^[A-Za-z]+$/)
      .withMessage("First name must only contain letters"),
    body("lastname")
      .notEmpty()
      .withMessage("Last name is required")
      .bail()
      .matches(/^[A-Za-z]+$/)
      .withMessage("Last name must only contain letters"),

    body("email")
      .isEmail()
      .withMessage("email is required")
      .bail()
      .normalizeEmail()
      .custom(async (value) => {
        if (value) {
          const existingEmail = await User.findOne({ where: { email: value } });
          if (existingEmail) {
            throw new Error("Email already in use");
          }
        }
        return true;
      }),

    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .bail()
      .custom(async (value) => {
        if (value) {
          const existingUser = await User.findOne({
            where: { username: value },
          });
          if (existingUser) {
            throw new Error("Username already in use");
          }
        }
        return true;
      }),

    body("mobile_number")
      .notEmpty()
      .withMessage("Mobile number is required")
      .bail()
      .isNumeric()
      .withMessage("Mobile number must only contain numbers")
      .bail()
      .isLength({ min: 10, max: 10 })
      .withMessage("Enter 10 numeric characters")
      .bail()
      .custom(async (value) => {
        if (value) {
          const existingUser = await User.findOne({
            where: { mobile_number: value },
          });
          if (existingUser) {
            throw new Error("Mobile number already in use");
          }
        }
        return true;
      }),

    body("password").custom((value, { req }) => {
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
            "Password must contain at least one special character (e.g. @, #, $, etc.)",
          );
        }
      }

      if (errors.length > 0) {
        throw new Error(errors.join(","));
      }

      return true;
    }),
    body("address").notEmpty().withMessage("Address is required"),
    body("state")
      .notEmpty()
      .withMessage("State is required")
      .bail()
      .matches(/^[A-Za-z]+$/)
      .withMessage("State must only contain letters"),
    body("city")
      .notEmpty()
      .withMessage("City is required")
      .bail()
      .matches(/^[A-Za-z]+$/)
      .withMessage("City must only contain letters"),
    body("country")
      .notEmpty()
      .withMessage("Country is required")
      .bail()
      .matches(/^[A-Za-z]+$/)
      .withMessage("Country must only contain letters"),
    body("zip_code")
      .isNumeric()
      .withMessage("Zip code must only contain numbers")
      .bail()
      .custom((value) => {
        if (!value) {
          throw new Error("Zip code is required");
        }

        if (!/^\d{6}$/.test(value)) {
          throw new Error("Invalid format of Zipcode");
        }

        return true;
      }),
    body("role")
      .notEmpty()
      .withMessage("Role is required")
      .isIn(["owner", "tenant", "buyer"])
      .withMessage(" Role is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const data = req.body;

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.mapped(),
      });
    }

    const {
      firstname,
      lastname,
      email,
      username,
      mobile_number,
      address,
      password,
      state,
      city,
      country,
      zip_code,
      role,
    } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      firstname,
      lastname,
      email,
      username,
      mobile_number,
      password: hashedPassword,
      address,
      state,
      city,
      country,
      zip_code,
      role,
    });

    const transporter = nodemailer.createTransport({
      host: "smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "4aed33d360731e",
        pass: "5c1d19075a612b",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: "swetha.kotuluru1@gmail.com",
      to: email,
      subject: "Welcome to HouseHunt Platform",
      html: `
        <h1>Welcome, ${firstname} ${lastname}!</h1>
        <p>Thank you for registering on our HouseHunt platform.</p>
        <p>Here are your registration details:</p>
        <ul>
          <li><strong>Username:</strong> ${username}</li>
          <li><strong>Mobile Number:</strong> ${mobile_number}</li>
          <li><strong>Address:</strong> ${address}, ${city}, ${state}, ${country} - ${zip_code}</li>
          <li><strong>Role:</strong> ${role}</li>
        </ul>
        <p>We are excited to have you on board. Feel free to explore our platform!</p>
        <p>Best regards,<br>The HouseHunt Team</p>
      `,
    };

    try {
      res.status(201).json({
        success: true,
        message:
          "Registration successful! Please check your email for confirmation.",
        user: {
          id: newUser.id,
          firstname,
          lastname,
          email,
          username,
          role,
        },
      });

      transporter
        .sendMail(mailOptions)
        .then(() => console.log("Welcome email sent"))
        .catch((err) => console.error("Email error:", err));
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  },
);

router.get("/login", (req, res) => {
  const token =
    req.cookies.authToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded) {
        return res.redirect("/dashboard");
      }
    } catch (err) {}
  }

  const referrer = req.get("Referrer") || "";

  if (
    !referrer.includes("/") &&
    !referrer.includes("/homePage") &&
    !referrer.includes("/register") &&
    !referrer.includes("/changePassword") &&
    !referrer.includes("/forgot-password") &&
    !referrer.includes("/dashboard") &&
    !referrer.includes("/search-filterProperties")
  ) {
    return res.redirect("/homePage");
  }
  const message = req.cookies.otp_message;

  res.clearCookie("otp_message");

  res.render("login", {
    title: "login",
    errors: {},
    data: {},
    message: message || "",
  });
});

router.post(
  "/login",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email")
      .bail()
      .normalizeEmail(),

    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.mapped(),
      });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(400).json({
          success: false,
          errors: {
            email: { msg: "Invalid email" },
          },
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          errors: {
            password: { msg: "Incorrect password" },
          },
        });
      }

      const payload = {
        userId: user.id,
        role: user.role,
        firstname: user.firstname,
      };

      const token = jwt.sign(payload, JWT_SECRET);
      res.cookie("authToken", token, { httpOnly: true });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          firstname: user.firstname,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
);

router.get("/dashboard", userMiddleware, (req, res) => {
  res.render("dashboard", { title: "dashboard", user: req.user });
});

router.get("/editProfile", userMiddleware, async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  let message = "";
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).render("editProfile", {
        title: "editProfile",
        message: "User not found",
        user: {},
        errors: {},
        data: {},
      });
    }
    res.render("editProfile", {
      title: "editProfile",
      user,
      errors: {},
      message: message,
      data: {},
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).render("editProfile", {
      message: "Error fetching user details",
      user: {},
      errors: {},
      data: {},
    });
  }
});

router.post(
  "/editProfile",
  userMiddleware,
  upload.single("image"),
  [
    body("email")
      .optional()
      .isEmail()
      .withMessage("Invalid email format")
      .bail()
      .normalizeEmail()
      .custom(async (value, { req }) => {
        if (value) {
          const existingEmail = await User.findOne({ where: { email: value } });
          if (existingEmail && existingEmail.id !== req.user.id) {
            throw new Error("Email is already in use");
          }
        }
        return true;
      }),

    body("mobile_number")
      .optional()
      .isNumeric()
      .withMessage("Mobile number must only contain numbers")
      .bail()
      .isLength({ min: 10, max: 10 })
      .withMessage("Mobile number must be exactly 10 numeric characters")
      .bail()
      .custom(async (value, { req }) => {
        if (value) {
          const existingUser = await User.findOne({
            where: { mobile_number: value },
          });
          if (existingUser && existingUser.id !== req.user.id) {
            throw new Error("Mobile number already in use");
          }
        }
        return true;
      }),

    body("address").optional(),

    body("image")
      .optional()
      .custom((value, { req }) => {
        if (req.file) {
          const image = req.file;
          const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
          if (!allowedTypes.includes(image.mimetype)) {
            throw new Error("Only jpg, jpeg, and png images are allowed");
          }
          if (image.size > 500 * 1024 * 1024) {
            throw new Error("Image size must be less than 500MB");
          }
        }
        return true;
      }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    let message = "";

    if (!errors.isEmpty()) {
      return res.render("editProfile", {
        title: "editProfile",
        user: req.user,
        errors: errors.mapped(),
        message: message,
        data: req.body,
      });
    }

    const { email, mobile_number, address, firstname, lastname } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.render("editProfile", {
        title: "editProfile",
        errors: {
          email: { msg: "User not found." },
        },
        message: "User not found",
        user: req.user,
        data: req.body,
      });
    }

    // Check if any field has changed
    const hasChanges =
      (firstname && firstname !== user.firstname) ||
      (lastname && lastname !== user.lastname) ||
      (email && email !== user.email) ||
      (mobile_number && mobile_number !== user.mobile_number) ||
      (address && address !== user.address) ||
      req.file;

    if (!hasChanges) {
      return res.render("editProfile", {
        title: "editProfile",
        user,
        message: "Please edit at least one field to update your profile!",
        messageType: "error",
        errors: {},
        data: req.body,
      });
    }

    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (email) user.email = email;
    if (mobile_number) user.mobile_number = mobile_number;
    if (address) user.address = address;
    if (req.file) user.image = `/uploads/${req.file.filename}`;

    try {
      await user.save();
      return res.render("editProfile", {
        title: "editProfile",
        user,
        message: "Profile updated successfully.",
        messageType: "success",
        errors: {},
        data: req.body,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      return res.status(500).render("editProfile", {
        user: req.user,
        errors: {
          form: { msg: "Error updating profile." },
        },
        data: req.body,
      });
    }
  },
);

router.get("/changePassword", userMiddleware, (req, res) => {
  res.render("changePassword", {
    title: "changepassword",
    user: req.user,
    errors: {},
    message: null,
    data: {},
  });
});
router.post(
  "/changepassword",
  userMiddleware,
  [
    body("current_password")
      .notEmpty()
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
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters long")
      .matches(/[A-Z]/)
      .withMessage("New password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("New password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("New password must contain at least one number")
      .matches(/[\W_]/)
      .withMessage(
        "New password must contain at least one special character (e.g. @, #, $, etc.)",
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
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("changepassword", {
        title: "changepassword",
        user: req.user,
        errors: errors.mapped(),
        data: req.body,
        message: null,
      });
    }
    try {
      const { current_password, new_password, confirm_password } = req.body;

      if (!req.user) {
        return res.redirect("/login");
      }

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.redirect("/login");
      }

      const isMatch = await bcrypt.compare(current_password, user.password);
      if (!isMatch) {
        return res.render("changePassword", {
          title: "changepassword",
          message: "Current password is incorrect.",
          errors: {},
          data: req.body,
        });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);
      user.password = hashedPassword;

      await user.save();

      res.render("changePassword", {
        message: "Password updated successfully!",
        title: "changepassword",
        errors: {},
        data: {},
        redirectUrl: "/login",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      return res
        .status(500)
        .json({ message: "Error updating password", error: error.message });
    }
  },
);

router.get("/forgot-password", (req, res) => {
  const token =
    req.cookies.authToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded) {
        return res.redirect("/dashboard"); // Redirect if already logged in
      }
    } catch (err) {}
  }

  res.render("forgot-password", {
    title: "forgot-password",
    errors: {},
    data: {},
    message: "",
  });
});

router.post(
  "/forgot-password",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format")
      .bail()
      .normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.mapped(),
      });
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
        return res.status(404).json({
          errors: {
            email: { msg: "No user found with this email" },
          },
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000);
      const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

      await user.update({
        reset_token: otp,
        reset_token_expiry: expirationTime,
      });

      res.status(200).json({
        message: "OTP sent successfully",
      });

      transporter
        .sendMail({
          from: "swetha.kotuluru1@gmail.com",
          to: email,
          subject: "OTP for Password Reset",
          text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
        })
        .catch((err) => console.error("Mail error:", err));
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        message: "Something went wrong while sending OTP",
      });
    }
  },
);

router.get("/reset-password", (req, res) => {
  const token =
    req.cookies.authToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded) {
        return res.redirect("/dashboard");
      }
    } catch (err) {}
  }

  const message = req.cookies.otp_message;
  res.clearCookie("otp_message");

  res.render("reset-password", {
    errors: {},
    title: "reset-password",
    data: {},
    message: message || "",
  });
});

router.post(
  "/reset-password",
  [
    body("otp")
      .notEmpty()
      .withMessage("OTP is required")
      .isNumeric()
      .withMessage("OTP must be a number"),
    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .bail()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .matches(/[\W_]/)
      .withMessage("Password must contain at least one special character"),
    body("confirmPassword")
      .notEmpty()
      .withMessage("Confirm password is required")
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage("Passwords must match"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const errorData = errors.isEmpty() ? {} : errors.mapped();

    console.log("Validation Errors:", errorData);

    // if (!errors.isEmpty()) {
    //   return res.render("reset-password", {
    //     title: "reset-password",
    //     errors: errorData,
    //     data: req.body,
    //   });
    // }
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.mapped(),
      });
    }

    const { otp, newPassword, confirmPassword } = req.body;

    try {
      if (!otp) {
        return res.status(400).json({
          errors: { otp: { msg: "OTP is required" } },
        });
      }

      const user = await User.findOne({ where: { reset_token: otp } });
      // if (!user) {
      //   return res.render("reset-password", {
      //     title: "reset-password",
      //     errors: { otp: { msg: "Invalid OTP" } },
      //     data: req.body,
      //   });
      // }
      if (!user) {
        return res.status(404).json({
          errors: {
            otp: { msg: "Invalid OTP" },
          },
        });
      }

      if (!confirmPassword) {
        return res.status(404).json({
          errors: {
            confirmPassword: { msg: "Confirm Password is required" },
          },
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      });

      res.cookie("otp_message", "Your password has been successfully reset.", {
        maxAge: 10 * 60 * 1000,
        httpOnly: true,
      });
      // return res.redirect("/login");
      return res.status(200).json({
        message: "Password reset successful",
      });
    } catch (error) {
      title: ("reset-password",
        console.error("Error during resetting password:", error));
      res.status(500).send("Internal Server Error");
    }
  },
);

router.post("/logout", userMiddleware, (req, res) => {
  try {
    const token =
      req.cookies.authToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      blacklist.push(token);
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).send("Logout failed");
      }

      res.clearCookie("authToken");
      res.redirect("/homePage");
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res
      .status(500)
      .json({ message: "Error logging out", error: error.message });
  }
});

module.exports = router;
