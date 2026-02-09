const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/sequelize");

const ShortlistedProperties = sequelize.define(
  "ShortlistedProperties",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    property_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "property_id",
    },
  },
  {
    tableName: "shortlisted_properties",
    timestamps: false,

    indexes: [
      {
        unique: true,
        fields: ["user_id", "property_id"],
      },
    ],
  }
);

module.exports = ShortlistedProperties;
