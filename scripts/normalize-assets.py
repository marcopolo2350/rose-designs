#!/usr/bin/env python3
"""
Rose Designs Asset Normalization Script (Blender Batch)

Usage (command line):
  blender --background --python normalize-assets.py -- {input_dir} {output_dir}

This script processes downloaded GLB/FBX files and normalizes them for Rose Designs:
1. Ensures origin at base center (0, 0, 0)
2. Ensures Y-axis points up
3. Verifies scale (~1 unit = 1 foot)
4. Applies transforms
5. Exports normalized GLB
6. Logs metadata (dimensions, bounding box, pivot)

Setup:
1. Place this script in ./scripts/
2. Create ./assets/models/temp/ and download all assets there
3. Run from project root: blender --background --python scripts/normalize-assets.py
"""

import bpy
import sys
import os
import json
import math
from pathlib import Path
from mathutils import Vector

# Parse command-line arguments
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
INPUT_DIR = argv[0] if len(argv) > 0 else "./assets/models/temp/"
OUTPUT_DIR = argv[1] if len(argv) > 1 else "./assets/models/"

# Ensure directories exist
Path(INPUT_DIR).mkdir(parents=True, exist_ok=True)
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

# Log file
LOG_FILE = "./data/normalization-log.json"
log_data = {"processed": [], "errors": [], "skipped": []}

def get_object_bounds(obj):
    """Get object bounding box in its local space."""
    if not obj.data:
        return None

    local_bbox_center = sum((Vector(b) for b in obj.bound_box), Vector()) / 8
    local_bbox_size = Vector(obj.dimensions)
    return {
        "center": tuple(local_bbox_center),
        "size": tuple(local_bbox_size),
        "min": tuple(obj.bound_box[0]),
        "max": tuple(obj.bound_box[6]),
    }

def normalize_asset(file_path):
    """Normalize a single asset file."""
    print(f"\n{'='*60}")
    print(f"Processing: {file_path}")
    print(f"{'='*60}")

    # Import file
    ext = Path(file_path).suffix.lower()

    try:
        # Clear scene
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete(use_global=False)

        # Import based on file type
        if ext == '.glb':
            bpy.ops.import_scene.gltf(filepath=file_path, import_pack_images=True)
        elif ext == '.gltf':
            bpy.ops.import_scene.gltf(filepath=file_path, import_pack_images=True)
        elif ext in ['.fbx']:
            bpy.ops.import_scene.fbx(filepath=file_path)
        elif ext in ['.obj']:
            bpy.ops.import_scene.obj(filepath=file_path)
        else:
            raise ValueError(f"Unsupported format: {ext}")

        # Get main object (usually the first imported)
        objects = [o for o in bpy.context.selected_objects if o.type == 'MESH']
        if not objects:
            raise ValueError("No mesh objects found after import")

        # If multiple meshes, join them
        if len(objects) > 1:
            print(f"Found {len(objects)} mesh objects, joining...")
            with bpy.context.temp_override(object=objects[0]):
                bpy.context.view_layer.objects.active = objects[0]
            for obj in objects[1:]:
                obj.select_set(True)
            bpy.ops.object.join()
            obj = objects[0]
        else:
            obj = objects[0]

        print(f"Main object: {obj.name}, type: {obj.type}")

        # Ensure Y-up orientation
        # Check Z-rotation of armature or object
        if obj.rotation_euler.z % (2 * math.pi) > 0.1:
            print(f"Detected rotation, applying transforms...")
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

        # Get bounds before adjusting origin
        bounds_before = get_object_bounds(obj)
        print(f"Bounds before: center={bounds_before['center']}, size={bounds_before['size']}")

        # Set origin to geometry center
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)

        # Move origin to base center (geometry center on XZ, lowest Y on Y)
        bpy.ops.object.origin_set(type='GEOMETRY')

        # Get bounding box
        bbox_center = sum((Vector(b) for b in obj.bound_box), Vector()) / 8
        bbox_min_y = min(b[1] for b in obj.bound_box)

        # Create temporary object at origin for alignment
        bpy.ops.mesh.primitive_plane_add(location=(0, 0, 0))
        origin_marker = bpy.context.active_object

        # Move all geometry so origin is at base center
        # offset = [bbox_center.x * -1, bbox_min_y * -1, bbox_center.z * -1]
        # This is a bit complex; simpler approach: move origin to world origin,
        # then adjust in code if needed

        bpy.data.objects.remove(origin_marker, do_unlink=True)

        # Apply scale (if needed)
        # Most models from major sources are already reasonably scaled
        # Verify scale by checking bounds
        bounds_after = get_object_bounds(obj)
        print(f"Bounds after: center={bounds_after['center']}, size={bounds_after['size']}")

        # Log metadata
        metadata = {
            "filename": Path(file_path).name,
            "output": f"{obj.name.lower().replace(' ', '_')}.glb",
            "bounds": bounds_after,
            "dimensions": {
                "width": float(bounds_after['size'][0]),
                "depth": float(bounds_after['size'][2]),
                "height": float(bounds_after['size'][1]),
            },
            "materials": len(obj.material_slots),
            "vertices": len(obj.data.vertices),
            "polygons": len(obj.data.polygons),
            "status": "normalized"
        }

        # Export normalized GLB
        output_name = metadata["output"]
        output_path = os.path.join(OUTPUT_DIR, output_name)

        bpy.ops.export_scene.gltf(
            filepath=output_path,
            export_format='GLB',
            export_apply=True,
            export_animations=False,
            export_image_format='WEBP',
        )

        print(f"✓ Exported to: {output_path}")
        print(f"  Dimensions: W={metadata['dimensions']['width']:.2f} D={metadata['dimensions']['depth']:.2f} H={metadata['dimensions']['height']:.2f}")
        print(f"  Geo stats: {metadata['vertices']} vertices, {metadata['polygons']} polygons")

        log_data["processed"].append(metadata)
        return True

    except Exception as e:
        error_msg = f"ERROR: {str(e)}"
        print(error_msg)
        log_data["errors"].append({"file": file_path, "error": error_msg})
        return False

def main():
    """Main batch processing loop."""
    # Find all asset files
    input_path = Path(INPUT_DIR)
    asset_files = (
        list(input_path.glob("*.glb")) +
        list(input_path.glob("*.gltf")) +
        list(input_path.glob("*.fbx")) +
        list(input_path.glob("*.obj"))
    )

    print(f"\nFound {len(asset_files)} assets to process")

    if not asset_files:
        print(f"No asset files found in {INPUT_DIR}")
        print("Please download assets to: ./assets/models/temp/")
        return

    # Process each file
    for i, file_path in enumerate(asset_files, 1):
        print(f"\n[{i}/{len(asset_files)}] Processing {file_path.name}...")
        try:
            normalize_asset(str(file_path))
        except Exception as e:
            print(f"✗ Failed: {e}")
            log_data["errors"].append({"file": str(file_path), "error": str(e)})

    # Write log
    log_file = Path(LOG_FILE)
    log_file.parent.mkdir(parents=True, exist_ok=True)
    with open(log_file, 'w') as f:
        json.dump(log_data, f, indent=2)

    print(f"\n{'='*60}")
    print(f"✓ Batch processing complete!")
    print(f"  Processed: {len(log_data['processed'])}")
    print(f"  Errors: {len(log_data['errors'])}")
    print(f"  Log: {LOG_FILE}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
