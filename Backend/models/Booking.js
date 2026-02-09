const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/sequelize");

const Booking = sequelize.define(
  "Booking",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "Users",
        key: "id",
      },
    },
    property_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "Properties",
        key: "id",
      },
    },
    government_id_proof: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    booking_status: {
      type: DataTypes.ENUM("confirmed", "pending"),
      allowNull: true,
    },
    total_price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    property_status: {
      type: DataTypes.ENUM("rent", "buy"),
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    payment_status: {
      type: DataTypes.ENUM("pending", "done"),
      allowNull: false,
    },

    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Booking;
