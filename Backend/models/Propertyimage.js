const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/sequelize");

const PropertyImage = sequelize.define(
  "PropertyImage",
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
    image_path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "property_images",
    timestamps: false,
  }
);

PropertyImage.associate = (models) => {
  PropertyImage.belongsTo(models.Property, {
    foreignKey: "property_id",
    onDelete: "CASCADE",
  });
};

module.exports = PropertyImage;
