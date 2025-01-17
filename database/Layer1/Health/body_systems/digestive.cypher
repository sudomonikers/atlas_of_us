// Main System Node
MERGE (digestive {name: 'Digestive System'})
SET digestive:System:Health,
    digestive.description = 'System responsible for processing food, absorbing nutrients, and eliminating waste'

// Major Organs of the Upper GI Tract
MERGE (mouth {name: 'Mouth'})
SET mouth:Organ:Health,
    mouth.description = 'Initial point of digestion where food enters and mechanical breakdown begins'

MERGE (pharynx {name: 'Pharynx'})
SET pharynx:Organ:Health,
    pharynx.description = 'Muscular tube connecting mouth to esophagus, shared with respiratory system'

MERGE (esophagus {name: 'Esophagus'})
SET esophagus:Organ:Health,
    esophagus.description = 'Muscular tube that moves food from throat to stomach through peristalsis'

MERGE (stomach {name: 'Stomach'})
SET stomach:Organ:Health,
    stomach.description = 'Muscular organ that begins chemical digestion of proteins and mechanical breakdown of food'

// Major Organs of the Lower GI Tract
MERGE (smallIntestine {name: 'Small Intestine'})
SET smallIntestine:Organ:Health,
    smallIntestine.description = 'Primary site of nutrient absorption and continued digestion'

MERGE (largeIntestine {name: 'Large Intestine'})
SET largeIntestine:Organ:Health,
    largeIntestine.description = 'Organ responsible for water absorption and waste processing'

// Accessory Organs
MERGE (liver {name: 'Liver'})
SET liver:Organ:Health,
    liver.description = 'Largest internal organ, processes nutrients and produces bile'

MERGE (gallbladder {name: 'Gallbladder'})
SET gallbladder:Organ:Health,
    gallbladder.description = 'Storage organ for bile produced by the liver'

MERGE (pancreas {name: 'Pancreas'})
SET pancreas:Organ:Health,
    pancreas.description = 'Produces digestive enzymes and hormones for digestion'

// Mouth Components
MERGE (teeth {name: 'Teeth'})
SET teeth:Structure:Health,
    teeth.description = 'Hard structures for mechanical breakdown of food'

MERGE (tongue {name: 'Tongue'})
SET tongue:Structure:Health,
    tongue.description = 'Muscular organ for taste, manipulation of food, and swallowing'

MERGE (salivaryGlands {name: 'Salivary Glands'})
SET salivaryGlands:Structure:Health,
    salivaryGlands.description = 'Glands that produce saliva for initial digestion and lubrication'

// Small Intestine Components
MERGE (duodenum {name: 'Duodenum'})
SET duodenum:Structure:Health,
    duodenum.description = 'First part of small intestine where most chemical digestion occurs'

MERGE (jejunum {name: 'Jejunum'})
SET jejunum:Structure:Health,
    jejunum.description = 'Middle section of small intestine with major absorption function'

MERGE (ileum {name: 'Ileum'})
SET ileum:Structure:Health,
    ileum.description = 'Final section of small intestine, absorbs remaining nutrients'

// Large Intestine Components
MERGE (cecum {name: 'Cecum'})
SET cecum:Structure:Health,
    cecum.description = 'First part of large intestine, connects to appendix'

MERGE (colon {name: 'Colon'})
SET colon:Structure:Health,
    colon.description = 'Main part of large intestine, absorbs water and processes waste'

MERGE (rectum {name: 'Rectum'})
SET rectum:Structure:Health,
    rectum.description = 'Final straight portion of large intestine'

// Tissues
MERGE (mucosa {name: 'Mucosa'})
SET mucosa:Tissue:Health,
    mucosa.description = 'Inner lining of digestive tract with secretory and absorptive functions'

MERGE (submucosa {name: 'Submucosa'})
SET submucosa:Tissue:Health,
    submucosa.description = 'Layer containing blood vessels, nerves, and glands'

MERGE (muscularis {name: 'Muscularis'})
SET muscularis:Tissue:Health,
    muscularis.description = 'Muscle layer responsible for peristalsis'

MERGE (serosa {name: 'Serosa'})
SET serosa:Tissue:Health,
    serosa.description = 'Outer protective layer of digestive organs'

// Connect organs to system
MERGE (digestive)-[:CONTAINS]->(mouth)
MERGE (digestive)-[:CONTAINS]->(pharynx)
MERGE (digestive)-[:CONTAINS]->(esophagus)
MERGE (digestive)-[:CONTAINS]->(stomach)
MERGE (digestive)-[:CONTAINS]->(smallIntestine)
MERGE (digestive)-[:CONTAINS]->(largeIntestine)
MERGE (digestive)-[:CONTAINS]->(liver)
MERGE (digestive)-[:CONTAINS]->(gallbladder)
MERGE (digestive)-[:CONTAINS]->(pancreas)

// Connect structures to organs
MERGE (mouth)-[:CONTAINS]->(teeth)
MERGE (mouth)-[:CONTAINS]->(tongue)
MERGE (mouth)-[:CONTAINS]->(salivaryGlands)
MERGE (smallIntestine)-[:CONTAINS]->(duodenum)
MERGE (smallIntestine)-[:CONTAINS]->(jejunum)
MERGE (smallIntestine)-[:CONTAINS]->(ileum)
MERGE (largeIntestine)-[:CONTAINS]->(cecum)
MERGE (largeIntestine)-[:CONTAINS]->(colon)
MERGE (largeIntestine)-[:CONTAINS]->(rectum)

// Connect tissues to relevant organs (example for stomach)
MERGE (stomach)-[:CONTAINS]->(mucosa)
MERGE (stomach)-[:CONTAINS]->(submucosa)
MERGE (stomach)-[:CONTAINS]->(muscularis)
MERGE (stomach)-[:CONTAINS]->(serosa)

// Sample Conditions (not exhaustive)
MERGE (gerd {name: 'Gastroesophageal Reflux Disease'})
SET gerd:Condition:Health:Health,
    gerd.description = 'Chronic acid reflux from stomach into esophagus'

MERGE (ulcer {name: 'Peptic Ulcer'})
SET ulcer:Condition:Health:Health,
    ulcer.description = 'Sore in lining of stomach or small intestine'

MERGE (crohns {name: 'Crohn\'s Disease'})
SET crohns:Condition:Health:Health,
    crohns.description = 'Inflammatory bowel disease affecting any part of digestive tract'

// Connect conditions to relevant organs
MERGE (esophagus)-[:CAN_HAVE]->(gerd)
MERGE (stomach)-[:CAN_HAVE]->(ulcer)
MERGE (smallIntestine)-[:CAN_HAVE]->(ulcer)
MERGE (digestive)-[:CAN_HAVE]->(crohns)

// Measurements
MERGE (ph {name: 'pH Level'})
SET ph:Measurement:Health,
    ph.description = 'Measure of acidity in digestive tract',
    ph.normalRange = 'varies by location'

MERGE (transitTime {name: 'Transit Time'})
SET transitTime:Measurement:Health,
    transitTime.description = 'Time taken for food to pass through digestive system',
    transitTime.normalRange = '24-72 hours'

// Connect measurements
MERGE (digestive)-[:HAS_MEASUREMENT]->(ph)
MERGE (digestive)-[:HAS_MEASUREMENT]->(transitTime)