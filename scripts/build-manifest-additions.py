import json

# Load existing manifest
with open("data/asset-manifest.json", "r", encoding="utf-8") as f:
    manifest = json.load(f)

existing_ids = {item["id"] for item in manifest}

# ── VARIANT PRESETS ──────────────────────────────────────────────────────────
FABRIC = [
    {"id":"linen_sand","label":"Linen Sand","type":"material","family":"fabric","previewColor":"#D9C7B0","accentColor":"#F0E4D6","roughness":0.95,"metalness":0.01,"tintStrength":0.42},
    {"id":"boucle_cream","label":"Boucle Cream","type":"material","family":"fabric","previewColor":"#ECE5DA","accentColor":"#F9F4EB","roughness":0.97,"metalness":0.01,"tintStrength":0.44},
    {"id":"velvet_blush","label":"Velvet Blush","type":"colorway","family":"velvet","previewColor":"#C9A09D","accentColor":"#E6C9C5","roughness":0.74,"metalness":0.02,"tintStrength":0.50},
    {"id":"tailored_charcoal","label":"Tailored Charcoal","type":"colorway","family":"fabric","previewColor":"#67625E","accentColor":"#8A847F","roughness":0.88,"metalness":0.02,"tintStrength":0.54},
]
WOOD = [
    {"id":"light_oak","label":"Light Oak","type":"finish","family":"wood","previewColor":"#D4B28D","accentColor":"#EAD2B6","roughness":0.62,"metalness":0.05,"tintStrength":0.58},
    {"id":"medium_oak","label":"Medium Oak","type":"finish","family":"wood","previewColor":"#B88C63","accentColor":"#D9B28A","roughness":0.58,"metalness":0.05,"tintStrength":0.62},
    {"id":"dark_walnut","label":"Dark Walnut","type":"finish","family":"wood","previewColor":"#6D503C","accentColor":"#92735D","roughness":0.54,"metalness":0.06,"tintStrength":0.66},
    {"id":"matte_black","label":"Matte Black","type":"finish","family":"painted","previewColor":"#343232","accentColor":"#5A5655","roughness":0.48,"metalness":0.18,"tintStrength":0.75},
]
METAL = [
    {"id":"brass_warm","label":"Brass Warm","type":"finish","family":"metal","previewColor":"#C9A96E","accentColor":"#E4C98E","roughness":0.28,"metalness":0.82,"tintStrength":0.70},
    {"id":"matte_black","label":"Matte Black","type":"finish","family":"painted","previewColor":"#2E2C2C","accentColor":"#514F4F","roughness":0.55,"metalness":0.22,"tintStrength":0.75},
    {"id":"brushed_nickel","label":"Brushed Nickel","type":"finish","family":"metal","previewColor":"#AFAFAF","accentColor":"#D2D2D2","roughness":0.35,"metalness":0.88,"tintStrength":0.65},
]
CABINET = [
    {"id":"white_painted","label":"White Painted","type":"finish","family":"painted","previewColor":"#F0EBE3","accentColor":"#FAF6F0","roughness":0.58,"metalness":0.08,"tintStrength":0.55},
    {"id":"light_oak","label":"Light Oak","type":"finish","family":"wood","previewColor":"#D4B28D","accentColor":"#EAD2B6","roughness":0.62,"metalness":0.05,"tintStrength":0.58},
    {"id":"dark_walnut","label":"Dark Walnut","type":"finish","family":"wood","previewColor":"#6D503C","accentColor":"#92735D","roughness":0.54,"metalness":0.06,"tintStrength":0.66},
    {"id":"sage_matte","label":"Sage Matte","type":"finish","family":"painted","previewColor":"#8FA896","accentColor":"#B3C4B8","roughness":0.62,"metalness":0.06,"tintStrength":0.58},
]

def e(id_, name, cat, subcat, tags, cols, rooms, variants=None, default_v=None):
    entry = {
        "id": id_,
        "name": name,
        "category": cat,
        "subcategory": subcat,
        "modelPath": f"./assets/models/{id_}.glb",
        "thumbnailPath": f"./assets/thumbnails/{id_}.png",
        "defaultScale": 1,
        "tags": tags,
        "collections": cols,
        "recommendedRoomTypes": rooms,
    }
    if variants:
        entry["variants"] = variants
        entry["defaultVariantId"] = default_v or variants[0]["id"]
    return entry

new_entries = [
    # ── SEATING ──────────────────────────────────────────────────────────────
    e("ph_armchair_01","Armchair Classic","Seating","chair",["cozy","classic"],["Soft Romantic","Warm Modern"],["living_room","bedroom"],FABRIC,"linen_sand"),
    e("ph_armchair_modern","Armchair Modern","Seating","chair",["modern","accent"],["Warm Modern","Quiet Luxury"],["living_room","bedroom"],FABRIC,"boucle_cream"),
    e("ph_bar_chair","Bar Chair","Seating","stool",["kitchen","bar"],["Everyday Staples"],["kitchen","dining_room"],FABRIC,"linen_sand"),
    e("ph_chair_chinese","Chair Chinese","Seating","chair",["eclectic","accent"],["Quiet Luxury"],["living_room","bedroom"],WOOD,"dark_walnut"),
    e("ph_chair_gallinera","Chair Gallinera","Seating","chair",["accent","dining"],["Warm Modern"],["dining_room","living_room"],FABRIC,"linen_sand"),
    e("ph_chair_green","Chair Upholstered","Seating","chair",["accent","cozy"],["Soft Romantic"],["living_room","bedroom"],FABRIC,"velvet_blush"),
    e("ph_chair_midcentury","Chair Mid-Century","Seating","chair",["modern","accent"],["Warm Modern"],["living_room","office"],FABRIC,"tailored_charcoal"),
    e("ph_chair_painted","Chair Painted Wood","Seating","chair",["dining","classic"],["Everyday Staples"],["dining_room","kitchen"],WOOD,"light_oak"),
    e("ph_ottoman_01","Ottoman","Seating","ottoman",["cozy","accent"],["Soft Romantic","Everyday Staples"],["living_room","bedroom"],FABRIC,"boucle_cream"),
    e("ph_stool_metal","Stool Metal","Seating","stool",["kitchen","industrial"],["Everyday Staples"],["kitchen","dining_room"],METAL,"matte_black"),
    e("ph_sofa_01","Sofa Classic","Seating","sofa",["cozy","classic"],["Soft Romantic"],["living_room"],FABRIC,"linen_sand"),
    e("ph_sofa_02","Sofa Modern","Seating","sofa",["modern","accent"],["Warm Modern"],["living_room"],FABRIC,"boucle_cream"),
    e("ph_sofa_03","Sofa Grand","Seating","sofa",["cozy","large"],["Soft Romantic"],["living_room"],FABRIC,"velvet_blush"),
    e("ph_sofa_painted","Sofa Painted Frame","Seating","sofa",["classic","eclectic"],["Quiet Luxury"],["living_room"],FABRIC,"velvet_blush"),

    # ── TABLES ───────────────────────────────────────────────────────────────
    e("ph_coffee_gothic","Coffee Table Gothic","Tables","table",["eclectic","accent"],["Quiet Luxury"],["living_room"],WOOD,"dark_walnut"),
    e("ph_coffee_industrial","Coffee Table Industrial","Tables","table",["modern","industrial"],["Warm Modern"],["living_room"],WOOD,"medium_oak"),
    e("ph_coffee_modern","Coffee Table Minimal","Tables","table",["modern","minimal"],["Warm Modern"],["living_room"],WOOD,"light_oak"),
    e("ph_coffee_modern_2","Coffee Table Square","Tables","table",["modern","minimal"],["Warm Modern"],["living_room"],WOOD,"light_oak"),
    e("ph_coffee_round","Coffee Table Round","Tables","table",["cozy","round"],["Soft Romantic","Warm Modern"],["living_room"],WOOD,"medium_oak"),
    e("ph_coffee_table_01","Coffee Table Natural","Tables","table",["natural","accent"],["Warm Modern"],["living_room"],WOOD,"light_oak"),
    e("ph_side_table","Side Table","Tables","table",["accent","versatile"],["Everyday Staples"],["living_room","bedroom"],WOOD,"light_oak"),
    e("ph_side_table_tall","Side Table Tall","Tables","table",["accent","narrow"],["Everyday Staples"],["living_room","bedroom"],WOOD,"medium_oak"),
    e("ph_table_gallinera","Table Gallinera","Tables","table",["dining","accent"],["Warm Modern"],["dining_room"],WOOD,"medium_oak"),
    e("ph_table_painted","Table Painted","Tables","table",["dining","classic"],["Everyday Staples"],["dining_room","kitchen"],WOOD,"light_oak"),
    e("ph_table_round","Table Round","Tables","table",["dining","cozy"],["Soft Romantic"],["dining_room"],WOOD,"light_oak"),
    e("ph_table_wooden","Table Wood Plank","Tables","table",["dining","rustic"],["Warm Modern"],["dining_room"],WOOD,"medium_oak"),
    e("ph_table_wooden_2","Table Wood Trestle","Tables","table",["dining","rustic"],["Warm Modern"],["dining_room"],WOOD,"dark_walnut"),

    # ── STORAGE ──────────────────────────────────────────────────────────────
    e("ph_bookshelf","Bookshelf Open","Storage","shelf",["storage","books"],["Warm Modern","Everyday Staples"],["living_room","office","bedroom"],WOOD,"light_oak"),
    e("ph_cabinet_chinese","Cabinet Chinese","Storage","cabinet",["eclectic","accent"],["Quiet Luxury"],["living_room","bedroom"],WOOD,"dark_walnut"),
    e("ph_cabinet_drawer","Cabinet Drawers","Storage","cabinet",["storage","drawers"],["Everyday Staples"],["bedroom","living_room"],CABINET,"white_painted"),
    e("ph_cabinet_modern","Cabinet Modern","Storage","cabinet",["storage","modern"],["Warm Modern"],["living_room","bedroom"],CABINET,"white_painted"),
    e("ph_cabinet_painted","Cabinet Painted","Storage","cabinet",["storage","classic"],["Everyday Staples"],["living_room","bedroom","kitchen"],CABINET,"white_painted"),
    e("ph_cabinet_vintage","Cabinet Vintage","Storage","cabinet",["vintage","accent"],["Quiet Luxury"],["living_room","bedroom"],WOOD,"dark_walnut"),
    e("ph_console_01","Console Table","Storage","console",["entryway","accent"],["Warm Modern"],["living_room","entryway"],WOOD,"light_oak"),
    e("ph_console_chinese","Console Chinese","Storage","console",["eclectic","entryway"],["Quiet Luxury"],["living_room","entryway"],WOOD,"dark_walnut"),
    e("ph_shelf_01","Shelf Wall","Storage","shelf",["wall","storage"],["Everyday Staples"],["living_room","bedroom","kitchen"],WOOD,"light_oak"),
    e("ph_nightstand","Nightstand Classic","Storage","nightstand",["bedroom","classic"],["Soft Romantic"],["bedroom"],WOOD,"light_oak"),
    e("ph_nightstand_classic","Nightstand Drawer","Storage","nightstand",["bedroom","storage"],["Soft Romantic","Everyday Staples"],["bedroom"],WOOD,"medium_oak"),

    # ── LIGHTING ─────────────────────────────────────────────────────────────
    e("ph_chandelier_01","Chandelier Modern","Lighting","ceiling",["statement","ceiling"],["Quiet Luxury","Warm Modern"],["living_room","dining_room"],METAL,"brass_warm"),
    e("ph_chandelier_02","Chandelier Elegant","Lighting","ceiling",["statement","ceiling"],["Quiet Luxury"],["dining_room","living_room"],METAL,"brass_warm"),
    e("ph_chandelier_03","Chandelier Globe","Lighting","ceiling",["statement","ceiling"],["Warm Modern"],["dining_room","entryway"],METAL,"matte_black"),
    e("ph_chandelier_chinese","Chandelier Chinese","Lighting","ceiling",["eclectic","accent"],["Quiet Luxury"],["dining_room","living_room"],METAL,"brass_warm"),
    e("ph_chandelier_lantern","Lantern Pendant","Lighting","pendant",["lantern","warm"],["Soft Romantic","Warm Modern"],["dining_room","entryway","bedroom"],METAL,"brass_warm"),
    e("ph_lamp_ceiling","Ceiling Lamp Flush","Lighting","ceiling",["ceiling","minimal"],["Everyday Staples"],["bedroom","kitchen","bathroom"],METAL,"brushed_nickel"),
    e("ph_lamp_desk","Desk Lamp","Lighting","desk",["desk","task"],["Everyday Staples"],["office","bedroom"],METAL,"matte_black"),
    e("ph_lamp_industrial","Floor Lamp Industrial","Lighting","floor",["industrial","accent"],["Warm Modern"],["living_room","office"],METAL,"matte_black"),
    e("ph_lamp_pipe","Pipe Sconce","Lighting","wall",["wall","industrial"],["Warm Modern"],["living_room","bedroom","bathroom"],METAL,"matte_black"),

    # ── BEDS ─────────────────────────────────────────────────────────────────
    e("ph_bed_gothic","Bed Canopy","Beds","bed",["statement","romantic"],["Soft Romantic","Quiet Luxury"],["bedroom"],FABRIC,"velvet_blush"),

    # ── DECOR ─────────────────────────────────────────────────────────────────
    e("ph_plant_potted_01","Plant Potted","Decor","plant",["plant","natural"],["Soft Romantic","Warm Modern"],["living_room","bedroom","bathroom"]),
    e("ph_plant_potted_02","Plant Leafy","Decor","plant",["plant","lush"],["Warm Modern"],["living_room","bedroom"]),
    e("ph_plant_potted_04","Plant Tropical","Decor","plant",["plant","tropical"],["Warm Modern"],["living_room","office"]),
    e("ph_planter_clay","Planter Clay","Decor","plant",["plant","ceramic"],["Soft Romantic","Warm Modern"],["living_room","bedroom","kitchen"]),
    e("ph_vase_brass_01","Vase Brass","Decor","decor",["vase","brass","accent"],["Quiet Luxury"],["living_room","bedroom","dining_room"]),
    e("ph_vase_ceramic_01","Vase Ceramic","Decor","decor",["vase","ceramic","accent"],["Soft Romantic"],["living_room","bedroom","dining_room"]),

    # ── WALL DECOR ────────────────────────────────────────────────────────────
    e("ph_mirror_ornate","Mirror Ornate","Wall Decor","mirror",["mirror","statement"],["Soft Romantic","Quiet Luxury"],["bedroom","living_room","bathroom"]),
]

# Only add entries not already in manifest
truly_new = [entry for entry in new_entries if entry["id"] not in existing_ids]

# Fix placeholder kitchen entries
FIXES = {
    "kitchen_cabinet_base": "./assets/models/ph_cabinet_painted.glb",
    "kitchen_cabinet_upper": "./assets/models/ph_shelf_01.glb",
    "kitchen_island":        "./assets/models/ph_table_wooden.glb",
}
fixed = 0
for item in manifest:
    if item["id"] in FIXES:
        item["modelPath"] = FIXES[item["id"]]
        fixed += 1

manifest.extend(truly_new)

with open("data/asset-manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

print(f"Added {len(truly_new)} new entries (skipped {len(new_entries)-len(truly_new)} already registered)")
print(f"Fixed {fixed} placeholder model paths")
print(f"Total manifest entries: {len(manifest)}")
cats = {}
for entry in truly_new:
    cats[entry["category"]] = cats.get(entry["category"], 0) + 1
print("New by category:")
for cat, count in sorted(cats.items()):
    print(f"  {cat}: +{count}")
