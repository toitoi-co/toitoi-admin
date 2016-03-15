# Site management

All of these routes are currently restricted to those with an `admin` role.

## GET /admin/sites

Returns a list of all Site objects.

## POST /admin/sites

Creates a new site. Any Site property may be specified.

## GET /admin/sites/:siteId

Returns the Site object with the given `:siteId`.

## PUT /admin/sites/:siteId

Changes one or more fields in the Site object with the given `:siteId`. Note that this will be a __patch__, and does *not* replace the full Site object. Only changed fields currently need to be specified.

## DELETE /admin/sites/:siteId

Delets the Site object with the given `:siteId`.