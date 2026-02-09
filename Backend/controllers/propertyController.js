const Sequelize = require("sequelize");
const User = require("../models/User");
const Property = require("../models/Property");
const PropertyAmenity = require("../models/PropertyAmenity");
const RentalAgreement = require("../models/RentalAgreement");
const PropertyImage = require("../models/PropertyImage");
const Booking = require("../models/Booking");
const { body, validationResult } = require("express-validator");
const userMiddleware = require("../Middleware/userMiddleware");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

exports.createProperty = [
  body("name").notEmpty().withMessage("Name is required"),
  body("type")
    .isIn(["community", "apartment", "individual"])
    .withMessage("Invalid type")
    .notEmpty()
    .withMessage("Type is required"),
  body("address").notEmpty().withMessage("Address is required"),
  body("state")
    .notEmpty()
    .withMessage("State is required")
    .matches(/^[A-Za-z]+$/)
    .withMessage("State must only contain letters"),
  body("city")
    .notEmpty()
    .withMessage("City is required")
    .matches(/^[A-Za-z]+$/)
    .withMessage("City must only contain letters"),
  body("country")
    .notEmpty()
    .withMessage("Country is required")
    .matches(/^[A-Za-z]+$/)
    .withMessage("Country must only contain letters"),
  body("zip_code")
    .notEmpty()
    .withMessage("Zip code is required")
    .isNumeric()
    .withMessage("Zip code must only contain numbers"),
  body("description").notEmpty().withMessage("Description is required"),
  body("size").notEmpty().withMessage("size is required"),
  body("floor")
    .isIn(["ground floor", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    .notEmpty()
    .withMessage("floor is required")
    .custom(async (value, { req }) => {
      const { address, name, zip_code } = req.body;
      const existingProperty = await Property.findOne({
        where: {
          floor: value,
          address: address,
          name: name,
          zip_code: zip_code,
        },
      });

      if (existingProperty) {
        throw new Error(
          "This address is already associated with another property"
        );
      }

      return true;
    }),
  body("property_status")
    .isIn(["rent", "buy"])
    .notEmpty()
    .withMessage("Property status is required"),
  body("total_floor")
    .isIn(["ground floor", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    .notEmpty()
    .withMessage("Total floors is required"),
  body("property_age")
    .isIn(["1-2 year", "2-3 year", "3-4 year", "4-5 year", "More than 5 year"])
    .notEmpty()
    .withMessage("Property age is required"),
  body("bhk_type")
    .isIn(["3BHK", "2BHK", "1BHK", "1RK"])
    .notEmpty()
    .withMessage("bhk type is required"),
  body("base_price")
    .isNumeric()
    .if(body("property_status").equals("rent"))
    .isFloat({ min: 0 })
    .notEmpty()
    .withMessage("Base price is required"),
  body("amenity_price")
    .isNumeric()
    .if(body("property_status").equals("rent"))
    .isFloat({ min: 0 })
    .notEmpty()
    .withMessage("Amenity price is required"),
  body("maintenance_price")
    .isNumeric()
    .if(body("property_status").equals("rent"))
    .isFloat({ min: 0 })
    .notEmpty()
    .withMessage("Maintenance price is required"),
  body("availability_status")
    .isIn(["available", "not available"])
    .notEmpty()
    .withMessage("Availability status is required"),
  body("available_from")
    .notEmpty()
    .withMessage("Availability date is required"),
  body("amenities")
    .notEmpty()
    .custom((value) => {
      if (!value) {
        throw new Error("Add Amenity");
      }

      if (typeof value === "string") {
        value = [value];
      }

      if (!Array.isArray(value)) {
        throw new Error("Amenities must be an array.");
      }

      const validAmenities = [
        "swimming pool",
        "gym",
        "play area",
        "Lift",
        "Internet Services",
        "Air Conditioner",
        "Club House",
        "Intercom",
        "Fire Safety",
        "Gas Pipeline",
        "House Keeping",
        "Power Backup",
        "Visitor Parking",
      ];
      value.forEach((amenity) => {
        if (!validAmenities.includes(amenity)) {
          throw new Error(`${amenity} is not a valid amenity`);
        }
      });

      return true;
    }),

  body("images")
    // .notEmpty()
    .custom((value, { req }) => {
      if (!req.files || req.files.length === 0) {
        throw new Error("At least one image is required");
      }

      req.files.forEach((file) => {
        const validTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!validTypes.includes(file.mimetype)) {
          throw new Error(
            "Invalid file type. Only JPG, JPEG, and PNG are allowed."
          );
        }

        const maxSize = 500 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(
            "Image file size is too large. Maximum allowed size is 500MB."
          );
        }
      });

      return true;
    }),
  body("available_bathrooms")
    .isIn([1, 2, 3])
    .notEmpty()
    .withMessage("available bathrooms are required"),
  body("preferred_tenants")
    .if(body("property_status").equals("rent"))
    .isIn(["anyone", "bachelors", "family"])
    .notEmpty()
    .withMessage("Tenant type is required"),
  body("furnishing")
    .isIn(["fully furnished", "semi-furnished", "unfurnished"])
    .notEmpty()
    .withMessage("furnishing type is required"),
  body("parking")
    .isIn(["car", "bike", "both car and bike", "none"])
    .notEmpty()
    .withMessage("parking type is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        name,
        type,
        address,
        state,
        city,
        country,
        zip_code,
        description,
        size,
        floor,
        total_floor,
        property_age,
        bhk_type,
        base_price,
        amenity_price,
        maintenance_price,
        availability_status,
        available_from,
        amenities,
        available_bathrooms,
        preferred_tenants,
        furnishing,
        parking,
        property_status,
        total_price,
      } = req.body;

      const owner_id = req.user.id;

      let calculatedTotalPrice = 0;
      if (property_status === "rent") {
        const basePrice = parseFloat(base_price);
        const amenityPrice = parseFloat(amenity_price);
        const maintenancePrice = parseFloat(maintenance_price);
        calculatedTotalPrice = basePrice + amenityPrice + maintenancePrice;
      }

      const finalTotalPrice =
        property_status === "buy"
          ? parseFloat(total_price)
          : calculatedTotalPrice;

      let imagePaths = [];
      if (req.files && req.files.length > 0) {
        imagePaths = req.files.map((file) => `/uploads/${file.filename}`);
      }

      const propertyData = {
        name,
        type,
        address,
        state,
        city,
        country,
        zip_code,
        description,
        size,
        floor,
        total_floor,
        property_age,
        bhk_type,
        base_price: parseFloat(base_price),
        amenity_price: parseFloat(amenity_price),
        maintenance_price: parseFloat(maintenance_price),
        total_price: finalTotalPrice,
        availability_status,
        available_from,
        owner_id,
        amenities,
        available_bathrooms,
        furnishing,
        parking,
        property_status,
      };

      if (property_status === "rent" && preferred_tenants) {
        const validTenants = ["anyone", "bachelors", "family"];
        if (validTenants.includes(preferred_tenants)) {
          propertyData.preferred_tenants = preferred_tenants;
        } else {
          return res.status(400).json({
            message: "Invalid value for preferred_tenants",
            error: `${preferred_tenants} is not a valid tenant type.`,
          });
        }
      } else if (property_status === "buy") {
        propertyData.preferred_tenants = null;
      }

      const newProperty = await Property.create(propertyData);

      if (imagePaths.length > 0) {
        for (const imagePath of imagePaths) {
          await PropertyImage.create({
            property_id: newProperty.id,
            image_path: imagePath,
          });
        }
      }

      if (Array.isArray(amenities) && amenities.length > 0) {
        for (const amenity of amenities) {
          await PropertyAmenity.create({
            property_id: newProperty.id,
            amenity_name: amenity,
          });
        }
      }

      const userRole = req.user.role;

      const responseData = {
        message: "Property created successfully!",
        data: newProperty,
        images: imagePaths,
        amenities: amenities,
      };

      if (userRole === "buyer") {
        responseData.price = finalTotalPrice;
      } else if (userRole === "tenant") {
        responseData.price = {
          base_price: parseFloat(base_price),
          amenity_price: parseFloat(amenity_price),
          maintenance_price: parseFloat(maintenance_price),
          total_price: finalTotalPrice,
        };
        responseData.preferred_tenants = preferred_tenants;
      }

      res.status(201).json(responseData);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(500).json({
        message: "Error creating property",
        error: error.message,
      });
    }
  },
];

exports.editProperty = [
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("type")
    .optional()
    .isIn(["community", "apartment", "individual"])
    .withMessage("Invalid type"),
  body("address").optional().notEmpty().withMessage("Address cannot be empty"),
  body("state")
    .optional()
    .notEmpty()
    .withMessage("State cannot be empty")
    .matches(/^[A-Za-z]+$/)
    .withMessage("State must only contain letters"),
  body("city")
    .optional()
    .notEmpty()
    .withMessage("City cannot be empty")
    .matches(/^[A-Za-z]+$/)
    .withMessage("City must only contain letters"),
  body("country")
    .optional()
    .notEmpty()
    .withMessage("Country cannot be empty")
    .matches(/^[A-Za-z]+$/)
    .withMessage("Country must only contain letters"),
  body("zip_code")
    .optional()
    .notEmpty()
    .withMessage("Zip code cannot be empty")
    .matches(/^\d{6}$/)
    .withMessage("Zip code must be exactly 6 numeric characters"),
  body("description")
    .optional()
    .notEmpty()
    .withMessage("Description cannot be empty"),
  body("size").optional().notEmpty().withMessage("size is required"),
  body("floor")
    .isIn(["ground floor", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    .optional()
    .withMessage("floor is required")
    .custom(async (value, { req }) => {
      const { address, name, zip_code } = req.body;
      const existingProperty = await Property.findOne({
        where: {
          floor: value,
          address: address,
          name: name,
          zip_code: zip_code,
        },
      });

      if (existingProperty) {
        throw new Error(
          "This address is already associated with another property"
        );
      }

      return true;
    }),
  body("property_status")
    .isIn(["rent", "buy"])
    .optional()
    .notEmpty()
    .withMessage("Property status is required"),
  body("total_floor")
    .optional()
    .notEmpty()
    .isIn(["ground floor", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    .withMessage("Total floors is required"),
  body("property_age")
    .isIn(["1-2 year", "2-3 year", "3-4 year", "4-5 year", "More than 5 year"])
    .optional()
    .notEmpty()
    .withMessage("Property age is required"),
  body("bhk_type")
    .optional()
    .notEmpty()
    .isIn(["3BHK", "2BHK", "1BHK", "1RK"])
    .withMessage("Invalid bhk type"),
  body("total_price")
    .optional()
    .custom((value, { req }) => {
      if (req.body.property_status === "buy" && !value) {
        throw new Error("Total price is required for buy properties.");
      }
      return true;
    }),
  body("base_price")
    .optional()
    .custom((value, { req }) => {
      if (req.body.property_status === "rent" && !value) {
        throw new Error("Base price is required for rent properties.");
      }
      return true;
    }),
  body("amenity_price")
    .optional()
    .custom((value, { req }) => {
      if (req.body.property_status === "rent" && !value) {
        throw new Error("Amenity price is required for rent properties.");
      }
      return true;
    }),
  body("maintenance_price")
    .optional()
    .custom((value, { req }) => {
      if (req.body.property_status === "rent" && !value) {
        throw new Error("Maintenance price is required for rent properties.");
      }
      return true;
    }),
  body("availability_status")
    .optional()
    .notEmpty()
    .isIn(["available", "not available"])
    .withMessage("Invalid availability status"),
  body("available_from")
    .optional()
    .notEmpty()
    .withMessage("Availability date is required"),
  body("amenities")
    .optional()
    .notEmpty()
    .isArray({ min: 1 })
    .withMessage("Add amenity")
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error("Amenities must be an array.");
      }

      const validAmenities = [
        "swimming pool",
        "gym",
        "play area",
        "Lift",
        "Internet Services",
        "Air Conditioner",
        "Club House",
        "Intercom",
        "Fire Safety",
        "Gas Pipeline",
        "House Keeping",
        "Power Backup",
        "Visitor Parking",
      ];
      value.forEach((amenity) => {
        if (!validAmenities.includes(amenity)) {
          throw new Error(`${amenity} is not a valid amenity`);
        }
      });

      return true;
    }),
  body("images")
    .optional()
    .notEmpty()
    .custom((value, { req }) => {
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          const validTypes = ["image/jpeg", "image/png", "image/jpg"];
          if (!validTypes.includes(file.mimetype)) {
            throw new Error(
              "Invalid file type. Only JPG, JPEG, and PNG are allowed."
            );
          }

          const maxSize = 500 * 1024 * 1024;
          if (file.size > maxSize) {
            throw new Error(
              "Image file size is too large. Maximum allowed size is 500MB."
            );
          }
        });
      }
      return true;
    }),
  body("available_bathrooms")
    .isIn([1, 2, 3])
    .notEmpty()
    .optional()
    .withMessage("available bathrooms are required"),
  body("preferred_tenants")
    .isIn(["anyone", "bachelors", "family"])
    .optional()
    .notEmpty()
    .if(body("property_status").equals("rent"))
    .withMessage("Tenant type is required"),
  body("furnishing")
    .isIn(["fully furnished", "semi-furnished", "unfurnished"])
    .optional()
    .notEmpty()
    .withMessage("furnishing type is required"),
  body("parking")
    .isIn(["car", "bike", "both car and bike", "none"])
    .optional()
    .notEmpty()
    .withMessage("parking type is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      type,
      address,
      state,
      city,
      country,
      zip_code,
      description,
      size,
      floor,
      total_floor,
      property_age,
      bhk_type,
      base_price,
      amenity_price,
      maintenance_price,
      availability_status,
      available_from,
      amenities,
      available_bathrooms,
      preferred_tenants,
      furnishing,
      parking,
      property_status,
      total_price,
    } = req.body;

    try {
      const property = await Property.findOne({
        where: { id: req.body.id, owner_id: req.user.id },
      });

      if (!property) {
        return res.status(404).json({
          message: "Property not found or you are not authorized to edit it.",
        });
      }

      if (property_status === "buy" && total_price) {
        property.total_price = total_price;
        property.base_price = null;
        property.amenity_price = null;
        property.maintenance_price = null;
      } else property_status === "rent";
      const calculated_total_price =
        (parseFloat(base_price) || 0) +
        (parseFloat(amenity_price) || 0) +
        (parseFloat(maintenance_price) || 0);
      property.total_price = calculated_total_price.toFixed(2);

      if (name) property.name = name;
      if (type) property.type = type;
      if (address) property.address = address;
      if (state) property.state = state;
      if (city) property.city = city;
      if (country) property.country = country;
      if (zip_code) property.zip_code = zip_code;
      if (description) property.description = description;
      if (size) property.size = size;
      if (floor) property.floor = floor;
      if (total_floor) property.total_floor = total_floor;
      if (property_age) property.property_age = property_age;
      if (bhk_type) property.bhk_type = bhk_type;
      if (base_price) property.base_price = parseFloat(base_price);
      if (amenity_price) property.amenity_price = parseFloat(amenity_price);
      if (maintenance_price)
        property.maintenance_price = parseFloat(maintenance_price);
      if (total_price) property.total_price = parseFloat(total_price);
      if (availability_status)
        property.availability_status = availability_status;
      if (available_from) property.available_from = available_from;
      if (property_status === "rent" && preferred_tenants) {
        const validTenants = ["anyone", "bachelors", "family"];
        if (validTenants.includes(preferred_tenants)) {
          propertyData.preferred_tenants = preferred_tenants;
        } else {
          return res.status(400).json({
            message: "Invalid value for preferred_tenants",
            error: `${preferred_tenants} is not a valid tenant type.`,
          });
        }
      } else if (property_status === "buy") {
        propertyData.preferred_tenants = null;
        propertyData.base_price = null;
        propertyData.amenity_price = null;
        propertyData.maintenance_price = null;
      }
      if (amenities) {
        property.amenities = amenities;
      }

      if (req.files && req.files.length > 0) {
        const imagePaths = req.files.map((file) => `/uploads/${file.filename}`);
        for (const imagePath of imagePaths) {
          await PropertyImage.create({
            property_id: property.id,
            image_path: imagePath,
          });
        }
        property.images = imagePaths;
      }

      if (available_bathrooms)
        property.available_bathrooms = available_bathrooms;
      if (preferred_tenants) property.preferred_tenants = preferred_tenants;
      if (furnishing) property.furnishing = furnishing;
      if (parking) property.parking = parking;

      const updatedProperty = await property.save();

      if (Array.isArray(amenities) && amenities.length > 0) {
        await PropertyAmenity.destroy({ where: { property_id: property.id } });

        for (const amenity of amenities) {
          await PropertyAmenity.create({
            property_id: property.id,
            amenity_name: amenity,
          });
        }
      }
      const updatedImages = await PropertyImage.findAll({
        where: { property_id: updatedProperty.id },
      });

      const updatedAmenities = await PropertyAmenity.findAll({
        where: { property_id: updatedProperty.id },
      });

      const userRole = req.user.role;

      const responseData = {
        message: "Property edited successfully",
        data: property,
        images: updatedImages.map((image) => image.image_path),
        amenities: updatedAmenities.map((amenity) => amenity.amenity_name),
      };

      if (userRole === "buyer") {
        responseData.price = total_price;
      } else if (userRole === "tenant") {
        responseData.price = {
          base_price: parseFloat(base_price),
          amenity_price: parseFloat(amenity_price),
          maintenance_price: parseFloat(maintenance_price),
          total_price: total_price,
        };
        responseData.preferred_tenants = preferred_tenants;
      }

      res.status(200).json(responseData);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Error editing property", error: error.message });
    }
  },
];

exports.deleteProperty = [
  async (req, res) => {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Property ID is required" });
    }

    try {
      const property = await Property.findOne({
        where: { id, owner_id: req.user.id },
      });

      if (!property) {
        return res.status(404).json({
          message: "Property not found or you are not authorized to delete it.",
        });
      }

      const rentalAgreements = await RentalAgreement.findAll({
        where: { property_id: property.id },
      });

      if (rentalAgreements.length > 0) {
        await RentalAgreement.destroy({
          where: { property_id: property.id },
        });
      }

      const bookings = await Booking.findAll({
        where: { property_id: property.id },
      });

      if (bookings.length > 0) {
        await Booking.destroy({
          where: { property_id: property.id },
        });
      }
      await PropertyAmenity.destroy({
        where: { property_id: property.id },
      });
      await PropertyImage.destroy({
        where: { property_id: property.id },
      });

      await property.destroy();

      res.status(200).json({ message: "Property deleted successfully" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Error deleting property", error: error.message });
    }
  },
];

exports.PropertyList = [
  async (req, res) => {
    try {
      const role = req.user.role;
      let properties;

      if (role === "owner") {
        properties = await Property.findAll({
          where: { owner_id: req.user.id },
          include: [
            {
              model: PropertyAmenity,
              as: "amenities",
              attributes: ["amenity_name"],
            },
            {
              model: PropertyImage,
              as: "images",
              attributes: ["image_path"],
            },
          ],
        });
      } else if (role === "tenant") {
        properties = await Property.findAll({
          where: { availability_status: "available", property_status: "rent" },
          include: [
            {
              model: PropertyAmenity,
              as: "amenities",
              attributes: ["amenity_name"],
            },
            {
              model: PropertyImage,
              as: "images",
              attributes: ["image_path"],
            },
            {
              model: User,
              as: "owner",
              attributes: ["firstname", "email", "mobile_number"],
            },
          ],
        });
      } else if (role === "buyer") {
        properties = await Property.findAll({
          where: { property_status: "buy", availability_status: "available" },
          include: [
            {
              model: PropertyAmenity,
              as: "amenities",
              attributes: ["amenity_name"],
            },
            {
              model: PropertyImage,
              as: "images",
              attributes: ["image_path"],
            },
            {
              model: User,
              as: "owner",
              attributes: ["firstname", "email", "mobile_number"],
            },
          ],
        });
      }

      if (properties.length === 0) {
        return res.status(404).json({ message: "No properties found" });
      }

      res.status(200).json({
        message: "Property list fetched successfully",
        data: properties,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Error fetching properties",
        error: error.message,
      });
    }
  },
];

exports.searchAndFilterProperties = [
  body("search")
    .notEmpty()
    .isString()
    .withMessage("Search keyword is required"),

  body("filter.type")
    .optional()
    .isIn(["community", "apartment", "individual"])
    .withMessage("Invalid type")
    .notEmpty()
    .withMessage("Type is required if provided"),

  body("filter.availablility_status")
    .optional()
    .isIn(["available", "not available"])
    .withMessage(
      "Availability status must be either 'available' or 'not available'"
    ),

  body("filter.size")
    .optional()
    .custom((value) => {
      if (value === "" || value === null) {
        throw new Error("Size cannot be an empty string");
      }
      return true;
    }),
  body("filter.base_price_min")
    .optional()
    .custom((value) => {
      value = value ? value.trim() : value;
      if (value === "") {
        throw new Error("Base price min cannot be empty");
      }
      if (isNaN(value) || parseFloat(value) <= 0) {
        throw new Error("Base price max must be a positive number");
      }
      return true;
    }),

  body("filter.base_price_max")
    .optional()
    .custom((value) => {
      value = value ? value.trim() : value;
      if (value === "") {
        throw new Error("Base price max cannot be empty");
      }
      if (isNaN(value) || parseFloat(value) <= 0) {
        throw new Error("Base price max must be a positive number");
      }
      return true;
    }),
  body("filter.floor")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Floor must be an integer greater than 0"),
  body("filter.total_floor")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Total floor must be an integer greater than 0"),
  body("filter.property_age")
    .optional()
    .isIn(["1-2 year", "2-3 year", "3-4 year", "4-5 year", "More than 5 year"])
    .withMessage("Invalid property age"),

  body("filter.bhk_type")
    .optional()
    .isIn(["3BHK", "2BHK", "1BHK", "1RK"])
    .withMessage("Invalid BHK type"),

  body("filter.available_bathrooms")
    .optional()
    .isIn([1, 2, 3])
    .withMessage("Available bathrooms must be a number between 1 and 3"),

  body("filter.preferred_tenants")
    .optional()
    .isIn(["anyone", "bachelors", "family"])
    .withMessage("Preferred tenants must be one of: anyone, bachelors, family"),

  body("filter.furnishing")
    .optional()
    .isIn(["fully furnished", "semi-furnished", "unfurnished"])
    .withMessage("Invalid type")
    .notEmpty()
    .withMessage("furnishing type is required"),

  body("filter.parking")
    .optional()
    .isIn(["car", "bike", "both car and bike", "none"])
    .withMessage("Invalid type")
    .notEmpty()
    .withMessage("parking type is required"),

  body("filter.amenities")
    .optional()
    .isArray()
    .withMessage("Amenities must be an array.")
    .custom((value) => {
      if (value && !Array.isArray(value)) {
        throw new Error("Amenities must be an array.");
      }

      if (typeof value === "string") {
        value = [value];
      }

      for (const amenity of value) {
        if (typeof amenity !== "string" || amenity.trim() === "") {
          throw new Error("Each amenity must be a non-empty string.");
        }
      }

      return true;
    }),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { search, filter } = req.body;
    let searchConditions = {};

    if (
      (!search || search.trim() === "") &&
      (!filter || Object.keys(filter).length === 0)
    ) {
      return res.status(400).json({
        message: "Please provide at least one search or filter criterion.",
      });
    }

    if (!search || search.trim() === "") {
      return res.status(400).json({
        message:
          "Please provide at least one of the following search criteria: name, description, or city, etc.",
      });
    }

    if (filter && Object.keys(filter).length === 0) {
      return res.status(400).json({
        message:
          "Please provide at least one valid filter criterion (e.g., base_price_max, base_price_min, etc.).",
      });
    }

    try {
      if (search) {
        searchConditions[Op.or] = [
          { city: { [Op.like]: `%${search}%` } },
          { state: { [Op.like]: `%${search}%` } },
          { country: { [Op.like]: `%${search}%` } },
          { address: { [Op.like]: `%${search}%` } },
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { property_status: { [Op.like]: `%${search}%` } },
        ];
      }

      if (filter) {
        if (filter.base_price_min) {
          searchConditions.base_price = searchConditions.base_price || {};
          searchConditions.base_price[Op.gte] = filter.base_price_min;
        }
        if (filter.base_price_max) {
          searchConditions.base_price = searchConditions.base_price || {};
          searchConditions.base_price[Op.lte] = filter.base_price_max;
        }
        if (filter.availability_status) {
          searchConditions.availability_status = filter.availability_status;
        }
        if (filter.type)
          searchConditions.type = { [Op.like]: `%${filter.type}%` };
        if (filter.size) searchConditions.size = filter.size;
        if (filter.floor) searchConditions.floor = filter.floor;
        if (filter.property_age)
          searchConditions.property_age = filter.property_age;
        if (filter.bhk_type) searchConditions.bhk_type = filter.bhk_type;
        if (filter.available_bathrooms)
          searchConditions.available_bathrooms = filter.available_bathrooms;
        if (filter.preferred_tenants)
          searchConditions.preferred_tenants = filter.preferred_tenants;
        if (filter.furnishing) searchConditions.furnishing = filter.furnishing;
        if (filter.parking) searchConditions.parking = filter.parking;
        if (filter.amenities) {
          if (!Array.isArray(filter.amenities)) {
            filter.amenities = [filter.amenities];
          }
          searchConditions[Op.or] = filter.amenities.map((amenity) => ({
            "$amenities.amenity_name$": { [Op.like]: `%${amenity}%` },
          }));
        }
      }

      const properties = await Property.findAll({
        where: searchConditions,
        include: [
          {
            model: PropertyAmenity,
            as: "amenities",
            attributes: ["id", "amenity_name"],
            required: true,
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
      });

      if (properties.length === 0) {
        return res.status(404).json({
          message:
            "No properties found with the provided search and filter criteria.",
        });
      }

      return res.status(200).json({
        message: "Properties found based on your search and filter criteria:",
        properties,
      });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error fetching properties", error: err.message });
    }
  },
];

exports.getPropertyDetails = [
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const role = req.user.role;
      let property;

      if (role === "owner") {
        property = await Property.findOne({
          where: {
            id,
            owner_id: userId,
          },
          include: [
            {
              model: PropertyAmenity,
              as: "amenities",
              attributes: ["id", "property_id", "amenity_name"],
            },
            {
              model: PropertyImage,
              as: "images",
              attributes: ["id", "property_id", "image_path"],
            },
            {
              model: User,
              as: "owner",
              attributes: ["firstname", "email", "mobile_number"],
            },
          ],
        });

        if (!property) {
          return res.status(404).json({
            message:
              "Property does not exist or you do not have permission to view it.",
          });
        }
      } else if (role === "tenant") {
        property = await Property.findOne({
          where: {
            id,
            property_status: "rent",
            availability_status: "available",
          },
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
        });

        if (!property) {
          return res.status(404).json({
            message: `No rental property found with ID ${id} or it's not available.`,
          });
        }
      } else if (role === "buyer") {
        property = await Property.findOne({
          where: {
            id,
            property_status: "buy",
            availability_status: "available",
          },
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
        });

        if (!property) {
          return res.status(404).json({
            message: `No property for sale found with ID ${id} or it's not available.`,
          });
        }
      }

      return res.status(200).json({
        message: "Property details fetched successfully.",
        property,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Error fetching property details",
        error: error.message,
      });
    }
  },
];
