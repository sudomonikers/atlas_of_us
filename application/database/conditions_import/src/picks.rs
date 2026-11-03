//the conditions in the seed, chosen by hand: common ones a person knows they have, each with the body functions and
//structures it affects, by code as the body seed has them. Diseases come from Mondo and features from HPO, and each is
//in only once, from whichever names it best
pub const PICKS: &[(&str, &[&str])] = &[
    // Breathing
    ("MONDO:0004979", &["b440", "b4500", "b455", "s4301"]),          // asthma
    ("MONDO:0005002", &["b440", "b455", "b4501", "s4301"]),          // chronic obstructive pulmonary disease
    ("MONDO:0011786", &["b4351", "b4502", "s310"]),                  // allergic rhinitis
    ("MONDO:0007147", &["b134", "b440", "b1300", "s330"]),           // obstructive sleep apnea syndrome
    ("MONDO:0009061", &["b440", "b4504", "b515", "s4301", "s550"]), // cystic fibrosis
    ("MONDO:0019338", &["b440", "b455", "s4301"]),                   // sarcoidosis
    ("MONDO:0004822", &["b440", "b4501", "b4504", "s4301"]),         // bronchiectasis
    ("HP:0011109", &["b4504", "b255", "s310"]),                      // Chronic sinusitis
    ("HP:0034315", &["b4501"]),                                      // Chronic cough
    ("HP:0025267", &["b134", "b440"]),                               // Snoring
    // Heart and blood vessels
    ("MONDO:0001134", &["b4200", "s410"]),                           // essential hypertension
    ("HP:0002615", &["b4201"]),                                      // Hypotension
    ("HP:0001278", &["b4202", "b2401"]),                             // Orthostatic hypotension
    ("MONDO:0005010", &["b4103", "b455", "s4101"]),                  // coronary artery disorder
    ("MONDO:0005252", &["b4102", "b455", "s4100"]),                  // heart failure
    ("MONDO:0004981", &["b4101", "s4100"]),                          // atrial fibrillation
    ("HP:0001649", &["b4100"]),                                      // Tachycardia
    ("HP:0001962", &["b460"]),                                       // Palpitations
    ("MONDO:0004910", &["b410", "s4100"]),                           // mitral valve prolapse
    ("MONDO:0005453", &["b410", "s4100"]),                           // congenital heart disease
    ("MONDO:0001315", &["b4202", "b4100", "b455", "b2401"]),         // orthostatic intolerance
    ("MONDO:0005098", &["b110", "b730", "b167", "b760", "s110"]),    // stroke disorder
    ("MONDO:0005386", &["b4150", "b2801", "b455", "s4101"]),         // peripheral arterial disease
    ("HP:0002619", &["b4152", "s4102"]),                             // Varicose veins
    ("HP:0030880", &["b4151", "b2700", "s4103"]),                    // Raynaud phenomenon
    ("MONDO:0005399", &["b4303", "b4152", "s4102"]),                 // venous thromboembolism
    ("MONDO:0008560", &["b4303"]),                                   // thrombophilia due to activated protein C resistance
    ("MONDO:0005439", &["b5403", "s4101"]),                          // familial hypercholesterolemia
    ("HP:0003124", &["b5403"]),                                      // Hypercholesterolemia
    ("MONDO:0019297", &["b4352", "s4200"]),                          // lymphedema
    // Hormones and metabolism
    ("MONDO:0005147", &["b5401", "b555", "s550"]),                   // type 1 diabetes mellitus
    ("MONDO:0005148", &["b5401", "b530", "s550"]),                   // type 2 diabetes mellitus
    ("MONDO:0006920", &["b5401"]),                                   // prediabetes syndrome
    ("HP:0001943", &["b5401"]),                                      // Hypoglycemia
    ("MONDO:0011122", &["b530", "b540", "b455"]),                    // obesity disorder
    ("MONDO:0005420", &["b555", "b5400", "b1300", "s5801"]),         // hypothyroidism
    ("MONDO:0004425", &["b555", "b5400", "b4100", "s5801"]),         // hyperthyroidism
    ("MONDO:0007699", &["b555", "b4350", "s5801"]),                  // Hashimoto thyroiditis
    ("MONDO:0005364", &["b555", "b4350", "s5801", "s230"]),          // Graves disease
    ("MONDO:0008487", &["b555", "b650", "b6600", "s6300"]),          // polycystic ovary syndrome
    ("MONDO:0100480", &["b555", "b545", "s5803"]),                   // autoimmune primary adrenal insufficiency
    ("MONDO:0018912", &["b555", "b530", "s5803"]),                   // Cushing syndrome
    ("MONDO:0005393", &["b5402", "b2801", "b710", "s770"]),          // gout
    ("MONDO:0005298", &["b720", "s7700"]),                           // osteoporosis
    ("MONDO:0100471", &["b5451", "s7700"]),                          // vitamin D deficiency
    ("MONDO:0006507", &["b5451", "s560"]),                           // hereditary hemochromatosis
    ("HP:0004322", &["s770"]),                                       // Short stature
    ("HP:0000098", &["s770"]),                                       // Tall stature
    ("HP:6000855", &["b5501", "b2700"]),                             // Cold intolerance
    ("HP:0002046", &["b5501", "b2700"]),                             // Heat intolerance
    // Blood and immunity
    ("MONDO:0001356", &["b4300", "b4301", "b4552"]),                 // iron deficiency anemia
    ("MONDO:0011382", &["b4301", "b280", "s4204"]),                  // sickle cell disease
    ("MONDO:0019402", &["b4300", "b4301", "s4204"]),                 // beta thalassemia
    ("MONDO:0010602", &["b4303"]),                                   // hemophilia A
    ("MONDO:0024574", &["b4303"]),                                   // von Willebrand disease
    ("HP:0000978", &["b4303", "b810"]),                              // Bruising susceptibility
    ("MONDO:0005775", &["b4301"]),                                   // G6PD deficiency
    ("MONDO:0005109", &["b4350", "s420"]),                           // HIV infectious disease
    ("MONDO:0700226", &["b4351", "b5153"]),                          // food allergy
    ("MONDO:0000775", &["b4351"]),                                   // drug allergy
    ("HP:0012537", &["b5153"]),                                      // Food intolerance
    ("MONDO:0100345", &["b5151", "b5153", "b535"]),                  // lactose intolerance
    ("MONDO:0005130", &["b5152", "b5153", "b4350", "s5400"]),        // celiac disease
    // Mind and development
    ("MONDO:0007743", &["b140", "b1304", "b147", "b1641"]),          // attention deficit-hyperactivity disorder
    ("MONDO:0005258", &["b122", "b156", "b167", "b1643"]),           // autism spectrum disorder
    ("MONDO:0005489", &["b167", "b1560", "b1561"]),                  // dyslexia
    ("MONDO:0001552", &["b172"]),                                    // dyscalculia
    ("HP:0010526", &["b176", "b7602"]),                              // Dysgraphia
    ("MONDO:0004922", &["b176", "b7602", "b147"]),                   // developmental coordination disorder
    ("HP:0002312", &["b7602", "b176"]),                              // Clumsiness
    ("MONDO:0001071", &["b117", "b164"]),                            // intellectual disability
    ("MONDO:0007661", &["b7652", "b1304"]),                          // Tourette syndrome
    ("HP:0025268", &["b3300", "b3301"]),                             // Stuttering
    ("MONDO:0000598", &["b167", "s110"]),                            // aphasia
    ("MONDO:0003227", &["b1561", "b156"]),                           // prosopagnosia
    ("HP:0020345", &["b1561", "b144"]),                              // Aphantasia
    ("HP:6000024", &["b156"]),                                       // Synesthesia
    ("HP:0025113", &["b1560", "b152"]),                              // Misophonia
    ("MONDO:0002009", &["b152", "b130", "b134", "b1265"]),           // major depressive disorder
    ("MONDO:0000694", &["b152", "b130", "b134"]),                    // seasonal affective disorder
    ("MONDO:0001942", &["b152", "b1263", "b1603", "b134"]),          // generalized anxiety disorder
    ("MONDO:0005383", &["b152", "b460", "b4100"]),                   // panic disorder
    ("MONDO:0001247", &["b152", "b122", "b1266"]),                   // social phobia
    ("MONDO:0012000", &["b152"]),                                    // specific phobia
    ("MONDO:0004985", &["b152", "b130", "b1600", "b134"]),           // bipolar disorder
    ("MONDO:0005090", &["b160", "b156", "b1602", "b122"]),           // schizophrenia
    ("MONDO:0008114", &["b1603", "b152", "b1304"]),                  // obsessive-compulsive disorder
    ("MONDO:0005146", &["b152", "b144", "b134", "b1521"]),           // post-traumatic stress disorder
    ("MONDO:0001156", &["b152", "b1521", "b1304", "b1800"]),         // borderline personality disorder
    ("MONDO:0005351", &["b1302", "b1801", "b530"]),                  // anorexia nervosa
    ("MONDO:0005452", &["b1302", "b1801", "b1304", "b5106"]),        // bulimia nervosa
    ("MONDO:0005582", &["b1302", "b1304", "b530"]),                  // binge eating disorder
    ("MONDO:0007079", &["b1303", "b1304", "s560"]),                  // alcohol dependence
    // Sleep
    ("MONDO:0013600", &["b1341", "b1342", "b1343"]),                 // insomnia
    ("MONDO:0021107", &["b1344", "b110", "b1300"]),                  // narcolepsy
    ("HP:0001262", &["b1300", "b110"]),                              // Excessive daytime somnolence
    ("HP:0025236", &["b1344"]),                                      // Sleep walking
    ("HP:0003763", &["b5101", "s3200", "s7103"]),                    // Bruxism
    ("MONDO:0005391", &["b1342", "b780", "b765"]),                   // restless legs syndrome
    // Brain and nerves
    ("MONDO:0005277", &["b2801", "b2100", "b5350", "b21020"]),       // migraine disorder
    ("HP:0012228", &["b2801"]),                                      // Tension-type headache
    ("MONDO:0043537", &["b2801", "b215"]),                           // cluster headache syndrome
    ("HP:0002315", &["b2801"]),                                      // Headache
    ("MONDO:0005027", &["b110", "b765", "s110"]),                    // epilepsy
    ("MONDO:0005301", &["b760", "b730", "b2100", "b4552", "s110", "s120"]), // multiple sclerosis
    ("MONDO:0005180", &["b7651", "b735", "b770", "b760", "s1103"]),  // Parkinson disease
    ("MONDO:0004975", &["b144", "b114", "b164", "s110"]),            // Alzheimer disease
    ("MONDO:0001627", &["b144", "b114", "b164", "b117"]),            // dementia
    ("MONDO:0006497", &["b735", "b760", "b770", "s110"]),            // cerebral palsy
    ("MONDO:0003233", &["b7651"]),                                   // essential tremor
    ("HP:0001337", &["b7651"]),                                      // Tremor
    ("MONDO:0008599", &["b2801", "s1106"]),                          // trigeminal neuralgia
    ("MONDO:0005665", &["b7300", "b2151", "s1106", "s7104"]),        // Bell's palsy
    ("MONDO:0007275", &["b2801", "b265", "b7300", "s7302"]),         // carpal tunnel syndrome
    ("MONDO:0005244", &["b265", "b2700", "b280", "b730"]),           // peripheral neuropathy
    ("HP:0003401", &["b840", "b265"]),                               // Paresthesia
    ("MONDO:0009688", &["b730", "b740", "b2151", "b4552"]),          // myasthenia gravis
    ("MONDO:0004976", &["b730", "b735", "b5105", "b320", "s1200"]),  // amyotrophic lateral sclerosis
    ("MONDO:0007739", &["b765", "b144", "b164", "b152", "s1103"]),   // Huntington disease
    ("MONDO:0008449", &["b730", "b620", "b525", "s120", "s7600"]),   // spina bifida
    ("MONDO:0001150", &["b117", "s110"]),                            // hydrocephalus
    ("HP:0002301", &["b7302", "b7352", "b760"]),                     // Hemiplegia
    ("HP:0010550", &["b7303", "b7353", "b770", "s120"]),             // Paraplegia
    ("HP:0002445", &["b7304", "b7354", "s120"]),                     // Tetraplegia
    ("MONDO:0005404", &["b130", "b4552", "b455", "b134"]),           // myalgic encephalomyelitis/chronic fatigue syndrome
    ("HP:0012378", &["b1300", "b4552"]),                             // Fatigue
    ("MONDO:0005546", &["b2802", "b134", "b1300"]),                  // fibromyalgia
    ("HP:0012532", &["b280"]),                                       // Chronic pain
    ("MONDO:0019369", &["b2801", "b840", "b710"]),                   // complex regional pain syndrome
    ("MONDO:0018486", &["b2102", "b1561"]),                          // visual snow syndrome
    ("MONDO:0008015", &["b2403", "b5350", "b235"]),                  // motion sickness
    // Bones, joints and muscles
    ("MONDO:0005178", &["b710", "b2801", "s7701"]),                  // osteoarthritis
    ("MONDO:0008383", &["b710", "b2802", "b4350", "s7701"]),         // rheumatoid arthritis
    ("MONDO:0005306", &["b710", "b2801", "s7600"]),                  // ankylosing spondylitis
    ("MONDO:0011849", &["b710", "b810", "s7701", "s810"]),           // psoriatic arthritis
    ("MONDO:0007915", &["b4350", "b2802", "b810", "b4552"]),         // systemic lupus erythematosus
    ("MONDO:0010030", &["b2153", "b5104", "b4350"]),                 // Sjogren syndrome
    ("MONDO:0019735", &["b2802", "b7800", "s7702"]),                 // polymyalgia rheumatica
    ("HP:0002829", &["b2802", "s7701"]),                             // Arthralgia
    ("MONDO:0005392", &["s7600", "b720"]),                           // scoliosis
    ("HP:0002808", &["s7600"]),                                      // Kyphosis
    ("HP:0001382", &["b7102", "b715"]),                              // Joint hypermobility
    ("MONDO:0001798", &["b7102", "b7152", "b2802"]),                 // hypermobility syndrome
    ("MONDO:0020066", &["b715", "b7102", "b810", "b820"]),           // Ehlers-Danlos syndrome
    ("MONDO:0007523", &["b7152", "b7102", "b2802"]),                 // Ehlers-Danlos syndrome, hypermobility type
    ("MONDO:0007947", &["b715", "b2100", "s4101", "s770"]),          // Marfan syndrome
    ("MONDO:0019019", &["s7700", "b720", "b230"]),                   // osteogenesis imperfecta
    ("MONDO:0007037", &["s7700", "s770"]),                           // achondroplasia
    ("MONDO:0010679", &["b730", "b740", "s7702"]),                   // Duchenne muscular dystrophy
    ("MONDO:0004833", &["b2801", "s7502"]),                          // plantar fasciitis
    ("HP:0001763", &["s7502", "b770"]),                              // Pes planus
    ("HP:0001822", &["s7502"]),                                      // Hallux valgus
    ("HP:0002857", &["s7501", "b770"]),                              // Genu valgum
    ("HP:0002970", &["s7501", "b770"]),                              // Genu varum
    ("MONDO:0024333", &["b2803", "s1201"]),                          // sciatica
    ("HP:0003419", &["b2801", "s7600"]),                             // Low back pain
    ("HP:0030833", &["b2801", "s7102"]),                             // Neck pain
    ("HP:0030839", &["b2801", "s7501"]),                             // Knee pain
    ("MONDO:0011385", &["b2801", "s7600"]),                          // intervertebral disk degenerative disorder
    ("MONDO:0006763", &["b7100", "b2801", "s7201"]),                 // frozen shoulder
    ("MONDO:0005473", &["b5102", "b2801", "s7103"]),                 // temporomandibular joint disorder
    ("HP:0003394", &["b7801", "b7650"]),                             // Muscle spasm
    ("HP:0010442", &["s7302", "s7502"]),                             // Polydactyly
    // Digestion
    ("MONDO:0007186", &["b535", "b5105", "s520"]),                   // gastroesophageal reflux disease
    ("MONDO:0005052", &["b525", "b5351", "b5352"]),                  // irritable bowel syndrome
    ("MONDO:0005011", &["b515", "b525", "b5152", "s540"]),           // Crohn disease
    ("MONDO:0005101", &["b525", "b515", "s5401"]),                   // ulcerative colitis
    ("MONDO:0004235", &["b5352", "b525", "s5401"]),                  // diverticulitis
    ("HP:0002019", &["b5252", "b5251"]),                             // Constipation
    ("HP:0002015", &["b5105", "s520"]),                              // Dysphagia
    ("MONDO:0012672", &["b5352", "s570"]),                           // cholelithiasis
    ("MONDO:0004872", &["b5250", "s5401"]),                          // hemorrhoid
    ("MONDO:0004247", &["b515", "b535", "s530"]),                    // peptic ulcer disease
    ("MONDO:0013209", &["b540", "s560"]),                            // metabolic dysfunction-associated steatotic liver disease
    ("MONDO:0005344", &["b4350", "s560"]),                           // hepatitis B virus infection
    ("MONDO:0005231", &["b4350", "s560"]),                           // hepatitis C virus infection
    ("MONDO:0005361", &["b5105", "b4351", "s520"]),                  // eosinophilic esophagitis
    ("MONDO:0005003", &["b5151", "b2801", "s550"]),                  // chronic pancreatitis
    ("MONDO:0005076", &["s3201", "s3200"]),                          // periodontitis
    // Skin and hair
    ("MONDO:0004980", &["b810", "b840", "s810"]),                    // atopic eczema
    ("MONDO:0005083", &["b810", "b820", "s810"]),                    // psoriasis
    ("MONDO:0011438", &["b830", "s8201", "s8100"]),                  // acne
    ("MONDO:0006604", &["b830", "s8100"]),                           // rosacea
    ("MONDO:0008661", &["b830", "s810"]),                            // vitiligo
    ("MONDO:0043209", &["b830", "b850", "b2102", "s2202"]),          // albinism
    ("MONDO:0005340", &["b850", "s840"]),                            // alopecia areata
    ("MONDO:0005339", &["b850", "s8400"]),                           // androgenetic alopecia
    ("HP:0002216", &["b850", "s840"]),                               // Premature graying of hair
    ("HP:0001007", &["b850", "s8404", "s8401"]),                     // Hirsutism
    ("MONDO:0006559", &["b810", "b840", "s8200"]),                   // hidradenitis suppurativa
    ("MONDO:0850230", &["b4351", "b840", "s810"]),                   // chronic urticaria
    ("MONDO:0005480", &["b810", "b4351", "s810"]),                   // contact dermatitis
    ("MONDO:0006608", &["b830", "s8201", "s8100"]),                  // seborrheic dermatitis
    ("MONDO:0005348", &["b820", "s810"]),                            // keloid
    ("HP:0000958", &["b810", "s810"]),                               // Dry skin
    ("HP:0000975", &["b830", "s8200"]),                              // Hyperhidrosis
    // Eyes
    ("MONDO:0001384", &["b2100", "s2201", "s220"]),                  // myopia
    ("MONDO:0004891", &["b2100", "s220"]),                           // hyperopia
    ("MONDO:0011284", &["b2100", "s2201"]),                          // astigmatism
    ("MONDO:0001330", &["b2100", "b2150", "s2204"]),                 // presbyopia
    ("MONDO:0001703", &["b21021", "s2203"]),                         // color vision disorder
    ("HP:0000662", &["b21020", "s2203"]),                            // Nyctalopia
    ("HP:0000613", &["b21020", "b220"]),                             // Photophobia
    ("HP:0000505", &["b210", "s220"]),                               // Visual impairment
    ("HP:0000618", &["b210", "s220"]),                               // Blindness
    ("MONDO:0005041", &["b2101", "s2203"]),                          // glaucoma
    ("MONDO:0005129", &["b2100", "b2102", "s2204"]),                 // cataract
    ("MONDO:0005150", &["b2100", "s2203"]),                          // age-related macular degeneration
    ("MONDO:0015486", &["b2100", "s2201"]),                          // keratoconus
    ("MONDO:0001020", &["b2100", "b1561"]),                          // amblyopia
    ("MONDO:0003432", &["b2152", "s2303"]),                          // strabismus
    ("HP:0000639", &["b2152", "b2100"]),                             // Nystagmus
    ("MONDO:0006733", &["b2153", "b220", "s2300"]),                  // dry eye syndrome
    ("MONDO:0019200", &["b2101", "b21020", "s2203"]),                // retinitis pigmentosa
    ("MONDO:0005266", &["b2100", "s2203"]),                          // diabetic retinopathy
    ("HP:0000508", &["b2151", "s2301"]),                             // Ptosis
    ("HP:0001100", &["s2202"]),                                      // Heterochromia iridis
    // Ears, nose and mouth
    ("HP:0000365", &["b230", "s260"]),                               // Hearing impairment
    ("HP:0009900", &["b230", "b2302", "s260"]),                      // Unilateral deafness
    ("MONDO:0020678", &["b2300", "b2304", "s2600"]),                 // sensorineural hearing loss disorder
    ("HP:0000360", &["b2400"]),                                      // Tinnitus
    ("HP:0010780", &["b240", "b1560"]),                              // Hyperacusis
    ("MONDO:0007972", &["b2351", "b2401", "b2400", "b230", "s260"]), // Meniere disease
    ("MONDO:0005349", &["b230", "s2502"]),                           // otosclerosis
    ("HP:0002321", &["b2401", "b235"]),                              // Vertigo
    ("HP:0000458", &["b255", "b250"]),                               // Anosmia
    ("HP:0410030", &["s3204", "b320"]),                              // Cleft lip
    // Kidneys, bladder and reproduction
    ("MONDO:0005300", &["b6100", "b545", "s6100"]),                  // chronic kidney disease
    ("MONDO:0008171", &["b2801", "b610", "s6100"]),                  // nephrolithiasis
    ("MONDO:0020642", &["b610", "s6100"]),                           // polycystic kidney disease
    ("MONDO:0006624", &["b6201", "b6202", "s6102"]),                 // overactive bladder
    ("HP:0000020", &["b6202", "s620"]),                              // Urinary incontinence
    ("HP:0000012", &["b630", "b6201"]),                              // Urinary urgency
    ("MONDO:0018301", &["b630", "b6201", "s6102"]),                  // interstitial cystitis
    ("MONDO:0010811", &["b6200", "b6201", "s6306"]),                 // benign prostatic hyperplasia
    ("MONDO:0005133", &["b6701", "b6600", "s6301"]),                 // endometriosis
    ("MONDO:0010888", &["b6502", "b6701", "s6301"]),                 // adenomyosis
    ("MONDO:0007886", &["b6502", "s6301"]),                          // uterine corpus leiomyoma
    ("HP:0100607", &["b6701"]),                                      // Dysmenorrhea
    ("HP:0000132", &["b6502"]),                                      // Menorrhagia
    ("MONDO:1010182", &["b152", "b6701"]),                           // premenstrual dysphoric disorder
    ("MONDO:0005047", &["b6600", "s630"]),                           // infertility disorder
    ("MONDO:0005362", &["b6400", "s6305"]),                          // erectile dysfunction
    // Genetic
    ("MONDO:0008608", &["b117", "b735", "s4100"]),                   // Down syndrome
    ("MONDO:0019499", &["b6600", "b555", "s6300"]),                  // Turner syndrome
    ("MONDO:0006823", &["b6600", "b555", "s6304"]),                  // Klinefelter syndrome
    ("MONDO:0010383", &["b117", "b140", "b122"]),                    // fragile X syndrome
    ("MONDO:0009861", &["b5402", "b117"]),                           // phenylketonuria
    ("MONDO:0018975", &["s810", "s1106", "b830"]),                   // neurofibromatosis type 1
    // Cancer
    ("MONDO:0007254", &["s6302"]),                                   // breast cancer
    ("MONDO:0008315", &["s6306", "b620"]),                           // prostate cancer
    ("MONDO:0005575", &["s5401", "b525"]),                           // colorectal cancer
    ("MONDO:0008903", &["s4301", "b440"]),                           // lung cancer
    ("MONDO:0005105", &["s810"]),                                    // melanoma
    ("MONDO:0005059", &["b430", "b4350", "s4204"]),                  // leukemia
    ("MONDO:0004952", &["b4353", "s4201"]),                          // Hodgkins lymphoma
    ("MONDO:0002108", &["b555", "s5801"]),                           // thyroid cancer
    ("MONDO:0005447", &["s6304", "b6600"]),                          // testicular cancer
    // Infections
    ("MONDO:0018076", &["b440", "b4501", "s4301"]),                  // tuberculosis
    ("MONDO:0019632", &["b2802", "b4552", "b710"]),                  // Lyme disease
    ("MONDO:0100233", &["b4552", "b455", "b144", "b440"]),           // long COVID-19
    ("MONDO:0005609", &["b2801", "b840", "s810"]),                   // herpes zoster
];
