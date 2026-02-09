const Property = require("./Property");
const PropertyAmenity = require("./PropertyAmenity");
const PropertyImage = require("./PropertyImage");
const Booking = require("./Booking");
const User = require("./User");
const RentalAgreement = require("./RentalAgreement");
const ShortlistedProperties = require("./ShortlistedProperties");

Property.hasMany(PropertyAmenity, {
  foreignKey: "property_id",
  as: "amenities",
});
Property.hasMany(PropertyImage, { foreignKey: "property_id", as: "images" });
Property.hasMany(Booking, { foreignKey: "property_id", as: "bookings" });
User.hasMany(Property, {
  foreignKey: "owner_id",
  as: "properties",
});
Property.belongsTo(User, {
  foreignKey: "owner_id",
  as: "owner",
});
User.hasMany(Booking, {
  foreignKey: "user_id",
  as: "bookings",
});
Booking.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

PropertyAmenity.belongsTo(Property, { foreignKey: "property_id" });
PropertyImage.belongsTo(Property, {
  foreignKey: "property_id",
  onDelete: "CASCADE",
});
Booking.belongsTo(Property, {
  foreignKey: "property_id",
  as: "property",
});

RentalAgreement.belongsTo(Property, {
  foreignKey: "property_id",
  as: "property",
});
RentalAgreement.belongsTo(Booking, { foreignKey: "booking_id", as: "booking" });

ShortlistedProperties.belongsTo(Property, {
  foreignKey: "property_id",
  as: "property",
});
ShortlistedProperties.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = {
  Property,
  PropertyAmenity,
  Booking,
  User,
};
