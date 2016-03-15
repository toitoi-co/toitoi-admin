# Plan management

All of these routes are currently restricted to those with an `admin` role.

## GET /admin/plans

Returns a list of all Plan objects.

## POST /admin/plans

Creates a new plan. Any Plan property may be specified.

## GET /admin/plans/:planId

Returns the Plan object with the given `:planId`.

## PUT /admin/plans/:planId

Changes one or more fields in the Plan object with the given `:planId`. Note that this will be a __patch__, and does *not* replace the full Plan object. Only changed fields currently need to be specified.

## DELETE /admin/plans/:planId

Delets the Plan object with the given `:planId`.