// Main System Node
MERGE (repro {name: 'Reproductive System'})
SET repro:System, repro.description = 'Biological system responsible for reproduction, including production of gametes and hormones'

// Create separate male and female system components
MERGE (male {name: 'Male Reproductive System'})
SET male:System:Health, male.description = 'Male-specific reproductive organs and structures'

MERGE (female {name: 'Female Reproductive System'})
SET female:System:Health, female.description = 'Female-specific reproductive organs and structures'

MERGE (repro)-[:CONTAINS]->(male)
MERGE (repro)-[:CONTAINS]->(female)

// Male Organs and Structures
MERGE (testes {name: 'Testes'})
SET testes:Organ:Health, testes.description = 'Paired male gonads that produce sperm and testosterone'

MERGE (epididymis {name: 'Epididymis'})
SET epididymis:Structure:Health, epididymis.description = 'Highly coiled tubular structure where sperm mature and are stored'

MERGE (vasD {name: 'Vas Deferens'})
SET vasD:Structure:Health, vasD.description = 'Muscular tubes that transport sperm from epididymis to urethra'

MERGE (prostate {name: 'Prostate Gland'})
SET prostate:Organ:Health, prostate.description = 'Gland that produces components of seminal fluid'

MERGE (penis {name: 'Penis'})
SET penis:Organ:Health, penis.description = 'Male copulatory organ containing erectile tissue and urethra'

// Female Organs and Structures
MERGE (ovaries {name: 'Ovaries'})
SET ovaries:Organ:Health, ovaries.description = 'Paired female gonads that produce eggs and hormones'

MERGE (fallopian {name: 'Fallopian Tubes'})
SET fallopian:Structure:Health, fallopian.description = 'Tubes that transport eggs from ovaries to uterus'

MERGE (uterus {name: 'Uterus'})
SET uterus:Organ:Health, uterus.description = 'Muscular organ where fetal development occurs'

MERGE (cervix {name: 'Cervix'})
SET cervix:Structure:Health, cervix.description = 'Lower portion of uterus that connects to vagina'

MERGE (vagina {name: 'Vagina'})
SET vagina:Organ:Health, vagina.description = 'Female copulatory organ and birth canal'

// Connect organs to their respective systems
MERGE (male)-[:CONTAINS]->(testes)
MERGE (male)-[:CONTAINS]->(epididymis)
MERGE (male)-[:CONTAINS]->(vasD)
MERGE (male)-[:CONTAINS]->(prostate)
MERGE (male)-[:CONTAINS]->(penis)

MERGE (female)-[:CONTAINS]->(ovaries)
MERGE (female)-[:CONTAINS]->(fallopian)
MERGE (female)-[:CONTAINS]->(uterus)
MERGE (female)-[:CONTAINS]->(cervix)
MERGE (female)-[:CONTAINS]->(vagina)

// Tissues
MERGE (endometrium {name: 'Endometrium'})
SET endometrium:Tissue:Health, endometrium.description = 'Inner lining of the uterus that changes throughout menstrual cycle'

MERGE (myometrium {name: 'Myometrium'})
SET myometrium:Tissue:Health, myometrium.description = 'Muscular wall of the uterus'

MERGE (erectileTissue {name: 'Erectile Tissue'})
SET erectileTissue:Tissue:Health, erectileTissue.description = 'Specialized tissue that can become engorged with blood'

// Connect tissues to organs
MERGE (uterus)-[:CONTAINS]->(endometrium)
MERGE (uterus)-[:CONTAINS]->(myometrium)
MERGE (penis)-[:CONTAINS]->(erectileTissue)

// Example Conditions/Variations (three examples as requested)
MERGE (endometriosis {name: 'Endometriosis'})
SET endometriosis:Condition:Health, endometriosis.description = 'Growth of endometrial tissue outside the uterus',
    endometriosis.affects = 'reproductive organs and surrounding tissues'

MERGE (pcos {name: 'Polycystic Ovary Syndrome'})
SET pcos:Condition:Health, pcos.description = 'Hormonal disorder causing enlarged ovaries with small cysts',
    pcos.affects = 'ovaries and hormonal balance'

MERGE (prostatitis {name: 'Prostatitis'})
SET prostatitis:Condition:Health, prostatitis.description = 'Inflammation of the prostate gland',
    prostatitis.types = ['acute', 'chronic']

// Connect conditions to appropriate structures
MERGE (endometrium)-[:CAN_HAVE]->(endometriosis)
MERGE (ovaries)-[:CAN_HAVE]->(pcos)
MERGE (prostate)-[:CAN_HAVE]->(prostatitis)

// Measurable Properties
MERGE (hormoneLevel {name: 'Hormone Levels'})
SET hormoneLevel:Measurement:Health, hormoneLevel.description = 'Concentration of reproductive hormones in blood',
    hormoneLevel.units = 'ng/mL',
    hormoneLevel.measuredHormones = ['testosterone', 'estrogen', 'progesterone']

// Connect measurements
MERGE (repro)-[:HAS_MEASUREMENT]->(hormoneLevel)