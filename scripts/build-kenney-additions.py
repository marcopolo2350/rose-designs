"""Phase 1C — add selected Kenney furniture-kit props to the asset manifest.
Kenney models are already GLB; paths reference assets/kenney_furniture-kit/Models/GLTF format/."""
import json, os, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
manifest_path = root / "data" / "asset-manifest.json"
kenney_dir = "./assets/kenney_furniture-kit/Models/GLTF format"

# Curated set: decorative / prop items that fill catalog gaps.
# (id, kenney file, name, category, subcategory, mountType, scale, tags, rooms)
KENNEY = [
    ("kn_ceiling_fan",      "ceilingFan.glb",        "Ceiling Fan",       "Lighting",   "fan",      "ceiling", 1.4, ["utility"],   ["bedroom","living_room"]),
    ("kn_pillow",            "pillow.glb",            "Pillow",            "Decor",      "pillow",   "floor",   1.0, ["decor"],     ["bedroom","living_room"]),
    ("kn_pillow_blue",       "pillowBlue.glb",        "Pillow Blue",       "Decor",      "pillow",   "floor",   1.0, ["decor"],     ["bedroom","living_room"]),
    ("kn_pillow_long",       "pillowLong.glb",        "Pillow Long",       "Decor",      "pillow",   "floor",   1.0, ["decor"],     ["bedroom"]),
    ("kn_books",             "books.glb",             "Books Stack",       "Decor",      "books",    "floor",   1.0, ["decor"],     ["office","living_room"]),
    ("kn_potted_plant",      "pottedPlant.glb",       "Potted Plant",      "Plants",     "plant",    "floor",   1.0, ["plant"],     ["living_room","office","bedroom"]),
    ("kn_plant_small_1",     "plantSmall1.glb",       "Plant Small 1",     "Plants",     "plant",    "floor",   1.0, ["plant"],     ["living_room","office"]),
    ("kn_plant_small_2",     "plantSmall2.glb",       "Plant Small 2",     "Plants",     "plant",    "floor",   1.0, ["plant"],     ["living_room","office"]),
    ("kn_plant_small_3",     "plantSmall3.glb",       "Plant Small 3",     "Plants",     "plant",    "floor",   1.0, ["plant"],     ["living_room","office"]),
    ("kn_radio",             "radio.glb",             "Radio",             "Decor",      "radio",    "floor",   1.0, ["decor"],     ["living_room","kitchen"]),
    ("kn_speaker",           "speaker.glb",           "Speaker",           "Decor",      "speaker",  "floor",   1.0, ["audio"],     ["living_room","office"]),
    ("kn_speaker_small",     "speakerSmall.glb",      "Speaker Small",     "Decor",      "speaker",  "floor",   1.0, ["audio"],     ["living_room","office"]),
    ("kn_laptop",            "laptop.glb",            "Laptop",            "Decor",      "laptop",   "floor",   1.0, ["tech"],      ["office"]),
    ("kn_computer_screen",   "computerScreen.glb",    "Monitor",           "Decor",      "monitor",  "floor",   1.0, ["tech"],      ["office"]),
    ("kn_computer_keyboard", "computerKeyboard.glb",  "Keyboard",          "Decor",      "keyboard", "floor",   1.0, ["tech"],      ["office"]),
    ("kn_tv_modern",         "televisionModern.glb",  "Television Modern", "Decor",      "tv",       "floor",   1.0, ["tech"],      ["living_room","bedroom"]),
    ("kn_kitchen_microwave", "kitchenMicrowave.glb",  "Microwave",         "Kitchen",    "appliance","floor",   1.0, ["appliance"], ["kitchen"]),
    ("kn_kitchen_blender",   "kitchenBlender.glb",    "Blender",           "Kitchen",    "appliance","floor",   1.0, ["appliance"], ["kitchen"]),
    ("kn_kitchen_coffee",    "kitchenCoffeeMachine.glb","Coffee Machine",  "Kitchen",    "appliance","floor",   1.0, ["appliance"], ["kitchen"]),
    ("kn_toaster",           "toaster.glb",           "Toaster",           "Kitchen",    "appliance","floor",   1.0, ["appliance"], ["kitchen"]),
    ("kn_trashcan",          "trashcan.glb",          "Trashcan",          "Utility",    "trash",    "floor",   1.0, ["utility"],   ["kitchen","bathroom","office"]),
    ("kn_coat_rack",         "coatRackStanding.glb",  "Coat Rack",         "Storage",    "rack",     "floor",   1.0, ["storage"],   ["living_room","bedroom"]),
    ("kn_bear",              "bear.glb",              "Teddy Bear",        "Decor",      "toy",      "floor",   1.0, ["decor","kids"],["nursery","bedroom"]),
    ("kn_cardboard_box",     "cardboardBoxClosed.glb","Moving Box",        "Decor",      "box",      "floor",   1.0, ["prop"],      ["living_room","bedroom"]),
]

def e(id_, file_, name, cat, sub, mount, scale, tags, rooms):
    return {
        "id": id_,
        "name": name,
        "category": cat,
        "subcategory": sub,
        "modelPath": f"{kenney_dir}/{file_}",
        "thumbnailPath": f"./assets/thumbnails/{id_}.png",
        "defaultScale": scale,
        "mountType": mount,
        "tags": tags,
        "collections": ["Kenney Kit"],
        "recommendedRoomTypes": rooms,
        "variants": [],
        "source": "Kenney furniture-kit (CC0)"
    }

with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

existing_ids = {m.get("id") for m in manifest}
added = 0
for row in KENNEY:
    if row[0] in existing_ids: continue
    # verify source file exists
    src = root / kenney_dir.replace("./","") / row[1]
    if not src.exists():
        print(f"  SKIP (missing): {row[1]}")
        continue
    manifest.append(e(*row))
    added += 1

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"Added {added} Kenney entries. Manifest total: {len(manifest)}")
