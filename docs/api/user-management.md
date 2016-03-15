# User management

All of these routes are currently restricted to those with an `admin` role.

## GET /admin/users

Returns a list of all User objects.

## POST /admin/users

Creates a new user. Any User property may be specified, except for `hash` - instead, specify a `password`. Database constraints apply, and a `password` is required for now.

Possible route-specific responses:

* __422__: Custom validation failed. Message is one of:
	* "Setting the hash directly is not allowed."
	* "A password must be specified."

## GET /admin/users/:userId

Returns the User object with the given `:userId`.

## PUT /admin/users/:userId

Changes one or more fields in the User object with the given `:userId`. Note that this will be a __patch__, and does *not* replace the full User object. Only changed fields currently need to be specified.

## DELETE /admin/users/:userId

Delets the User object with the given `:userId`.