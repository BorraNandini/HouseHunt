------------USER MANAGEMENT--------------
-> Signup/Register :

1. Firstname
2. Lastname
3. Email (should be unique)
4. Username (should be unique)
5. Mobile number
6. Address (State, city, country, zip code, address)
7. Password(password strength)(encoded form in db)
8. Confirm Password
9. Choose role(owner/tenant/both)

-> Login :

1. Username
2. Email
3. Password
4. role dropdown

-> Edit profile :

1. Email
2. Mobile number
3. current password
4. New password
5. confirm password
6. Address
7. Image

-> Forgot password with mail:

1. Registered email/registered mobile number
2. OTP verification

-> Reset password :

1. New password
2. confirm password

-> Logout

<----------------------PROPERTY MANAGEMENT--------------->

-> Property creation :

1. ID
2. name
3. type( community, apartment, individual)
4. Location (State, city, country, zip code, address)
5. description
6. size (2bhk/3bhk/1RK/1bhk)
7. features (swimming pool, gym, play area)
8. images
9. availability status
10. owner details (user ID of owner)

-> property listing :

1. property type
2. property location
3. price range
4. propert size
5. property status
6. prices

-> property updates :

1. all fields of property creation are editable.
   (property name, property type, property location, property description, property size, property features, property images, availability status, owner details)

-> Property Deletion :

1. Property ID
2. Reason for deletion

-> Property Maintenance :

1. Maintenance problem(dropdown)
2. Problem description
3. Schedule date/time

-> Amenities :

1. Type
2. charges
3. Description

-> lease :

1. lease type
2. start/end

-> price :

1. base price
2. amenity charges
3. maintenance charges

-> property filters :

1. property type
2. property location
3. price range
4. propert size
5. property status

--------------BOOKING MANAGEMENT-------------------

-> Booking :

1. Tenant name
2. Tenant contact info
3. Property ID
4. Government ID Proof
5. upload ID Proof

-> Booking confirmation :

1. Booking ID
1. Booking status(dropdown(confirmed, pending, rejected))

-> Rental agreement :

1. Agreements terms
2. rental amount
3. start and end date(lease duration)
4. security deposit
5. Digital signatures

-> Booking payment :

1. Booking ID
2. Tenant name
3. Total amount
4. Payment method
5. Transaction ID
6. Invoice

-> Booking Tracking :

1. Booking ID
2. Property ID
3. Tenant Name
4. Booking status
5. Payment status

-> Booking cancellation :

1. Booking ID
2. Cancellation Reason
3. Refund Status

User Management
Signup/Register: Allows users to register with details such as first name, last name, email, phone number, and more.
Login: Allows users to log in using their username, email, and password.
Edit Profile: Users can update their contact info, address, password, etc.
Forgot Password: Allows password recovery via registered email or mobile number.
Logout: Ends the user session.
Property Management
Property Creation: Users (owners) can create properties with detailed information such as name, location, features, images, and availability.
Property Listing: Allows tenants to filter properties by type, location, price range, and size.
Property Updates: Users can edit property details like description, features, and availability.
Property Deletion: Allows owners to delete properties with a reason.
Property Maintenance: Allows tenants to report maintenance issues with a dropdown for problem types.
Amenities: Adding amenities like types, charges, and descriptions.
Lease Management: Information about lease type and duration.
Price Management: Input for base price, amenity charges, and maintenance charges.
Property Filters: Used by tenants to filter properties based on specific criteria.
Booking Management
Booking: Allows tenants to book a property by providing their contact information, property ID, and ID proof.
Booking Confirmation: Admin can confirm, reject, or mark bookings as pending.
Rental Agreement: Agreement terms, rental amount, security deposit, and digital signatures.
Booking Payment: Payment details such as the total amount, payment method, and transaction ID.
Booking Tracking: Track booking status, payment status, and associated property.
Booking Cancellation: Allows cancellations with reasons and refund status.

FOR DATABASE:
table name - users

1. firstname
2. lastname
3. Email
4. Username (should be unique)
5. Mobile number
6. Address (State, city, country, zip code, address)
7. Password(password strength)
8. Confirm Password
9. Choose role(owner/tenant/both)
10. id

table name - properties

1. ID
2. name
3. type( community, apartment, individual)
4. Location (State, city, country, zip code, address)
5. description
6. size (2bhk/3bhk/1RK/1bhk)
7. features (swimming pool, gym, play area)
8. availability status
9. owner details (user ID of owner)

-> Amenities :

1. id
2. property_id
3. name

-> price :

1. id
2. property_id
3. base price
4. amenity charges
5. maintenance charges
6. total price

-> propertyImages
id
property_id
image_name
image_url

--------------BOOKING MANAGEMENT-------------------

-> Booking :

1. id
2. tenant_id(user_id)
3. Property ID
4. Government ID Proof
5. Booking status(dropdown(confirmed, pending, rejected, cancelled))
6. Total amount

7. Payment status(pending, done)

-> Rental agreement :

1. id
2. booking_id
3. Agreements terms
4. rental amount
5. start and end date(lease duration)
6. security deposit
7. Digital signatures
   --------Booking Management-----------------
   ->booking Creation
   ->booking details
   ->booking listing
   ->booking cancellation
   ->rental agreement
   ->booking confirmation
   ->booking rejected

for buying a property:

user controller
-> role('owner', 'tenant', 'buyer')

property controller
-> createproperty (property_status(for rent or for selling))
-> availability_status(rented, sold)
-> for buying a property(price)

booking controller
all fields are same need to add a field(payable_amount)

RENTAL SERVICES:

HomePage: where we have register and login options. And also search option to find properties by location and can filter their requirements.

If user want to register their property, while registering he should choose the role as owner

If role is owner:

-> owner can login to the site.
-> after login owner will be redirected to dashboard where he can find (profile settings dropdown to edit profile and change password) and (property owners dropdown in which we have property creation, property listing, property details, booking listing)
property creation: owner can register their property (properties which are available for both rent and buy)
property listing: owner can see the list of properties which are created by him and can edit, delete properties and can view bookings for their properties.
property details: here owner can see full property details.
booking listing: owner can see the list of bookings also can update booking status(confirmed,pending,cancelled, rejected) and can create rental agreements.
view rental agreements: can see all the rental agreements created by owner.

If role is tenant:

-> after login if role is tenant, user is redirected to dashboard where he can edit profile and change password. Also user can view property details, can book property, can view previous and current bookings, can view the agreements of previous and current booked properties.

property details: user can see all the property information and can book the property.
booking listing: can see list of bookings created by user.
view rental agreements: user can see the agreement created by owner and can download the agreement.

If role is buyer:

-> after login if role is buyer, user is redirected to dashboard where he can edit profile and change password. Also user can view property details, can book property, can view previous and current bookings, can view the agreements of previous and current booked properties.

property details: user can see all the property information and can book the property.
booking listing: can see list of bookings created by user.
view rental agreements: user can see the agreement created by owner and can download the agreement.

pending work:

Need to add logo
Home page -> In search and filter, we need to add property booking.
rental agreement -> need to user , owner info and styling as well(view agreement for tenants/buyers).

changes:
-> booking list
actions : if booking_status is confirmed then update button should not be there.
if rental agreement is already created then button should not be there

update booking status: remove updateBookingstatus in booking list and add as pop up in model(remove pending option and use radio buttons)

header: logo, header should be same for all (before )

property listing: add icons for edit, delete, view bookings. Also add property details in listing.

edit profile: user info should come and we need to edit data.
