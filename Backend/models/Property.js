const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../helpers/sequelize");

const Property = sequelize.define(
  "Property",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("community", "apartment", "individual"),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    zip_code: {
      type: DataTypes.INTEGER(20),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    size: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    floor: {
      type: DataTypes.ENUM("ground floor", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
      allowNull: false,
    },
    total_floor: {
      type: DataTypes.ENUM("ground floor", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
      allowNull: false,
    },
    property_age: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    property_status: {
      type: DataTypes.ENUM("rent", "buy"),
      allowNull: false,
    },
    bhk_type: {
      type: DataTypes.ENUM("3BHK", "2BHK", "1BHK", "1RK"),
      allowNull: false,
    },
    base_price: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    amenity_price: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    maintenance_price: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    total_price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    availability_status: {
      type: DataTypes.ENUM("available", "not available"),
      allowNull: false,
    },
    available_from: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    available_bathrooms: {
      type: DataTypes.ENUM(1, 2, 3),
      allowNull: false,
    },
    preferred_tenants: {
      type: DataTypes.ENUM("anyone", "bachelors", "family"),
      allowNull: true,
    },
    furnishing: {
      type: DataTypes.ENUM("fully furnished", "semi-furnished", "unfurnished"),
      allowNull: false,
    },
    parking: {
      type: DataTypes.ENUM("car", "bike", "both car and bike", "none"),
      allowNull: false,
    },
    owner_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Property;
