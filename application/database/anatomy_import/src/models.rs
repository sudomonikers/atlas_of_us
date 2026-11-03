//turns BodyParts3D's meshes into the 3D body the ui draws: each mesh is simplified so the whole body loads in a browser,
//turned from millimetres with z up into metres with y up and the body facing +z, and written into one binary glTF file
//per layer, a node per mesh named by its element id. Normals are left out; the ui works them out
use std::{
    collections::{BTreeMap, BTreeSet, HashMap},
    fs::{self, File},
    io::Read,
    path::Path,
};

use meshopt::{SimplifyOptions, VertexDataAdapter};
use serde_json::json;

use crate::BoxError;

pub const ZIP: &str = "isa_BP3D_4.0_obj_99.zip";
//how much of each mesh's triangles are kept, and the fewest any mesh keeps
const KEEP: f32 = 0.04;
const MIN_TRIANGLES: usize = 60;
//how far simplifying may move the surface, as a share of the mesh's size
const MAX_ERROR: f32 = 0.05;

struct Mesh {
    positions: Vec<[f32; 3]>,
    indices: Vec<u32>,
    concept: Option<String>, //the FMA id of what the mesh is of, from its header
}

//every element mesh in the zip, by element id such as FJ1252
fn read_all(dir: &Path) -> Result<BTreeMap<String, Mesh>, BoxError> {
    let path = dir.join(ZIP);
    let mut zip = zip::ZipArchive::new(File::open(&path).map_err(|e| format!("{}: {e}", path.display()))?)?;
    let mut meshes = BTreeMap::new();
    for i in 0..zip.len() {
        let mut file = zip.by_index(i)?;
        let Some(id) = file.name().rsplit('/').next().and_then(|n| n.strip_suffix(".obj")).map(str::to_string) else { continue };
        let mut text = String::new();
        file.read_to_string(&mut text)?;
        meshes.insert(id, parse(&text));
    }
    Ok(meshes)
}

//an OBJ's vertices and triangles, with polygons split into fans
fn parse(text: &str) -> Mesh {
    let mut mesh = Mesh { positions: Vec::new(), indices: Vec::new(), concept: None };
    for line in text.lines() {
        if let Some(id) = line.strip_prefix("# Concept ID : ") {
            mesh.concept = Some(id.trim().to_string());
        }
        let mut words = line.split_whitespace();
        match words.next() {
            Some("v") => {
                let v: Vec<f32> = words.take(3).filter_map(|w| w.parse().ok()).collect();
                if let [x, y, z] = v[..] {
                    mesh.positions.push([x / 1000.0, z / 1000.0, -y / 1000.0]);
                }
            }
            Some("f") => {
                let corners: Vec<u32> = words.filter_map(|w| w.split('/').next()?.parse::<u32>().ok()).map(|i| i - 1).collect();
                for k in 1..corners.len().saturating_sub(1) {
                    mesh.indices.extend([corners[0], corners[k], corners[k + 1]]);
                }
            }
            _ => {}
        }
    }
    mesh
}

//the mesh with fewer triangles, keeping only the vertices still used. Vertices at the same place are welded first, since
//seams stop the simplifier, and a mesh it can't bring near its target is simplified coarsely instead
fn simplify(mesh: &Mesh) -> Mesh {
    let mut welded: HashMap<[u32; 3], u32> = HashMap::new();
    let mut positions: Vec<[f32; 3]> = Vec::new();
    let weld: Vec<u32> = mesh.positions.iter().map(|p| *welded.entry(p.map(f32::to_bits)).or_insert_with(|| {
        positions.push(*p);
        positions.len() as u32 - 1
    })).collect();
    let indices: Vec<u32> = mesh.indices.iter().map(|&i| weld[i as usize]).collect();

    let bytes: Vec<u8> = positions.iter().flat_map(|p| p.iter().flat_map(|c| c.to_le_bytes())).collect();
    let simplified = match VertexDataAdapter::new(&bytes, 12, 0) {
        Ok(adapter) => {
            let triangles = indices.len() / 3;
            let target = ((triangles as f32 * KEEP) as usize).max(MIN_TRIANGLES).min(triangles);
            let fine = meshopt::simplify(&indices, &adapter, target * 3, MAX_ERROR, SimplifyOptions::None, None);
            if fine.len() > target * 3 * 2 {
                meshopt::simplify_sloppy(&indices, &adapter, target * 3, MAX_ERROR, None)
            } else {
                fine
            }
        }
        Err(_) => indices,
    };
    let mut remap: HashMap<u32, u32> = HashMap::new();
    let mut kept = Vec::new();
    let indices = simplified.iter().map(|&i| *remap.entry(i).or_insert_with(|| {
        kept.push(positions[i as usize]);
        kept.len() as u32 - 1
    })).collect();
    Mesh { positions: kept, indices, concept: mesh.concept.clone() }
}

//what each mesh is of, by element id, from the meshes' headers
pub struct Written {
    pub triangles: BTreeMap<String, usize>, //how many triangles each layer has
    pub concepts: BTreeMap<String, String>,
}

//what each mesh is of, by element id, read from the headers alone
pub fn concepts(dir: &Path) -> Result<BTreeMap<String, String>, BoxError> {
    let path = dir.join(ZIP);
    let mut zip = zip::ZipArchive::new(File::open(&path).map_err(|e| format!("{}: {e}", path.display()))?)?;
    let mut concepts = BTreeMap::new();
    for i in 0..zip.len() {
        let mut file = zip.by_index(i)?;
        let Some(id) = file.name().rsplit('/').next().and_then(|n| n.strip_suffix(".obj")).map(str::to_string) else { continue };
        let mut head = vec![0; 2048];
        let read = file.read(&mut head)?;
        let text = String::from_utf8_lossy(&head[..read]);
        if let Some(concept) = text.lines().find_map(|l| l.strip_prefix("# Concept ID : ")) {
            concepts.insert(id, concept.trim().to_string());
        }
    }
    Ok(concepts)
}

//writes one glTF file per layer of the meshes given for it
pub fn write(dir: &Path, out: &Path, layers: &BTreeMap<String, BTreeSet<String>>) -> Result<Written, BoxError> {
    let meshes = read_all(dir)?;
    let concepts = meshes.iter().filter_map(|(id, m)| Some((id.clone(), m.concept.clone()?))).collect();
    fs::create_dir_all(out)?;
    let mut triangles = BTreeMap::new();
    for (layer, elements) in layers {
        let mut buffer: Vec<u8> = Vec::new();
        let (mut views, mut accessors, mut gltf_meshes, mut nodes) = (Vec::new(), Vec::new(), Vec::new(), Vec::new());
        let mut count = 0;
        for id in elements {
            let Some(mesh) = meshes.get(id) else { return Err(format!("{ZIP} has no mesh {id}").into()) };
            let mesh = simplify(mesh);
            if mesh.indices.is_empty() {
                continue;
            }
            count += mesh.indices.len() / 3;
            //positions, with their bounds as glTF asks
            let (mut min, mut max) = ([f32::MAX; 3], [f32::MIN; 3]);
            let start = buffer.len();
            for p in &mesh.positions {
                for k in 0..3 {
                    min[k] = min[k].min(p[k]);
                    max[k] = max[k].max(p[k]);
                    buffer.extend(p[k].to_le_bytes());
                }
            }
            views.push(json!({"buffer": 0, "byteOffset": start, "byteLength": buffer.len() - start, "target": 34962}));
            accessors.push(json!({"bufferView": views.len() - 1, "componentType": 5126, "count": mesh.positions.len(), "type": "VEC3", "min": min, "max": max}));
            //indices, two bytes each when they fit
            let start = buffer.len();
            let short = mesh.positions.len() <= u16::MAX as usize;
            for &i in &mesh.indices {
                if short { buffer.extend((i as u16).to_le_bytes()) } else { buffer.extend(i.to_le_bytes()) }
            }
            views.push(json!({"buffer": 0, "byteOffset": start, "byteLength": buffer.len() - start, "target": 34963}));
            accessors.push(json!({"bufferView": views.len() - 1, "componentType": if short { 5123 } else { 5125 }, "count": mesh.indices.len(), "type": "SCALAR"}));
            while buffer.len() % 4 != 0 {
                buffer.push(0);
            }
            gltf_meshes.push(json!({"name": id, "primitives": [{"attributes": {"POSITION": accessors.len() - 2}, "indices": accessors.len() - 1}]}));
            nodes.push(json!({"name": id, "mesh": gltf_meshes.len() - 1}));
        }
        let gltf = json!({
            "asset": {"version": "2.0", "generator": "atlas anatomy-import", "copyright": "BodyParts3D, (c) The Database Center for Life Science, CC BY 4.0"},
            "scene": 0,
            "scenes": [{"nodes": (0..nodes.len()).collect::<Vec<_>>()}],
            "nodes": nodes, "meshes": gltf_meshes, "accessors": accessors, "bufferViews": views,
            "buffers": [{"byteLength": buffer.len()}],
        });
        fs::write(out.join(format!("{layer}.glb")), glb(&gltf, &buffer)?)?;
        triangles.insert(layer.clone(), count);
    }
    Ok(Written { triangles, concepts })
}

//a binary glTF: the header, the json chunk padded with spaces, and the binary chunk
fn glb(gltf: &serde_json::Value, buffer: &[u8]) -> Result<Vec<u8>, BoxError> {
    let mut text = serde_json::to_vec(gltf)?;
    while text.len() % 4 != 0 {
        text.push(b' ');
    }
    let total = 12 + 8 + text.len() + 8 + buffer.len();
    let mut out = Vec::with_capacity(total);
    out.extend(b"glTF");
    out.extend(2u32.to_le_bytes());
    out.extend((total as u32).to_le_bytes());
    out.extend((text.len() as u32).to_le_bytes());
    out.extend(b"JSON");
    out.extend(text);
    out.extend((buffer.len() as u32).to_le_bytes());
    out.extend(b"BIN\0");
    out.extend(buffer);
    Ok(out)
}
