// Main System Node
MATCH (digestive {name: 'Digestive System'})

// Major Organs of the Upper GI Tract
MERGE (mouth {name: 'Mouth'})
SET mouth:L1:Health:Organ,
    mouth.description = 'Initial point of digestion where food enters and mechanical breakdown begins'

MERGE (pharynx {name: 'Pharynx'})
SET pharynx:L1:Health:Organ,
    pharynx.description = 'Muscular tube connecting mouth to esophagus, shared with respiratory system'

MERGE (esophagus {name: 'Esophagus'})
SET esophagus:L1:Health:Organ,
    esophagus.description = 'Muscular tube that moves food from throat to stomach through peristalsis'

MERGE (stomach {name: 'Stomach'})
SET stomach:L1:Health:Organ,
    stomach.description = 'Muscular organ that begins chemical digestion of proteins and mechanical breakdown of food'

// Major Organs of the Lower GI Tract
MERGE (smallIntestine {name: 'Small Intestine'})
SET smallIntestine:L1:Health:Organ,
    smallIntestine.description = 'Primary site of nutrient absorption and continued digestion'

MERGE (largeIntestine {name: 'Large Intestine'})
SET largeIntestine:L1:Health:Organ,
    largeIntestine.description = 'Organ responsible for water absorption and waste processing'

// Accessory Organs
MERGE (liver {name: 'Liver'})
SET liver:L1:Health:Organ,
    liver.description = 'Largest internal organ, processes nutrients and produces bile'

MERGE (gallbladder {name: 'Gallbladder'})
SET gallbladder:L1:Health:Organ,
    gallbladder.description = 'Storage organ for bile produced by the liver'

MERGE (pancreas {name: 'Pancreas'})
SET pancreas:L1:Health:Organ,
    pancreas.description = 'Produces digestive enzymes and hormones for digestion'

// Mouth Components
MERGE (teeth {name: 'Teeth'})
SET teeth:L1:Health:Structure,
    teeth.description = 'Hard structures for mechanical breakdown of food'

MERGE (tongue {name: 'Tongue'})
SET tongue:L1:Health:Structure,
    tongue.description = 'Muscular organ for taste, manipulation of food, and swallowing'

MERGE (salivaryGlands {name: 'Salivary Glands'})
SET salivaryGlands:L1:Health:Structure,
    salivaryGlands.description = 'Glands that produce saliva for initial digestion and lubrication'

// Small Intestine Components
MERGE (duodenum {name: 'Duodenum'})
SET duodenum:L1:Health:Structure,
    duodenum.description = 'First part of small intestine where most chemical digestion occurs'

MERGE (jejunum {name: 'Jejunum'})
SET jejunum:L1:Health:Structure,
    jejunum.description = 'Middle section of small intestine with major absorption function'

MERGE (ileum {name: 'Ileum'})
SET ileum:L1:Health:Structure,
    ileum.description = 'Final section of small intestine, absorbs remaining nutrients'

// Large Intestine Components
MERGE (cecum {name: 'Cecum'})
SET cecum:L1:Health:Structure,
    cecum.description = 'First part of large intestine, connects to appendix'

MERGE (colon {name: 'Colon'})
SET colon:L1:Health:Structure,
    colon.description = 'Main part of large intestine, absorbs water and processes waste'

MERGE (rectum {name: 'Rectum'})
SET rectum:L1:Health:Structure,
    rectum.description = 'Final straight portion of large intestine'

// Tissues
MERGE (mucosa {name: 'Mucosa'})
SET mucosa:L1:Health:Tissue,
    mucosa.description = 'Inner lining of digestive tract with secretory and absorptive functions'

MERGE (submucosa {name: 'Submucosa'})
SET submucosa:L1:Health:Tissue,
    submucosa.description = 'Layer containing blood vessels, nerves, and glands'

MERGE (muscularis {name: 'Muscularis'})
SET muscularis:L1:Health:Tissue,
    muscularis.description = 'Muscle layer responsible for peristalsis'

MERGE (serosa {name: 'Serosa'})
SET serosa:L1:Health:Tissue,
    serosa.description = 'Outer protective layer of digestive organs'

// Connect organs to system
MERGE (mouth)-[:MAKES_UP]->(digestive)
MERGE (pharynx)-[:MAKES_UP]->(digestive)
MERGE (esophagus)-[:MAKES_UP]->(digestive)
MERGE (stomach)-[:MAKES_UP]->(digestive)
MERGE (smallIntestine)-[:MAKES_UP]->(digestive)
MERGE (largeIntestine)-[:MAKES_UP]->(digestive)
MERGE (liver)-[:MAKES_UP]->(digestive)
MERGE (gallbladder)-[:MAKES_UP]->(digestive)
MERGE (pancreas)-[:MAKES_UP]->(digestive)

// Connect structures to organs
MERGE (teeth)-[:MAKES_UP]->(mouth)
MERGE (tongue)-[:MAKES_UP]->(mouth)
MERGE (salivaryGlands)-[:MAKES_UP]->(mouth)
MERGE (duodenum)-[:MAKES_UP]->(smallIntestine)
MERGE (jejunum)-[:MAKES_UP]->(smallIntestine)
MERGE (ileum)-[:MAKES_UP]->(smallIntestine)
MERGE (cecum)-[:MAKES_UP]->(largeIntestine)
MERGE (colon)-[:MAKES_UP]->(largeIntestine)
MERGE (rectum)-[:MAKES_UP]->(largeIntestine)

// Connect tissues to relevant organs (example for stomach)
MERGE (mucosa)-[:MAKES_UP]->(stomach)
MERGE (submucosa)-[:MAKES_UP]->(stomach)
MERGE (muscularis)-[:MAKES_UP]->(stomach)
MERGE (serosa)-[:MAKES_UP]->(stomach)