const { body, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const User = require("../models/User");
const PropertyAmenity = require("../models/PropertyAmenity");
const PropertyImage = require("../models/PropertyImage");
const Property = require("../models/Property");
const userMiddleware = require("../Middleware/userMiddleware");
const RentalAgreement = require("../models/RentalAgreement");

exports.createBooking = [
  body("property_id").notEmpty().withMessage("Property ID is required"),
  body("government_id_proof")
    .notEmpty()
    .withMessage("Government ID Proof is required"),
  body("payment_method").notEmpty().withMessage("Payment method is required"),
  body("transaction_id").custom((value, { req }) => {
    if (req.body.payment_status === "done" && !value) {
      throw new Error(
        "Transaction ID is required when payment status is 'done'"
      );
    }
    return true;
  }),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        property_id,
        government_id_proof,
        booking_status,
        payment_method,
        transaction_id,
        payment_status,
      } = req.body;

      const user_id = req.user.id;
      const user_role = req.user.role;

      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({ message: "user not found" });
      }

      const property = await Property.findByPk(property_id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (user_role === "buyer" && property.property_status !== "buy") {
        return res.status(400).json({
          message: "You can only book properties with status 'buy' as a buyer",
        });
      }

      if (user_role === "tenant" && property.property_status !== "rent") {
        return res.status(400).json({
          message:
            "You can only book properties with status 'rent' as a tenant",
        });
      }

      const existingBooking = await Booking.findOne({
        where: {
          property_id,
          booking_status: "confirmed",
          payment_status: "done",
        },
      });

      if (existingBooking) {
        return res
          .status(400)
          .json({ message: "Property has already been booked." });
      }

      if (property.availability_status !== "available") {
        return res
          .status(400)
          .json({ message: "Property is not available for booking" });
      }

      const total_price = property.total_price;
      const property_status = property.property_status;

      const newBooking = await Booking.create({
        user_id,
        property_id,
        government_id_proof,
        booking_status,
        total_price,
        property_status,
        payment_method,
        transaction_id,
        payment_status,
      });

      res.status(201).json({
        message: "Booking created successfully!",
        user_id: user_id,
        data: newBooking,
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({
        message: "Error creating booking",
        error: error.message,
      });
    }
  },
];

exports.getBookingDetails = [
  async (req, res) => {
    const { booking_id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
      if (userRole === "tenant") {
        return res.status(403).json({
          message: "Tenants are not allowed to access booking listing",
        });
      }
      if (userRole === "buyer") {
        return res.status(403).json({
          message: "buyer are not allowed to access booking listing",
        });
      }
      const booking = await Booking.findByPk(booking_id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: [
              "firstname",
              "lastname",
              "email",
              "mobile_number",
              "address",
              "city",
              "state",
              "country",
            ],
          },
          {
            model: Property,
            as: "property",
            include: [
              {
                model: PropertyAmenity,
                as: "amenities",
                attributes: ["id", "amenity_name"],
              },
              {
                model: PropertyImage,
                as: "images",
                attributes: ["id", "image_path"],
              },
              {
                model: User,
                as: "owner",
                attributes: ["firstname", "email", "mobile_number"],
              },
            ],
          },
        ],
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (!booking.property) {
        return res.status(404).json({ message: "property not found" });
      }

      if (booking.property.owner_id !== userId) {
        return res
          .status(403)
          .json({ message: "You are not the owner of this property" });
      }

      return res.status(200).json({
        message: "Booking details fetched successfully.",
        data: booking,
      });
    } catch (error) {
      console.error("Error fetching booking details:", error);
      return res.status(500).json({
        message: "Error fetching booking details",
        error: error.message,
      });
    }
  },
];

exports.getBookingListing = [
  async (req, res) => {
    const ownerId = req.user.id;
    const userRole = req.user.role;

    try {
      const properties = await Property.findAll({
        where: { owner_id: ownerId },

        include: [
          {
            model: User,
            as: "owner",
            attributes: ["firstname", "email", "mobile_number"],
          },
          {
            model: PropertyAmenity,
            as: "amenities",
            attributes: ["id", "amenity_name"],
          },
          {
            model: PropertyImage,
            as: "images",
            attributes: ["id", "image_path"],
          },
        ],
      });
      if (userRole === "tenant") {
        return res.status(403).json({
          message: "Tenants are not allowed to access booking listing",
        });
      }
      if (userRole === "buyer") {
        return res.status(403).json({
          message: "buyer are not allowed to access booking listing",
        });
      }

      if (properties.length === 0) {
        return res
          .status(404)
          .json({ message: "No properties found for this owner" });
      }

      const propertyIds = properties.map((property) => property.id);
      const bookings = await Booking.findAll({
        where: { property_id: propertyIds },
        order: [["id", "ASC"]],
        include: [
          {
            model: User,
            as: "user",
            attributes: [
              "firstname",
              "lastname",
              "email",
              "mobile_number",
              "address",
              "city",
              "state",
              "country",
            ],
          },
          {
            model: Property,
            as: "property",
            include: [
              {
                model: PropertyAmenity,
                as: "amenities",
                attributes: ["id", "amenity_name"],
              },
              {
                model: PropertyImage,
                as: "images",
                attributes: ["id", "image_path"],
              },
              {
                model: User,
                as: "owner",
                attributes: ["firstname", "email", "mobile_number"],
              },
            ],
          },
        ],
      });

      if (bookings.length === 0) {
        return res
          .status(404)
          .json({ message: "No bookings found for your properties" });
      }

      return res.status(200).json({
        message: "Booking listings fetched successfully.",
        data: bookings,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Error fetching booking listings",
        error: error.message,
      });
    }
  },
];

exports.updateBookingStatus = [
  body("booking_id").notEmpty().withMessage("Booking ID is required"),
  body("booking_status")
    .isIn(["confirmed", "pending", "rejected", "cancelled"])
    .withMessage("Invalid booking status")
    .notEmpty()
    .withMessage("Booking status is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { booking_id, booking_status } = req.body;
    const userId = req.user.id;

    try {
      const booking = await Booking.findOne({
        where: { id: booking_id },
        include: [
          {
            model: Property,
            as: "property",
            attributes: ["owner_id"],
          },
        ],
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const propertyOwnerId = booking.property
        ? booking.property.owner_id
        : null;
      if (propertyOwnerId !== userId) {
        return res.status(403).json({
          message: "Only the property owner can update the booking status",
        });
      }

      const updateResult = await handleBookingStatusChange(
        booking,
        booking_status
      );

      if (updateResult.error) {
        return res.status(400).json({
          message: updateResult.message,
          data: booking,
        });
      }

      booking.booking_status = booking_status;
      await booking.save();

      return res.status(200).json({
        message: `Booking status updated to ${booking_status}`,
        data: booking,
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      return res.status(500).json({
        message: "Error updating booking status",
        error: error.message,
      });
    }
  },
];

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
        data: booking,
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
    return {
      error: true,
      message: "Payment must be done before confirming the booking.",
    };
  }

  booking.booking_status = "confirmed";
  return { error: false };
};

const handleRejectBooking = async (booking) => {
  if (booking.booking_status === "confirmed") {
    return { error: true, message: "Confirmed booking cannot be rejected." };
  }

  booking.booking_status = "rejected";
  return { error: false };
};

const handleCancelBooking = async (booking) => {
  if (booking.booking_status === "confirmed") {
    return {
      error: true,
      message: "Confirmed booking cannot be cancelled directly.",
    };
  }

  booking.booking_status = "cancelled";
  return { error: false };
};

const handlePendingBooking = (booking) => {
  if (booking.booking_status === "confirmed") {
    return {
      error: true,
      message: "Confirmed booking cannot be set to pending.",
    };
  }
  if (booking.booking_status === "cancelled") {
    return {
      error: true,
      message: "Cancelled booking cannot be set to pending.",
    };
  }
  if (
    booking.payment_status === "done" &&
    booking.booking_status !== "pending"
  ) {
    booking.booking_status = "pending";
    return { error: false };
  }
  if (booking.payment_status === "pending") {
    booking.booking_status = "cancelled";
    return { error: false };
  }

  return { error: true, message: "Booking cannot be set to pending." };
};

exports.createRentalAgreement = [
  body("property_id").notEmpty().withMessage("Property ID is required"),
  body("booking_id").notEmpty().withMessage("Booking ID is required"),
  body("security_deposit")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Security deposit must be a non-negative integer"),
  body("lease_duration")
    .optional()
    .notEmpty()
    .withMessage("Lease duration date is required"),
  body("booking_confirmation")
    .isIn(["confirmed", "pending", "cancelled", "rejected"])
    .withMessage("Invalid booking confirmation status")
    .notEmpty()
    .withMessage("Booking confirmation status is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        property_id,
        booking_id,
        security_deposit,
        lease_duration,
        booking_confirmation,
      } = req.body;

      const user_id = req.user.id;

      const booking = await Booking.findByPk(booking_id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (
        booking.booking_status !== "confirmed" ||
        booking.payment_status !== "done"
      ) {
        return res.status(400).json({
          message:
            "Booking and payment must be confirmed before creating a rental agreement",
        });
      }

      const property = await Property.findByPk(property_id);
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
        return res.status(400).json({
          message: "Rental agreement already exists for this booking",
        });
      }

      const newRentalAgreement = await RentalAgreement.create({
        property_id,
        booking_id,
        security_deposit,
        lease_duration,
        booking_confirmation,
      });

      const owner = await User.findByPk(property.owner_id);

      const user = await User.findByPk(booking.user_id);

      res.status(201).json({
        message: "Rental agreement created successfully!",
        data: {
          rental_agreement: newRentalAgreement,
          property: {
            id: property.id,
            name: property.name,
            address: property.address,
            price: property.price,
          },
          owner: {
            id: owner.id,
            firstname: owner.firstname,
            email: owner.email,
            mobile_number: owner.mobile_number,
          },
          user: {
            id: user.id,
            firstname: user.firstname,
            email: user.email,
            mobile_number: user.mobile_number,
          },
        },
      });
    } catch (error) {
      console.error("Error creating rental agreement:", error);
      res.status(500).json({
        message: "Error creating rental agreement",
        error: error.message,
      });
    }
  },
];
