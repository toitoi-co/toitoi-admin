The entire API is a JSON API - in all cases, it expects a JSON-formatted request body (or no request body at all).

Fields for which the contents are self-evident (eg. `firstName`), are listed but not documented further.

Each API response will contain an `X-API-Authenticated` header with a string value of either `true` or `false`, depending on whether the request was made as an authenticated user or as a 'guest'.

When an error occurs, the appropriate status code is sent, along with a JSON response body which contains a 'message' property. In the future, a machine-readable error code may also be sent along, for localization purposes.

Each method specifies the specific types of errors that it might return. In some cases, an error may also include additional properties with more details - these are documented as well.

# Global error types

* any -> __401__: The user is not authenticated, but the endpoint requires authentication.
* any -> __403__: The user is authenticated, but the ACL does not allow them the requested access to this endpoint.
* any -> __404__: The given route or object was not found.
* POST/PUT -> __422__: One or more fields failed the validation rules. The error response m ay contain an `errors` property with more details, formatted like the output of `checkit`'s `checkit.error#errors` property.

# Models

There's currently a fairly direct mapping between the request format for many API calls, and the objects that are saved to the database. Some exceptions exist, but will be noted in the documentation for those API calls specifically.

## User

* __id__: Unique, numeric, auto-incremented ID for the user.
* __email__
* __role__: String, referencing the role name in the ACL. Can be any of the roles returned by the `GET /roles` route, except for `guest`.
* __isActive__: Boolean.
* __signupFlowCompleted:__ Boolean, whether the user has gone through the sign-up flow, including e-mail validation, setting a password, and so on.
* __firstName__, __lastName__, __address1__, __address2__, __city__, __state__, __postalCode__, __country__
* __createdAt__: Timestamp, when the user account was registered.
* __updatedAt__: Timestamp, when the properties of the user were last changed.

# Routes

## Authentication

### POST /register

Creates a new user account. The following fields are accepted:

* __email__: E-mail address of the user. Must be valid, as it will receive a confirmation e-mail.
* __firstName__
* __lastName__
* __password__: Must be between 8 and 1024 characters, and contain at least one number or special character. This field will likely be removed in the future, in favour of setting a password after e-mail confirmation.
* __address1__, __address2__, __city__, __state__, __postalCode__, __country__: *Optional.* Further user information.

### POST /login

Attempts to authenticate as a given user. Expects the following:

* __username__
* __password__

Possible route-specific responses:

* __200__: Authentication successful. Response contains a User object.
* __401__: Invalid login details. Message is one of:
	* "No such account exists."
	* "Invalid password."

### POST /logout

Only accessible to those with `member` role or above.

Logs the user out. This route may expect a CSRF prevention token in the future.

Possible route-specific responses:

* __204__: Logout successful.

### POST /change-password

Only accessible to those with `member` role or above.

Attempts to change the user's password. Expects the following:

* __password__: The new password for the user.
* __oldPassword__: The old password for the user. This is *only* necessary if the user's `signupFlowCompleted` attribute is set to `true`, to accommodate the signup flow where an initial password will be set *after* the user confirms their e-mail address.

Possible route-specific responses:

* __204__: Password change successful.
* __401__: Invalid `oldPassword`. Message is one of:
	* "No previous password specified, but user is not a new user."
	* "Invalid previous password specified."

### POST /generate-token

Only accessible to those with `member` role or above.

Generates and returns a Firebase authentication token, that can be used to talk directly to Firebase. The token will be tied to the user (and their corresponding privileges), and replaces the direct username/password authentication in Firebase that Webhook used.

The response will be an object with a single property, `token`, which contains the generated token.

## Role management

All of these routes are currently restricted to those with an `admin` role.

### GET /roles

Returns a list of all the currently existing ACL roles. The response will be an array of strings, each representing a role name.

## User management

All of these routes are currently restricted to those with an `admin` role.

### GET /users

Returns a list of all User objects.

### POST /users

Creates a new user. Any User property may be specified, except for `hash` - instead, specify a `password`. Database constraints apply, and a `password` is required for now.

Possible route-specific responses:

* __422__: Custom validation failed. Message is one of:
	* "Setting the hash directly is not allowed."
	* "A password must be specified."

### GET /users/:userId

Returns the User object with the given `:userId`.

### PUT /users/:userId

Changes one or more fields in the User object with the given `:userId`. Note that this will be a __patch__, and does *not* replace the full User object. Only changed fields currently need to be specified.

### DELETE /users/:userId

Delets the User object with the given `:userId`.

Possible route-specific responses:

* __409__: Deletion failed because the object already doesn't exist anymore. The conditions under which this error can occur are currently unclear, as this was not documented in the previous version of this codebase, but it may be related to a race condition.