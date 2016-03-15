# Preset management

All of these routes are currently restricted to those with an `admin` role.

## GET /admin/presets

Returns a list of all Preset objects.

## POST /admin/presets

Creates a new preset. Any Preset property may be specified.

## GET /admin/presets/:presetId

Returns the Preset object with the given `:presetId`.

## PUT /admin/presets/:presetId

Changes one or more fields in the Preset object with the given `:presetId`. Note that this will be a __patch__, and does *not* replace the full Preset object. Only changed fields currently need to be specified.

## DELETE /admin/presets/:presetId

Delets the Preset object with the given `:presetId`.