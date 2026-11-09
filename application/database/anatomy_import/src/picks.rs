//choices made by hand: parts BodyParts3D has no model of, which body functions parts carry out, and which layer of the 3D
//body each mesh is drawn on

//FMA classes the graph has although BodyParts3D has no model of them, so the whole body is there to learn about, drawn or
//not. Each is placed under the nearest parts it's part of, or a kind of, in FMA
pub const EXTRAS: &[&str] = &[
    "FMA7195",   // Lung
    "FMA17558",  // Uterus
    "FMA7209",   // Ovary
    "FMA18245",  // Uterine tube
    "FMA19949",  // Vagina
    "FMA20462",  // Vulva
    "FMA9909",   // Clitoris
    "FMA9601",   // Breast
    "FMA9707",   // Penis
    "FMA18252",  // Scrotum
    "FMA9603",   // Thyroid gland
    "FMA13890",  // Parathyroid gland
    "FMA55097",  // Larynx
    "FMA55457",  // Vocal fold
    "FMA46688",  // Pharynx
    "FMA9609",   // Tonsil
    "FMA54378",  // Nasal cavity
    "FMA54549",  // Palate
    "FMA54448",  // Eye
    "FMA12513",  // Eyeball
    "FMA58301",  // Retina
    "FMA54437",  // Eyelid
    "FMA52780",  // Ear
    "FMA56513",  // Middle ear
    "FMA9595",   // Tympanic membrane
    "FMA60909",  // Internal ear
    "FMA60201",  // Cochlea
    "FMA60186",  // Semicircular canal
    "FMA61817",  // Cerebral hemisphere
    "FMA61830",  // Cerebral cortex
    "FMA61824",  // Frontal lobe
    "FMA61825",  // Temporal lobe
    "FMA61826",  // Parietal lobe
    "FMA9903",   // Peripheral nervous system
    "FMA7162",   // Lymphatic system
    "FMA9825",   // Immune system
    "FMA5034",   // Lymph node
    "FMA9608",   // Bone marrow
    "FMA7490",   // Joint
    "FMA35175",  // Knee joint
    "FMA35178",  // Hip joint
    "FMA25912",  // Glenohumeral joint
    "FMA35289",  // Elbow joint
    "FMA35195",  // Ankle joint
    "FMA54832",  // Temporomandibular joint
    "FMA19726",  // Pelvic diaphragm
    "FMA30319",  // Ligament
    "FMA7183",   // Upper limb
    "FMA24890",  // Arm
    "FMA24967",  // Thigh
    "FMA9712",   // Hand
    "FMA9664",   // Foot
    "FMA15703",  // Anal canal
    "FMA15711",  // Anus
    "FMA59152",  // Sweat gland
    "FMA54326",  // Nail
];

//wholes an extra belongs to that FMA doesn't link it to, so each sits in its system
pub const PLACES: &[(&str, &str)] = &[
    ("FMA7195", "FMA7158"),   // lung, respiratory system
    ("FMA55097", "FMA7158"),  // larynx, respiratory system
    ("FMA55457", "FMA55097"), // vocal fold, larynx
    ("FMA46688", "FMA7152"),  // pharynx, alimentary system
    ("FMA9603", "FMA9668"),   // thyroid gland, endocrine system
    ("FMA13890", "FMA9668"),  // parathyroid gland, endocrine system
    ("FMA17558", "FMA7160"),  // uterus, genital system
    ("FMA7209", "FMA7160"),   // ovary, genital system
    ("FMA18245", "FMA7160"),  // uterine tube, genital system
    ("FMA19949", "FMA7160"),  // vagina, genital system
    ("FMA20462", "FMA7160"),  // vulva, genital system
    ("FMA9707", "FMA7160"),   // penis, genital system
    ("FMA18252", "FMA7160"),  // scrotum, genital system
    ("FMA9601", "FMA74657"),  // breast, integument
    ("FMA5034", "FMA7162"),   // lymph node, lymphatic system
    ("FMA59152", "FMA7163"),  // sweat gland, skin
    ("FMA15711", "FMA15703"), // anus, anal canal
    ("FMA60186", "FMA60909"), // semicircular canal, internal ear
];

//the classes whose kinds are major parts: organs, which in FMA include every bone, muscle, joint and named vessel, the
//parts of the central nervous system FMA doesn't count as organs, and parts conditions are linked to that aren't organs.
//Every part SERVES or MEASURES names is major too
pub const MAJOR: &[&str] = &[
    "FMA67498", // organ
    "FMA50801", // brain
    "FMA7647",  // spinal cord
    "FMA24138", // cervical vertebral column
    "FMA59762", // gingiva
];

//a part and the ICF body functions it carries out, by code as the functions seed has them
pub const SERVES: &[(&str, &[&str])] = &[
    ("FMA50801", &["b110", "b114", "b117", "b122", "b126", "b130", "b134", "b140", "b144", "b152", "b156", "b160", "b164", "b167", "b172", "b176", "b180"]), // brain
    ("FMA61824", &["b147", "b164", "b1304", "b7600"]),  // frontal lobe
    ("FMA61825", &["b144", "b1560", "b167"]),           // temporal lobe
    ("FMA61826", &["b1564", "b1565", "b172"]),          // parietal lobe
    ("FMA67325", &["b1561"]),                           // occipital lobe
    ("FMA67944", &["b7602", "b2351", "b770"]),          // cerebellum
    ("FMA79876", &["b110", "b4400", "b4100"]),          // brainstem
    ("FMA62008", &["b5500", "b1302", "b555"]),          // hypothalamus
    ("FMA5865", &["b250", "b255", "b2152", "b5105"]),   // cranial nerve
    ("FMA7647", &["b750", "b760", "b265", "b270"]),     // spinal cord
    ("FMA9903", &["b265", "b270", "b730"]),             // peripheral nervous system
    ("FMA12513", &["b210"]),                            // eyeball
    ("FMA58238", &["b2100"]),                           // cornea
    ("FMA58235", &["b2150"]),                           // iris
    ("FMA58301", &["b2101", "b2102"]),                  // retina
    ("FMA58241", &["b2100", "b2150"]),                  // lens
    ("FMA59101", &["b2153"]),                           // lacrimal gland
    ("FMA54437", &["b2151"]),                           // eyelid
    ("FMA52781", &["b2302"]),                           // external ear
    ("FMA9595", &["b2300"]),                            // tympanic membrane
    ("FMA60201", &["b2300", "b2301", "b2304"]),         // cochlea
    ("FMA60186", &["b2351", "b2352"]),                  // semicircular canal
    ("FMA46472", &["b255", "b4502"]),                   // nose
    ("FMA12516", &["b5101", "b5102"]),                  // tooth
    ("FMA54640", &["b250", "b320", "b5103", "b5105"]),  // tongue
    ("FMA59816", &["b320", "b5100"]),                   // lip
    ("FMA54549", &["b320", "b5105"]),                   // palate
    ("FMA46688", &["b5105"]),                           // pharynx
    ("FMA55097", &["b310", "b340"]),                    // larynx
    ("FMA7088", &["b410"]),                             // heart
    ("FMA50720", &["b4150", "b420"]),                   // artery
    ("FMA50723", &["b4152"]),                           // vein
    ("FMA5034", &["b4353"]),                            // lymph node
    ("FMA9607", &["b4350"]),                            // thymus
    ("FMA7196", &["b4350", "b430"]),                    // spleen
    ("FMA9608", &["b4300"]),                            // bone marrow
    ("FMA7394", &["b440", "b4501"]),                    // trachea
    ("FMA7195", &["b440", "b4504", "b455"]),            // lung
    ("FMA13295", &["b445"]),                            // diaphragm
    ("FMA9597", &["b5104"]),                            // salivary gland
    ("FMA7131", &["b5105"]),                            // esophagus
    ("FMA7148", &["b5150", "b5151"]),                   // stomach
    ("FMA7200", &["b5151", "b5152"]),                   // small intestine
    ("FMA7201", &["b5250", "b5251", "b5253"]),          // large intestine
    ("FMA7198", &["b5151", "b5401", "b555"]),           // pancreas
    ("FMA7197", &["b540", "b5151", "b545"]),            // liver
    ("FMA7202", &["b5151"]),                            // gallbladder
    ("FMA13889", &["b555", "b5550"]),                   // pituitary gland
    ("FMA9603", &["b555", "b5400"]),                    // thyroid gland
    ("FMA13890", &["b5451"]),                           // parathyroid gland
    ("FMA9604", &["b555", "b4202"]),                    // adrenal gland
    ("FMA7203", &["b6100", "b545", "b420"]),            // kidney
    ("FMA15900", &["b6101", "b620"]),                   // urinary bladder
    ("FMA19667", &["b6200"]),                           // urethra
    ("FMA7209", &["b6600", "b650", "b555"]),            // ovary
    ("FMA17558", &["b650", "b6601", "b6602"]),          // uterus
    ("FMA9601", &["b6603"]),                            // breast
    ("FMA20462", &["b640"]),                            // vulva
    ("FMA7210", &["b6600", "b555"]),                    // testis
    ("FMA9707", &["b640", "b6200"]),                    // penis
    ("FMA9600", &["b6600"]),                            // prostate
    ("FMA5018", &["b720"]),                             // bone organ
    ("FMA7490", &["b710", "b715"]),                     // joint
    ("FMA5022", &["b730", "b735", "b740"]),             // muscle organ
    ("FMA13478", &["b710", "b715"]),                    // vertebral column
    ("FMA35175", &["b710", "b715", "b770"]),            // knee joint
    ("FMA35178", &["b710", "b715", "b770"]),            // hip joint
    ("FMA9712", &["b7600"]),                            // hand
    ("FMA7163", &["b810", "b820", "b840"]),             // skin
    ("FMA59152", &["b830", "b5501"]),                   // sweat gland
    ("FMA54326", &["b860"]),                            // nail
    ("FMA53667", &["b850"]),                            // hair
];

//a measurement, by name as the norms seed has it, and the parts it's a reading of
pub const MEASURES: &[(&str, &[&str])] = &[
    ("Height", &["FMA20394"]),                  // the body
    ("Weight", &["FMA20394"]),
    ("Body Mass Index", &["FMA20394"]),
    ("Body Fat", &["FMA20394"]),
    ("Waist Circumference", &["FMA9577"]),      // abdomen
    ("Hip Circumference", &["FMA9578"]),        // pelvis
    ("Upper Arm Length", &["FMA24890"]),        // arm
    ("Upper Leg Length", &["FMA24967"]),        // thigh
    ("Resting Heart Rate", &["FMA7088"]),       // heart
    ("Systolic Blood Pressure", &["FMA50720"]), // artery
    ("Diastolic Blood Pressure", &["FMA50720"]),
    ("Grip Strength", &["FMA9712"]),            // hand
    ("VO2 Max", &["FMA7195", "FMA7088"]),       // lung, heart
    ("Hearing Threshold", &["FMA52780"]),       // ear
    ("Visual Acuity", &["FMA12513"]),           // eyeball
];

//the layers of the 3D body, in the order a mesh is checked against them: each mesh is drawn on the first layer whose
//classes include something its part is, or is part of, in FMA, and on organs when it's in none
pub const LAYERS: &[(&str, &[&str])] = &[
    ("skin", &["FMA7163"]),                                                        // skin
    ("nervous", &["FMA7157", "FMA55675", "FMA65132", "FMA5884", "FMA5865"]),       // nervous system, neuraxis, nerve, ganglion, cranial nerve
    ("vessels", &["FMA7088", "FMA50720", "FMA50723", "FMA3710", "FMA228642"]),     // heart, artery, vein, vascular tree, vasculature
    ("skeleton", &["FMA5018", "FMA55107", "FMA23881", "FMA7490", "FMA30319"]),     // bone organ, cartilage organ, skeletal system, joint, ligament
    ("muscles", &["FMA5022", "FMA32558", "FMA9721", "FMA321912"]),                 // muscle organ, musculature, tendon, fascia
];
pub const OTHER_LAYER: &str = "organs";

//words in a part's name that put its mesh on a layer, for the meshes FMA's links don't place
pub const LAYER_WORDS: &[(&str, &[&str])] = &[
    ("nervous", &["nerve", "gyrus", "sulcus", "colliculus", "thalam", "optic tract", "optic chiasm", "midbrain", "forebrain", "cerebral hemisphere", "geniculate", "fornix", "commissure", "peduncle", "stria terminalis", "lamina terminalis", "putamen", "ganglion"]),
    ("vessels", &["artery", "arteries", "arterial", "vein", "venous", "aorta", "vena"]),
    ("skeleton", &["ligament", "bone", "cartilage", "vertebra", "rib"]),
    ("muscles", &["muscle", "pronator", "supinator", "adductor", "abductor", "flexor", "extensor", "trapezius", "rectus", "oblique", "intertransversari", "pollicis", "hallucis", "lumbrical", "interosse", "tract", "fascia", "levator", "tendinous"]),
];

//a part and the topics to learn more about it in, by name as the topics graph has them. Topics come from the topics
//import, so a name the graph doesn't have yet links nothing until the topic exists. The parts below a part, and above it
//up to the whole body, show its topics too, so systems and organs carry them
pub const TOPICS: &[(&str, &[&str])] = &[
    ("FMA20394", &["Human Anatomy", "Human Physiology"]),                                       // human body
    ("FMA7161", &["Cardiovascular System", "Cardiology", "Vascular Surgery"]),                  // cardiovascular system
    ("FMA7158", &["Respiratory Medicine", "Respiratory Therapy"]),                              // respiratory system
    ("FMA7157", &["Neurology", "Neuroanatomy", "Neurophysiology"]),                             // nervous system
    ("FMA50801", &["Neuropsychology", "Neurological Surgery"]),                                 // brain
    ("FMA7482", &["Musculoskeletal Anatomy", "Orthopaedics", "Kinesiology", "Biomechanics", "Physiotherapy"]), // musculoskeletal system
    ("FMA7490", &["Orthopaedic Manual Physiotherapy"]),                                         // joint
    ("FMA5022", &["Exercise Physiology"]),                                                      // muscle organ
    ("FMA7152", &["Gastroenterology", "Nutrition"]),                                            // alimentary system
    ("FMA7197", &["Hepatology"]),                                                               // liver
    ("FMA49184", &["Mouth Anatomy", "Maxillofacial and Oral Surgery"]),                         // mouth
    ("FMA12516", &["Dental Anatomy", "Dental Sciences", "Orthodontics"]),                       // tooth
    ("FMA7159", &["Urology", "Renal Diseases"]),                                                // urinary system
    ("FMA7160", &["Reproductive Health"]),                                                      // genital system
    ("FMA17558", &["Obstetrics and Gynaecology"]),                                              // uterus
    ("FMA7209", &["Obstetrics and Gynaecology"]),                                               // ovary
    ("FMA9668", &["Endocrinology", "Endocrine Physiology"]),                                    // endocrine system
    ("FMA9825", &["Immunology", "Clinical Immunology"]),                                        // immune system
    ("FMA7162", &["Immunology"]),                                                               // lymphatic system
    ("FMA9608", &["General Haematology"]),                                                      // bone marrow
    ("FMA74657", &["Dermatology", "Skin Types"]),                                               // integumentary system
    ("FMA72979", &["Dermatology", "Skin Types"]),                                               // integumentary system
    ("FMA7163", &["Dermatology", "Skin Types"]),                                                // skin
    ("FMA54448", &["Ophthalmology", "Refraction of the Eye", "Orthoptics"]),                    // eye
    ("FMA52780", &["Audiology", "Physiology of Hearing", "Physiology of Balance"]),             // ear
    ("FMA9664", &["Foot Problems", "Podiatric Surgery"]),                                       // foot
];
