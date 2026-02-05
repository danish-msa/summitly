# Repliers Map Polygon Fix – Flutter Proxy (FastAPI)

Your Flutter app’s FastAPI proxy is getting:

```json
{
  "detail": "[{\"param\":\"map\",\"msg\":[\"map is an invalid geojson polygon/multipolygon. For more information visit https://en.wikipedia.org/wiki/GeoJSON\"]}]"
}
```

The issue is **how** the `map` parameter is being sent, not the polygon math itself. The Summitly website talks to the same Repliers API successfully; here’s what it does differently and how to align your proxy.

---

## Root cause: Repliers expects coordinates, not a full GeoJSON object

Your code sends `map` as a **full GeoJSON Polygon object**:

```python
body["map"] = to_geojson_polygon(req.polygon)
# Sends: { "type": "Polygon", "coordinates": [ [ [lng,lat], ... ] ] }
```

Repliers’ validation expects the **coordinates part** of a GeoJSON polygon (the array of rings), not the wrapper with `"type": "Polygon"`.  

In Summitly we send `map` as a **string** in the form:

```text
[[[lng,lat],[lng,lat],[lng,lat],...]]
```

So: one string that is the JSON representation of the **coordinates** array (one ring, closed), not the full `{ type, coordinates }` object.

---

## What to change in your FastAPI proxy

### 1. Send `map` as the coordinates array (string or raw array)

- **Option A (recommended, matches Summitly):**  
  Send `map` as a **string** in the request body:  
  `"[[[lng,lat],[lng,lat],...]]"` (closed ring, `[lng, lat]` order).

- **Option B:**  
  If Repliers accepts JSON body and you keep sending a JSON body, try sending `map` as the **raw coordinates array** (no `type`), e.g.  
  `[[[lng,lat],[lng,lat],...]]`  
  and **not**  
  `{"type":"Polygon","coordinates":[[[lng,lat],...]]}`.

So in both cases: **do not send** `{"type": "Polygon", "coordinates": [...]}`. Send only the coordinates structure (as string or as JSON array).

### 2. Implement a “coordinates only” formatter

Keep your existing `to_geojson_polygon` logic for building the ring and closing it, but expose **only the coordinates** for `map`:

```python
def to_map_param(points: List[LatLng]) -> str:
    """
    Repliers expects map as a string: [[[lng,lat],[lng,lat],...]]
    (coordinates array of a GeoJSON Polygon, not the full object).
    GeoJSON uses [longitude, latitude].
    """
    coords = [[p.lng, p.lat] for p in points]
    if coords[0] != coords[-1]:
        coords.append(coords[0])
    if len(coords) < 4:
        raise ValueError(f"Polygon must have at least 3 unique points, got {len(coords) - 1}")
    # Return string representation of the single ring (coordinates format)
    import json
    return json.dumps([coords])
```

Then in your cluster endpoint, set:

```python
body["map"] = to_map_param(req.polygon)
```

So the **value** of `map` in the body is the string `"[[[lng,lat],[lng,lat],...]]"` (one ring, closed). That matches what the working site sends (as a query param string).

### 3. Trim `REPLIERS_BASE_URL`

You have:

```python
REPLIERS_BASE_URL = os.getenv("REPLIERS_BASE_URL", " https://api.repliers.io ")
```

The spaces can cause a malformed URL. Use:

```python
REPLIERS_BASE_URL = os.getenv("REPLIERS_BASE_URL", "https://api.repliers.io").strip()
```

(And avoid putting spaces in the default.)

### 4. Don’t default the API key in code

You have:

```python
REPLIERS_API_KEY = os.getenv("REPLIERS_API_KEY", "24Y1YzalzgzzpxfElKhmnITSL5AkRO")
```

Remove the default and fail explicitly if missing:

```python
REPLIERS_API_KEY = os.getenv("REPLIERS_API_KEY", "").strip()
# Then in the endpoint you already raise if not set – good.
```

This avoids leaking keys and makes env-based config clear.

### 5. Pydantic v2: `min_items` → `min_length`

If you’re on Pydantic v2, use:

```python
polygon: List[LatLng] = Field(..., min_length=3)
```

and for MLS:

```python
mlsNumbers: List[str] = Field(..., min_length=1)
```

---

## Summary

| What you had | What Repliers expects (from working Summitly) |
|-------------|-----------------------------------------------|
| `body["map"] = {"type": "Polygon", "coordinates": [coords]}` | `body["map"] = "[[[lng,lat],[lng,lat],...]]"` (string) or raw array `[[[lng,lat],...]]` |
| Full GeoJSON object | Only the **coordinates** of the polygon (one ring, closed), as string or array |

After changing to the coordinates-only format (and trimming the base URL), the “map is an invalid geojson polygon/multipolygon” error should go away. If you later need to support MultiPolygon, use the same idea: send only the coordinates structure Repliers expects (e.g. array of rings or array of polygons), not a full GeoJSON wrapper, unless their docs say otherwise.
