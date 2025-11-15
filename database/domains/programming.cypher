// Domain: Programming
// Generated: 2025-11-15
// Description: The practice of writing, testing, and maintaining computer programs and software systems

// ============================================================
// DOMAIN: Programming
// Generated: 2025-11-15
// Agent 1: Domain Structure
// ============================================================

// Create Domain
CREATE (d:Domain {
  name: 'Programming',
  description: 'The practice of writing, testing, and maintaining computer programs and software systems. This domain encompasses the full lifecycle of software development from conceptual design through production deployment, including core programming skills, software architecture, debugging, version control, testing methodologies, and deployment practices.',
  level_count: 5,
  created_date: date(),
  scope_included: ['writing code in multiple programming languages', 'understanding algorithms and data structures', 'debugging and troubleshooting code', 'version control and collaboration', 'testing methodologies and quality assurance', 'software design patterns and architecture', 'code optimization and performance', 'deploying and maintaining applications', 'APIs and integration', 'security best practices in code'],
  scope_excluded: ['software project management (separate domain)', 'user interface design and UX (separate domain)', 'DevOps infrastructure and deployment infrastructure (separate domain - focuses on infrastructure automation)', 'database design and SQL (foundational skill that crosses domains)', 'computer science theory (separate domain - algorithm analysis and computational theory)']
});

// Create Domain Levels
CREATE (level1:Domain_Level {
  domain: 'Programming',
  level: 1,
  name: 'Novice',
  description: 'Learning basic syntax and control flow, writing simple programs, understanding variables and basic data types, and running code with guidance'
});

CREATE (level2:Domain_Level {
  domain: 'Programming',
  level: 2,
  name: 'Developing',
  description: 'Writing functions and basic object-oriented code, working with multiple files, using version control, and beginning to test code independently'
});

CREATE (level3:Domain_Level {
  domain: 'Programming',
  level: 3,
  name: 'Competent',
  description: 'Writing well-structured applications with appropriate design patterns, debugging effectively, using testing frameworks, and collaborating with other developers'
});

CREATE (level4:Domain_Level {
  domain: 'Programming',
  level: 4,
  name: 'Advanced',
  description: 'Designing scalable systems, mentoring junior developers, optimizing code for performance, managing complex dependencies, and contributing to architectural decisions'
});

CREATE (level5:Domain_Level {
  domain: 'Programming',
  level: 5,
  name: 'Master',
  description: 'Architecting large-scale systems, establishing best practices and standards, solving complex technical problems, and advancing programming techniques and frameworks'
});

// Connect Domain to Levels
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level1);
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level2);
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level3);
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level4);
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level5);

// ============================================================
// Agent 2a: Knowledge Nodes
// ============================================================

// Foundational Knowledge (Novice Level)

MERGE (k_syntax:Knowledge {name: 'Programming Syntax Fundamentals'})
SET k_syntax.description = 'Basic syntax rules and structural elements of programming languages, including variables, operators, and control flow statements. Understanding syntax is the first step to writing functional code.',
    k_syntax.how_to_learn = 'Start with interactive coding tutorials (Codecademy, FreeCodeCamp). Write simple programs daily focusing on correct syntax. Read examples from official language documentation. Expected time: 1-2 weeks of consistent practice.',
    k_syntax.remember_level = 'Recall variable declarations, basic data types (int, string, boolean), and the syntax of if/else statements and loops',
    k_syntax.understand_level = 'Explain how variables store data, why different data types exist, and how control flow statements direct program execution',
    k_syntax.apply_level = 'Write simple programs using variables, operators, and control structures to solve basic computational problems',
    k_syntax.analyze_level = 'Examine code snippets to identify syntax errors and understand how different syntax choices affect program behavior',
    k_syntax.evaluate_level = 'Compare different syntax approaches and judge which is most appropriate for a given situation',
    k_syntax.create_level = 'Write original programs demonstrating correct syntax and proper use of language features';

MERGE (k_datatypes:Knowledge {name: 'Data Types and Variables'})
SET k_datatypes.description = 'Understanding different data types (integers, floats, strings, booleans), how to declare and initialize variables, and how data is stored in memory. This is fundamental to all programming.',
    k_datatypes.how_to_learn = 'Work through interactive tutorials on data types. Write programs that use different data types. Experiment with type conversions. Read language documentation. Expected time: 1-2 weeks.',
    k_datatypes.remember_level = 'Recall the names and basic characteristics of common data types: integer, float, string, and boolean',
    k_datatypes.understand_level = 'Explain the differences between data types, how variables store values, and why type systems exist in programming languages',
    k_datatypes.apply_level = 'Choose appropriate data types for variables in programs and correctly declare and initialize them',
    k_datatypes.analyze_level = 'Analyze how data type choices affect memory usage, computation speed, and program correctness',
    k_datatypes.evaluate_level = 'Evaluate whether data type choices in existing code are optimal for the problem domain',
    k_datatypes.create_level = 'Define custom data structures and design type systems for new programs';

MERGE (k_control_flow:Knowledge {name: 'Control Flow Logic'})
SET k_control_flow.description = 'Understanding how programs flow from one statement to the next, including conditional statements (if/else), loops (for/while), and decision-making logic. This allows programs to respond to different inputs.',
    k_control_flow.how_to_learn = 'Practice with flowchart exercises before coding. Write simple programs with multiple conditional branches. Debug programs with incorrect control flow. Expected time: 2-3 weeks.',
    k_control_flow.remember_level = 'Recall the syntax of if statements, else if, else, for loops, and while loops',
    k_control_flow.understand_level = 'Explain how conditional statements determine which code executes, and how loops repeat code blocks based on conditions',
    k_control_flow.apply_level = 'Write programs with nested conditionals and loops to solve practical problems',
    k_control_flow.analyze_level = 'Trace through code execution to understand the exact path taken by different inputs',
    k_control_flow.evaluate_level = 'Judge whether control flow logic correctly handles all cases and edge cases',
    k_control_flow.create_level = 'Design complex control flow patterns for sophisticated programs';

MERGE (k_functions:Knowledge {name: 'Functions and Procedures'})
SET k_functions.description = 'Understanding how to write and call functions, including parameters, return values, and function scope. Functions are fundamental to code organization and reusability.',
    k_functions.how_to_learn = 'Study function declaration and usage in your chosen language. Write many small functions. Practice passing parameters and returning values. Expected time: 2-3 weeks.',
    k_functions.remember_level = 'Recall how to declare functions, define parameters, and return values from functions',
    k_functions.understand_level = 'Explain why functions are useful, how parameters allow functions to be reusable, and how function scope isolates variables',
    k_functions.apply_level = 'Break programs into functions and call them appropriately from other functions',
    k_functions.analyze_level = 'Examine how function design affects code readability and reusability',
    k_functions.evaluate_level = 'Judge whether function boundaries and parameters are well-designed for maintainability',
    k_functions.create_level = 'Design comprehensive function libraries and establish function conventions for code organization';

MERGE (k_debugging_basics:Knowledge {name: 'Basic Debugging Techniques'})
SET k_debugging_basics.description = 'Understanding how to identify and fix errors in code using print statements, reading error messages, and logical analysis. Debugging is essential for turning broken code into working code.',
    k_debugging_basics.how_to_learn = 'Intentionally write buggy code and practice fixing it. Learn to read error messages carefully. Use print statements to track program execution. Expected time: 1-2 weeks.',
    k_debugging_basics.remember_level = 'Recall common error types: syntax errors, runtime errors, and logic errors',
    k_debugging_basics.understand_level = 'Explain what error messages mean and how they help identify problems in code',
    k_debugging_basics.apply_level = 'Use debugging techniques to locate and fix errors in programs',
    k_debugging_basics.analyze_level = 'Analyze error messages and execution traces to determine root causes',
    k_debugging_basics.evaluate_level = 'Judge the severity of bugs and prioritize which to fix first',
    k_debugging_basics.create_level = 'Develop systematic debugging strategies for complex codebases';

MERGE (k_input_output:Knowledge {name: 'Input and Output Operations'})
SET k_input_output.description = 'Understanding how programs receive input from users and display output to users or files. Input/output is how programs interact with the outside world.',
    k_input_output.how_to_learn = 'Write programs that accept user input and display results. Work with console input/output. Read files and write data to files. Expected time: 1-2 weeks.',
    k_input_output.remember_level = 'Recall how to print output to console and how to read user input in your programming language',
    k_input_output.understand_level = 'Explain the concept of standard input and output, and how programs can interact with users',
    k_input_output.apply_level = 'Write programs that accept user input, process it, and display results appropriately',
    k_input_output.analyze_level = 'Examine I/O patterns and identify inefficiencies or security issues',
    k_input_output.evaluate_level = 'Judge the quality of user-facing I/O and error messages',
    k_input_output.create_level = 'Design comprehensive I/O systems for complex applications';

// Core Knowledge (Developing/Competent Levels)

MERGE (k_oop:Knowledge {name: 'Object-Oriented Programming'})
SET k_oop.description = 'Understanding classes, objects, inheritance, polymorphism, and encapsulation. OOP is a major programming paradigm that allows organizing code around real-world concepts.',
    k_oop.how_to_learn = 'Study OOP principles through tutorials and books. Implement small projects using classes and inheritance. Refactor procedural code to OOP style. Expected time: 4-6 weeks.',
    k_oop.remember_level = 'Recall the definitions of classes, objects, methods, inheritance, and encapsulation',
    k_oop.understand_level = 'Explain how OOP concepts map to real-world entities and why OOP improves code organization',
    k_oop.apply_level = 'Design and implement classes with appropriate methods and properties for domain problems',
    k_oop.analyze_level = 'Examine class hierarchies and inheritance structures to assess design quality',
    k_oop.evaluate_level = 'Critique OOP designs for violations of SOLID principles and poor encapsulation',
    k_oop.create_level = 'Architect comprehensive object-oriented systems with well-designed class hierarchies';

MERGE (k_arrays_collections:Knowledge {name: 'Arrays and Collections'})
SET k_arrays_collections.description = 'Understanding how to work with collections of data including arrays, lists, sets, and dictionaries. Collections are essential for managing multiple values efficiently.',
    k_arrays_collections.how_to_learn = 'Work through collection data structure tutorials. Implement common collection operations. Practice iterating over collections. Expected time: 3-4 weeks.',
    k_arrays_collections.remember_level = 'Recall how to create arrays, lists, sets, and dictionaries and access their elements',
    k_arrays_collections.understand_level = 'Explain the differences between collection types and when to use each, and understand indexing and iteration',
    k_arrays_collections.apply_level = 'Use appropriate collection types to solve problems and perform operations like filtering and mapping',
    k_arrays_collections.analyze_level = 'Analyze collection usage patterns and identify inefficient implementations',
    k_arrays_collections.evaluate_level = 'Judge whether collection choices are optimal for performance and clarity',
    k_arrays_collections.create_level = 'Implement custom collection classes and design collection APIs';

MERGE (k_algorithms:Knowledge {name: 'Algorithm Fundamentals'})
SET k_algorithms.description = 'Understanding basic algorithms for sorting, searching, and common computational tasks. Algorithms are step-by-step procedures for solving problems.',
    k_algorithms.how_to_learn = 'Study algorithm pseudocode and implementations. Practice coding classic algorithms. Use visualization tools to understand algorithm behavior. Expected time: 4-6 weeks.',
    k_algorithms.remember_level = 'Recall the names and basic ideas behind common algorithms like bubble sort, linear search, and binary search',
    k_algorithms.understand_level = 'Explain how algorithms work, why different algorithms exist for the same problem, and their trade-offs',
    k_algorithms.apply_level = 'Implement algorithms correctly and choose appropriate algorithms for specific problems',
    k_algorithms.analyze_level = 'Analyze algorithm efficiency and predict performance on large datasets',
    k_algorithms.evaluate_level = 'Compare different algorithms and judge which is best suited for specific constraints',
    k_algorithms.create_level = 'Design original algorithms for novel problems and optimize existing implementations';

MERGE (k_version_control:Knowledge {name: 'Version Control Basics'})
SET k_version_control.description = 'Understanding Git and other version control systems for tracking code changes, collaborating with others, and maintaining project history. Version control is essential for any software project.',
    k_version_control.how_to_learn = 'Install Git and practice basic commands with a test repository. Work through GitHub guides. Collaborate on projects using version control. Expected time: 2-3 weeks.',
    k_version_control.remember_level = 'Recall basic Git commands: add, commit, push, pull, and branch',
    k_version_control.understand_level = 'Explain what commits represent, how branching allows parallel development, and why version control matters',
    k_version_control.apply_level = 'Use Git to manage code changes, create branches for features, and merge changes from others',
    k_version_control.analyze_level = 'Examine commit history to understand code evolution and identify changes',
    k_version_control.evaluate_level = 'Judge code changes in pull requests and provide meaningful review feedback',
    k_version_control.create_level = 'Establish version control workflows and branching strategies for teams';

MERGE (k_testing:Knowledge {name: 'Testing and Test-Driven Development'})
SET k_testing.description = 'Understanding how to write automated tests, design test cases, and use test frameworks. Testing ensures code works correctly and catches bugs early.',
    k_testing.how_to_learn = 'Learn a testing framework for your language. Write tests for existing code. Practice test-driven development (TDD). Expected time: 3-4 weeks.',
    k_testing.remember_level = 'Recall different types of tests: unit tests, integration tests, and end-to-end tests',
    k_testing.understand_level = 'Explain why automated testing improves code quality and how test-driven development works',
    k_testing.apply_level = 'Write unit tests for functions and use testing frameworks to verify code behavior',
    k_testing.analyze_level = 'Examine test coverage to identify untested code paths',
    k_testing.evaluate_level = 'Judge the quality of tests and identify missing test cases',
    k_testing.create_level = 'Design comprehensive testing strategies and build testing infrastructure for large projects';

MERGE (k_error_handling:Knowledge {name: 'Error Handling and Exceptions'})
SET k_error_handling.description = 'Understanding how to handle errors gracefully, use exception mechanisms, and prevent crashes. Proper error handling improves program robustness and user experience.',
    k_error_handling.how_to_learn = 'Study exception handling in your language. Practice try/catch blocks. Design custom exceptions. Expected time: 2-3 weeks.',
    k_error_handling.remember_level = 'Recall try/catch/finally syntax and common exception types',
    k_error_handling.understand_level = 'Explain why exceptions exist, how they propagate through code, and the difference between checked and unchecked exceptions',
    k_error_handling.apply_level = 'Write code that catches exceptions appropriately and handles error cases gracefully',
    k_error_handling.analyze_level = 'Examine error handling patterns and identify missing exception handlers',
    k_error_handling.evaluate_level = 'Judge whether error handling is appropriate for different failure scenarios',
    k_error_handling.create_level = 'Design robust error handling strategies and define error handling policies for teams';

MERGE (k_code_organization:Knowledge {name: 'Code Organization and Modules'})
SET k_code_organization.description = 'Understanding how to organize code into packages, modules, and namespaces. Good organization makes code maintainable and allows reuse.',
    k_code_organization.how_to_learn = 'Study module systems in your language. Refactor monolithic code into modules. Work on projects with clear module structure. Expected time: 3-4 weeks.',
    k_code_organization.remember_level = 'Recall how to create modules, import dependencies, and organize files into packages',
    k_code_organization.understand_level = 'Explain how modules encapsulate functionality and how dependencies between modules work',
    k_code_organization.apply_level = 'Organize code into well-structured modules and establish clear boundaries between components',
    k_code_organization.analyze_level = 'Examine module dependencies and identify circular dependencies or tight coupling',
    k_code_organization.evaluate_level = 'Judge module designs for maintainability, coherence, and reusability',
    k_code_organization.create_level = 'Architect large-scale module systems and establish module design standards';

MERGE (k_libraries:Knowledge {name: 'Using Libraries and Frameworks'})
SET k_libraries.description = 'Understanding how to use existing libraries and frameworks to accelerate development. Most real projects depend heavily on libraries.',
    k_libraries.how_to_learn = 'Choose 2-3 popular libraries. Read their documentation thoroughly. Build projects using these libraries. Study example code. Expected time: 4-6 weeks.',
    k_libraries.remember_level = 'Recall the purpose of major libraries and their key APIs',
    k_libraries.understand_level = 'Explain what problems libraries solve and how to identify which library to use for a task',
    k_libraries.apply_level = 'Use libraries correctly, integrate them into projects, and follow their conventions',
    k_libraries.analyze_level = 'Examine library code to understand implementation details and limitations',
    k_libraries.evaluate_level = 'Judge whether a library is appropriate for a use case and compare alternatives',
    k_libraries.create_level = 'Design reusable libraries and establish library design patterns for teams';

// Advanced Knowledge (Advanced Level)

MERGE (k_design_patterns:Knowledge {name: 'Design Patterns and Best Practices'})
SET k_design_patterns.description = 'Understanding proven solutions to common programming problems including patterns like Singleton, Observer, and Factory. Design patterns improve code quality and team communication.',
    k_design_patterns.how_to_learn = 'Study the Gang of Four design patterns book. Identify patterns in existing codebases. Apply patterns to new projects. Expected time: 6-8 weeks.',
    k_design_patterns.remember_level = 'Recall the names and basic structures of major design patterns',
    k_design_patterns.understand_level = 'Explain the problems each pattern solves and the trade-offs of using each pattern',
    k_design_patterns.apply_level = 'Recognize situations where design patterns apply and implement them appropriately',
    k_design_patterns.analyze_level = 'Examine existing code to identify which patterns are being used correctly or incorrectly',
    k_design_patterns.evaluate_level = 'Judge whether design pattern usage is appropriate for the problem context',
    k_design_patterns.create_level = 'Create novel patterns for domain-specific problems and establish pattern standards for teams';

MERGE (k_performance:Knowledge {name: 'Performance Optimization'})
SET k_performance.description = 'Understanding how to identify performance bottlenecks, measure execution speed, and optimize code for efficiency. Performance matters for user experience and infrastructure costs.',
    k_performance.how_to_learn = 'Learn profiling tools for your language. Identify bottlenecks in real projects. Study algorithm complexity. Practice optimizations. Expected time: 4-6 weeks.',
    k_performance.remember_level = 'Recall what Big O notation means and identify common performance problems like N² algorithms',
    k_performance.understand_level = 'Explain the trade-offs between speed and memory, and how algorithm choice affects performance',
    k_performance.apply_level = 'Use profiling tools to find bottlenecks and implement optimizations',
    k_performance.analyze_level = 'Analyze code to predict performance characteristics and identify inefficiencies',
    k_performance.evaluate_level = 'Judge whether performance optimizations are worth the implementation complexity',
    k_performance.create_level = 'Architect high-performance systems and establish performance optimization strategies';

MERGE (k_concurrency:Knowledge {name: 'Concurrency and Asynchronous Programming'})
SET k_concurrency.description = 'Understanding how to write programs that do multiple things at once using threading, async/await, or event loops. Concurrency is essential for responsive and scalable applications.',
    k_concurrency.how_to_learn = 'Study concurrency models in your language. Build multi-threaded applications. Work with async/await patterns. Expected time: 6-8 weeks.',
    k_concurrency.remember_level = 'Recall the differences between threads, processes, and async operations',
    k_concurrency.understand_level = 'Explain why concurrency is needed, how it improves performance, and what concurrency problems exist',
    k_concurrency.apply_level = 'Write multithreaded code and use concurrency primitives to coordinate between threads',
    k_concurrency.analyze_level = 'Identify race conditions, deadlocks, and other concurrency issues in code',
    k_concurrency.evaluate_level = 'Judge whether concurrency is needed and whether implementations are correct',
    k_concurrency.create_level = 'Design concurrent systems and establish concurrency patterns for high-throughput applications';

MERGE (k_security:Knowledge {name: 'Security and Secure Coding'})
SET k_security.description = 'Understanding security vulnerabilities, secure coding practices, and how to protect applications from attacks. Security is critical for user trust and data protection.',
    k_security.how_to_learn = 'Study OWASP security guidelines. Learn about common vulnerabilities: injection, XSS, CSRF. Practice secure coding. Expected time: 4-6 weeks.',
    k_security.remember_level = 'Recall common security vulnerabilities: SQL injection, XSS, CSRF, and buffer overflows',
    k_security.understand_level = 'Explain why vulnerabilities exist and how attackers exploit them',
    k_security.apply_level = 'Write code that defends against common attacks and follows security best practices',
    k_security.analyze_level = 'Review code for security issues and identify potential vulnerabilities',
    k_security.evaluate_level = 'Judge the security posture of applications and prioritize security improvements',
    k_security.create_level = 'Design secure systems and establish security standards for organizations';

MERGE (k_scalability:Knowledge {name: 'Scalability and Architecture'})
SET k_scalability.description = 'Understanding how to design systems that handle growth in users, data, or load. Scalability requires architectural decisions made early in development.',
    k_scalability.how_to_learn = 'Study distributed systems concepts. Learn about horizontal vs vertical scaling. Architect projects for scale. Expected time: 6-8 weeks.',
    k_scalability.remember_level = 'Recall scaling strategies: caching, load balancing, sharding, and microservices',
    k_scalability.understand_level = 'Explain why systems need to scale and the trade-offs between different scaling approaches',
    k_scalability.apply_level = 'Design architectures that can handle growth without complete rewrites',
    k_scalability.analyze_level = 'Examine system architectures to identify scalability bottlenecks',
    k_scalability.evaluate_level = 'Judge whether architectural choices are appropriate for anticipated scale',
    k_scalability.create_level = 'Architect large-scale distributed systems and establish scalability principles';

MERGE (k_code_quality:Knowledge {name: 'Code Quality and Maintainability'})
SET k_code_quality.description = 'Understanding metrics and practices that improve code quality: readability, consistency, documentation, and refactoring. Quality code is easier to maintain and modify.',
    k_code_quality.how_to_learn = 'Use linting and code analysis tools. Practice refactoring. Read clean code literature. Review high-quality codebases. Expected time: 4-6 weeks.',
    k_code_quality.remember_level = 'Recall code quality metrics: cyclomatic complexity, code coverage, and duplication percentage',
    k_code_quality.understand_level = 'Explain why code quality matters and how it affects team productivity and maintenance costs',
    k_code_quality.apply_level = 'Refactor code for clarity, eliminate duplication, and apply naming conventions',
    k_code_quality.analyze_level = 'Use metrics to identify code quality issues and prioritize improvements',
    k_code_quality.evaluate_level = 'Judge code quality standards and establish quality gates for teams',
    k_code_quality.create_level = 'Design code quality frameworks and establish organizational coding standards';

// Specialized Knowledge (Master Level)

MERGE (k_system_design:Knowledge {name: 'System Design and Architecture'})
SET k_system_design.description = 'Understanding how to design large-scale systems from first principles, making trade-off decisions about storage, compute, and communication. This is expertise in technical leadership.',
    k_system_design.how_to_learn = 'Study system design case studies and practice interviews. Design systems for real problems. Lead architectural discussions. Expected time: 8-12 weeks.',
    k_system_design.remember_level = 'Recall system design principles: separation of concerns, CAP theorem, and consistency models',
    k_system_design.understand_level = 'Explain how to approach system design problems and identify key design decisions',
    k_system_design.apply_level = 'Design scalable systems that meet specified requirements and constraints',
    k_system_design.analyze_level = 'Analyze existing systems to understand design choices and identify improvement opportunities',
    k_system_design.evaluate_level = 'Judge architectural proposals and provide informed feedback on design trade-offs',
    k_system_design.create_level = 'Architect novel systems and advance system design techniques in your field';

MERGE (k_advanced_patterns:Knowledge {name: 'Advanced Programming Paradigms'})
SET k_advanced_patterns.description = 'Understanding alternative programming paradigms beyond OOP: functional programming, reactive programming, and declarative styles. Different paradigms solve different problems well.',
    k_advanced_patterns.how_to_learn = 'Learn functional programming concepts. Study reactive programming frameworks. Apply different paradigms to projects. Expected time: 8-12 weeks.',
    k_advanced_patterns.remember_level = 'Recall key concepts of functional programming: pure functions, immutability, and composition',
    k_advanced_patterns.understand_level = 'Explain the benefits of different paradigms and when each is most appropriate',
    k_advanced_patterns.apply_level = 'Write code using functional and reactive styles appropriately within projects',
    k_advanced_patterns.analyze_level = 'Analyze code to identify which paradigm is dominant and its effects on correctness',
    k_advanced_patterns.evaluate_level = 'Judge whether paradigm choices lead to better solutions for specific problems',
    k_advanced_patterns.create_level = 'Design novel applications of programming paradigms and extend paradigm techniques';

MERGE (k_language_design:Knowledge {name: 'Language and Compiler Concepts'})
SET k_language_design.description = 'Understanding how programming languages are designed, how compilers work, and how language features affect program correctness and performance. This is deep technical knowledge.',
    k_language_design.how_to_learn = 'Study compiler construction books. Learn language grammar and syntax trees. Implement small language interpreters. Expected time: 10-12 weeks.',
    k_language_design.remember_level = 'Recall compiler phases: lexing, parsing, semantic analysis, code generation, and optimization',
    k_language_design.understand_level = 'Explain how language design choices affect what code you can write and how it executes',
    k_language_design.apply_level = 'Use knowledge of language internals to write more efficient and correct code',
    k_language_design.analyze_level = 'Analyze how language features compile to machine code and understand performance implications',
    k_language_design.evaluate_level = 'Judge whether language choices are optimal for specific problem domains',
    k_language_design.create_level = 'Design new programming languages and advance language design theory';

MERGE (k_research:Knowledge {name: 'Programming Research and Innovation'})
SET k_research.description = 'Understanding how to stay current with programming research, evaluate new techniques, and contribute to the advancement of the field. This represents continuous innovation and learning.',
    k_research.how_to_learn = 'Read academic papers and conference talks. Experiment with new technologies. Contribute to open source projects. Expected time: Ongoing practice.',
    k_research.remember_level = 'Recall major research areas in programming: type systems, verification, symbolic execution, and program synthesis',
    k_research.understand_level = 'Explain current research directions and how they might impact practical programming',
    k_research.apply_level = 'Evaluate new techniques for adoption in your work and contribute to innovation',
    k_research.analyze_level = 'Analyze research papers to understand their contributions and limitations',
    k_research.evaluate_level = 'Judge the significance of research and its practical applicability',
    k_research.create_level = 'Conduct original research and advance the state of programming knowledge';

// ============================================================
// Agent 2b: Skill Nodes
// ============================================================

// Basic Programming Skills (Novice Level)

MERGE (s_variables:Skill {name: 'Variable Declaration and Management'})
SET s_variables.description = 'The ability to declare, initialize, and manage variables correctly, understanding how to assign values, use appropriate data types, and manage variable scope. This is a fundamental skill for writing any functional code.',
    s_variables.how_to_develop = 'Write simple programs with multiple variables. Practice assigning and reassigning values. Experiment with different data types. Use print statements to verify variable values. Expected time: 1-2 weeks of daily practice.',
    s_variables.novice_level = 'Can declare variables and assign simple values. Often needs references for syntax. Understands basic types: int, string, boolean. To progress: Write programs that use many different variables and types.',
    s_variables.advanced_beginner_level = 'Declares and initializes variables correctly without reference. Understands scope at a basic level. Can choose appropriate types for most cases. To progress: Practice with complex variable lifecycles and scope interactions.',
    s_variables.competent_level = 'Uses variables effectively with correct scoping. Avoids common mistakes like uninitialized variables. Makes sound type choices. To progress: Learn about memory implications and advanced type systems.',
    s_variables.proficient_level = 'Intuitively uses variables with perfect scoping and type choices. Rarely makes variable-related errors. To progress: Master advanced type systems and memory-efficient variable management.',
    s_variables.expert_level = 'Complete mastery of variable systems including complex scoping, memory management, and type systems. Can design variable systems for languages or frameworks.';

MERGE (s_control_flow:Skill {name: 'Control Flow Implementation'})
SET s_control_flow.description = 'The ability to implement conditional logic (if/else), loops (for/while), and branching to direct program execution based on different conditions. Control flow is essential for creating programs that respond to inputs.',
    s_control_flow.how_to_develop = 'Write programs with nested conditionals. Implement loops with different termination conditions. Solve algorithm problems that require complex control flow. Practice tracing code execution by hand. Expected time: 2-3 weeks.',
    s_control_flow.novice_level = 'Can write simple if/else statements and basic for loops. Syntax is often looked up. Struggles with nested structures. To progress: Practice nested conditionals and different loop types.',
    s_control_flow.advanced_beginner_level = 'Writes if/else chains and nested loops independently. Understands different loop types but default to familiar ones. To progress: Solve problems requiring complex control flow patterns.',
    s_control_flow.competent_level = 'Implements complex control flow including nested conditionals and loops correctly. Makes appropriate loop choices. To progress: Refactor control flow for clarity and efficiency.',
    s_control_flow.proficient_level = 'Designs control flow patterns intuitively. Recognizes and refactors inefficient patterns. To progress: Master advanced control flow techniques and pattern recognition.',
    s_control_flow.expert_level = 'Designs sophisticated control flow architectures. Optimizes complex logic for clarity and performance. Can teach control flow patterns to others.';

MERGE (s_function_writing:Skill {name: 'Function Writing and Composition'})
SET s_function_writing.description = 'The ability to write well-designed functions with appropriate parameters and return values, understanding decomposition of problems into functions, and composing functions together. Functions are the building blocks of organized code.',
    s_function_writing.how_to_develop = 'Write many small functions. Practice decomposing programs into functions. Refactor code to eliminate duplication by extracting functions. Study well-designed function libraries. Expected time: 2-3 weeks.',
    s_function_writing.novice_level = 'Can write simple functions with parameters and return values. Often writes monolithic code. To progress: Practice decomposing problems into multiple functions.',
    s_function_writing.advanced_beginner_level = 'Breaks programs into functions and composes them appropriately. Sometimes makes poor function boundary decisions. To progress: Learn about function design principles and refactoring.',
    s_function_writing.competent_level = 'Designs functions with clear boundaries and appropriate parameters. Avoids parameter bloat and side effects. To progress: Master higher-order functions and functional composition.',
    s_function_writing.proficient_level = 'Functions are well-designed intuitively. Can instantly see when refactoring would improve structure. To progress: Design function libraries and APIs.',
    s_function_writing.expert_level = 'Designs elegant function systems with perfect composition. Architects function-based frameworks and libraries.';

MERGE (s_basic_debugging:Skill {name: 'Basic Debugging and Error Identification'})
SET s_basic_debugging.description = 'The ability to identify why code is not working, using error messages, print statements, and logical reasoning to locate and fix bugs. Debugging is essential for turning broken code into working code.',
    s_basic_debugging.how_to_develop = 'Write intentionally buggy code and practice fixing it. Learn error message syntax for your language. Use print statements to trace execution. Practice explaining what code does. Expected time: 1-2 weeks.',
    s_basic_debugging.novice_level = 'Reads error messages but often confused about what they mean. Uses print statements randomly. To progress: Learn to systematically trace code execution.',
    s_basic_debugging.advanced_beginner_level = 'Understands error messages and can locate obvious bugs. Systematically uses print statements. To progress: Learn to identify logic errors without running code.',
    s_basic_debugging.competent_level = 'Quickly identifies most bugs using error messages and code inspection. Can trace complex control flow. To progress: Learn debugger tools and advanced techniques.',
    s_basic_debugging.proficient_level = 'Finds bugs rapidly through intuitive code reading. Rarely needs to run code to understand problems. To progress: Mentor others in debugging.',
    s_basic_debugging.expert_level = 'Can identify complex bugs instantly. Teaches debugging techniques to others. Designs systems that are easy to debug.';

MERGE (s_input_output:Skill {name: 'Input/Output and File Operations'})
SET s_input_output.description = 'The ability to read input from users and files, and write output to console and files. I/O operations are how programs interact with the outside world and persist data.',
    s_input_output.how_to_develop = 'Write programs that accept user input. Read and write text files. Work with CSV and JSON formats. Handle input errors gracefully. Expected time: 1-2 weeks.',
    s_input_output.novice_level = 'Can print to console and read basic user input. File operations are looked up. To progress: Write programs that read and write multiple files.',
    s_input_output.advanced_beginner_level = 'Reads and writes files independently. Understands streams and buffering at basic level. To progress: Handle errors in file operations and work with structured formats.',
    s_input_output.competent_level = 'Handles file I/O correctly including error handling. Works with common file formats. To progress: Learn advanced I/O techniques and performance optimization.',
    s_input_output.proficient_level = 'Designs I/O operations intuitively with proper error handling. To progress: Optimize I/O performance for large files.',
    s_input_output.expert_level = 'Designs sophisticated I/O systems. Optimizes for performance and reliability. Handles edge cases seamlessly.';

// Intermediate Programming Skills (Developing/Competent Level)

MERGE (s_data_structures:Skill {name: 'Data Structure Usage'})
SET s_data_structures.description = 'The ability to select and use appropriate data structures (arrays, lists, sets, maps) for problems, understanding the performance trade-offs of different structures. Choosing correct data structures dramatically improves code efficiency.',
    s_data_structures.how_to_develop = 'Study different data structures and their operations. Solve problems using various data structures. Measure performance differences. Refactor code to use better structures. Expected time: 3-4 weeks.',
    s_data_structures.novice_level = 'Uses arrays for most problems. Understands basic lists and dictionaries. To progress: Learn when different structures are more appropriate.',
    s_data_structures.advanced_beginner_level = 'Uses different structures appropriately for common patterns. Sometimes suboptimal choices. To progress: Analyze performance implications of structure choices.',
    s_data_structures.competent_level = 'Selects appropriate structures based on problem requirements. Understands performance implications. To progress: Learn advanced structures and custom implementations.',
    s_data_structures.proficient_level = 'Intuitively chooses optimal structures. Can quickly assess performance trade-offs. To progress: Design custom data structures for specialized problems.',
    s_data_structures.expert_level = 'Designs sophisticated data structures for specialized problems. Optimizes for specific access patterns.';

MERGE (s_oop_basics:Skill {name: 'Object-Oriented Programming Design'})
SET s_oop_basics.description = 'The ability to design and implement classes, inheritance hierarchies, and object interactions, understanding encapsulation and polymorphism. OOP is a major programming paradigm that organizes code around objects.',
    s_oop_basics.how_to_develop = 'Study OOP principles through examples. Refactor procedural code into OOP. Implement class hierarchies. Practice different design patterns. Expected time: 4-6 weeks.',
    s_oop_basics.novice_level = 'Can write simple classes with methods and properties. Inheritance is confusing. To progress: Study class design and inheritance relationships.',
    s_oop_basics.advanced_beginner_level = 'Designs classes with inheritance but sometimes violates encapsulation. Beginning to understand polymorphism. To progress: Learn about SOLID principles and better class design.',
    s_oop_basics.competent_level = 'Designs class hierarchies that follow SOLID principles. Uses polymorphism appropriately. To progress: Learn advanced OOP patterns and techniques.',
    s_oop_basics.proficient_level = 'Designs elegant OOP systems intuitively. Classes are well-encapsulated and loosely coupled. To progress: Mentor others in OOP design.',
    s_oop_basics.expert_level = 'Architects sophisticated OOP systems. Designs elegant inheritance hierarchies and interfaces.';

MERGE (s_version_control:Skill {name: 'Version Control Workflows'})
SET s_version_control.description = 'The ability to use Git effectively in team environments, including branching, merging, rebasing, and resolving conflicts. Version control enables collaboration and project history tracking.',
    s_version_control.how_to_develop = 'Use Git on team projects. Practice branching and merging strategies. Resolve merge conflicts. Learn advanced Git workflows. Expected time: 2-3 weeks.',
    s_version_control.novice_level = 'Uses basic Git commands: add, commit, push, pull. Branching is avoided or causes confusion. To progress: Practice feature branches and merging.',
    s_version_control.advanced_beginner_level = 'Creates branches for features and merges independently. Sometimes struggles with conflicts. To progress: Learn rebase and advanced merge strategies.',
    s_version_control.competent_level = 'Manages complex branching and merging scenarios. Resolves conflicts cleanly. To progress: Design branching strategies for teams.',
    s_version_control.proficient_level = 'Manages complex multi-developer workflows intuitively. Teaches version control to others. To progress: Design organizational Git workflows.',
    s_version_control.expert_level = 'Designs sophisticated version control strategies for large teams.';

MERGE (s_testing:Skill {name: 'Automated Testing'})
SET s_testing.description = 'The ability to write automated tests that verify code correctness, using testing frameworks and designing effective test cases. Automated testing catches bugs early and documents expected behavior.',
    s_testing.how_to_develop = 'Learn a testing framework for your language. Write tests for existing code. Practice test-driven development (TDD). Analyze test coverage. Expected time: 3-4 weeks.',
    s_testing.novice_level = 'Can write simple unit tests that verify basic functionality. Tests are often fragile. To progress: Learn to write more robust and maintainable tests.',
    s_testing.advanced_beginner_level = 'Writes unit tests for most functions. Understands different test types. To progress: Learn to design tests for edge cases and failures.',
    s_testing.competent_level = 'Writes comprehensive tests covering normal and edge cases. Uses testing frameworks effectively. To progress: Learn test-driven development and advanced testing techniques.',
    s_testing.proficient_level = 'Designs comprehensive test strategies intuitively. Tests are clear and maintainable. To progress: Mentor others in testing practices.',
    s_testing.expert_level = 'Designs sophisticated testing strategies and testing infrastructure.';

MERGE (s_error_handling:Skill {name: 'Error Handling and Exception Management'})
SET s_error_handling.description = 'The ability to handle errors gracefully using exception mechanisms, designing custom exceptions, and writing code that fails safely. Proper error handling improves robustness and user experience.',
    s_error_handling.how_to_develop = 'Study exception handling in your language. Write code that catches and handles errors. Design custom exception hierarchies. Practice failure scenarios. Expected time: 2-3 weeks.',
    s_error_handling.novice_level = 'Uses try/catch blocks but often catches broadly. Exception types are not well understood. To progress: Learn to design specific exception handlers.',
    s_error_handling.advanced_beginner_level = 'Catches specific exceptions appropriately. Beginning to design custom exceptions. To progress: Learn when to propagate vs. handle exceptions.',
    s_error_handling.competent_level = 'Designs robust error handling with appropriate recovery strategies. To progress: Design error handling policies and strategies.',
    s_error_handling.proficient_level = 'Designs error handling intuitively. Code fails gracefully in all scenarios. To progress: Mentor others in error handling.',
    s_error_handling.expert_level = 'Designs sophisticated error handling systems for complex applications.';

MERGE (s_code_refactoring:Skill {name: 'Code Refactoring and Improvement'})
SET s_code_refactoring.description = 'The ability to improve existing code without changing its behavior, eliminating duplication, improving clarity, and making code more maintainable. Refactoring keeps code quality high over time.',
    s_code_refactoring.how_to_develop = 'Study refactoring techniques and patterns. Refactor existing codebases. Use automated refactoring tools. Read code quality literature. Expected time: 3-4 weeks.',
    s_code_refactoring.novice_level = 'Can identify obvious duplication and extract to functions. Refactoring often breaks code. To progress: Learn safe refactoring techniques.',
    s_code_refactoring.advanced_beginner_level = 'Refactors code safely to eliminate duplication. Improves clarity incrementally. To progress: Learn to recognize deeper refactoring opportunities.',
    s_code_refactoring.competent_level = 'Refactors code consistently to improve structure and clarity. To progress: Learn architectural refactoring techniques.',
    s_code_refactoring.proficient_level = 'Refactors code intuitively for clarity and maintainability. To progress: Mentor others in refactoring.',
    s_code_refactoring.expert_level = 'Performs sophisticated architectural refactoring to improve large systems.';

// Advanced Programming Skills (Advanced Level)

MERGE (s_algorithm_design:Skill {name: 'Algorithm Design and Optimization'})
SET s_algorithm_design.description = 'The ability to design algorithms for problems, analyze their complexity, and optimize them for performance. Algorithm knowledge enables writing efficient code that scales.',
    s_algorithm_design.how_to_develop = 'Study algorithm analysis and complexity. Solve algorithm problems systematically. Implement classic algorithms. Optimize existing algorithms. Expected time: 6-8 weeks.',
    s_algorithm_design.novice_level = 'Understands basic algorithms like sorting and searching. Big O notation is unfamiliar. To progress: Study algorithm complexity and analysis.',
    s_algorithm_design.advanced_beginner_level = 'Understands Big O notation and can estimate algorithm complexity. Implements basic algorithms. To progress: Solve complex algorithm problems.',
    s_algorithm_design.competent_level = 'Analyzes algorithm complexity accurately. Selects appropriate algorithms for problems. To progress: Design novel algorithms and optimize existing ones.',
    s_algorithm_design.proficient_level = 'Intuitively designs efficient algorithms. Can quickly identify inefficiencies. To progress: Solve extremely complex algorithm problems.',
    s_algorithm_design.expert_level = 'Designs novel algorithms for complex problems. Advances algorithmic techniques in the field.';

MERGE (s_design_patterns:Skill {name: 'Design Patterns Application'})
SET s_design_patterns.description = 'The ability to recognize common programming problems, apply proven design patterns to solve them, and judge when patterns are appropriate. Patterns improve code structure and team communication.',
    s_design_patterns.how_to_develop = 'Study Gang of Four design patterns. Identify patterns in existing codebases. Apply patterns to new projects. Debate pattern choices with teammates. Expected time: 6-8 weeks.',
    s_design_patterns.novice_level = 'Aware of some design patterns but rarely applies them intentionally. To progress: Study patterns deeply and identify them in code.',
    s_design_patterns.advanced_beginner_level = 'Recognizes some patterns in code and applies a few patterns. To progress: Study more patterns and practice applying them appropriately.',
    s_design_patterns.competent_level = 'Applies design patterns appropriately to solve common problems. To progress: Learn advanced patterns and anti-patterns.',
    s_design_patterns.proficient_level = 'Intuitively recognizes when patterns apply and applies them elegantly. To progress: Mentor others in patterns.',
    s_design_patterns.expert_level = 'Designs novel patterns for domain-specific problems. Advances pattern design.';

MERGE (s_concurrency:Skill {name: 'Concurrent and Asynchronous Programming'})
SET s_concurrency.description = 'The ability to write programs that do multiple things at once using threads, async/await, or event loops, understanding synchronization and avoiding race conditions. Concurrency enables responsive and scalable applications.',
    s_concurrency.how_to_develop = 'Study concurrency models in your language. Build multi-threaded applications. Work with async/await patterns. Debug concurrency issues. Expected time: 6-8 weeks.',
    s_concurrency.novice_level = 'Understands basic threading concepts but struggles to implement correctly. To progress: Study synchronization primitives and practice debugging.',
    s_concurrency.advanced_beginner_level = 'Writes simple multi-threaded code but creates race conditions. To progress: Learn synchronization techniques and async patterns.',
    s_concurrency.competent_level = 'Writes correct concurrent code using proper synchronization. To progress: Learn advanced concurrency patterns and high-performance techniques.',
    s_concurrency.proficient_level = 'Designs concurrent systems that work correctly and efficiently. To progress: Optimize high-performance concurrent systems.',
    s_concurrency.expert_level = 'Designs sophisticated concurrent systems with expert synchronization and performance.';

MERGE (s_code_review:Skill {name: 'Code Review and Feedback'})
SET s_code_review.description = 'The ability to review code critically, identify issues, provide constructive feedback, and guide improvements. Code reviews improve quality and spread knowledge across teams.',
    s_code_review.how_to_develop = 'Review colleagues code regularly. Study code review guidelines and best practices. Practice giving constructive feedback. Learn to balance criticism with encouragement. Expected time: 4-6 weeks.',
    s_code_review.novice_level = 'Can identify obvious bugs and style issues. Feedback is sometimes harsh or unclear. To progress: Learn to provide constructive feedback.',
    s_code_review.advanced_beginner_level = 'Identifies bugs and design issues clearly. Provides helpful feedback. Sometimes too lenient or strict. To progress: Learn to balance feedback appropriately.',
    s_code_review.competent_level = 'Reviews code thoroughly and provides balanced, constructive feedback. To progress: Mentor others in code review.',
    s_code_review.proficient_level = 'Reviews code with great insight and tact. Guides authors to better solutions. To progress: Set code review standards for teams.',
    s_code_review.expert_level = 'Provides expert code reviews that significantly improve code quality and guide architectural decisions.';

MERGE (s_debugging_advanced:Skill {name: 'Advanced Debugging Techniques'})
SET s_debugging_advanced.description = 'The ability to debug complex issues using debuggers, profilers, and advanced techniques, including reproducing intermittent bugs and analyzing system behavior. Advanced debugging enables solving difficult problems.',
    s_debugging_advanced.how_to_develop = 'Learn debugger tools for your language and platform. Use profilers to find bottlenecks. Debug production issues. Practice with race conditions and intermittent bugs. Expected time: 4-6 weeks.',
    s_debugging_advanced.novice_level = 'Uses print statements exclusively. Debugger tools are not well understood. To progress: Learn to use debugger tools effectively.',
    s_debugging_advanced.advanced_beginner_level = 'Uses debugger for basic debugging. Understands breakpoints and stepping. To progress: Learn profiling and advanced debugging techniques.',
    s_debugging_advanced.competent_level = 'Uses debuggers and profilers to find issues effectively. To progress: Learn to debug race conditions and complex issues.',
    s_debugging_advanced.proficient_level = 'Debugs complex issues rapidly using advanced techniques. To progress: Mentor others in advanced debugging.',
    s_debugging_advanced.expert_level = 'Solves extremely complex debugging problems with expert techniques and tools.';

MERGE (s_performance_optimization:Skill {name: 'Performance Optimization'})
SET s_performance_optimization.description = 'The ability to identify performance bottlenecks using profiling, understand performance trade-offs, and optimize code for speed and efficiency without sacrificing correctness. Performance optimization enables scalable systems.',
    s_performance_optimization.how_to_develop = 'Learn profiling tools for your language. Measure execution time and memory usage. Identify bottlenecks and optimize them. Study performance optimization case studies. Expected time: 4-6 weeks.',
    s_performance_optimization.novice_level = 'Optimizes obvious inefficiencies like N² algorithms. Premature optimization is common. To progress: Learn to profile and measure before optimizing.',
    s_performance_optimization.advanced_beginner_level = 'Profiles code and finds bottlenecks. Optimizations are sometimes effective. To progress: Learn to optimize algorithms and data structures.',
    s_performance_optimization.competent_level = 'Profiles effectively and implements optimizations. Understands trade-offs. To progress: Learn advanced optimization techniques.',
    s_performance_optimization.proficient_level = 'Optimizes code intuitively and effectively. Balances performance with other concerns. To progress: Mentor others in optimization.',
    s_performance_optimization.expert_level = 'Performs sophisticated performance optimization of complex systems.';

// Expert Programming Skills (Master Level)

MERGE (s_system_design:Skill {name: 'System Architecture and Design'})
SET s_system_design.description = 'The ability to design large-scale systems from first principles, making trade-off decisions about storage, computation, communication, and availability. Architectural expertise enables building systems that scale and endure.',
    s_system_design.how_to_develop = 'Study system design fundamentals and case studies. Design systems for complex real-world problems. Lead architectural discussions. Analyze existing large-scale systems. Expected time: 8-12 weeks.',
    s_system_design.novice_level = 'Understands basic system design concepts but struggles with complex tradeoffs. To progress: Study more case studies and architectural patterns.',
    s_system_design.advanced_beginner_level = 'Designs systems for simple requirements. Misses important considerations at scale. To progress: Study distributed systems and scalability principles.',
    s_system_design.competent_level = 'Designs systems that meet requirements and consider scalability. To progress: Learn advanced architectural patterns and techniques.',
    s_system_design.proficient_level = 'Designs scalable systems intuitively with good trade-off decisions. To progress: Design extremely complex systems.',
    s_system_design.expert_level = 'Designs sophisticated large-scale systems with expert architectural decisions.';

MERGE (s_technical_leadership:Skill {name: 'Technical Leadership and Mentoring'})
SET s_technical_leadership.description = 'The ability to guide technical teams, make architectural decisions, mentor junior developers, and advance technical practices across organizations. Leadership ensures quality and knowledge sharing.',
    s_technical_leadership.how_to_develop = 'Lead technical projects and decisions. Mentor junior developers regularly. Establish coding standards and best practices. Learn leadership and communication skills. Expected time: Ongoing development.',
    s_technical_leadership.novice_level = 'Uncomfortable in leadership roles. Guidance is sometimes unclear or unhelpful. To progress: Study leadership principles and practice mentoring.',
    s_technical_leadership.advanced_beginner_level = 'Can guide small teams and mentor individuals. Leadership is developing. To progress: Lead larger initiatives and develop more influence.',
    s_technical_leadership.competent_level = 'Leads teams effectively. Makes sound technical decisions. Mentors developers. To progress: Expand influence and impact across teams.',
    s_technical_leadership.proficient_level = 'Leads technical strategy across teams. Mentors effectively. Establishes high standards. To progress: Mentor other leaders.',
    s_technical_leadership.expert_level = 'Provides expert technical leadership across large organizations. Advances technical culture and practices.';

MERGE (s_innovation:Skill {name: 'Innovation and Problem-Solving'})
SET s_innovation.description = 'The ability to apply creative thinking to difficult programming problems, explore novel solutions, and advance programming techniques. Innovation drives progress and competitive advantage.',
    s_innovation.how_to_develop = 'Tackle complex, unsolved problems. Study novel approaches in research and practice. Experiment with new technologies. Share innovations with communities. Expected time: Ongoing practice.',
    s_innovation.novice_level = 'Applies existing solutions. Struggling with novel problems. To progress: Study how others approach novel problems.',
    s_innovation.advanced_beginner_level = 'Attempts novel solutions but they often fail. To progress: Study more deeply and develop problem-solving intuition.',
    s_innovation.competent_level = 'Solves novel problems with creative approaches. To progress: Innovate at larger scales and share innovations.',
    s_innovation.proficient_level = 'Regularly innovates and solves difficult problems creatively. To progress: Advance the state of the art.',
    s_innovation.expert_level = 'Drives innovation and advances programming techniques at the cutting edge.';

MERGE (s_synthesis:Skill {name: 'Synthesis of Multiple Paradigms'})
SET s_synthesis.description = 'The ability to combine different programming paradigms (OOP, functional, reactive, procedural) appropriately within a single system. Paradigm synthesis enables elegant solutions to complex problems.',
    s_synthesis.how_to_develop = 'Study multiple programming paradigms deeply. Apply different paradigms to different parts of systems. Practice switching between paradigms. Expected time: 8-12 weeks.',
    s_synthesis.novice_level = 'Focused on one paradigm. Mixing paradigms causes confusion. To progress: Study other paradigms thoroughly.',
    s_synthesis.advanced_beginner_level = 'Understands multiple paradigms but struggles to combine them well. To progress: Practice combined approaches in real systems.',
    s_synthesis.competent_level = 'Appropriately mixes paradigms in systems. To progress: Develop deeper intuition about paradigm combinations.',
    s_synthesis.proficient_level = 'Combines paradigms elegantly and intuitively. To progress: Develop new paradigm combinations.',
    s_synthesis.expert_level = 'Expertly synthesizes paradigms to create elegant, powerful solutions.';

// ============================================================
// Agent 2c: Trait Nodes
// ============================================================

// Cognitive and Personality traits essential to programming success (typically only 2-6 traits total)

MERGE (t_analytical_thinking:Trait {name: 'Analytical Thinking'})
SET t_analytical_thinking.description = 'The ability to break down complex problems into smaller, manageable parts and think systematically about solutions. Analytical thinking is fundamental to understanding code logic, debugging issues, and designing systems.',
    t_analytical_thinking.measurement_criteria = 'Assessed through ability to decompose problems, trace code execution logically, and identify root causes. Low (0-25): Struggles to break down problems, jumps to conclusions without analysis. Moderate (26-50): Can analyze simple problems but misses nuances in complex situations. High (51-75): Naturally decomposes problems, thinks systematically about solutions. Exceptional (76-100): Instantly breaks down even highly complex problems and identifies non-obvious root causes.';

MERGE (t_pattern_recognition:Trait {name: 'Pattern Recognition'})
SET t_pattern_recognition.description = 'The ability to identify, recognize, and internalize patterns in code structure, logic, and behavior. Pattern recognition accelerates learning, debugging, and identifying opportunities for refactoring.',
    t_pattern_recognition.measurement_criteria = 'Assessed through speed and accuracy in identifying patterns across code, recognizing bugs, and seeing refactoring opportunities. Low (0-25): Misses obvious patterns even when shown explicitly. Moderate (26-50): Recognizes common patterns in familiar contexts. High (51-75): Quickly identifies patterns across different code domains. Exceptional (76-100): Intuitively recognizes complex patterns and anticipates code behavior from minimal information.';

MERGE (t_perseverance:Trait {name: 'Perseverance and Problem-Solving Tenacity'})
SET t_perseverance.description = 'The ability to persist through difficult debugging sessions, algorithm challenges, and learning plateaus without becoming discouraged. Programming involves frequent failures and frustration that require sustained effort.',
    t_perseverance.measurement_criteria = 'Assessed through willingness to tackle hard problems, response to setbacks, and consistency in effort. Low (0-25): Gives up quickly when encountering difficult problems. Moderate (26-50): Continues effort but can become frustrated with prolonged challenges. High (51-75): Stays focused through difficult problems and maintains effort over extended periods. Exceptional (76-100): Thrives on difficult challenges and maintains exceptional effort regardless of setbacks.';

MERGE (t_attention_to_detail:Trait {name: 'Attention to Detail'})
SET t_attention_to_detail.description = 'The ability to notice small errors, inconsistencies, and edge cases in code. Programming requires precision; a single misplaced character or forgotten edge case can break entire systems.',
    t_attention_to_detail.measurement_criteria = 'Assessed through error detection ability, code review quality, and test comprehensiveness. Low (0-25): Frequently introduces syntax errors and overlooks obvious mistakes. Moderate (26-50): Catches most errors but misses some edge cases. High (51-75): Consistently catches errors and edge cases during development and review. Exceptional (76-100): Catches almost all errors, inconsistencies, and edge cases; rarely introduces bugs.';

MERGE (t_adaptability:Trait {name: 'Adaptability and Learning Agility'})
SET t_adaptability.description = 'The ability to quickly learn new languages, frameworks, and technologies, and adapt to changing requirements and paradigms. The programming field evolves rapidly and requires continuous learning.',
    t_adaptability.measurement_criteria = 'Assessed through speed of learning new technologies, comfort with unfamiliar tools, and ability to adjust to requirement changes. Low (0-25): Struggles to learn new languages or frameworks, resistant to change. Moderate (26-50): Can learn new technologies with significant time and effort. High (51-75): Learns new technologies quickly and adapts well to changes. Exceptional (76-100): Rapidly masters new languages and paradigms, thrives on learning and change.';

MERGE (t_creative_problem_solving:Trait {name: 'Creative Problem-Solving'})
SET t_creative_problem_solving.description = 'The ability to approach problems from novel angles, think outside the box, and develop elegant solutions that others might not see. Creative thinking enables innovation and elegant code design.',
    t_creative_problem_solving.measurement_criteria = 'Assessed through novelty of solutions, elegance of designs, and ability to innovate. Low (0-25): Applies standard solutions mechanically, struggling with problems that lack obvious answers. Moderate (26-50): Develops workable solutions, occasional creative insights. High (51-75): Regularly finds elegant solutions and creative approaches. Exceptional (76-100): Consistently develops novel, elegant solutions that advance the state of the art.';

// ============================================================
// Agent 2d: Milestone Nodes
// ============================================================

// Novice Level Milestones (1-2 milestones)
// Entry-level achievements that mark the beginning of programming journey

MERGE (m_first_program:Milestone {name: 'Complete First Functional Program'})
SET m_first_program.description = 'Successfully write, run, and verify a complete program that solves a simple problem with correct output. This milestone marks the transition from learning syntax to actually programming.',
    m_first_program.how_to_achieve = 'Follow a structured tutorial or course in your chosen language. Start with a simple problem: calculate a sum, convert temperatures, process user input. Write the program yourself rather than copy-pasting. Test it with multiple inputs to verify correctness. Most beginners achieve this in their first 1-2 weeks of consistent practice (5-10 hours total).';

MERGE (m_first_commit:Milestone {name: 'Make First Git Commit'})
SET m_first_commit.description = 'Initialize a Git repository and make your first commit with your code. This marks entry into version control and collaborative development practices.',
    m_first_commit.how_to_achieve = 'Initialize Git in a project directory. Stage your code files. Write a clear commit message describing the changes. Push to GitHub or another remote repository if possible. This typically takes 30 minutes to an hour for first-time users and establishes the foundation for professional development practices.';

// Developing Level Milestones (2-3 milestones)
// Intermediate achievements demonstrating growing competence

MERGE (m_multistage_program:Milestone {name: 'Develop Multi-File Program'})
SET m_multistage_program.description = 'Successfully organize code across multiple files using modules or packages, demonstrating ability to structure larger programs and understand file organization.',
    m_multistage_program.how_to_achieve = 'Take an existing program or start a new one. Identify natural divisions of functionality (UI, data handling, calculations). Create separate files/modules for each section. Import/include these modules correctly. Verify the program still works with all pieces integrated. This typically takes 2-3 weeks for developers at this level and represents significant growth in code organization skills.';

MERGE (m_pull_request:Milestone {name: 'Contribute Via Pull Request'})
SET m_pull_request.description = 'Create a feature branch, develop code changes, and submit a pull request for code review. This marks entry into collaborative development and peer review processes.',
    m_pull_request.how_to_achieve = 'Fork or branch an existing project. Implement a feature or fix a bug on your branch. Write clear commit messages for your changes. Open a pull request with description of changes and rationale. Respond to review feedback and iterate. This typically occurs 2-4 weeks into development and demonstrates collaborative skills.';

MERGE (m_test_coverage:Milestone {name: 'Achieve 70% Test Coverage'})
SET m_test_coverage.description = 'Write automated tests that cover 70% of a program codebase, demonstrating commitment to quality assurance and testing practices.',
    m_test_coverage.how_to_achieve = 'Take an existing program or new project. Learn a testing framework for your language. Write unit tests for core functionality. Measure coverage using tools (coverage.py, nyc, etc.). Add tests until coverage reaches 70%. Aim for meaningful tests, not just line coverage. This typically takes 3-4 weeks and requires 30-40 hours of effort.';

MERGE (m_language_switch:Milestone {name: 'Solve Problem in Second Language'})
SET m_language_switch.description = 'Successfully solve a meaningful programming problem in a second language, demonstrating language-agnostic programming knowledge and ability to adapt.',
    m_language_switch.how_to_achieve = 'Choose a second language (Python if you started with JavaScript, Java if you started with Python, etc.). Work through language-specific tutorials for 1-2 weeks. Implement a project (not hello world) in this new language. The project should be complex enough to require classes, functions, and control flow. Most developers achieve this 2-3 months into serious programming.';

// Competent Level Milestones (2-4 milestones)
// Significant achievements demonstrating solid professional capability

MERGE (m_architecture_design:Milestone {name: 'Design and Implement Scalable Architecture'})
SET m_architecture_design.description = 'Plan and execute a medium-scale application with clear architectural layers (data, business logic, presentation), demonstrating ability to think about system design.',
    m_architecture_design.how_to_achieve = 'Start with a project idea of moderate complexity (todo app with database, web app with multiple components, etc.). Plan the architecture before coding: identify layers, responsibilities, and interactions. Implement following the plan. Refactor as needed to maintain clean boundaries. The project should take 4-8 weeks and be substantial enough to demonstrate design thinking rather than ad-hoc development.';

MERGE (m_bug_investigation:Milestone {name: 'Solve Complex Bug Using Debugger'})
SET m_bug_investigation.description = 'Successfully identify and fix a non-obvious bug using debugger tools (breakpoints, stepping, watches), demonstrating advanced debugging capability.',
    m_bug_investigation.how_to_achieve = 'Encounter or create a subtle bug (timing issue, off-by-one error, incorrect state update, etc.) that print statements alone cannot reveal. Use your language debugger to set breakpoints, step through code, and watch variable values. Trace the execution to identify the root cause. Implement the fix. This milestone represents a significant jump in debugging capability and typically occurs after 3-4 months of development.';

MERGE (m_performance_optimization:Milestone {name: 'Improve Performance by 50%'})
SET m_performance_optimization.description = 'Profile an application, identify bottlenecks, and implement optimizations that deliver measurable 50% or greater improvement in performance metrics.',
    m_performance_optimization.how_to_achieve = 'Choose an application with performance issues or artificially complex data. Measure baseline performance (execution time, memory usage, or throughput). Use profiling tools to identify bottlenecks. Implement optimizations: improve algorithms, optimize data structures, reduce memory allocation, optimize loops. Verify the improvement meets the 50% target. Document what changed and why it improved performance. This typically takes 2-4 weeks and requires deep understanding of both the code and performance analysis.';

MERGE (m_open_source_contribution:Milestone {name: 'Contribute to Open Source Project'})
SET m_open_source_contribution.description = 'Submit code changes to an established open source project, getting merged after code review. This marks entry into the broader programming community.',
    m_open_source_contribution.how_to_achieve = 'Choose an open source project using your language and tools. Start small: fix a documentation error, improve a test, or resolve a tagged beginner issue. Fork the project, make your changes, and submit a pull request. Respond to reviews from maintainers. Once merged, celebrate: this is a significant professional milestone. Most developers are ready for this 3-6 months into serious programming.';

MERGE (m_code_review_mentor:Milestone {name: 'Lead Technical Code Review'})
SET m_code_review_mentor.description = 'Conduct a substantive code review of a colleague or teammate code, providing technical feedback and improvement guidance.',
    m_code_review_mentor.description = 'Review a colleague or team member code change in detail. Identify design issues, potential bugs, style improvements, and optimization opportunities. Provide clear, constructive feedback. Engage in discussion about the implementation. Have the submitter implement some or all of your suggested improvements. This milestone represents the beginning of taking on review and mentoring responsibility.';

// Advanced Level Milestones (2-4 milestones)
// Major professional achievements requiring substantial expertise

MERGE (m_production_system:Milestone {name: 'Ship Production System to Users'})
SET m_production_system.description = 'Develop and deploy a complete software system to real users, taking responsibility for uptime, stability, and user experience.',
    m_production_system.how_to_achieve = 'Plan a real application that solves an actual problem for an actual user base. Develop end-to-end including frontend, backend, database, and deployment. Set up monitoring, logging, and error handling. Launch to users. Support users through initial issues. Handle bug fixes and updates. This is a major milestone requiring 3-6 months of focused development and represents real-world programming capability.';

MERGE (m_technical_leadership_role:Milestone {name: 'Lead Technical Team or Project'})
SET m_technical_leadership_role.description = 'Take ownership of technical direction for a team or significant project, making architectural decisions and guiding other developers.',
    m_technical_leadership_role.how_to_achieve = 'Advocate for a technical project or initiative. Take leadership role: propose architecture, make technology decisions, define coding standards. Guide other developers through problems and reviews. Make decisions about trade-offs and priorities. Successfully deliver a project with team. This typically occurs 3-5 years into a programming career and requires both technical depth and interpersonal skills.';

MERGE (m_system_redesign:Milestone {name: 'Redesign and Modernize Legacy System'})
SET m_system_redesign.description = 'Take an existing, perhaps outdated system and successfully redesign it with modern architecture and techniques while maintaining functionality and user data.',
    m_system_redesign.how_to_achieve = 'Identify a legacy system with significant technical debt (old framework, tight coupling, poor testing, etc.). Plan a modernization strategy. Execute the migration incrementally: extract modules, rewrite components, improve tests, update dependencies. Maintain backward compatibility and data integrity throughout. Successfully serve all users without disruption. This milestone typically takes 3-6 months and demonstrates mastery of complex system evolution.';

MERGE (m_architecture_pattern:Milestone {name: 'Establish Architectural Pattern for Organization'})
SET m_architecture_pattern.description = 'Design and advocate for a significant architectural pattern or practice that gets adopted across multiple teams and projects in an organization.',
    m_architecture_pattern.how_to_achieve = 'Identify a recurring architectural problem across projects (microservices organization, deployment patterns, testing strategies, etc.). Design a comprehensive solution with examples. Document the pattern thoroughly. Present to stakeholders and teams. Help teams implement it. See adoption across 2+ teams/projects. This represents organizational influence and requires both technical expertise and communication skills.';

// Master Level Milestones (2-5 milestones)
// Exceptional achievements representing mastery and significant impact

MERGE (m_framework_design:Milestone {name: 'Design and Release Framework or Library'})
SET m_framework_design.description = 'Create a reusable framework or library that solves a significant class of problems, get it adopted by other developers or organizations, and maintain it as a public project.',
    m_framework_design.how_to_achieve = 'Identify a general problem that your experience has exposed (testing utilities, API frameworks, database abstractions, etc.). Design an elegant, general solution. Implement with comprehensive documentation and examples. Package and release publicly (npm, PyPI, GitHub, etc.). Promote and maintain the project. Track adoption and impact. A successful framework takes 6-12 months to reach meaningful adoption and represents deep expertise in a specific domain.';

MERGE (m_system_architecture_innovation:Milestone {name: 'Innovate System Architecture Approach'})
SET m_system_architecture_innovation.description = 'Develop or pioneer a novel architectural approach or system design pattern that meaningfully improves how problems in your domain are solved.',
    m_system_architecture_innovation.how_to_achieve = 'Identify limitations in existing architectural approaches. Conceive of a fundamentally different solution (event sourcing, CQRS, new microservices pattern, etc.). Develop proof of concept in a real project. Document thoroughly. Share through articles, talks, or open source. Help others adopt the approach. See it solve previously difficult problems in new ways. This represents true innovation and typically occurs after 5-10 years of specialization.';

MERGE (m_mentored_developers:Milestone {name: 'Successfully Mentor Multiple Developers to Senior Level'})
SET m_mentored_developers.description = 'Guide and develop multiple junior or mid-level programmers through their progression to senior/advanced level, directly impacting their careers and technical growth.',
    m_mentored_developers.how_to_achieve = 'Over several years, work closely with at least 3-5 developers at various levels. Provide regular feedback, guidance, and growth opportunities. Expose them to challenging problems and support them through the struggle. Review their code thoughtfully. Advocate for their growth and advancement. See them progress to senior positions. This milestone reflects long-term investment in others and is typical of strong engineering leaders.';

MERGE (m_research_contribution:Milestone {name: 'Contribute to Programming Research or Advancement'})
SET m_research_contribution.description = 'Contribute to programming research, either through publications, open source innovation, or advancement of techniques that are adopted and referenced by others in the field.',
    m_research_contribution.how_to_achieve = 'Conduct original research or innovation in programming (novel algorithm, performance improvement technique, new framework approach, etc.). Document thoroughly: write paper, create comprehensive open source project, or produce detailed technical analysis. Share with the community through conferences, publications, or repositories. See others cite your work and build on it. This represents the highest level of contribution and typically involves 8+ years of deep specialization.';

MERGE (m_conference_talk:Milestone {name: 'Present Technical Talk at Major Conference'})
SET m_conference_talk.description = 'Deliver a well-received technical presentation at a significant programming conference, sharing expertise with the broader programming community.',
    m_conference_talk.how_to_achieve = 'Develop deep expertise in a specific topic (architecture pattern, new framework, performance optimization, etc.). Write a compelling talk proposal. Get accepted to a known conference. Prepare and practice the talk. Deliver to an audience of 100+ programmers. Receive positive feedback and questions indicating audience engagement. This typically occurs after 5-10 years of focused expertise and represents recognition as a thought leader in a domain.';

MERGE (m_programming_language:Milestone {name: 'Learn and Apply Entirely New Programming Language Paradigm'})
SET m_programming_language.description = 'Deeply master a programming language with a fundamentally different paradigm from your primary experience (e.g., Lisp if you know OOP, Haskell if you know imperative, Prolog if you know procedural) and apply it meaningfully.',
    m_programming_language.how_to_achieve = 'Choose a language with a paradigm fundamentally different from your experience (functional, logic-based, concatenative, etc.). Study the language and paradigm for 4-8 weeks. Implement a substantial project in this language. Understand and internalize the different way of thinking. Optionally apply insights from this language back to your primary languages. This milestone typically occurs 5+ years into a programming career and requires intellectual flexibility and depth.';

// ============================================================
// Agent 3: Relationships
// ============================================================

// ============================================================
// SECTION 1: Component Prerequisites
// ============================================================

// Knowledge Prerequisites - foundation knowledge

MATCH (k1:Knowledge {name: 'Data Types and Variables'})
MATCH (k2:Knowledge {name: 'Programming Syntax Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Remember'}]->(k2);

MATCH (k1:Knowledge {name: 'Control Flow Logic'})
MATCH (k2:Knowledge {name: 'Programming Syntax Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Functions and Procedures'})
MATCH (k2:Knowledge {name: 'Control Flow Logic'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Functions and Procedures'})
MATCH (k2:Knowledge {name: 'Data Types and Variables'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Input and Output Operations'})
MATCH (k2:Knowledge {name: 'Programming Syntax Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Remember'}]->(k2);

MATCH (k1:Knowledge {name: 'Basic Debugging Techniques'})
MATCH (k2:Knowledge {name: 'Functions and Procedures'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Knowledge Prerequisites - intermediate level

MATCH (k1:Knowledge {name: 'Object-Oriented Programming'})
MATCH (k2:Knowledge {name: 'Functions and Procedures'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Arrays and Collections'})
MATCH (k2:Knowledge {name: 'Data Types and Variables'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Algorithm Fundamentals'})
MATCH (k2:Knowledge {name: 'Control Flow Logic'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Algorithm Fundamentals'})
MATCH (k2:Knowledge {name: 'Arrays and Collections'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Testing and Test-Driven Development'})
MATCH (k2:Knowledge {name: 'Functions and Procedures'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Error Handling and Exceptions'})
MATCH (k2:Knowledge {name: 'Control Flow Logic'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Code Organization and Modules'})
MATCH (k2:Knowledge {name: 'Functions and Procedures'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Using Libraries and Frameworks'})
MATCH (k2:Knowledge {name: 'Code Organization and Modules'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Knowledge Prerequisites - advanced level

MATCH (k1:Knowledge {name: 'Design Patterns and Best Practices'})
MATCH (k2:Knowledge {name: 'Object-Oriented Programming'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Performance Optimization'})
MATCH (k2:Knowledge {name: 'Algorithm Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Concurrency and Asynchronous Programming'})
MATCH (k2:Knowledge {name: 'Control Flow Logic'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Security and Secure Coding'})
MATCH (k2:Knowledge {name: 'Error Handling and Exceptions'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Scalability and Architecture'})
MATCH (k2:Knowledge {name: 'Performance Optimization'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Code Quality and Maintainability'})
MATCH (k2:Knowledge {name: 'Code Organization and Modules'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Knowledge Prerequisites - master level

MATCH (k1:Knowledge {name: 'System Design and Architecture'})
MATCH (k2:Knowledge {name: 'Scalability and Architecture'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Programming Paradigms'})
MATCH (k2:Knowledge {name: 'Object-Oriented Programming'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Language and Compiler Concepts'})
MATCH (k2:Knowledge {name: 'Algorithm Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Skill Prerequisites - basic level

MATCH (s1:Skill {name: 'Control Flow Implementation'})
MATCH (s2:Skill {name: 'Variable Declaration and Management'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Function Writing and Composition'})
MATCH (s2:Skill {name: 'Control Flow Implementation'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Basic Debugging and Error Identification'})
MATCH (s2:Skill {name: 'Function Writing and Composition'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Input/Output and File Operations'})
MATCH (s2:Skill {name: 'Variable Declaration and Management'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Skill Prerequisites - intermediate level

MATCH (s1:Skill {name: 'Data Structure Usage'})
MATCH (s2:Skill {name: 'Variable Declaration and Management'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Object-Oriented Programming Design'})
MATCH (s2:Skill {name: 'Function Writing and Composition'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Version Control Workflows'})
MATCH (s2:Skill {name: 'Basic Debugging and Error Identification'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Automated Testing'})
MATCH (s2:Skill {name: 'Function Writing and Composition'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Error Handling and Exception Management'})
MATCH (s2:Skill {name: 'Control Flow Implementation'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Code Refactoring and Improvement'})
MATCH (s2:Skill {name: 'Function Writing and Composition'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

// Skill Prerequisites - advanced level

MATCH (s1:Skill {name: 'Algorithm Design and Optimization'})
MATCH (s2:Skill {name: 'Data Structure Usage'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Design Patterns Application'})
MATCH (s2:Skill {name: 'Object-Oriented Programming Design'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Concurrent and Asynchronous Programming'})
MATCH (s2:Skill {name: 'Control Flow Implementation'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Code Review and Feedback'})
MATCH (s2:Skill {name: 'Code Refactoring and Improvement'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Advanced Debugging Techniques'})
MATCH (s2:Skill {name: 'Basic Debugging and Error Identification'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Performance Optimization'})
MATCH (s2:Skill {name: 'Algorithm Design and Optimization'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Skill Prerequisites - expert level

MATCH (s1:Skill {name: 'System Architecture and Design'})
MATCH (s2:Skill {name: 'Design Patterns Application'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Technical Leadership and Mentoring'})
MATCH (s2:Skill {name: 'Code Review and Feedback'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Expert'}]->(s2);

MATCH (s1:Skill {name: 'Innovation and Problem-Solving'})
MATCH (s2:Skill {name: 'Algorithm Design and Optimization'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Synthesis of Multiple Paradigms'})
MATCH (s2:Skill {name: 'Object-Oriented Programming Design'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

// Cross-component prerequisites: Skills requiring Knowledge

MATCH (s:Skill {name: 'Data Structure Usage'})
MATCH (k:Knowledge {name: 'Arrays and Collections'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Object-Oriented Programming Design'})
MATCH (k:Knowledge {name: 'Object-Oriented Programming'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Automated Testing'})
MATCH (k:Knowledge {name: 'Testing and Test-Driven Development'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Error Handling and Exception Management'})
MATCH (k:Knowledge {name: 'Error Handling and Exceptions'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Version Control Workflows'})
MATCH (k:Knowledge {name: 'Version Control Basics'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s:Skill {name: 'Algorithm Design and Optimization'})
MATCH (k:Knowledge {name: 'Algorithm Fundamentals'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s:Skill {name: 'Design Patterns Application'})
MATCH (k:Knowledge {name: 'Design Patterns and Best Practices'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Concurrent and Asynchronous Programming'})
MATCH (k:Knowledge {name: 'Concurrency and Asynchronous Programming'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Performance Optimization'})
MATCH (k:Knowledge {name: 'Performance Optimization'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s:Skill {name: 'System Architecture and Design'})
MATCH (k:Knowledge {name: 'System Design and Architecture'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

// Cross-component prerequisites: Skills requiring Traits

MATCH (s:Skill {name: 'Basic Debugging and Error Identification'})
MATCH (t:Trait {name: 'Analytical Thinking'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (s:Skill {name: 'Algorithm Design and Optimization'})
MATCH (t:Trait {name: 'Analytical Thinking'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (s:Skill {name: 'Algorithm Design and Optimization'})
MATCH (t:Trait {name: 'Pattern Recognition'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (s:Skill {name: 'Code Refactoring and Improvement'})
MATCH (t:Trait {name: 'Attention to Detail'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (s:Skill {name: 'Design Patterns Application'})
MATCH (t:Trait {name: 'Pattern Recognition'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (s:Skill {name: 'Concurrent and Asynchronous Programming'})
MATCH (t:Trait {name: 'Perseverance and Problem-Solving Tenacity'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (s:Skill {name: 'System Architecture and Design'})
MATCH (t:Trait {name: 'Analytical Thinking'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (s:Skill {name: 'Technical Leadership and Mentoring'})
MATCH (t:Trait {name: 'Adaptability and Learning Agility'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (s:Skill {name: 'Innovation and Problem-Solving'})
MATCH (t:Trait {name: 'Creative Problem-Solving'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

// Milestone Prerequisites

MATCH (m1:Milestone {name: 'Develop Multi-File Program'})
MATCH (m2:Milestone {name: 'Complete First Functional Program'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Contribute Via Pull Request'})
MATCH (m2:Milestone {name: 'Make First Git Commit'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve 70% Test Coverage'})
MATCH (m2:Milestone {name: 'Develop Multi-File Program'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Solve Problem in Second Language'})
MATCH (m2:Milestone {name: 'Complete First Functional Program'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Design and Implement Scalable Architecture'})
MATCH (m2:Milestone {name: 'Develop Multi-File Program'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Bug Investigation'})
MATCH (m2:Milestone {name: 'Achieve 70% Test Coverage'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Improve Performance by 50%'})
MATCH (m2:Milestone {name: 'Design and Implement Scalable Architecture'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Contribute to Open Source Project'})
MATCH (m2:Milestone {name: 'Contribute Via Pull Request'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Ship Production System to Users'})
MATCH (m2:Milestone {name: 'Design and Implement Scalable Architecture'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Lead Technical Team or Project'})
MATCH (m2:Milestone {name: 'Ship Production System to Users'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Redesign and Modernize Legacy System'})
MATCH (m2:Milestone {name: 'Ship Production System to Users'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Framework Design and Release'})
MATCH (m2:Milestone {name: 'Contribute to Open Source Project'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// ============================================================
// SECTION 2: Domain Level Requirements
// ============================================================

// Level 1: Novice

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (k:Knowledge {name: 'Programming Syntax Fundamentals'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (k:Knowledge {name: 'Data Types and Variables'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (k:Knowledge {name: 'Control Flow Logic'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (k:Knowledge {name: 'Input and Output Operations'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (s:Skill {name: 'Variable Declaration and Management'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (s:Skill {name: 'Control Flow Implementation'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (s:Skill {name: 'Function Writing and Composition'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (s:Skill {name: 'Input/Output and File Operations'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (t:Trait {name: 'Analytical Thinking'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 20}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (t:Trait {name: 'Perseverance and Problem-Solving Tenacity'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 25}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (t:Trait {name: 'Attention to Detail'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 30}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (m:Milestone {name: 'Complete First Functional Program'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// Level 2: Developing

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (k:Knowledge {name: 'Programming Syntax Fundamentals'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (k:Knowledge {name: 'Data Types and Variables'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (k:Knowledge {name: 'Control Flow Logic'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (k:Knowledge {name: 'Functions and Procedures'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (k:Knowledge {name: 'Version Control Basics'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (k:Knowledge {name: 'Basic Debugging Techniques'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Variable Declaration and Management'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Control Flow Implementation'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Function Writing and Composition'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Basic Debugging and Error Identification'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Version Control Workflows'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Input/Output and File Operations'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (t:Trait {name: 'Analytical Thinking'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (t:Trait {name: 'Perseverance and Problem-Solving Tenacity'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (t:Trait {name: 'Adaptability and Learning Agility'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (m:Milestone {name: 'Develop Multi-File Program'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (m:Milestone {name: 'Make First Git Commit'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// Level 3: Competent

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Control Flow Logic'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Functions and Procedures'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Object-Oriented Programming'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Arrays and Collections'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Algorithm Fundamentals'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Testing and Test-Driven Development'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Error Handling and Exceptions'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Code Organization and Modules'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Code Quality and Maintainability'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Control Flow Implementation'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Function Writing and Composition'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Data Structure Usage'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Object-Oriented Programming Design'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Automated Testing'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Error Handling and Exception Management'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Code Refactoring and Improvement'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Version Control Workflows'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (t:Trait {name: 'Analytical Thinking'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (t:Trait {name: 'Perseverance and Problem-Solving Tenacity'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (t:Trait {name: 'Attention to Detail'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (m:Milestone {name: 'Design and Implement Scalable Architecture'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (m:Milestone {name: 'Achieve 70% Test Coverage'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// Level 4: Advanced

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Object-Oriented Programming'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Arrays and Collections'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Algorithm Fundamentals'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Design Patterns and Best Practices'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Performance Optimization'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Concurrency and Asynchronous Programming'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Security and Secure Coding'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Scalability and Architecture'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Data Structure Usage'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Object-Oriented Programming Design'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Algorithm Design and Optimization'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Design Patterns Application'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Code Review and Feedback'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Performance Optimization'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Advanced Debugging Techniques'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (t:Trait {name: 'Analytical Thinking'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (t:Trait {name: 'Pattern Recognition'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (t:Trait {name: 'Creative Problem-Solving'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (m:Milestone {name: 'Ship Production System to Users'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (m:Milestone {name: 'Contribute to Open Source Project'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// Level 5: Master

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'System Design and Architecture'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Advanced Programming Paradigms'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Language and Compiler Concepts'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Programming Research and Innovation'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'System Architecture and Design'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Technical Leadership and Mentoring'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Innovation and Problem-Solving'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Synthesis of Multiple Paradigms'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (t:Trait {name: 'Analytical Thinking'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (t:Trait {name: 'Creative Problem-Solving'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (t:Trait {name: 'Adaptability and Learning Agility'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (m:Milestone {name: 'Lead Technical Team or Project'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (m:Milestone {name: 'Design and Release Framework or Library'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

