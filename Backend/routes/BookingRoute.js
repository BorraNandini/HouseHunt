const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookingDetails,
  getBookingListing,
  updateBookingStatus,
  createRentalAgreement,
} = require("../controllers/bookingController");
const { body, validationResult } = require("express-validator");
const bookingMiddleware = require("../Middleware/bookingMiddleware");
const propertyMiddleware = require("../Middleware/propertyMiddleware");
const Booking = require("../models/Booking");
const userMiddleware = require("../Middleware/userMiddleware");
const User = require("../models/User");
const Property = require("../models/Property");
const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const RentalAgreement = require("../models/RentalAgreement");
router.get(
  "/createBooking/:id",
  userMiddleware,
  bookingMiddleware,
  async (req, res) => {
    try {
      const propertyId = req.params.id;
      const role = req.user?.role || req.session.role;

      const property = await Property.findByPk(propertyId);

      if (!property) {
        return res.render("createBooking", {
          title: "createBooking",
          message: "Property not found",
          messageType: "error",
          property: null,
          role,
          data: {},
          errors: {},
        });
      }

      if (role === "buyer" && property.property_status === "rent") {
        return res.render("createBooking", {
          title: "createBooking",
          message: "This property is for rent. As a buyer, you cannot book it.",
          messageType: "error",
          property: null,
          role,
          data: {},
          errors: {},
        });
      }

      if (role === "tenant" && property.property_status === "buy") {
        return res.render("createBooking", {
          title: "createBooking",
          message:
            "This property is for sale. As a tenant, you cannot book it.",
          messageType: "error",
          property: null,
          role,
          data: {},
          errors: {},
        });
      }

      res.render("createBooking", {
        title: "createBooking",
        message: "",
        messageType: "",
        property,
        role,
        data: {},
        errors: {},
      });
    } catch (error) {
      console.error("Error fetching property by ID:", error);
      res.render("createBooking", {
        title: "createBooking",
        message: "Error fetching property",
        messageType: "error",
        property: null,
        role: req.user?.role || req.session.role,
        data: {},
        errors: {},
      });
    }
  }
);

router.post("/createBooking/:id", userMiddleware, bookingMiddleware, [
  body("government_id_proof")
    .notEmpty()
    .withMessage("Government ID Proof is required"),

  body("payment_method").notEmpty().withMessage("Payment method is required"),
  body("payment_status")
    .notEmpty()
    .optional()
    .withMessage("Payment status is required"),
  body("transaction_id").custom((value, { req }) => {
    if (req.body.payment_status === "done" && !value) {
      throw new Error(
        "Transaction ID is required when payment status is 'done'"
      );
    }
    return true;
  }),

  body("start_date")
    .custom((value, { req }) => {
      if (req.user.role === "tenant" && !value) {
        throw new Error("Start date is required.");
      }

      if (value) {
        const inputDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);

        if (inputDate < today) {
          throw new Error("Start date cannot be in the past.");
        }
      }

      return true;
    })
    .optional()
    .isISO8601()
    .withMessage("Invalid start date format"),

  body("end_date")
    .custom((value, { req }) => {
      if (req.user.role === "tenant" && !value) {
        throw new Error("End date is required.");
      }
      return true;
    })
    .optional()
    .isDate()
    .withMessage("Invalid end date")
    .custom((value, { req }) => {
      if (
        req.user.role === "tenant" &&
        new Date(value) < new Date(req.body.start_date)
      ) {
        throw new Error("End date must be after start date.");
      }
      return true;
    }),

  async (req, res) => {
    const errors = validationResult(req);
    const role = req.user.role;
    const propertyId = req.params.id;

    const property = await Property.findByPk(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (!errors.isEmpty()) {
      return res.render("createBooking", {
        title: "createBooking",
        property,
        role,
        errors: errors.mapped(),
        data: req.body,
        messageType: "error",
      });
    }

    try {
      const {
        government_id_proof,
        booking_status,
        payment_method,
        transaction_id,
        payment_status,
        start_date,
        end_date,
      } = req.body;

      const user_id = req.user.id;
      const user_role = req.user.role;

      if (user_role !== "tenant" && user_role !== "buyer") {
        return res.status(400).json({
          message: "Only tenants and buyers are allowed to book properties.",
        });
      }

      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingBooking = await Booking.findOne({
        where: {
          user_id,
          property_id: propertyId,
          booking_status: "confirmed",
          payment_status: "done",
        },
      });

      if (existingBooking) {
        return res.render("createBooking", {
          title: "createBooking",
          message: "You have already booked this property.",
          messageType: "error",
          property,
          user_id,
          role,
          data: req.body,
          errors: {},
        });
      }

      let startDate = null,
        endDate = null;
      if (user_role === "tenant") {
        startDate = new Date(start_date);
        endDate = new Date(end_date);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        const overlappingBookings = await Booking.findAll({
          where: {
            property_id: propertyId,
            booking_status: "confirmed",
            payment_status: "done",
            [Op.or]: [
              {
                start_date: { [Op.between]: [startDate, endDate] },
              },
              {
                end_date: { [Op.between]: [startDate, endDate] },
              },
              {
                [Op.and]: [
                  { start_date: { [Op.lte]: startDate } },
                  { end_date: { [Op.gte]: endDate } },
                ],
              },
            ],
          },
        });

        if (overlappingBookings.length > 0) {
          return res.render("createBooking", {
            message: "This property is already booked for the selected dates.",
            messageType: "error",
            property,
            user_id,
            role,
            data: req.body,
            errors: {},
          });
        }
      }

      const bookingData = {
        user_id,
        property_id: propertyId,
        government_id_proof,
        booking_status,
        total_price: property.total_price,
        property_status: property.property_status,
        payment_method,
        transaction_id,
        payment_status,
      };

      if (user_role === "tenant") {
        bookingData.start_date = startDate;
        bookingData.end_date = endDate;
      }

      const newBooking = await Booking.create(bookingData);

      return res.render("createBooking", {
        title: "createBooking",
        message: "Booking created successfully!",
        messageType: "success",
        property,
        user_id,
        role,
        data: newBooking,
        errors: {},
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      return res.render("createBooking", {
        title: "createBooking",
        message: "Error creating booking",
        messageType: "error",
        error: error.message,
        property,
        role,
        data: req.body,
        errors: {},
      });
    }
  },
]);

router.get("/bookingDetails/:id", userMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const property = await Property.findOne({
      where: { id: id },
      include: [
        {
          model: Booking,
          as: "bookings",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["firstname", "lastname", "email", "mobile_number"],
            },
          ],
        },
      ],
    });

    if (!property) {
      return res.status(404).render("bookingDetails", {
        error: "Property not found",
        bookings: null,
      });
    }

    res.render("bookingDetails", {
      title: "bookingDetails",
      property,
      bookings: property.bookings,
      error: null,
      user: req.user,
    });
  } catch (err) {
    console.error("Error fetching booking details:", err);
    res.status(500).render("bookingDetails", {
      error: "Server error while fetching booking details",
      bookings: null,
    });
  }
});

router.get("/bookingListing", userMiddleware, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { booking_status, payment_status } = req.query;
    const whereConditions = {};
    if (booking_status) whereConditions.booking_status = booking_status;
    if (payment_status) whereConditions.payment_status = payment_status;

    let bookings = [];
    let totalBookings = 0;

    const commonInclude = [
      {
        model: User,
        as: "user",
        attributes: ["firstname", "lastname", "email", "mobile_number"],
      },
      {
        model: Property,
        as: "property",
        attributes: ["name", "total_price"],
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["firstname", "lastname", "email", "mobile_number"],
          },
        ],
      },
    ];

    if (role === "owner") {
      const properties = await Property.findAll({
        where: { owner_id: userId },
      });

      if (!properties.length) {
        return res
          .status(404)
          .json({ message: "No properties found for this owner." });
      }

      const propertyIds = properties.map((p) => p.id);

      bookings = await Booking.findAll({
        where: { property_id: propertyIds, ...whereConditions },
        limit,
        offset,
        include: commonInclude,
      });

      totalBookings = await Booking.count({
        where: { property_id: propertyIds, ...whereConditions },
      });
    } else if (role === "tenant" || role === "buyer") {
      bookings = await Booking.findAll({
        where: { user_id: userId, ...whereConditions },
        limit,
        offset,
        include: commonInclude,
      });

      totalBookings = await Booking.count({
        where: { user_id: userId, ...whereConditions },
      });
    } else {
      return res.status(403).json({
        message:
          "Access denied. Only owners, tenants, or buyers can view bookings.",
      });
    }
    let bookingsWithFlags = [];

    if (bookings.length > 0) {
      const bookingIds = bookings.map((b) => b.id);

      const agreements = await RentalAgreement.findAll({
        where: { booking_id: bookingIds },
        attributes: ["booking_id"],
      });

      const agreementSet = new Set(agreements.map((a) => Number(a.booking_id)));

      bookingsWithFlags = bookings.map((booking) => {
        const plain = booking.get({ plain: true });
        plain.rental_agreement_created = agreementSet.has(Number(booking.id));
        return plain;
      });
    } else {
      // fallback: convert empty bookings array to plain array
      bookingsWithFlags = bookings.map((booking) =>
        booking.get({ plain: true })
      );
    }

    const totalPages = Math.ceil(totalBookings / limit);

    res.render("bookingListing", {
      title: "bookingListing",
      message: "Booking listings fetched successfully",
      bookings: bookingsWithFlags,
      currentPage: page,
      totalPages,
      role,
      user: req.user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching booking listings",
      error: error.message,
    });
  }
});

router.get(
  "/updateBookingStatus/:bookingId",
  userMiddleware,
  async (req, res) => {
    const bookingId = req.params.bookingId;

    try {
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        return res.render("updateBookingStatus", {
          errors: [{ msg: "Booking not found" }],
          message: null,
          selected_status: "",
          bookingId: bookingId,
        });
      }

      return res.render("updateBookingStatus", {
        title: "updateBookingStatus",
        errors: [],
        message: null,
        selected_status: booking.booking_status,
        bookingId: bookingId,
      });
    } catch (err) {
      return res.render("updateBookingStatus", {
        errors: [{ msg: "Error fetching booking: " + err.message }],
        message: null,
        selected_status: "",
        bookingId: bookingId,
      });
    }
  }
);
router.post(
  "/updateBookingStatus/:bookingId",
  userMiddleware,
  async (req, res) => {
    const bookingId = req.params.bookingId;
    const { newStatus } = req.body;

    try {
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      }

      booking.booking_status = newStatus;
      await booking.save();

      return res.json({
        success: true,
        message: "Booking status updated successfully",
      });
    } catch (err) {
      console.error("Error updating booking:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

const handleBookingStatusChange = async (booking, booking_status) => {
  switch (booking_status) {
    case "confirmed":
      return await handleConfirmBooking(booking);
    case "rejected":
      return await handleRejectBooking(booking);
    case "cancelled":
      return await handleCancelBooking(booking);
    case "pending":
      return handlePendingBooking(booking);
    default:
      return {
        error: true,
        message: "Invalid booking status provided",
      };
  }
};

const handleConfirmBooking = async (booking) => {
  if (booking.booking_status === "confirmed") {
    return { error: true, message: "Booking is already confirmed." };
  }
  if (booking.booking_status !== "pending") {
    return { error: true, message: "Booking must be pending to confirm." };
  }
  if (booking.payment_status !== "done") {
    return { error: true, message: "Payment must be done before confirming." };
  }
  return { error: false };
};

const handleRejectBooking = async (booking) => {
  if (booking.booking_status === "confirmed") {
    return { error: true, message: "Confirmed booking cannot be rejected." };
  }
  return { error: false };
};

const handleCancelBooking = async (booking) => {
  if (booking.payment_status === "pending") {
    booking.booking_status = "cancelled";
    return {
      error: false,
      message: "Booking cancelled due to pending payment.",
    };
  }

  if (
    booking.booking_status === "confirmed" &&
    booking.payment_status === "done"
  ) {
    return {
      error: true,
      message:
        "Confirmed booking with completed payment cannot be cancelled directly.",
    };
  }

  booking.booking_status = "cancelled";
  return { error: false };
};

const handlePendingBooking = (booking) => {
  if (booking.booking_status === "confirmed") {
    return { error: true, message: "Cannot set confirmed booking to pending." };
  }
  if (booking.booking_status === "cancelled") {
    return { error: true, message: "Cannot set cancelled booking to pending." };
  }
  if (
    booking.payment_status === "done" &&
    booking.booking_status !== "pending"
  ) {
    return { error: false };
  }
  if (
    booking.payment_status === "pending" &&
    booking.booking_status === "confirmed"
  ) {
    return {
      error: false,
      message: "Booking cancelled.",
    };
  }
  return { error: true, message: "Invalid state for setting to pending." };
};

router.get(
  "/createRentalAgreement/:bookingId",
  userMiddleware,
  async (req, res) => {
    const bookingId = req.params.bookingId;

    try {
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        return res.render("createRentalAgreement", {
          errors: [{ msg: "Booking not found" }],
          message: null,
          booking_id: "",
          role: req.user?.role || req.session.role,
          data: {},
        });
      }

      return res.render("createRentalAgreement", {
        title: "createRentalAgreement",
        errors: [],
        message: null,
        booking_id: booking.id,
        role: req.user?.role || req.session.role,
        data: booking,
      });
    } catch (err) {
      return res.render("createRentalAgreement", {
        errors: [{ msg: "Error fetching booking: " + err.message }],
        message: null,
        booking_id: "",
        role: req.user?.role || req.session.role,
        data: {},
      });
    }
  }
);

router.post("/createRentalAgreement", userMiddleware, propertyMiddleware, [
  body("property_id").notEmpty().withMessage("Property ID is required"),
  body("booking_id").notEmpty().withMessage("Booking ID is required"),
  body("security_deposit")
    .notEmpty()
    .withMessage("Security deposit is required")
    .isInt({ min: 0 })
    .withMessage("Security deposit must be a number"),
  body("lease_duration")
    .notEmpty()
    .withMessage("Lease duration date is required"),
  body("booking_confirmation")
    .isIn(["confirmed", "pending", "cancelled", "rejected"])
    .withMessage("Invalid booking confirmation status")
    .notEmpty()
    .withMessage("Booking confirmation status is required"),
  async (req, res) => {
    const errors = validationResult(req);
    const role = req.user.role;
    const propertyId = req.body.property_id;
    const property = await Property.findByPk(propertyId);

    if (!errors.isEmpty()) {
      return res.render("createRentalAgreement", {
        property,
        role,
        errors: errors.mapped(),
        data: req.body,
        messageType: "error",
        booking_id: req.body.booking_id,
      });
    }

    try {
      const {
        property_id,
        booking_id,
        security_deposit,
        lease_duration,
        booking_confirmation,
      } = req.body;

      console.log("request body", req.body);

      const user_id = req.user.id;

      const booking = await Booking.findByPk(booking_id);
      if (!booking) {
        return res.render("createRentalAgreement", {
          title: "createRentalAgreement",
          property,
          role,
          errors: [{ msg: "Booking not found" }],
          data: req.body,
          messageType: "error",
          booking_id: "",
        });
      }

      if (
        booking.booking_status !== "confirmed" ||
        booking.payment_status !== "done"
      ) {
        return res.render("createRentalAgreement", {
          title: "createRentalAgreement",
          property,
          role,
          errors: [
            {
              msg: "Booking and payment must be confirmed before creating a rental agreement",
            },
          ],
          data: req.body,
          messageType: "error",
          booking_id: "",
        });
      }

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (property.owner_id !== user_id) {
        return res.status(403).json({
          message:
            "You must be the property owner to create a rental agreement",
        });
      }

      const existingAgreement = await RentalAgreement.findOne({
        where: { booking_id },
      });
      if (existingAgreement) {
        return res.render("createRentalAgreement", {
          title: "createRentalAgreement",
          property,
          role,
          errors: [],
          data: req.body,
          message: "Rental agreement already exists for this booking",
          messageType: "error",
          booking_id,
        });
      }

      const newRentalAgreement = await RentalAgreement.create({
        property_id,
        booking_id,
        security_deposit,
        lease_duration,
        booking_confirmation,
      });

      return res.render("createRentalAgreement", {
        message: "Rental agreement created successfully!",
        title: "createRentalAgreement",
        messageType: "success",
        property,
        role,
        data: newRentalAgreement,
        errors: {},
      });
    } catch (error) {
      console.error("Error creating rental agreement:", error);
      return res.render("createRentalAgreement", {
        message: "Error creating rental agreement",
        title: "createRentalAgreement",
        messageType: "error",
        error: error.message,
        property,
        role,
        data: req.body,
        errors: {},
      });
    }
  },
]);

router.get("/rentalAgreements", userMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let rentalAgreements;

    if (role === "owner") {
      rentalAgreements = await RentalAgreement.findAll({
        include: [
          {
            model: Property,
            as: "property",
            attributes: [
              "id",
              "name",
              "address",
              "total_price",
              "property_status",
              "bhk_type",
            ],
            where: { owner_id: userId },
          },
          {
            model: Booking,
            as: "booking",
            include: [
              {
                model: User,
                as: "user",
                attributes: [
                  "id",
                  "firstname",
                  "lastname",
                  "email",
                  "mobile_number",
                ],
              },
            ],
          },
        ],
      });
    } else if (role === "tenant") {
      rentalAgreements = await RentalAgreement.findAll({
        include: [
          {
            model: Booking,
            as: "booking",
            where: { user_id: userId },
            include: [
              {
                model: Property,
                as: "property",
                attributes: [
                  "id",
                  "name",
                  "address",
                  "total_price",
                  "property_status",
                  "bhk_type",
                ],
                include: [
                  {
                    model: User,
                    as: "owner",
                    attributes: [
                      "id",
                      "firstname",
                      "lastname",
                      "email",
                      "mobile_number",
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
    } else {
      return res.status(403).json({
        message:
          "Access denied. Only owners and tenants can view rental agreements.",
      });
    }

    if (!rentalAgreements || rentalAgreements.length === 0) {
      return res.render("rentalAgreements", {
        title: "rentalAgreements",
        message: "",
        rentalAgreements: null,
      });
    }

    res.render("rentalAgreements", {
      title: "rentalAgreements",
      message: "Rental agreements fetched successfully",
      rentalAgreements,
      role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred while fetching the rental agreements.",
      error: error.message,
    });
  }
});

module.exports = router;
