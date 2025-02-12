// Main System Node
MATCH (repro {name: 'Reproductive System'})

// Create separate male and female system components
MERGE (male {name: 'Male Reproductive System'})
SET male:L1:Health:System,
    male.description = 'Male-specific reproductive organs and structures'

MERGE (female {name: 'Female Reproductive System'})
SET female:L1:Health:System,
    female.description = 'Female-specific reproductive organs and structures'

MERGE (male)-[:MAKES_UP]->(repro)
MERGE (female)-[:MAKES_UP]->(repro)

// Male Organs and Structures
MERGE (testes {name: 'Testes'})
SET testes:L1:Health:Organ,
    testes.description = 'Paired male gonads that produce sperm and testosterone'

MERGE (epididymis {name: 'Epididymis'})
SET epididymis:L1:Health:Structure,
    epididymis.description = 'Highly coiled tubular structure where sperm mature and are stored'

MERGE (vasD {name: 'Vas Deferens'})
SET vasD:L1:Health:Structure,
    vasD.description = 'Muscular tubes that transport sperm from epididymis to urethra'

MERGE (prostate {name: 'Prostate Gland'})
SET prostate:L1:Health:Organ,
    prostate.description = 'Gland that produces components of seminal fluid'

MERGE (penis {name: 'Penis'})
SET penis:L1:Health:Organ,
    penis.description = 'Male copulatory organ containing erectile tissue and urethra'

// Female Organs and Structures
MERGE (ovaries {name: 'Ovaries'})
SET ovaries:L1:Health:Organ,
    ovaries.description = 'Paired female gonads that produce eggs and hormones'

MERGE (fallopian {name: 'Fallopian Tubes'})
SET fallopian:L1:Health:Structure,
    fallopian.description = 'Tubes that transport eggs from ovaries to uterus'

MERGE (uterus {name: 'Uterus'})
SET uterus:L1:Health:Organ,
    uterus.description = 'Muscular organ where fetal development occurs'

MERGE (cervix {name: 'Cervix'})
SET cervix:L1:Health:Structure,
    cervix.description = 'Lower portion of uterus that connects to vagina'

MERGE (vagina {name: 'Vagina'})
SET vagina:L1:Health:Organ,
    vagina.description = 'Female copulatory organ and birth canal'

// Connect organs to their respective systems
MERGE (testes)-[:MAKES_UP]->(male)
MERGE (epididymis)-[:MAKES_UP]->(male)
MERGE (vasD)-[:MAKES_UP]->(male)
MERGE (prostate)-[:MAKES_UP]->(male)
MERGE (penis)-[:MAKES_UP]->(male)

MERGE (ovaries)-[:MAKES_UP]->(female)
MERGE (fallopian)-[:MAKES_UP]->(female)
MERGE (uterus)-[:MAKES_UP]->(female)
MERGE (cervix)-[:MAKES_UP]->(female)
MERGE (vagina)-[:MAKES_UP]->(female)

// Tissues
MERGE (endometrium {name: 'Endometrium'})
SET endometrium:L1:Health:Tissue,
    endometrium.description = 'Inner lining of the uterus that changes throughout menstrual cycle'

MERGE (myometrium {name: 'Myometrium'})
SET myometrium:L1:Health:Tissue,
    myometrium.description = 'Muscular wall of the uterus'

MERGE (erectileTissue {name: 'Erectile Tissue'})
SET erectileTissue:L1:Health:Tissue,
    erectileTissue.description = 'Specialized tissue that can become engorged with blood'

// Connect tissues to organs
MERGE (endometrium)-[:MAKES_UP]->(uterus)
MERGE (myometrium)-[:MAKES_UP]->(uterus)
MERGE (erectileTissue)-[:MAKES_UP]->(penis)