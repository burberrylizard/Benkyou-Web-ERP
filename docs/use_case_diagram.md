# Benkyou ERP & LMS - UML Use Case Diagram & Specification

This document presents a **Standard UML Use Case Diagram** and detailed functional specifications for the **Benkyou Web ERP & LMS Platform**, focused strictly on the **5 core user roles** (SuperAdmin, Admin, Operator, Instructor, and Student).

---

## 1. Visual Use Case Diagram

The visual diagram below follows standard UML notation:
* **Left Side**: The 5 Primary Actors (`SuperAdmin`, `Admin`, `Operator`, `Instructor`, `Student`).
* **Center Box**: The `<<Subsystem>> Benkyou ERP & LMS` system boundary containing the use cases represented as ovals.
* **Right Side**: The External System Services (`Identity Provider`, `Stripe Payment Gateway`).
* **Associations**: Straight lines connecting actors to their respective use cases, with dotted arrows representing `<<include>>` relationships.

```mermaid
flowchart LR
    %% Styling Rules for Classic Black & White UML Aesthetics
    classDef actor fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;
    classDef usecase fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;
    classDef boundary fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000,font-weight:bold;
    classDef include stroke:#000000,stroke-width:1px,stroke-dasharray: 5 5,color:#000000;

    %% 1. Primary Actors (Left)
    subgraph LeftActors ["Primary Actors"]
        direction TB
        SuperAdmin["👤 SuperAdmin\n(Platform Owner)"]:::actor
        Admin["👤 Admin\n(School Admin)"]:::actor
        Operator["👤 Operator\n(Academic Operator)"]:::actor
        Instructor["👤 Instructor\n(Course Teacher)"]:::actor
        Student["👤 Student\n(Eager Learner)"]:::actor
    end

    %% 2. System Boundary (Center)
    subgraph SystemBoundary ["<<Subsystem>>\nBenkyou ERP & LMS"]
        direction TB
        
        %% Foundational Use Case
        UC_AUTH(["Authenticate User"]):::usecase

        %% SuperAdmin Use Cases
        UC_SA_OVERSIGHT(["Global Org Oversight"]):::usecase
        UC_SA_SEED(["Platform Seeding & Setup"]):::usecase
        
        %% Admin Use Cases
        UC_ADM_SUB(["Manage Subscription Tier"]):::usecase
        UC_ADM_PAY(["Process Payment Checkout"]):::usecase
        
        %% Operator Use Cases
        UC_OP_BATCH(["Batch Enroll Students"]):::usecase
        UC_OP_SECTIONS(["Setup Class Sections"]):::usecase
        
        %% Instructor Use Cases
        UC_INST_CURR(["Design Course Curriculum"]):::usecase
        UC_INST_QUIZ(["Compose Assessments"]):::usecase
        
        %% Student Use Cases
        UC_STUD_PLAYER(["Interact with Course Player"]):::usecase
        UC_STUD_EXAM(["Take Timed Exams/Quizzes"]):::usecase

        %% UML <<include>> Relations
        UC_ADM_PAY -.->|<<include>>| UC_ADM_SUB
        UC_STUD_EXAM -.->|<<include>>| UC_STUD_PLAYER
    end

    %% 3. External Supporting Services (Right)
    subgraph RightActors ["Supporting Services"]
        direction TB
        IDProvider["⚙️ <<Service>>\nIdentity Provider"]:::actor
        StripeGateway["💳 <<Service>>\nStripe Payment Gateway"]:::actor
    end

    %% --- ASSOCIATIONS ---
    
    %% SuperAdmin Associations
    SuperAdmin --- UC_SA_OVERSIGHT
    SuperAdmin --- UC_SA_SEED
    SuperAdmin --- UC_AUTH

    %% Admin Associations
    Admin --- UC_ADM_SUB
    Admin --- UC_ADM_PAY
    Admin --- UC_AUTH

    %% Operator Associations
    Operator --- UC_OP_BATCH
    Operator --- UC_OP_SECTIONS
    Operator --- UC_AUTH

    %% Instructor Associations
    Instructor --- UC_INST_CURR
    Instructor --- UC_INST_QUIZ
    Instructor --- UC_AUTH

    %% Student Associations
    Student --- UC_STUD_PLAYER
    Student --- UC_STUD_EXAM
    Student --- UC_AUTH

    %% Right Services Associations
    UC_AUTH --- IDProvider
    UC_ADM_PAY --- StripeGateway

    %% Style application
    style SystemBoundary fill:#ffffff,stroke:#000000,stroke-width:2px;
    style LeftActors fill:#ffffff,stroke:none;
    style RightActors fill:#ffffff,stroke:none;
```

---

## 2. UML Use Case Dictionary

### 2.1. The 5 Primary Actors

| Actor | Description | Key Systems / Controls | Associated Controller |
| :--- | :--- | :--- | :--- |
| **SuperAdmin** | The platform owner/developer. Seeds defaults, configures subscription options, and oversees multi-tenant isolation. | Global dashboard, seed scripts. | [OperatorController.cs](file:///c:/Users/Charlize%20Jane%20Inday/source/repos/Benkyou/Benkyou.API/Controllers/OperatorController.cs) |
| **Admin** | The school administrator/principal. Adjusts institutional info, branding, and coordinates plan billing. | Tenant configuration settings, billing. | [OrganizationController.cs](file:///c:/Users/Charlize%20Jane%20Inday/source/repos/Benkyou/Benkyou.API/Controllers/OrganizationController.cs) |
| **Operator** | The school registrar/operations manager. Onboards class sections and enrolls student groups in bulk. | Class sections roster, CSV Match Stage. | [ClassSectionsController.cs](file:///c:/Users/Charlize%20Jane%20Inday/source/repos/Benkyou/Benkyou.API/Controllers/ClassSectionsController.cs) |
| **Instructor** | The curriculum educator/teacher. Structures modular syllabus outlines, quizzes, exams, and grades submissions. | Lesson drag-and-drop hierarchy, quiz creator. | [AssessmentsController.cs](file:///c:/Users/Charlize%20Jane%20Inday/source/repos/Benkyou/Benkyou.API/Controllers/AssessmentsController.cs) |
| **Student** | The active learner. Attends lectures, progress milestones, flags test questions, and submits midterms. | Video player, timed exam grid, grades. | [ProgressController.cs](file:///c:/Users/Charlize%20Jane%20Inday/source/repos/Benkyou/Benkyou.API/Controllers/ProgressController.cs) |

---

### 2.2. Functional Relationships

* **`Process Payment Checkout` includes `Manage Subscription Tier`**: In order to initialize a payment transaction with the Stripe Gateway, the **Admin** must first select and set up their target plan details.
* **`Take Timed Exams/Quizzes` includes `Interact with Course Player`**: A **Student** must be in an active session inside the course player shell to run and complete an evaluation.
* **`Authenticate User` maps to `Identity Provider`**: Every primary actor requires session generation and role verification handled by the database service.
