const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/sequelize");
const Property = require("./Property");
const RentalAgreement = sequelize.define(
  "RentalAgreement",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    booking_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "Bookings",
        key: "id",
      },
    },
    security_deposit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lease_duration: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    booking_confirmation: {
      type: DataTypes.ENUM("confirmed", "pending", "cancelled", "rejected"),
    },
  },
  {
    tableName: "rental_agreements",
    timestamps: false,
  }
);

RentalAgreement.belongsTo(Property, { foreignKey: "property_id" });

module.exports = RentalAgreement;
