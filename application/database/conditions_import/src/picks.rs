//the conditions in the seed, chosen by hand: common ones a person knows they have, each with the body functions it
//affects, by code as the functions seed has them, and the body parts it affects, by FMA id as the anatomy seed has them.
//Diseases come from Mondo and features from HPO, and each is in only once, from whichever names it best
pub const PICKS: &[(&str, &[&str], &[&str])] = &[
    // Breathing
    ("MONDO:0004979", &["b440", "b4500", "b455"], &["FMA7195"]),                 // asthma
    ("MONDO:0005002", &["b440", "b455", "b4501"], &["FMA7195"]),                 // chronic obstructive pulmonary disease
    ("MONDO:0011786", &["b4351", "b4502"], &["FMA46472"]),                       // allergic rhinitis
    ("MONDO:0007147", &["b134", "b440", "b1300"], &["FMA46688"]),                // obstructive sleep apnea syndrome
    ("MONDO:0009061", &["b440", "b4504", "b515"], &["FMA7195", "FMA7198"]),      // cystic fibrosis
    ("MONDO:0019338", &["b440", "b455"], &["FMA7195"]),                          // sarcoidosis
    ("MONDO:0004822", &["b440", "b4501", "b4504"], &["FMA7195"]),                // bronchiectasis
    ("HP:0011109", &["b4504", "b255"], &["FMA46472"]),                           // Chronic sinusitis
    ("HP:0034315", &["b4501"], &[]),                                             // Chronic cough
    ("HP:0025267", &["b134", "b440"], &[]),                                      // Snoring
    // Heart and blood vessels
    ("MONDO:0001134", &["b4200"], &["FMA7161"]),                                 // essential hypertension
    ("HP:0002615", &["b4201"], &[]),                                             // Hypotension
    ("HP:0001278", &["b4202", "b2401"], &[]),                                    // Orthostatic hypotension
    ("MONDO:0005010", &["b4103", "b455"], &["FMA50720"]),                        // coronary artery disorder
    ("MONDO:0005252", &["b4102", "b455"], &["FMA7088"]),                         // heart failure
    ("MONDO:0004981", &["b4101"], &["FMA7088"]),                                 // atrial fibrillation
    ("HP:0001649", &["b4100"], &[]),                                             // Tachycardia
    ("HP:0001962", &["b460"], &[]),                                              // Palpitations
    ("MONDO:0004910", &["b410"], &["FMA7088"]),                                  // mitral valve prolapse
    ("MONDO:0005453", &["b410"], &["FMA7088"]),                                  // congenital heart disease
    ("MONDO:0001315", &["b4202", "b4100", "b455", "b2401"], &[]),                // orthostatic intolerance
    ("MONDO:0005098", &["b110", "b730", "b167", "b760"], &["FMA50801"]),         // stroke disorder
    ("MONDO:0005386", &["b4150", "b2801", "b455"], &["FMA50720"]),               // peripheral arterial disease
    ("HP:0002619", &["b4152"], &["FMA50723"]),                                   // Varicose veins
    ("HP:0030880", &["b4151", "b2700"], &["FMA228642"]),                         // Raynaud phenomenon
    ("MONDO:0005399", &["b4303", "b4152"], &["FMA50723"]),                       // venous thromboembolism
    ("MONDO:0008560", &["b4303"], &[]),                                          // thrombophilia due to activated protein C resistance
    ("MONDO:0005439", &["b5403"], &["FMA50720"]),                                // familial hypercholesterolemia
    ("HP:0003124", &["b5403"], &[]),                                             // Hypercholesterolemia
    ("MONDO:0019297", &["b4352"], &["FMA7162"]),                                 // lymphedema
    // Hormones and metabolism
    ("MONDO:0005147", &["b5401", "b555"], &["FMA7198"]),                         // type 1 diabetes mellitus
    ("MONDO:0005148", &["b5401", "b530"], &["FMA7198"]),                         // type 2 diabetes mellitus
    ("MONDO:0006920", &["b5401"], &[]),                                          // prediabetes syndrome
    ("HP:0001943", &["b5401"], &[]),                                             // Hypoglycemia
    ("MONDO:0011122", &["b530", "b540", "b455"], &[]),                           // obesity disorder
    ("MONDO:0005420", &["b555", "b5400", "b1300"], &["FMA9603"]),                // hypothyroidism
    ("MONDO:0004425", &["b555", "b5400", "b4100"], &["FMA9603"]),                // hyperthyroidism
    ("MONDO:0007699", &["b555", "b4350"], &["FMA9603"]),                         // Hashimoto thyroiditis
    ("MONDO:0005364", &["b555", "b4350"], &["FMA9603", "FMA54448"]),             // Graves disease
    ("MONDO:0008487", &["b555", "b650", "b6600"], &["FMA7209"]),                 // polycystic ovary syndrome
    ("MONDO:0100480", &["b555", "b545"], &["FMA9604"]),                          // autoimmune primary adrenal insufficiency
    ("MONDO:0018912", &["b555", "b530"], &["FMA9604"]),                          // Cushing syndrome
    ("MONDO:0005393", &["b5402", "b2801", "b710"], &["FMA7482"]),                // gout
    ("MONDO:0005298", &["b720"], &["FMA5018"]),                                  // osteoporosis
    ("MONDO:0100471", &["b5451"], &["FMA5018"]),                                 // vitamin D deficiency
    ("MONDO:0006507", &["b5451"], &["FMA7197"]),                                 // hereditary hemochromatosis
    ("HP:0004322", &[], &["FMA7482"]),                                           // Short stature
    ("HP:0000098", &[], &["FMA7482"]),                                           // Tall stature
    ("HP:6000855", &["b5501", "b2700"], &[]),                                    // Cold intolerance
    ("HP:0002046", &["b5501", "b2700"], &[]),                                    // Heat intolerance
    // Blood and immunity
    ("MONDO:0001356", &["b4300", "b4301", "b4552"], &[]),                        // iron deficiency anemia
    ("MONDO:0011382", &["b4301", "b280"], &["FMA9608"]),                         // sickle cell disease
    ("MONDO:0019402", &["b4300", "b4301"], &["FMA9608"]),                        // beta thalassemia
    ("MONDO:0010602", &["b4303"], &[]),                                          // hemophilia A
    ("MONDO:0024574", &["b4303"], &[]),                                          // von Willebrand disease
    ("HP:0000978", &["b4303", "b810"], &[]),                                     // Bruising susceptibility
    ("MONDO:0005775", &["b4301"], &[]),                                          // G6PD deficiency
    ("MONDO:0005109", &["b4350"], &["FMA9825"]),                                 // HIV infectious disease
    ("MONDO:0700226", &["b4351", "b5153"], &[]),                                 // food allergy
    ("MONDO:0000775", &["b4351"], &[]),                                          // drug allergy
    ("HP:0012537", &["b5153"], &[]),                                             // Food intolerance
    ("MONDO:0100345", &["b5151", "b5153", "b535"], &[]),                         // lactose intolerance
    ("MONDO:0005130", &["b5152", "b5153", "b4350"], &["FMA7200"]),               // celiac disease
    // Mind and development
    ("MONDO:0007743", &["b140", "b1304", "b147", "b1641"], &[]),                 // attention deficit-hyperactivity disorder
    ("MONDO:0005258", &["b122", "b156", "b167", "b1643"], &[]),                  // autism spectrum disorder
    ("MONDO:0005489", &["b167", "b1560", "b1561"], &[]),                         // dyslexia
    ("MONDO:0001552", &["b172"], &[]),                                           // dyscalculia
    ("HP:0010526", &["b176", "b7602"], &[]),                                     // Dysgraphia
    ("MONDO:0004922", &["b176", "b7602", "b147"], &[]),                          // developmental coordination disorder
    ("HP:0002312", &["b7602", "b176"], &[]),                                     // Clumsiness
    ("MONDO:0001071", &["b117", "b164"], &[]),                                   // intellectual disability
    ("MONDO:0007661", &["b7652", "b1304"], &[]),                                 // Tourette syndrome
    ("HP:0025268", &["b3300", "b3301"], &[]),                                    // Stuttering
    ("MONDO:0000598", &["b167"], &["FMA50801"]),                                 // aphasia
    ("MONDO:0003227", &["b1561", "b156"], &[]),                                  // prosopagnosia
    ("HP:0020345", &["b1561", "b144"], &[]),                                     // Aphantasia
    ("HP:6000024", &["b156"], &[]),                                              // Synesthesia
    ("HP:0025113", &["b1560", "b152"], &[]),                                     // Misophonia
    ("MONDO:0002009", &["b152", "b130", "b134", "b1265"], &[]),                  // major depressive disorder
    ("MONDO:0000694", &["b152", "b130", "b134"], &[]),                           // seasonal affective disorder
    ("MONDO:0001942", &["b152", "b1263", "b1603", "b134"], &[]),                 // generalized anxiety disorder
    ("MONDO:0005383", &["b152", "b460", "b4100"], &[]),                          // panic disorder
    ("MONDO:0001247", &["b152", "b122", "b1266"], &[]),                          // social phobia
    ("MONDO:0012000", &["b152"], &[]),                                           // specific phobia
    ("MONDO:0004985", &["b152", "b130", "b1600", "b134"], &[]),                  // bipolar disorder
    ("MONDO:0005090", &["b160", "b156", "b1602", "b122"], &[]),                  // schizophrenia
    ("MONDO:0008114", &["b1603", "b152", "b1304"], &[]),                         // obsessive-compulsive disorder
    ("MONDO:0005146", &["b152", "b144", "b134", "b1521"], &[]),                  // post-traumatic stress disorder
    ("MONDO:0001156", &["b152", "b1521", "b1304", "b1800"], &[]),                // borderline personality disorder
    ("MONDO:0005351", &["b1302", "b1801", "b530"], &[]),                         // anorexia nervosa
    ("MONDO:0005452", &["b1302", "b1801", "b1304", "b5106"], &[]),               // bulimia nervosa
    ("MONDO:0005582", &["b1302", "b1304", "b530"], &[]),                         // binge eating disorder
    ("MONDO:0007079", &["b1303", "b1304"], &["FMA7197"]),                        // alcohol dependence
    // Sleep
    ("MONDO:0013600", &["b1341", "b1342", "b1343"], &[]),                        // insomnia
    ("MONDO:0021107", &["b1344", "b110", "b1300"], &[]),                         // narcolepsy
    ("HP:0001262", &["b1300", "b110"], &[]),                                     // Excessive daytime somnolence
    ("HP:0025236", &["b1344"], &[]),                                             // Sleep walking
    ("HP:0003763", &["b5101"], &["FMA12516", "FMA54832"]),                       // Bruxism
    ("MONDO:0005391", &["b1342", "b780", "b765"], &[]),                          // restless legs syndrome
    // Brain and nerves
    ("MONDO:0005277", &["b2801", "b2100", "b5350", "b21020"], &[]),              // migraine disorder
    ("HP:0012228", &["b2801"], &[]),                                             // Tension-type headache
    ("MONDO:0043537", &["b2801", "b215"], &[]),                                  // cluster headache syndrome
    ("HP:0002315", &["b2801"], &[]),                                             // Headache
    ("MONDO:0005027", &["b110", "b765"], &["FMA50801"]),                         // epilepsy
    ("MONDO:0005301", &["b760", "b730", "b2100", "b4552"], &["FMA50801", "FMA7647"]), // multiple sclerosis
    ("MONDO:0005180", &["b7651", "b735", "b770", "b760"], &["FMA50801"]),        // Parkinson disease
    ("MONDO:0004975", &["b144", "b114", "b164"], &["FMA50801"]),                 // Alzheimer disease
    ("MONDO:0001627", &["b144", "b114", "b164", "b117"], &[]),                   // dementia
    ("MONDO:0006497", &["b735", "b760", "b770"], &["FMA50801"]),                 // cerebral palsy
    ("MONDO:0003233", &["b7651"], &[]),                                          // essential tremor
    ("HP:0001337", &["b7651"], &[]),                                             // Tremor
    ("MONDO:0008599", &["b2801"], &["FMA5865"]),                                 // trigeminal neuralgia
    ("MONDO:0005665", &["b7300", "b2151"], &["FMA5865", "FMA5022"]),             // Bell's palsy
    ("MONDO:0007275", &["b2801", "b265", "b7300"], &["FMA9712"]),                // carpal tunnel syndrome
    ("MONDO:0005244", &["b265", "b2700", "b280", "b730"], &[]),                  // peripheral neuropathy
    ("HP:0003401", &["b840", "b265"], &[]),                                      // Paresthesia
    ("MONDO:0009688", &["b730", "b740", "b2151", "b4552"], &[]),                 // myasthenia gravis
    ("MONDO:0004976", &["b730", "b735", "b5105", "b320"], &["FMA7647"]),         // amyotrophic lateral sclerosis
    ("MONDO:0007739", &["b765", "b144", "b164", "b152"], &["FMA50801"]),         // Huntington disease
    ("MONDO:0008449", &["b730", "b620", "b525"], &["FMA7647", "FMA13478"]),      // spina bifida
    ("MONDO:0001150", &["b117"], &["FMA50801"]),                                 // hydrocephalus
    ("HP:0002301", &["b7302", "b7352", "b760"], &[]),                            // Hemiplegia
    ("HP:0010550", &["b7303", "b7353", "b770"], &["FMA7647"]),                   // Paraplegia
    ("HP:0002445", &["b7304", "b7354"], &["FMA7647"]),                           // Tetraplegia
    ("MONDO:0005404", &["b130", "b4552", "b455", "b134"], &[]),                  // myalgic encephalomyelitis/chronic fatigue syndrome
    ("HP:0012378", &["b1300", "b4552"], &[]),                                    // Fatigue
    ("MONDO:0005546", &["b2802", "b134", "b1300"], &[]),                         // fibromyalgia
    ("HP:0012532", &["b280"], &[]),                                              // Chronic pain
    ("MONDO:0019369", &["b2801", "b840", "b710"], &[]),                          // complex regional pain syndrome
    ("MONDO:0018486", &["b2102", "b1561"], &[]),                                 // visual snow syndrome
    ("MONDO:0008015", &["b2403", "b5350", "b235"], &[]),                         // motion sickness
    // Bones, joints and muscles
    ("MONDO:0005178", &["b710", "b2801"], &["FMA7490"]),                         // osteoarthritis
    ("MONDO:0008383", &["b710", "b2802", "b4350"], &["FMA7490"]),                // rheumatoid arthritis
    ("MONDO:0005306", &["b710", "b2801"], &["FMA13478"]),                        // ankylosing spondylitis
    ("MONDO:0011849", &["b710", "b810"], &["FMA7490", "FMA7163"]),               // psoriatic arthritis
    ("MONDO:0007915", &["b4350", "b2802", "b810", "b4552"], &[]),                // systemic lupus erythematosus
    ("MONDO:0010030", &["b2153", "b5104", "b4350"], &[]),                        // Sjogren syndrome
    ("MONDO:0019735", &["b2802", "b7800"], &["FMA5022"]),                        // polymyalgia rheumatica
    ("HP:0002829", &["b2802"], &["FMA7490"]),                                    // Arthralgia
    ("MONDO:0005392", &["b720"], &["FMA13478"]),                                 // scoliosis
    ("HP:0002808", &[], &["FMA13478"]),                                          // Kyphosis
    ("HP:0001382", &["b7102", "b715"], &[]),                                     // Joint hypermobility
    ("MONDO:0001798", &["b7102", "b7152", "b2802"], &[]),                        // hypermobility syndrome
    ("MONDO:0020066", &["b715", "b7102", "b810", "b820"], &[]),                  // Ehlers-Danlos syndrome
    ("MONDO:0007523", &["b7152", "b7102", "b2802"], &[]),                        // Ehlers-Danlos syndrome, hypermobility type
    ("MONDO:0007947", &["b715", "b2100"], &["FMA50720", "FMA7482"]),             // Marfan syndrome
    ("MONDO:0019019", &["b720", "b230"], &["FMA5018"]),                          // osteogenesis imperfecta
    ("MONDO:0007037", &[], &["FMA5018", "FMA7482"]),                             // achondroplasia
    ("MONDO:0010679", &["b730", "b740"], &["FMA5022"]),                          // Duchenne muscular dystrophy
    ("MONDO:0004833", &["b2801"], &["FMA9664"]),                                 // plantar fasciitis
    ("HP:0001763", &["b770"], &["FMA9664"]),                                     // Pes planus
    ("HP:0001822", &[], &["FMA9664"]),                                           // Hallux valgus
    ("HP:0002857", &["b770"], &["FMA35175"]),                                    // Genu valgum
    ("HP:0002970", &["b770"], &["FMA35175"]),                                    // Genu varum
    ("MONDO:0024333", &["b2803"], &["FMA9903"]),                                 // sciatica
    ("HP:0003419", &["b2801"], &["FMA13478"]),                                   // Low back pain
    ("HP:0030833", &["b2801"], &["FMA24138"]),                                   // Neck pain
    ("HP:0030839", &["b2801"], &["FMA35175"]),                                   // Knee pain
    ("MONDO:0011385", &["b2801"], &["FMA13478"]),                                // intervertebral disk degenerative disorder
    ("MONDO:0006763", &["b7100", "b2801"], &["FMA25912"]),                       // frozen shoulder
    ("MONDO:0005473", &["b5102", "b2801"], &["FMA54832"]),                       // temporomandibular joint disorder
    ("HP:0003394", &["b7801", "b7650"], &[]),                                    // Muscle spasm
    ("HP:0010442", &[], &["FMA9712", "FMA9664"]),                                // Polydactyly
    // Digestion
    ("MONDO:0007186", &["b535", "b5105"], &["FMA7131"]),                         // gastroesophageal reflux disease
    ("MONDO:0005052", &["b525", "b5351", "b5352"], &[]),                         // irritable bowel syndrome
    ("MONDO:0005011", &["b515", "b525", "b5152"], &["FMA71132"]),                // Crohn disease
    ("MONDO:0005101", &["b525", "b515"], &["FMA7201"]),                          // ulcerative colitis
    ("MONDO:0004235", &["b5352", "b525"], &["FMA7201"]),                         // diverticulitis
    ("HP:0002019", &["b5252", "b5251"], &[]),                                    // Constipation
    ("HP:0002015", &["b5105"], &["FMA7131"]),                                    // Dysphagia
    ("MONDO:0012672", &["b5352"], &["FMA7202"]),                                 // cholelithiasis
    ("MONDO:0004872", &["b5250"], &["FMA7201"]),                                 // hemorrhoid
    ("MONDO:0004247", &["b515", "b535"], &["FMA7148"]),                          // peptic ulcer disease
    ("MONDO:0013209", &["b540"], &["FMA7197"]),                                  // metabolic dysfunction-associated steatotic liver disease
    ("MONDO:0005344", &["b4350"], &["FMA7197"]),                                 // hepatitis B virus infection
    ("MONDO:0005231", &["b4350"], &["FMA7197"]),                                 // hepatitis C virus infection
    ("MONDO:0005361", &["b5105", "b4351"], &["FMA7131"]),                        // eosinophilic esophagitis
    ("MONDO:0005003", &["b5151", "b2801"], &["FMA7198"]),                        // chronic pancreatitis
    ("MONDO:0005076", &[], &["FMA59762", "FMA12516"]),                           // periodontitis
    // Skin and hair
    ("MONDO:0004980", &["b810", "b840"], &["FMA7163"]),                          // atopic eczema
    ("MONDO:0005083", &["b810", "b820"], &["FMA7163"]),                          // psoriasis
    ("MONDO:0011438", &["b830"], &["FMA7163"]),                                  // acne
    ("MONDO:0006604", &["b830"], &["FMA7163"]),                                  // rosacea
    ("MONDO:0008661", &["b830"], &["FMA7163"]),                                  // vitiligo
    ("MONDO:0043209", &["b830", "b850", "b2102"], &["FMA58235"]),                // albinism
    ("MONDO:0005340", &["b850"], &["FMA53667"]),                                 // alopecia areata
    ("MONDO:0005339", &["b850"], &["FMA53667"]),                                 // androgenetic alopecia
    ("HP:0002216", &["b850"], &["FMA53667"]),                                    // Premature graying of hair
    ("HP:0001007", &["b850"], &["FMA53667"]),                                    // Hirsutism
    ("MONDO:0006559", &["b810", "b840"], &["FMA59152"]),                         // hidradenitis suppurativa
    ("MONDO:0850230", &["b4351", "b840"], &["FMA7163"]),                         // chronic urticaria
    ("MONDO:0005480", &["b810", "b4351"], &["FMA7163"]),                         // contact dermatitis
    ("MONDO:0006608", &["b830"], &["FMA7163"]),                                  // seborrheic dermatitis
    ("MONDO:0005348", &["b820"], &["FMA7163"]),                                  // keloid
    ("HP:0000958", &["b810"], &["FMA7163"]),                                     // Dry skin
    ("HP:0000975", &["b830"], &["FMA59152"]),                                    // Hyperhidrosis
    // Eyes
    ("MONDO:0001384", &["b2100"], &["FMA58238", "FMA12513"]),                    // myopia
    ("MONDO:0004891", &["b2100"], &["FMA12513"]),                                // hyperopia
    ("MONDO:0011284", &["b2100"], &["FMA58238"]),                                // astigmatism
    ("MONDO:0001330", &["b2100", "b2150"], &["FMA58241"]),                       // presbyopia
    ("MONDO:0001703", &["b21021"], &["FMA58301"]),                               // color vision disorder
    ("HP:0000662", &["b21020"], &["FMA58301"]),                                  // Nyctalopia
    ("HP:0000613", &["b21020", "b220"], &[]),                                    // Photophobia
    ("HP:0000505", &["b210"], &["FMA12513"]),                                    // Visual impairment
    ("HP:0000618", &["b210"], &["FMA12513"]),                                    // Blindness
    ("MONDO:0005041", &["b2101"], &["FMA58301"]),                                // glaucoma
    ("MONDO:0005129", &["b2100", "b2102"], &["FMA58241"]),                       // cataract
    ("MONDO:0005150", &["b2100"], &["FMA58301"]),                                // age-related macular degeneration
    ("MONDO:0015486", &["b2100"], &["FMA58238"]),                                // keratoconus
    ("MONDO:0001020", &["b2100", "b1561"], &[]),                                 // amblyopia
    ("MONDO:0003432", &["b2152"], &["FMA49033"]),                                // strabismus
    ("HP:0000639", &["b2152", "b2100"], &[]),                                    // Nystagmus
    ("MONDO:0006733", &["b2153", "b220"], &["FMA59101"]),                        // dry eye syndrome
    ("MONDO:0019200", &["b2101", "b21020"], &["FMA58301"]),                      // retinitis pigmentosa
    ("MONDO:0005266", &["b2100"], &["FMA58301"]),                                // diabetic retinopathy
    ("HP:0000508", &["b2151"], &["FMA54437"]),                                   // Ptosis
    ("HP:0001100", &[], &["FMA58235"]),                                          // Heterochromia iridis
    // Ears, nose and mouth
    ("HP:0000365", &["b230"], &["FMA60909"]),                                    // Hearing impairment
    ("HP:0009900", &["b230", "b2302"], &["FMA60909"]),                           // Unilateral deafness
    ("MONDO:0020678", &["b2300", "b2304"], &["FMA60201"]),                       // sensorineural hearing loss disorder
    ("HP:0000360", &["b2400"], &[]),                                             // Tinnitus
    ("HP:0010780", &["b240", "b1560"], &[]),                                     // Hyperacusis
    ("MONDO:0007972", &["b2351", "b2401", "b2400", "b230"], &["FMA60909"]),      // Meniere disease
    ("MONDO:0005349", &["b230"], &["FMA56513"]),                                 // otosclerosis
    ("HP:0002321", &["b2401", "b235"], &[]),                                     // Vertigo
    ("HP:0000458", &["b255", "b250"], &[]),                                      // Anosmia
    ("HP:0410030", &["b320"], &["FMA59816"]),                                    // Cleft lip
    // Kidneys, bladder and reproduction
    ("MONDO:0005300", &["b6100", "b545"], &["FMA7203"]),                         // chronic kidney disease
    ("MONDO:0008171", &["b2801", "b610"], &["FMA7203"]),                         // nephrolithiasis
    ("MONDO:0020642", &["b610"], &["FMA7203"]),                                  // polycystic kidney disease
    ("MONDO:0006624", &["b6201", "b6202"], &["FMA15900"]),                       // overactive bladder
    ("HP:0000020", &["b6202"], &["FMA19726"]),                                   // Urinary incontinence
    ("HP:0000012", &["b630", "b6201"], &[]),                                     // Urinary urgency
    ("MONDO:0018301", &["b630", "b6201"], &["FMA15900"]),                        // interstitial cystitis
    ("MONDO:0010811", &["b6200", "b6201"], &["FMA9600"]),                        // benign prostatic hyperplasia
    ("MONDO:0005133", &["b6701", "b6600"], &["FMA17558"]),                       // endometriosis
    ("MONDO:0010888", &["b6502", "b6701"], &["FMA17558"]),                       // adenomyosis
    ("MONDO:0007886", &["b6502"], &["FMA17558"]),                                // uterine corpus leiomyoma
    ("HP:0100607", &["b6701"], &[]),                                             // Dysmenorrhea
    ("HP:0000132", &["b6502"], &[]),                                             // Menorrhagia
    ("MONDO:1010182", &["b152", "b6701"], &[]),                                  // premenstrual dysphoric disorder
    ("MONDO:0005047", &["b6600"], &["FMA7160"]),                                 // infertility disorder
    ("MONDO:0005362", &["b6400"], &["FMA9707"]),                                 // erectile dysfunction
    // Genetic
    ("MONDO:0008608", &["b117", "b735"], &["FMA7088"]),                          // Down syndrome
    ("MONDO:0019499", &["b6600", "b555"], &["FMA7209"]),                         // Turner syndrome
    ("MONDO:0006823", &["b6600", "b555"], &["FMA7210"]),                         // Klinefelter syndrome
    ("MONDO:0010383", &["b117", "b140", "b122"], &[]),                           // fragile X syndrome
    ("MONDO:0009861", &["b5402", "b117"], &[]),                                  // phenylketonuria
    ("MONDO:0018975", &["b830"], &["FMA7163", "FMA5865"]),                       // neurofibromatosis type 1
    // Cancer
    ("MONDO:0007254", &[], &["FMA9601"]),                                        // breast cancer
    ("MONDO:0008315", &["b620"], &["FMA9600"]),                                  // prostate cancer
    ("MONDO:0005575", &["b525"], &["FMA7201"]),                                  // colorectal cancer
    ("MONDO:0008903", &["b440"], &["FMA7195"]),                                  // lung cancer
    ("MONDO:0005105", &[], &["FMA7163"]),                                        // melanoma
    ("MONDO:0005059", &["b430", "b4350"], &["FMA9608"]),                         // leukemia
    ("MONDO:0004952", &["b4353"], &["FMA5034"]),                                 // Hodgkins lymphoma
    ("MONDO:0002108", &["b555"], &["FMA9603"]),                                  // thyroid cancer
    ("MONDO:0005447", &["b6600"], &["FMA7210"]),                                 // testicular cancer
    // Infections
    ("MONDO:0018076", &["b440", "b4501"], &["FMA7195"]),                         // tuberculosis
    ("MONDO:0019632", &["b2802", "b4552", "b710"], &[]),                         // Lyme disease
    ("MONDO:0100233", &["b4552", "b455", "b144", "b440"], &[]),                  // long COVID-19
    ("MONDO:0005609", &["b2801", "b840"], &["FMA7163"]),                         // herpes zoster
];
