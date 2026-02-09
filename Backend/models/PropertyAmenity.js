const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/sequelize");
const Property = require("./Property");

const PropertyAmenity = sequelize.define(
  "PropertyAmenity",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    property_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amenity_name: {
      type: DataTypes.JSON(
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
        "Visitor Parking"
      ),
      allowNull: false,
    },
  },
  {
    tableName: "property_amenities",
    timestamps: false,
  }
);

PropertyAmenity.associate = (models) => {
  PropertyAmenity.belongsTo(models.Property, {
    foreignKey: "property_id",
    as: "property",
    onDelete: "CASCADE",
  });
};

module.exports = PropertyAmenity;
