//the conditions offered as a checklist, by group in the order shown, each with the everyday name it goes by there,
//and the everyday names and abbreviations people search for conditions by. Both name conditions in picks.rs
pub const CHECKLIST: &[(&str, &[(&str, &str)])] = &[
    ("Seeing", &[
        ("MONDO:0001384", "Nearsighted"), // myopia
        ("MONDO:0004891", "Farsighted"), // hyperopia
        ("MONDO:0001330", "Need reading glasses"), // presbyopia
        ("MONDO:0011284", "Astigmatism"), // astigmatism
        ("MONDO:0001703", "Color blind"), // color vision disorder
        ("HP:0000505", "Low vision"), // Visual impairment
        ("HP:0000618", "Blind"), // Blindness
        ("MONDO:0005129", "Cataracts"), // cataract
        ("MONDO:0005041", "Glaucoma"), // glaucoma
    ]),
    ("Hearing and balance", &[
        ("HP:0000365", "Hard of hearing"), // Hearing impairment
        ("HP:0009900", "Deaf in one ear"), // Unilateral deafness
        ("HP:0000360", "Ringing in the ears"), // Tinnitus
        ("HP:0002321", "Vertigo"), // Vertigo
        ("MONDO:0008015", "Motion sickness"), // motion sickness
    ]),
    ("Moving", &[
        ("HP:0003419", "Bad back"), // Low back pain
        ("HP:0030839", "Bad knee"), // Knee pain
        ("HP:0030833", "Neck pain"), // Neck pain
        ("MONDO:0005178", "Osteoarthritis"), // osteoarthritis
        ("MONDO:0008383", "Rheumatoid arthritis"), // rheumatoid arthritis
        ("HP:0001382", "Double-jointed"), // Joint hypermobility
        ("MONDO:0005392", "Scoliosis"), // scoliosis
        ("MONDO:0004833", "Plantar fasciitis"), // plantar fasciitis
        ("MONDO:0007275", "Carpal tunnel"), // carpal tunnel syndrome
        ("MONDO:0006497", "Cerebral palsy"), // cerebral palsy
        ("HP:0010550", "Paraplegia"), // Paraplegia
    ]),
    ("Breathing and heart", &[
        ("MONDO:0004979", "Asthma"), // asthma
        ("MONDO:0011786", "Hay fever"), // allergic rhinitis
        ("MONDO:0005002", "COPD"), // chronic obstructive pulmonary disease
        ("MONDO:0001134", "High blood pressure"), // essential hypertension
        ("HP:0003124", "High cholesterol"), // Hypercholesterolemia
        ("MONDO:0004981", "Atrial fibrillation"), // atrial fibrillation
    ]),
    ("Mind and focus", &[
        ("MONDO:0007743", "ADHD"), // attention deficit-hyperactivity disorder
        ("MONDO:0005258", "Autism"), // autism spectrum disorder
        ("MONDO:0005489", "Dyslexia"), // dyslexia
        ("MONDO:0001942", "Anxiety"), // generalized anxiety disorder
        ("MONDO:0002009", "Depression"), // major depressive disorder
        ("MONDO:0004985", "Bipolar disorder"), // bipolar disorder
        ("MONDO:0008114", "OCD"), // obsessive-compulsive disorder
        ("MONDO:0005146", "PTSD"), // post-traumatic stress disorder
    ]),
    ("Sleep", &[
        ("MONDO:0013600", "Insomnia"), // insomnia
        ("MONDO:0007147", "Sleep apnea"), // obstructive sleep apnea syndrome
        ("MONDO:0021107", "Narcolepsy"), // narcolepsy
        ("MONDO:0005391", "Restless legs"), // restless legs syndrome
    ]),
    ("Long-term illness", &[
        ("MONDO:0005147", "Type 1 diabetes"), // type 1 diabetes mellitus
        ("MONDO:0005148", "Type 2 diabetes"), // type 2 diabetes mellitus
        ("MONDO:0005420", "Underactive thyroid"), // hypothyroidism
        ("MONDO:0005277", "Migraines"), // migraine disorder
        ("MONDO:0005027", "Epilepsy"), // epilepsy
        ("MONDO:0005301", "Multiple sclerosis"), // multiple sclerosis
        ("MONDO:0005180", "Parkinson's"), // Parkinson disease
        ("MONDO:0005546", "Fibromyalgia"), // fibromyalgia
        ("MONDO:0005404", "Chronic fatigue syndrome"), // myalgic encephalomyelitis/chronic fatigue syndrome
        ("MONDO:0100233", "Long COVID"), // long COVID-19
        ("HP:0012532", "Chronic pain"), // Chronic pain
    ]),
    ("Food and digestion", &[
        ("MONDO:0700226", "Food allergy"), // food allergy
        ("MONDO:0100345", "Lactose intolerant"), // lactose intolerance
        ("MONDO:0005130", "Celiac disease"), // celiac disease
        ("MONDO:0005052", "IBS"), // irritable bowel syndrome
        ("MONDO:0007186", "Acid reflux"), // gastroesophageal reflux disease
        ("MONDO:0005011", "Crohn's disease"), // Crohn disease
    ]),
];

pub const EVERYDAY: &[(&str, &[&str])] = &[
    ("MONDO:0007743", &["ADHD", "ADD"]), // attention deficit-hyperactivity disorder
    ("MONDO:0005301", &["MS"]), // multiple sclerosis
    ("MONDO:0005002", &["COPD", "emphysema"]), // chronic obstructive pulmonary disease
    ("MONDO:0001134", &["high blood pressure", "hypertension"]), // essential hypertension
    ("HP:0002615", &["low blood pressure"]), // Hypotension
    ("HP:0003124", &["high cholesterol"]), // Hypercholesterolemia
    ("MONDO:0001384", &["nearsighted", "shortsighted", "glasses"]), // myopia
    ("MONDO:0004891", &["farsighted", "longsighted"]), // hyperopia
    ("MONDO:0001330", &["reading glasses"]), // presbyopia
    ("MONDO:0001703", &["color blind", "colorblind"]), // color vision disorder
    ("HP:0000365", &["hard of hearing", "hearing loss", "deaf"]), // Hearing impairment
    ("HP:0009900", &["deaf in one ear"]), // Unilateral deafness
    ("HP:0000360", &["ringing in the ears"]), // Tinnitus
    ("HP:0003419", &["bad back", "back pain"]), // Low back pain
    ("HP:0030839", &["bad knee"]), // Knee pain
    ("HP:0001382", &["double-jointed"]), // Joint hypermobility
    ("MONDO:0011786", &["hay fever", "allergies", "seasonal allergies"]), // allergic rhinitis
    ("MONDO:0007147", &["sleep apnea"]), // obstructive sleep apnea syndrome
    ("MONDO:0005147", &["T1D"]), // type 1 diabetes mellitus
    ("MONDO:0005148", &["T2D"]), // type 2 diabetes mellitus
    ("MONDO:0005420", &["underactive thyroid"]), // hypothyroidism
    ("MONDO:0004425", &["overactive thyroid"]), // hyperthyroidism
    ("MONDO:0005277", &["migraines"]), // migraine disorder
    ("MONDO:0001942", &["anxiety", "GAD"]), // generalized anxiety disorder
    ("MONDO:0002009", &["depression", "MDD"]), // major depressive disorder
    ("MONDO:0008114", &["OCD"]), // obsessive-compulsive disorder
    ("MONDO:0005146", &["PTSD"]), // post-traumatic stress disorder
    ("MONDO:0005052", &["IBS"]), // irritable bowel syndrome
    ("MONDO:0007186", &["GERD", "acid reflux", "heartburn"]), // gastroesophageal reflux disease
    ("MONDO:0005258", &["ASD", "Asperger syndrome"]), // autism spectrum disorder
    ("MONDO:0005404", &["CFS", "ME/CFS", "chronic fatigue"]), // myalgic encephalomyelitis/chronic fatigue syndrome
    ("MONDO:0100233", &["long COVID"]), // long COVID-19
    ("MONDO:0004976", &["ALS", "Lou Gehrig's disease"]), // amyotrophic lateral sclerosis
    ("MONDO:0006497", &["CP"]), // cerebral palsy
    ("MONDO:0004981", &["AFib"]), // atrial fibrillation
    ("MONDO:0005098", &["stroke"]), // stroke disorder
    ("MONDO:0011122", &["obesity"]), // obesity disorder
    ("MONDO:0001356", &["anemia", "low iron"]), // iron deficiency anemia
    ("HP:0000618", &["blind"]), // Blindness
    ("HP:0000505", &["low vision"]), // Visual impairment
    ("MONDO:0008015", &["car sickness", "seasickness"]), // motion sickness
    ("MONDO:1010182", &["PMDD"]), // premenstrual dysphoric disorder
    ("MONDO:0008487", &["PCOS"]), // polycystic ovary syndrome
    ("MONDO:0005300", &["CKD"]), // chronic kidney disease
    ("MONDO:0005010", &["heart disease"]), // coronary artery disorder
    ("HP:0000975", &["excessive sweating"]), // Hyperhidrosis
    ("HP:0003763", &["teeth grinding"]), // Bruxism
    ("HP:0000662", &["night blindness"]), // Nyctalopia
    ("HP:0000613", &["light sensitivity"]), // Photophobia
    ("HP:0002015", &["trouble swallowing"]), // Dysphagia
    ("MONDO:0005339", &["balding", "pattern baldness"]), // androgenetic alopecia
    ("MONDO:0004980", &["eczema"]), // atopic eczema
    ("MONDO:0005180", &["Parkinson's"]), // Parkinson disease
    ("MONDO:0005011", &["Crohn's"]), // Crohn disease
    ("MONDO:0100345", &["lactose intolerant"]), // lactose intolerance
    ("MONDO:0005391", &["RLS"]), // restless legs syndrome
    ("HP:0012532", &["chronic pain"]), // Chronic pain
    ("MONDO:0007275", &["carpal tunnel"]), // carpal tunnel syndrome
];
