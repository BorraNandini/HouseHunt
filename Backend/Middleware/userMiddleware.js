// const jwt = require("jsonwebtoken");
// const blacklist = require("../helpers/Blacklist");

// const JWT_SECRET = "jwt_secret_key";

// const userMiddleware = (req, res, next) => {
//   const token = req.cookies?.authToken;

//   const wantsJSON =
//     req.headers.accept?.includes("application/json") ||
//     req.headers["content-type"] === "application/json";

//   if (!token) {
//     if (req.session?.user) {
//       req.user = req.session.user;
//       return next();
//     }

//     if (wantsJSON) {
//       return res.status(401).json({ message: "Unauthorized: No token" });
//     }

//     return res.redirect("/login");
//   }

//   if (blacklist.includes(token)) {
//     if (wantsJSON) {
//       return res
//         .status(401)
//         .json({ message: "Unauthorized: Token blacklisted" });
//     }
//     return res.redirect("/login");
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);

//     req.user = {
//       id: decoded.userId,
//       role: decoded.role,
//       firstname: decoded.firstname,
//       lastname: decoded.lastname,
//       email: decoded.email,
//       mobile_number: decoded.mobile_number,
//       address: decoded.address,
//     };

//     req.session.user = req.user;

//     next();
//   } catch (error) {
//     console.error("JWT verification failed:", error.message);

//     if (wantsJSON) {
//       return res
//         .status(401)
//         .json({ message: "Unauthorized: Invalid or expired token" });
//     }

//     return res.redirect("/login");
//   }
// };

// module.exports = userMiddleware;
const jwt = require("jsonwebtoken");
const blacklist = require("../helpers/Blacklist");
const ShortlistedProperties = require("../models/ShortlistedProperties");

const JWT_SECRET = "jwt_secret_key";

const userMiddleware = async (req, res, next) => {
  const token = req.cookies?.authToken;

  const wantsJSON =
    req.headers.accept?.includes("application/json") ||
    req.headers["content-type"] === "application/json";

  // let user = null;

  if (!token) {
    if (req.session?.user) {
      user = req.session.user;
    } else {
      if (wantsJSON)
        return res.status(401).json({ message: "Unauthorized: No token" });
      return res.redirect("/login");
    }
  }

  if (token && blacklist.includes(token)) {
    if (wantsJSON)
      return res
        .status(401)
        .json({ message: "Unauthorized: Token blacklisted" });
    return res.redirect("/login");
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      user = {
        id: decoded.userId,
        role: decoded.role,
        firstname: decoded.firstname,
        lastname: decoded.lastname,
        email: decoded.email,
        mobile_number: decoded.mobile_number,
        address: decoded.address,
      };
      req.session.user = user;
    } catch (error) {
      console.error("JWT verification failed:", error.message);
      if (wantsJSON)
        return res
          .status(401)
          .json({ message: "Unauthorized: Invalid or expired token" });
      return res.redirect("/login");
    }
  }

  req.user = user;
  res.locals.user = user;

  res.locals.hasShortlisted = false;
  if (user?.id) {
    try {
      const liked = await ShortlistedProperties.findAll({
        where: { user_id: user.id },
        attributes: ["property_id"],
      });
      res.locals.hasShortlisted = liked.length > 0;
    } catch (err) {
      console.error("Failed to load shortlisted properties:", err);
    }
  }

  next();
};

module.exports = userMiddleware;
