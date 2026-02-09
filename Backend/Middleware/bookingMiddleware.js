const checkOwnerRole = (req, res, next) => {
  if (req.user.role === "owner") {
    return res.render("dashboard", {
      user: req.user,
      message: "Access denied. Only tenants and buyers can create the booking.",
      errors: {},
      data: {},
      redirectUrl: "/login",
    });
  }

  next();
};
module.exports = checkOwnerRole;
