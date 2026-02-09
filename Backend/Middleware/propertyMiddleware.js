const checkOwnerRole = (req, res, next) => {
  if (req.user.role !== "owner") {
    return res.render("dashboard", {
      message:
        "Only owners can create properties/create Rental Agreement/can view bookings",
      errors: {},
      data: {},
      redirectUrl: "/login",
    });
  }

  next();
};

module.exports = checkOwnerRole;
