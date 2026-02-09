const express = require("express");
const router = express.Router();

const {
  createProperty,
  editProperty,
  deleteProperty,
  PropertyList,
  searchAndFilterProperties,
  getPropertyDetails,
} = require("../controllers/propertyController");

const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const userMiddleware = require("../Middleware/userMiddleware");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Property = require("../models/Property");
const PropertyAmenity = require("../models/PropertyAmenity");
const RentalAgreement = require("../models/RentalAgreement");
const PropertyImage = require("../models/PropertyImage");
const ShortlistedProperties = require("../models/ShortlistedProperties");
const propertyMiddleware = require("../Middleware/propertyMiddleware");
const Booking = require("../models/Booking");
const Associations = require("../models/Associations");
const { Op } = require("sequelize");

router.get(
  "/createProperty",
  userMiddleware,
  propertyMiddleware,
  (req, res) => {
    res.render("createProperty", {
      title: "createProperty",
      errors: {},
      data: {},
    });
  }
);

router.post(
  "/createProperty",
  userMiddleware,
  propertyMiddleware,
  upload.array("images"),
  [
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
      .matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/)
      .withMessage("State must only contain letters"),
    body("city")
      .notEmpty()
      .withMessage("City is required")
      .matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/)
      .withMessage("City must only contain letters"),
    body("country")
      .notEmpty()
      .withMessage("Country is required")
      .matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/)
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
    body("total_price")
      .isNumeric()
      .if(body("property_status").equals("buy"))
      .notEmpty()
      .withMessage("Total price is required for buying property"),
    body("total_floor")
      .notEmpty()
      .withMessage("Total floors is required")
      .isIn(["ground floor", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    body("property_age")
      .notEmpty()
      .withMessage("Property age is required")
      .isIn([
        "1-2 year",
        "2-3 year",
        "3-4 year",
        "4-5 year",
        "More than 5 year",
      ]),
    body("bhk_type")
      .notEmpty()
      .withMessage("bhk type is required")
      .isIn(["3BHK", "2BHK", "1BHK", "1RK"]),
    body("base_price")
      .if(body("property_status").equals("rent"))
      .isNumeric()
      .withMessage("Base price must be a number")
      .notEmpty()
      .withMessage("Base price is required"),

    body("amenity_price")
      .if(body("property_status").equals("rent"))
      .isNumeric()
      .withMessage("Amenity price must be a number")
      .notEmpty()
      .withMessage("Amenity price is required"),

    body("maintenance_price")
      .if(body("property_status").equals("rent"))
      .isNumeric()
      .withMessage("Maintenance price must be a number")
      .notEmpty()
      .withMessage("Maintenance price is required"),

    body("availability_status")
      .notEmpty()
      .withMessage("Availability status is required")
      .isIn(["available", "not available"]),
    body("available_from")
      .notEmpty()
      .withMessage("Availability date is required"),

    body("available_from")
      .notEmpty()
      .withMessage("Availability date is required")
      .custom((value) => {
        const inputDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);
        if (inputDate < today) {
          throw new Error("Availability date cannot be in the past");
        }
        return true;
      }),

    body("amenities")
      .notEmpty()
      .withMessage("Add atleast one amenity")
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
      .notEmpty()
      .withMessage("available bathrooms are required")
      .isIn([1, 2, 3]),
    body("preferred_tenants")
      .if(body("property_status").equals("rent"))
      .notEmpty()
      .withMessage("Tenant type is required")
      .isIn(["anyone", "bachelors", "family"]),
    body("furnishing")
      .notEmpty()
      .withMessage("furnishing type is required")
      .isIn(["fully furnished", "semi-furnished", "unfurnished"]),
    body("parking")
      .notEmpty()
      .withMessage("parking type is required")
      .isIn(["car", "bike", "both car and bike", "none"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());

      return res.render("createProperty", {
        title: "createProperty",
        errors: errors.mapped(),
        data: req.body,
      });
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
      let basePrice = property_status === "buy" ? 0 : parseFloat(base_price);
      let amenityPrice =
        property_status === "buy" ? 0 : parseFloat(amenity_price);
      let maintenancePrice =
        property_status === "buy" ? 0 : parseFloat(maintenance_price);

      let calculatedTotalPrice = 0;
      if (property_status === "rent") {
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
        total_price: finalTotalPrice,
        availability_status,
        available_from,
        owner_id,
        amenities,
        available_bathrooms,
        furnishing,
        parking,
        property_status,
        base_price: basePrice,
        amenity_price: amenityPrice,
        maintenance_price: maintenancePrice,
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
        console.log("Images uploaded and associated with property.");
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

      res.render("createProperty", {
        title: "createProperty",
        message: "Property created successfully!",
        messageType: "success",
        property: {},
        role: req.user.role,
        data: {},
        errors: {},
      });
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(500).json({
        message: "Error creating property",
        error: error.message,
      });
    }
  }
),
  router.get(
    "/editProperty/:id",
    userMiddleware,
    propertyMiddleware,
    async (req, res) => {
      const propertyId = req.params.id;

      try {
        const property = await Property.findOne({
          where: { id: propertyId },
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

        if (!property) {
          return res.status(404).send("Property not found");
        }

        console.log(property);
        res.render("editProperty", {
          title: "editProperty",
          property,
          errors: {},
        });
      } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching property");
      }
    }
  );

router.post(
  "/editProperty/:id",
  upload.array("images"),
  userMiddleware,
  propertyMiddleware,
  [
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("type")
      .optional()
      .isIn(["community", "apartment", "individual"])
      .withMessage("Invalid type"),

    body("address").optional().notEmpty().withMessage("Address is required"),
    body("city")
      .optional()
      .notEmpty()
      .withMessage("City is required")
      .matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/)
      .withMessage("City must not contain numbers"),
    body("state")
      .optional()
      .notEmpty()
      .withMessage("State is required")
      .matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/)
      .withMessage("state must not contain numbers"),
    body("country")
      .optional()
      .notEmpty()
      .withMessage("Country is required")
      .matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/)
      .withMessage("Country must not contain numbers"),
    body("zip_code")
      .optional()
      .notEmpty()
      .withMessage("Zip code cannot be empty")
      .matches(/^\d{5,6}$/)
      .withMessage("Zip code must be 5 or 6 numeric characters"),
    body("description")
      .optional()
      .notEmpty()
      .withMessage("Description cannot be empty"),
    body("maintenance_price")
      .optional()
      .notEmpty()
      .isFloat({ min: 0 })
      .withMessage("Maintenance price must be a number"),
    body("base_price")
      .optional()
      .notEmpty()
      .isFloat({ min: 0 })
      .withMessage("base price must be a number"),
    body("amenity_price")
      .optional()
      .notEmpty()
      .isFloat({ min: 0 })
      .withMessage("amenity price must be a number"),

    body("size").optional().notEmpty().withMessage("Size is required"),
    body("floor")
      .optional()
      .isIn(["ground floor", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    body("total_floor")
      .optional()
      .isIn(["ground floor", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    // body("property_status")
    //   .optional()
    //   .isIn(["rent", "buy"])
    //   .withMessage("Invalid property status"),
    body("property_age")
      .optional()
      .notEmpty()
      .withMessage("property_age is required")
      .isIn([
        "1-2 year",
        "2-3 year",
        "3-4 year",
        "4-5 year",
        "More than 5 year",
      ])
      .withMessage("property_age is required"),
    body("bhk_type").optional().isIn(["1BHK", "2BHK", "3BHK", "1RK"]),

    body("available_from").custom(async (value, { req }) => {
      if (typeof value === "undefined") return true;

      const propertyId = req.params.id;
      if (!propertyId) {
        throw new Error("propertyId is not defined");
      }

      const existingProperty = await Property.findByPk(propertyId); // Sequelize equivalent of findById

      if (!existingProperty) {
        throw new Error("Property not found");
      }

      const existingDate = new Date(existingProperty.available_from);
      const newDate = new Date(value);

      existingDate.setHours(0, 0, 0, 0);
      newDate.setHours(0, 0, 0, 0);

      if (existingDate.getTime() === newDate.getTime()) {
        return true;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(newDate)) {
        throw new Error("Invalid date format");
      }

      if (newDate < today) {
        throw new Error("Availability date cannot be in the past");
      }

      return true;
    }),

    body("total_price")
      .optional()
      .notEmpty()
      .withMessage("total price is required")
      .custom((value, { req }) => {
        if (req.body.property_status === "buy" && !value) {
          throw new Error("Total price is required for buy properties.");
        }
        return true;
      }),

    body("amenities")
      .optional()
      .isArray()
      .custom((value) => {
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
        for (let a of value) {
          if (!validAmenities.includes(a)) {
            throw new Error(`${a} is not a valid amenity`);
          }
        }
        return true;
      }),
    body("images").custom((_, { req }) => {
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const validTypes = ["image/jpeg", "image/png", "image/jpg"];
          if (!validTypes.includes(file.mimetype)) {
            throw new Error(
              "Invalid file type. Only JPG, JPEG, and PNG are allowed."
            );
          }
          if (file.size > 500 * 1024 * 1024) {
            throw new Error("Image file size too large. Max is 500MB.");
          }
        }
      }
      return true;
    }),
  ],
  async (req, res) => {
    const propertyId = req.params.id;
    console.log("Property ID:", propertyId);
    console.log("Request Body:", req.body);

    if (!propertyId) {
      return res.status(400).send("Property ID is missing.");
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const mappedErrors = errors.mapped();
      console.log("Validation errors:", errors.array());
      const propertyWithId = { ...req.body, id: propertyId };
      return res.render("editProperty", {
        title: "editProperty",
        errors: mappedErrors,
        property: propertyWithId,
      });
    }

    const {
      name,
      type,
      address,
      city,
      state,
      country,
      zip_code,
      description,
      size,
      floor,
      total_floor,
      // property_status,
      amenities,
      available_bathrooms,
      total_price,
      base_price,
      amenity_price,
      maintenance_price,
      available_from,
      parking,
    } = req.body;

    try {
      const currentProperty = await Property.findByPk(propertyId);
      if (!currentProperty) {
        return res.status(404).send("Property not found.");
      }

      const normalizeString = (val) => (val || "").toString().trim();
      const normalizeNumber = (val) => Number(val) || 0;
      const normalizeDate = (val) => {
        try {
          return new Date(val).toISOString().split("T")[0];
        } catch {
          return "";
        }
      };
      const normalizeArray = (arr) =>
        (arr || []).map((a) => a.toString().trim().toLowerCase()).sort();

      const comparisonLog = {
        name: normalizeString(name) !== normalizeString(currentProperty.name),
        type: normalizeString(type) !== normalizeString(currentProperty.type),
        address:
          normalizeString(address) !== normalizeString(currentProperty.address),
        city: normalizeString(city) !== normalizeString(currentProperty.city),
        state:
          normalizeString(state) !== normalizeString(currentProperty.state),
        country:
          normalizeString(country) !== normalizeString(currentProperty.country),
        zip_code:
          normalizeString(zip_code) !==
          normalizeString(currentProperty.zip_code),
        description:
          normalizeString(description) !==
          normalizeString(currentProperty.description),
        size: normalizeNumber(size) !== normalizeNumber(currentProperty.size),
        floor:
          normalizeNumber(floor) !== normalizeNumber(currentProperty.floor),
        total_floor:
          normalizeNumber(total_floor) !==
          normalizeNumber(currentProperty.total_floor),
        property_status: false, // Never consider property_status changed since it is not editable
        available_bathrooms:
          normalizeNumber(available_bathrooms) !==
          normalizeNumber(currentProperty.available_bathrooms),
        total_price:
          typeof total_price !== "undefined" &&
          normalizeNumber(total_price) !==
            normalizeNumber(currentProperty.total_price),

        base_price:
          normalizeNumber(base_price) !==
          normalizeNumber(currentProperty.base_price),
        amenity_price:
          normalizeNumber(amenity_price) !==
          normalizeNumber(currentProperty.amenity_price),
        maintenance_price:
          normalizeNumber(maintenance_price) !==
          normalizeNumber(currentProperty.maintenance_price),
        available_from:
          normalizeDate(available_from) !==
          normalizeDate(currentProperty.available_from),
        parking:
          normalizeString(parking) !== normalizeString(currentProperty.parking),
        amenities:
          Array.isArray(amenities) &&
          JSON.stringify(normalizeArray(amenities)) !==
            JSON.stringify(
              normalizeArray(
                (currentProperty.amenities || []).map((a) => a.amenity_name)
              )
            ),
        files: req.files && req.files.length > 0,
      };

      const hasChanges = Object.values(comparisonLog).some(Boolean);

      if (!hasChanges) {
        return res.render("editProperty", {
          title: "editProperty",
          property: currentProperty,
          errors: {},
          message: "Please edit at least one field to update the property.",
          messageType: "error1",
        });
      }

      const normalizedStatus = (currentProperty.property_status || "")
        .toString()
        .trim()
        .toLowerCase();

      const parsedBasePrice =
        normalizedStatus === "buy" ? 0 : parseFloat(base_price) || 0;
      const parsedAmenityPrice =
        normalizedStatus === "buy" ? 0 : parseFloat(amenity_price) || 0;
      const parsedMaintenancePrice =
        normalizedStatus === "buy" ? 0 : parseFloat(maintenance_price) || 0;

      let finalTotalPrice = 0;
      if (normalizedStatus === "rent") {
        finalTotalPrice =
          parsedBasePrice + parsedAmenityPrice + parsedMaintenancePrice;
      } else {
        finalTotalPrice = parseFloat(total_price) || 0;
      }

      console.log("Final total_price to be saved:", finalTotalPrice);

      await Property.update(
        {
          name,
          type,
          address,
          city,
          state,
          country,
          zip_code,
          description,
          size,
          floor,
          total_floor,
          // property_status, // keep it commented out here, no changes allowed
          amenities,
          available_bathrooms,
          total_price: finalTotalPrice,
          base_price,
          amenity_price,
          maintenance_price,
          available_from: available_from || currentProperty.available_from,
          parking,
        },
        { where: { id: propertyId } }
      );

      if (Array.isArray(amenities)) {
        await PropertyAmenity.destroy({ where: { property_id: propertyId } });
        const amenitiesData = amenities.map((a) => ({
          property_id: propertyId,
          amenity_name: a,
        }));
        await PropertyAmenity.bulkCreate(amenitiesData);
      }

      if (req.files && req.files.length > 0) {
        const imagePaths = req.files.map((f) => ({
          property_id: propertyId,
          image_path: `/uploads/${f.filename}`,
        }));
        await PropertyImage.bulkCreate(imagePaths);
      }

      const updatedProperty = await Property.findByPk(propertyId, {
        include: [
          {
            model: PropertyAmenity,
            as: "amenities",
            attributes: ["amenity_name"],
          },
          { model: PropertyImage, as: "images", attributes: ["image_path"] },
        ],
      });

      return res.render("editProperty", {
        title: "editProperty",
        property: updatedProperty,
        errors: {},
        message: "Property updated successfully!",
        messageType: "Success",
      });
    } catch (err) {
      console.error("Update Error:", err);
      res.status(500).send("Server error during property update.");
    }
  }
);

router.get("/search-filterProperties", async (req, res) => {
  try {
    const filter = req.query || {};
    const toArray = (value) =>
      value ? (Array.isArray(value) ? value : [value]) : [];

    const search = req.query.search || "";
    const property_status = req.query.property_status || "";
    const base_price_min = filter["filter.base_price_min"];
    const base_price_max = filter["filter.base_price_max"];

    const user = req.user || req.session.user;
    let hasShortlisted = false;
    let likedPropertyIds = [];
    if (user && user.id) {
      const liked = await ShortlistedProperties.findAll({
        where: { user_id: user.id },
        attributes: ["property_id"],
      });
      likedPropertyIds = liked.map((l) => Number(l.property_id));
      hasShortlisted = likedPropertyIds.length > 0;
    }

    if (!search.trim()) {
      return res.render("homePage", {
        title: "Rental Services",
        message: "Please enter a search term to find properties.",
        search: "",
        property_status: "",
        filter: filter,
        properties: [],
        user,
        hasShortlisted,
        message: null,
      });
    }

    const confirmedBookings = await Booking.findAll({
      where: { booking_status: "confirmed" },
      attributes: ["property_id"],
      raw: true,
    });
    const bookedIds = confirmedBookings.map((b) => Number(b.property_id));

    const filters = {
      type: filter["filter.type"],
      bhk_type: toArray(filter["filter.bhk_type"]),
      floor: toArray(filter["filter.floor"]),
      parking: toArray(filter["filter.parking"]),
      preferred_tenants: toArray(filter["filter.preferred_tenants"]),
      furnishing: toArray(filter["filter.furnishing"]),
      property_age: toArray(filter["filter.property_age"]),
      available_bathrooms: toArray(filter["filter.available_bathrooms"]),
      amenities: toArray(filter["filter.amenities"]),
      "filter.base_price_min": base_price_min || "",
      "filter.base_price_max": base_price_max || "",
    };

    let searchConditions = {
      [Op.and]: [
        {
          [Op.or]: [
            { city: { [Op.like]: `%${search}%` } },
            { state: { [Op.like]: `%${search}%` } },
            { country: { [Op.like]: `%${search}%` } },
            { address: { [Op.like]: `%${search}%` } },
            { name: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
          ],
        },
      ],
      availability_status: "available",
    };

    if (bookedIds.length > 0) {
      searchConditions.id = { [Op.notIn]: bookedIds };
    }

    if (property_status) {
      searchConditions.property_status = { [Op.eq]: property_status };
    }

    if (property_status === "rent") {
      if (base_price_min || base_price_max) {
        searchConditions.base_price = {};
        if (base_price_min)
          searchConditions.base_price[Op.gte] = parseFloat(base_price_min);
        if (base_price_max)
          searchConditions.base_price[Op.lte] = parseFloat(base_price_max);
      }
      if (filters.preferred_tenants.length) {
        searchConditions.preferred_tenants = {
          [Op.in]: filters.preferred_tenants,
        };
      }
    } else if (property_status === "buy") {
      if (base_price_min || base_price_max) {
        searchConditions.total_price = {};
        if (base_price_min)
          searchConditions.total_price[Op.gte] = parseFloat(base_price_min);
        if (base_price_max)
          searchConditions.total_price[Op.lte] = parseFloat(base_price_max);
      }
    }

    if (filters.type) searchConditions.type = { [Op.eq]: filters.type };
    if (filters.bhk_type.length)
      searchConditions.bhk_type = { [Op.in]: filters.bhk_type };
    if (filters.floor.length)
      searchConditions.floor = { [Op.in]: filters.floor };
    if (filters.parking.length)
      searchConditions.parking = { [Op.in]: filters.parking };
    if (filters.furnishing.length)
      searchConditions.furnishing = { [Op.in]: filters.furnishing };
    if (filters.property_age.length)
      searchConditions.property_age = { [Op.in]: filters.property_age };
    if (filters.available_bathrooms.length)
      searchConditions.available_bathrooms = {
        [Op.in]: filters.available_bathrooms,
      };

    const properties = await Property.findAll({
      where: searchConditions,
      include: [
        {
          model: PropertyAmenity,
          as: "amenities",
          required: filters.amenities.length > 0,
          where:
            filters.amenities.length > 0
              ? { amenity_name: { [Op.in]: filters.amenities } }
              : undefined,
        },
        {
          model: PropertyImage,
          as: "images",
          attributes: ["id", "property_id", "image_path"],
        },
      ],
    });

    return res.render("search-filterProperties", {
      title: "Search Results",
      search,
      layout: false,
      property_status,
      filter: filters,
      properties,
      likedPropertyIds,
      bookedIds,
      user,
      hasShortlisted,
      message: null,
    });
  } catch (err) {
    console.error("Error fetching properties:", err);
    return res
      .status(500)
      .json({ message: "Error processing the request", error: err.message });
  }
});

router.get("/propertyListing", userMiddleware, async (req, res) => {
  try {
    const role = req.user.role;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { property_status } = req.query;
    const deletedIds = req.query.deleted
      ? req.query.deleted.split(",").map((id) => parseInt(id))
      : [];

    const baseWhere = {
      availability_status: "available",
      ...(deletedIds.length > 0 && { id: { [Op.notIn]: deletedIds } }),
    };

    let properties = [];
    let totalProperties = 0;

    if (role === "owner") {
      const ownerWhere = {
        ...baseWhere,
        owner_id: req.user.id,
      };

      properties = await Property.findAll({
        where: ownerWhere,
        limit,
        offset,
        include: [
          {
            model: PropertyAmenity,
            as: "amenities",
            attributes: ["amenity_name"],
          },
          { model: PropertyImage, as: "images", attributes: ["image_path"] },
          {
            model: Booking,
            as: "bookings",
            attributes: ["id"],
          },
        ],
      });

      totalProperties = await Property.count({ where: ownerWhere });
    } else if (role === "tenant" || role === "buyer") {
      const status = role === "tenant" ? "rent" : "buy";

      const userWhere = {
        ...baseWhere,
        property_status: property_status || status,
      };

      properties = await Property.findAll({
        where: userWhere,
        limit,
        offset,
        include: [
          {
            model: PropertyAmenity,
            as: "amenities",
            attributes: ["amenity_name"],
          },
          { model: PropertyImage, as: "images", attributes: ["image_path"] },
          {
            model: User,
            as: "owner",
            attributes: ["firstname", "email", "mobile_number"],
          },
        ],
      });

      totalProperties = await Property.count({ where: userWhere });
    }

    const totalPages = Math.ceil(totalProperties / limit);

    if (properties.length === 0 && page > 1) {
      return res.redirect(
        `/propertyListing?page=${page - 1}&deleted=${deletedIds.join(",")}`
      );
    }

    res.render("propertyListing", {
      title: "propertyListing",
      message: "Property list fetched successfully",
      properties,
      currentPage: page,
      totalPages,
      role: req.user.role,
      user: req.user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching properties",
      error: error.message,
    });
  }
});

router.get("/propertyDetails", userMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let properties;

    if (role === "owner") {
      properties = await Property.findAll({
        where: { owner_id: userId },
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
        ],
      });

      if (!properties || properties.length === 0) {
        return res.render("propertyListing", {
          message: "You don't have any properties.",
        });
      }
    } else if (role === "tenant") {
      properties = await Property.findAll({
        where: {
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

      if (!properties || properties.length === 0) {
        return res.status(404).json({
          message: "No rental properties available at the moment.",
        });
      }
    } else if (role === "buyer") {
      properties = await Property.findAll({
        where: {
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

      if (!properties || properties.length === 0) {
        return res.status(404).json({
          message: "No properties for sale available at the moment.",
        });
      }
    }

    res.render("propertyDetails", {
      title: "propertyDetails",
      message: "Property details fetched successfully",
      properties,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred while fetching the property details.",
      error: error.message,
    });
  }
});

router.get("/propertyInfo/:id", userMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const propertyId = req.params.id;

    let property;

    if (role === "owner") {
      property = await Property.findOne({
        where: {
          id: propertyId,
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
        ],
      });

      if (!property) {
        return res.render("propertyInfo", {
          title: "propertyInfo",
          message: "Property not found.",
          property: null,
          role,
        });
      }
    } else if (role === "tenant" || role === "buyer") {
      property = await Property.findOne({
        where: {
          id: propertyId,
          property_status: role === "tenant" ? "rent" : "buy",
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
        let customMessage = "Property not found or unavailable.";

        if (role === "buyer") {
          customMessage =
            "This property is for rent. As a buyer, you cannot view full details.";
        } else if (role === "tenant") {
          customMessage =
            "This property is for sale. As a tenant, you cannot view full details.";
        }

        return res.render("propertyInfo", {
          title: "propertyInfo",
          message: customMessage,
          property: null,
          role,
        });
      }
    }

    res.render("propertyInfo", {
      title: "propertyInfo",
      message: "Property details fetched successfully",
      property,
      role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred while fetching the property details.",
      error: error.message,
    });
  }
});
router.get("/ShortlistedProperties", userMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const shortlisted = await ShortlistedProperties.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Property,
          as: "property",
          include: [
            { model: PropertyImage, as: "images" },
            { model: PropertyAmenity, as: "amenities" },
            {
              model: User,
              as: "owner",
              attributes: ["firstname", "email", "mobile_number"],
            },
          ],
        },
      ],
    });
    res.render("ShortlistedProperties", {
      title: "Shortlisted Properties",
      properties: shortlisted.map((item) => item.property),
      message:
        shortlisted.length === 0
          ? "No shortlisted properties available."
          : null,
    });
  } catch (error) {
    console.error("Error fetching shortlisted properties:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/shortlist", userMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.body;
    const userId = req.user && req.user.id;

    console.log("Shortlist request:", { userId, propertyId });

    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });

    const [entry, created] = await ShortlistedProperties.findOrCreate({
      where: { user_id: userId, property_id: propertyId },
    });

    console.log("Shortlist DB result:", { entry, created });

    res.json({
      success: true,
      message: created ? "Property shortlisted" : "Already shortlisted",
    });
  } catch (err) {
    console.error("Shortlist POST error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error shortlisting property" });
  }
});

router.delete("/shortlist", userMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.body;
    const userId = req.user && req.user.id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });

    await ShortlistedProperties.destroy({
      where: { user_id: userId, property_id: propertyId },
    });

    res.json({ success: true, message: "Property removed from shortlist" });
  } catch (err) {
    console.error("Shortlist DELETE error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error unshortlisting property" });
  }
});

router.post("/deleteProperty/:id", userMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const property = await Property.findOne({
      where: {
        id,
        owner_id: req.user.id,
        deleted_at: null,
      },
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found or you are not authorized to delete it",
      });
    }

    property.deleted_at = new Date();
    await property.save();

    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Error during property deletion:", error);
    res.status(500).json({
      message: "Error deleting property",
      error: error.message,
    });
  }
});

module.exports = router;
