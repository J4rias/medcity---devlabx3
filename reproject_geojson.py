from pyproj import Transformer
import json
import os

# EPSG:9377 is MAGNA-SIRGAS / Origen-Nacional (Recent official Colombian projection)
# EPSG:4326 is WGS84 (Lat/Lng)
transformer = Transformer.from_crs("EPSG:9377", "EPSG:4326", always_xy=True)

input_path = r"c:\Users\j4rias\Documents\Claude\Projects\Colombia 5.0\medcity\backend\data\comunas.geojson"
output_path = r"c:\Users\j4rias\Documents\Claude\Projects\Colombia 5.0\medcity\backend\data\comunas_wgs84.geojson"

if not os.path.exists(input_path):
    print(f"Error: {input_path} not found")
    exit(1)

with open(input_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

def transform_coords(coords):
    if isinstance(coords[0], (int, float)):
        lon, lat = transformer.transform(coords[0], coords[1])
        return [lon, lat]
    else:
        return [transform_coords(c) for c in coords]

print("Proyectando coordenadas...")
for feature in data['features']:
    geom = feature['geometry']
    geom['coordinates'] = transform_coords(geom['coordinates'])

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(data, f)

print(f"Hecho! GeoJSON guardado en {output_path}")
# Quick check of first coordinate
first_coord = data['features'][0]['geometry']['coordinates'][0][0]
print(f"Primera coordenada proyectada: {first_coord}")
