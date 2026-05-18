# PROJECT REPORT

## On

## "Personal Carbon Footprint Application (CarbonCalc)"

---

## Submitted By

- **Name:** [Your Name]
- **Department:** Computer Science and Engineering
- **Academic Year:** 2025-26

## Under the Guidance of

- **Guide Name:** [Guide Name]

---

## CERTIFICATE

This is to certify that the project entitled **"Personal Carbon Footprint Application (CarbonCalc)"** submitted by **[Your Name]** is a bonafide record of work carried out under my supervision and guidance.

---

## DECLARATION

I hereby declare that this report is my original work and has not been submitted elsewhere for any degree or diploma.

---

## ACKNOWLEDGEMENT

I express my sincere gratitude to my project guide, faculty members, teammates, and family for their valuable support and encouragement throughout this project.

---

## ABSTRACT

The Personal Carbon Footprint Application (CarbonCalc) is a sustainability-oriented digital system designed to help users understand, monitor, and reduce their personal carbon emissions. The project is based on the principle that climate action is most effective when awareness is converted into measurable daily behavior. While many awareness campaigns explain environmental issues at a global scale, individual users often lack tools to quantify their personal impact and evaluate progress over time.

This report presents the theoretical foundation of the project through six major chapters. It explains the conceptual need for personal carbon accounting, system objectives, requirement theory, architectural design principles, technological rationale, and security and quality attributes. The report focuses on "why" and "how" at a conceptual level rather than implementation steps.

The application integrates key sustainability engagement ideas: data visibility, goal-based self-regulation, gamification, social comparison, and administrative governance. These ideas are grounded in behavioral science and information systems theory, where sustained change depends on continuous feedback loops, intrinsic and extrinsic motivation, and trust in the platform.

The report concludes that a structured digital platform can act as a bridge between environmental knowledge and actionable daily practices. CarbonCalc demonstrates how software systems can be designed not only for functionality but also for social impact and responsible digital transformation.

---

## TABLE OF CONTENTS

1. Introduction and Conceptual Background  
2. Problem Statement, Need, and Objectives  
3. Requirement Engineering and Theoretical Framework  
4. System Architecture and Design Principles  
5. Technology Stack and Rationale  
6. Security, Quality Attributes, and Future Directions  
References

---

# Chapter 1: Introduction and Conceptual Background

## 1.1 Climate Change and Individual Responsibility

Climate change is often discussed at national and industrial levels, but a significant portion of emissions also emerges from cumulative individual activities such as transportation, food consumption, energy use, and consumption patterns. The concept of a **personal carbon footprint** translates abstract climate science into a measurable unit linked to human behavior. This makes environmental responsibility more practical for common users.

From a systems perspective, sustainability transitions require participation at three levels:

1. **Policy level** (regulations, incentives, targets),
2. **Institutional level** (organizations, businesses, infrastructure),
3. **Individual level** (lifestyle choices and behavior).

Digital tools such as CarbonCalc operate primarily at the third level while indirectly supporting broader sustainability ecosystems.

## 1.2 Concept of Carbon Footprint

A carbon footprint is generally defined as the total greenhouse gas emissions caused directly or indirectly by an individual, activity, event, or product, often represented in carbon dioxide equivalent (CO2e). The concept is not purely scientific; it is also educational and behavioral. It functions as:

- a **measurement mechanism** (quantifying impact),
- a **feedback mechanism** (showing trends and progress),
- a **decision mechanism** (guiding lifestyle adjustments).

For individual users, the footprint concept is useful only when three conditions are met:

1. Data is easy to enter or collect.
2. Feedback is understandable and timely.
3. Progress can be tracked over a meaningful duration.

These conditions shape the conceptual foundation of CarbonCalc.

## 1.3 Digital Sustainability Platforms

A digital sustainability platform differs from a simple calculator in one key way: it supports **continuous interaction over time**. Traditional calculators provide one-time estimates. Platforms, however, provide ongoing records, goal mechanisms, social feedback, and intervention points.

In theoretical terms, CarbonCalc can be viewed as:

- a **decision support system** (user insights),
- a **behavior change support system** (goals, badges, ranking),
- a **governed information system** (admin controls, audit visibility).

This multidimensional nature makes the project suitable for both technical and social analysis.

## 1.4 Purpose of the Project

The core purpose of CarbonCalc is not only to store data, but to enable **informed and sustained environmental behavior**. The project attempts to answer a practical question:

**How can a software system convert environmental concern into regular, measurable action?**

The answer proposed by this project is based on five design pillars:

1. Visibility of personal impact,
2. Structured personal targets,
3. Motivational reinforcement,
4. Community benchmarking,
5. Administrative trust and control.

---

# Chapter 2: Problem Statement, Need, and Objectives

## 2.1 Problem Statement

Despite growing climate awareness, individual users face major barriers in adopting low-carbon lifestyles:

1. **Cognitive Barrier:** users cannot estimate the environmental impact of daily habits.
2. **Behavioral Barrier:** users lack structured mechanisms to improve consistently.
3. **Motivational Barrier:** users lose momentum without progress feedback.
4. **Comparative Barrier:** users cannot benchmark themselves against peers.

As a result, awareness does not automatically lead to measurable behavior change.

## 2.2 Need for a Structured Digital Solution

A sustainability application is required when environmental action must be:

- measurable,
- repeatable,
- motivating,
- socially contextualized,
- and operationally manageable.

The need is both technical and social:

- **Technical need:** data capture, analytics, secure access, modular architecture.
- **Social need:** self-awareness, habit formation, encouragement, accountability.

CarbonCalc is designed to fulfill both dimensions simultaneously.

## 2.3 Objectives of the Project

### 2.3.1 Primary Objectives

1. Provide a platform for tracking personal carbon-related behavior.
2. Convert user data into understandable insights.
3. Support goal-driven reduction efforts.
4. Encourage continuous engagement using rewards and ranking.
5. Enable administrative governance and platform reliability.

### 2.3.2 Secondary Objectives

1. Support secure multi-mode authentication.
2. Establish role-based interaction boundaries.
3. Maintain data history for trend-based interpretation.
4. Ensure extensibility for future sustainability modules.

## 2.4 Scope of the Project

### In Scope

- Personal dashboard and carbon record lifecycle,
- goal creation and progress interpretation,
- gamification (badges),
- social comparison (leaderboard),
- notifications and admin governance.

### Out of Scope

- direct carbon sensor integration,
- verified carbon credit settlement,
- hardware device automation,
- AI-driven personalized coaching (future enhancement).

## 2.5 Expected Academic and Practical Value

From an academic perspective, this project integrates ideas from:

- sustainability informatics,
- human-computer interaction,
- behavior change theory,
- web systems architecture.

From a practical perspective, it provides a scalable foundation for digital climate engagement platforms in educational institutions or communities.

---

# Chapter 3: Requirement Engineering and Theoretical Framework

## 3.1 Requirement Engineering Perspective

Requirement engineering in sustainability systems must account for both **system utility** and **human adoption**. A feature is valuable only if it supports long-term user behavior and trust.

The requirement process in this project is conceptually divided into:

1. Functional capability requirements,
2. Non-functional quality requirements,
3. Stakeholder alignment requirements.

## 3.2 Functional Requirement Theory

Functional requirements define what the system must do. In CarbonCalc, function groups are designed around behavior loops:

1. **Input Loop:** user logs and profile data,
2. **Insight Loop:** dashboard views and trends,
3. **Action Loop:** goals and reduction tracking,
4. **Reinforcement Loop:** badges, leaderboard, notifications,
5. **Governance Loop:** admin oversight and controls.

This loop-oriented framing ensures that features are connected to user outcomes, not isolated as unrelated modules.

## 3.3 Non-Functional Requirement Theory

For climate-tech applications, non-functional requirements are critical because users trust the platform only when interaction is stable, secure, and understandable.

Key quality dimensions include:

- **Usability:** simple mental model, clear page purpose, low-friction tasks.
- **Reliability:** predictable behavior under normal usage.
- **Security:** identity protection and role isolation.
- **Scalability:** modular growth with user and data expansion.
- **Maintainability:** clear separation of concerns for long-term updates.
- **Auditability:** ability to trace critical administrative actions.

## 3.4 Stakeholder-Centric Analysis

A theoretical stakeholder view identifies three major actors:

1. **End User (individual participant):** needs guidance and motivation.
2. **Administrator (governance actor):** needs control, transparency, and moderation.
3. **System Owner/Institution:** needs reliability, engagement outcomes, and evolvability.

Good requirement design balances these interests without over-optimizing for only one group.

## 3.5 Behavioral Theory Mapping

The project aligns conceptually with behavior change principles:

- **Self-monitoring:** users observe their own patterns via logs and history.
- **Goal setting:** users define explicit targets and deadlines.
- **Feedback loops:** dashboards and progress values reinforce awareness.
- **Social influence:** leaderboard creates comparative motivation.
- **Recognition:** badges support achievement-based reinforcement.

Thus, the requirement model is not only software-centric but also human-centered.

---

# Chapter 4: System Architecture and Design Principles

## 4.1 Architectural Philosophy

The architecture follows a layered and modular philosophy to support clarity, control, and extensibility. The central principle is separation of concerns:

- interface concerns remain in frontend,
- business concerns remain in backend,
- persistence concerns remain in database.

This separation improves maintainability and reduces coupling.

## 4.2 Client-Server Conceptual Model

CarbonCalc follows a client-server web architecture:

1. **Client layer** handles interaction and presentation.
2. **Service layer** handles logic and policy.
3. **Persistence layer** handles structured storage and retrieval.

This model is widely used because it supports:

- independent development cycles,
- role-based policy centralization,
- and easier scaling of services.

## 4.3 Layered Backend Design Theory

A layered backend offers logical boundaries:

- **Controller layer:** endpoint exposure and request mapping.
- **Service layer:** rule enforcement and process logic.
- **Repository layer:** database operations.
- **Entity/model layer:** data representation.
- **Security layer:** authentication and authorization.

Theoretical benefits:

1. testability improves due to clear unit boundaries,
2. refactoring risk decreases due to encapsulation,
3. policy consistency improves due to centralized logic.

## 4.4 Modularity and Domain Partitioning

Domain partitioning is essential in systems with multiple user journeys. CarbonCalc logically partitions domains such as authentication, carbon logs, goals, badges, marketplace, notifications, and leaderboard. This prevents monolithic logic growth and supports parallel development.

In software design terms, this reflects:

- high cohesion within modules,
- low coupling across modules.

## 4.5 Data Flow and Interaction Model

The conceptual data flow is cyclic:

1. User action triggers a request.
2. Backend validates identity and role.
3. Business rules evaluate the request.
4. Database state is read or updated.
5. Response updates user-visible state.
6. User interprets feedback and performs next action.

This cycle is essential in behavior-support systems because each response influences subsequent decisions.

## 4.6 Design for Evolution

Architecture is not only for current features; it must support future evolution. CarbonCalc design enables future additions such as advanced analytics, AI recommendations, or integration modules without requiring complete redesign.

Key evolution principles:

- modular endpoints,
- standardized data contracts,
- configuration-driven behavior,
- role extensibility.

---

# Chapter 5: Technology Stack and Rationale

## 5.1 Technology Selection Criteria

Technology selection was guided by:

1. maturity and ecosystem stability,
2. learning and maintainability,
3. security support,
4. suitability for web-scale modular systems,
5. community and documentation availability.

## 5.2 Frontend Rationale

### React for Interactive Sustainability Dashboards

React is conceptually suitable for this project because sustainability applications depend on dynamic UI updates such as progress percentages, ranking changes, notification states, and data-driven views. Component-based architecture supports reuse and consistency across user and admin interfaces.

### CSS and Responsive Design

CSS-based styling supports both functional clarity and visual hierarchy. In behavior-change systems, readability and interface simplicity directly affect user retention. Responsive design also ensures accessibility across common device sizes.

## 5.3 Backend Rationale

### Spring Boot and Java 17

Spring Boot is selected for its robust enterprise architecture model and mature ecosystem. It supports modular REST APIs, dependency management, security integration, and clear service boundaries. Java provides type safety and long-term maintainability.

### Spring Security

Security is integral in user-data platforms. Spring Security provides:

- token-based authentication flow,
- role-based policy enforcement,
- secure route guarding,
- integration flexibility with OAuth2.

### JPA/Hibernate

Object-relational mapping supports faster development and cleaner data access abstraction, while preserving relational model strength at the database layer.

## 5.4 Database Rationale: PostgreSQL

PostgreSQL is suitable due to:

- ACID compliance,
- relational integrity support,
- strong query capabilities,
- production-grade reliability.

In CarbonCalc, relational consistency is important because user-related entities (logs, goals, badges, transactions, notifications) are interdependent.

## 5.5 Build and Dependency Ecosystem

Frontend and backend build ecosystems (`npm` and `maven`) provide reproducible dependency management and standardized project lifecycle operations. This reduces environment inconsistency and supports team collaboration.

## 5.6 Conceptual Fit of the Stack

The selected stack supports a balanced architecture:

- dynamic user interaction (frontend),
- secure and maintainable business logic (backend),
- consistent and extensible persistence (database).

This balance is necessary for sustainability platforms where long-term reliability matters more than short-term feature velocity.

---

# Chapter 6: Security, Quality Attributes, and Future Directions

## 6.1 Security as a Foundational Requirement

In personal data platforms, security is not an optional module; it is a system-level property. CarbonCalc addresses this through layered controls:

1. identity verification,
2. authorization boundaries,
3. controlled administrative capabilities,
4. operational controls (maintenance behavior).

Security also has a social impact: users engage more when they trust the platform.

## 6.2 Authentication and Authorization Theory

Authentication answers "Who is the user?" and authorization answers "What can the user do?" CarbonCalc separates these concerns to prevent privilege leakage.

- Authentication uses token-backed session trust.
- Authorization enforces role-specific action policies.

This follows the **principle of least privilege**, a core security design principle.

## 6.3 Quality Attributes and Their Importance

### Usability

If sustainability systems are difficult to use, users stop engaging and behavior impact collapses. Hence interface clarity is a strategic quality attribute, not only a UI concern.

### Reliability

Consistent results and stable behavior build confidence. Reliability is essential for goal-tracking credibility.

### Maintainability

Climate and policy contexts evolve. Software must adapt without major architectural disruption. Maintainability enables this adaptability.

### Auditability and Governance

Admin-level actions must be traceable. Audit visibility improves governance quality and reduces operational risk.

### Performance

Users expect quick responses for dashboards and routine interactions. Delays reduce adoption and perceived trust.

## 6.4 Ethical and Social Considerations

Digital sustainability tools should avoid two extremes:

1. **Data overload without guidance**, and
2. **gamification without meaningful outcomes**.

CarbonCalc conceptually aims for responsible engagement by combining metrics with interpretation and action pathways.

## 6.5 Limitations

Theoretical limitations of current scope include:

- dependence on user-entered data quality,
- limited context-aware recommendations,
- no direct integration with external emissions verification systems.

These do not invalidate the system but define the next research and development boundary.

## 6.6 Future Directions

Future conceptual extensions include:

1. AI-assisted behavior recommendations,
2. predictive trend modeling,
3. automatic data ingestion from devices,
4. community-level sustainability campaigns,
5. multilingual accessibility expansion,
6. institutional dashboards for educational or enterprise deployment.

## 6.7 Final Conclusion

CarbonCalc demonstrates that sustainability software must be designed as a socio-technical system, not merely a data-entry tool. By integrating measurement, motivation, governance, and quality-centered architecture, the project offers a strong conceptual model for future climate-engagement platforms.

---

# References

1. Intergovernmental Panel on Climate Change (IPCC), Assessment Reports, [https://www.ipcc.ch](https://www.ipcc.ch)  
2. United Nations Sustainable Development Goals, [https://sdgs.un.org/goals](https://sdgs.un.org/goals)  
3. React Documentation, [https://react.dev](https://react.dev)  
4. Spring Boot Documentation, [https://spring.io/projects/spring-boot](https://spring.io/projects/spring-boot)  
5. Spring Security Reference, [https://docs.spring.io/spring-security/reference](https://docs.spring.io/spring-security/reference)  
6. PostgreSQL Documentation, [https://www.postgresql.org/docs](https://www.postgresql.org/docs)  
7. Locke, E. A., and Latham, G. P., Goal-setting theory and task performance literature.  
8. Fogg, B. J., Behavior model concepts for persuasive technology.

# PROJECT REPORT

## On

## "Personal Carbon Footprint Application (CarbonCalc)"

Submitted in partial fulfillment of the requirements for internship/project documentation.

---

## Submitted By

- **Name:** [Your Name]
- **Roll No.:** [Your Roll Number]
- **Department:** Computer Science and Engineering
- **College:** [Your College Name]
- **Academic Year:** 2025-26

## Under the Guidance of

- **Project Guide:** [Guide Name]

---

## CERTIFICATE

This is to certify that the project entitled **"Personal Carbon Footprint Application (CarbonCalc)"** submitted by **[Your Name]** is a bonafide record of work carried out under my guidance and supervision. The report has been prepared as part of the internship/project work and has not been submitted previously for any other degree or diploma.

**Guide Signature:** ___________________  
**Head of Department:** ___________________  
**Date:** ___________________

---

## DECLARATION

I hereby declare that this report titled **"Personal Carbon Footprint Application (CarbonCalc)"** is my own work and has been completed under the guidance of my project supervisor. I further declare that this work has not been submitted to any other university or institution for the award of any degree.

**Student Signature:** ___________________  
**Name:** [Your Name]  
**Date:** ___________________

---

## ACKNOWLEDGEMENT

I express my sincere gratitude to my guide **[Guide Name]** for valuable guidance, continuous support, and constructive feedback during the development of this project. Their suggestions helped shape this work from conceptualization to deployment.

I would also like to thank the faculty members of the Department of Computer Science and Engineering for providing technical direction and necessary resources throughout the internship period.

I am grateful to my teammates for their collaboration, technical discussions, and collective efforts in building this application. I also acknowledge the open-source community for tools and libraries that made the implementation practical and efficient.

Finally, I thank my family and friends for their motivation and encouragement.

---

## ABSTRACT

Climate change is one of the most critical global challenges, and individual lifestyle choices contribute significantly to carbon emissions. The **Personal Carbon Footprint Application (CarbonCalc)** is designed as a full-stack web platform that helps users monitor, analyze, and reduce their daily carbon impact through data-driven insights and engagement mechanisms.

The application provides modules for user authentication, carbon logging, goal management, badge rewards, leaderboard ranking, marketplace participation, transaction tracking, and notification management. A dedicated admin panel supports analytics, user moderation, content management, maintenance control, and audit logging.

The frontend is built using React and delivers a responsive user interface for both normal users and administrators. The backend is developed with Spring Boot and Java 17, exposing secure REST APIs for all functional modules. PostgreSQL is used for persistent data storage, and role-based security is implemented using JWT and OAuth2 login options.

The platform supports behavior change by combining awareness tools (dashboard trends, history views, analytics), motivation tools (badges, leaderboard, goals), and operational features (marketplace, transactions, notifications). Weekly leaderboard snapshots provide historical comparison, and maintenance-mode control allows safe production-level administration.

This report presents problem analysis, objectives, system architecture, design methodology, implementation details, module-wise explanation, database structure, testing strategy, outcomes, limitations, and future enhancements. The project demonstrates that a well-designed digital platform can translate sustainability goals into measurable user actions.

---

## TABLE OF CONTENTS

1. Introduction  
2. Problem Statement and Motivation  
3. Objectives and Scope  
4. Requirement Analysis  
5. Methodology  
6. System Architecture and Design  
7. Technology Stack  
8. Implementation Details  
9. Database Design  
10. API Design and Integration  
11. Security and Access Control  
12. Testing and Validation  
13. Results and Discussion  
14. Challenges Faced  
15. Conclusion  
16. Future Scope  
17. References  
18. Appendix

---

# Chapter 1: Introduction

## 1.1 Background

Growing urbanization, increased travel, consumption-heavy lifestyles, and energy dependence have significantly increased individual carbon emissions. While climate science and policy-level initiatives are essential, meaningful change also requires daily behavioral awareness at the user level.

Most people do not have a clear understanding of how transportation, food habits, electricity usage, and purchase patterns translate into carbon impact. Existing tools often provide static calculators but lack continuity, motivation, personalization, or long-term engagement.

This project addresses that gap by providing a continuous tracking and improvement platform rather than a one-time carbon estimate.

## 1.2 Project Introduction

The **Personal Carbon Footprint Application (CarbonCalc)** is a web-based application where:

- users can log emissions and monitor progress,
- users can set and track reduction goals,
- users can earn badges and rank in leaderboards,
- users can access marketplace and transaction features,
- users can view and manage notifications,
- admins can monitor platform-wide analytics and manage operational modules.

The application supports both standard login and OAuth2 login for improved accessibility.

## 1.3 Need for the Project

There is a practical need for:

- personalized sustainability tracking,
- comparative feedback (community/leaderboard),
- reward-based motivation,
- transparent progress reporting,
- centralized administration for reliability.

CarbonCalc is designed to meet these needs with a scalable architecture and clear module boundaries.

---

# Chapter 2: Problem Statement and Motivation

## 2.1 Problem Statement

Individuals want to reduce environmental impact but face three major barriers:

1. **Measurement barrier:** inability to quantify daily emissions reliably.
2. **Action barrier:** no structured roadmap to improve behavior.
3. **Motivation barrier:** lack of recognition and social reinforcement.

Additionally, organizations deploying sustainability applications require:

- robust user management,
- secure authentication,
- traceable administration,
- extensible module architecture,
- maintainable backend and database design.

## 2.2 Motivation

The project was motivated by the idea that climate action must be translated into simple, repeatable, measurable actions at the user level. A digital platform can make this process:

- visible (through logs and dashboards),
- manageable (through goals and notifications),
- engaging (through badges and leaderboard),
- operationally sustainable (through admin tools).

## 2.3 Proposed Solution

A full-stack application with:

- secure authentication and role control,
- carbon logging and history tracking,
- goals and achievement tracking,
- gamified motivation (badges, leaderboard),
- marketplace and transaction workflows,
- notification system,
- complete admin dashboard for governance.

---

# Chapter 3: Objectives and Scope

## 3.1 Primary Objectives

1. Build a reliable platform for carbon footprint tracking.
2. Provide actionable user insights via dashboard and history.
3. Encourage behavioral change via goals and rewards.
4. Support operational workflows via admin dashboard.
5. Ensure secure and scalable architecture.

## 3.2 Secondary Objectives

- Integrate OAuth2-based social login.
- Enable maintenance-mode control for deployment safety.
- Maintain audit logs for administrator actions.
- Store weekly leaderboard snapshots for historical analysis.

## 3.3 Scope of Work

### In Scope

- Full-stack web application implementation.
- REST API design and integration.
- PostgreSQL schema design.
- Role-based authorization.
- User and admin modules.
- Basic testing of major workflows.

### Out of Scope

- Mobile-native application development.
- IoT/sensor-based automated carbon capture.
- Carbon offset verification with third-party registries.
- AI recommendation engine (planned in future scope).

---

# Chapter 4: Requirement Analysis

## 4.1 Functional Requirements

### User-Side Functional Requirements

1. User registration and login.
2. OAuth2 login (Google/GitHub).
3. View personal dashboard and trend analysis.
4. Add, view, and edit carbon logs.
5. Set goals and track completion status.
6. View earned/locked badges.
7. Browse marketplace items.
8. Perform and review transactions.
9. Read and dismiss notifications.
10. View live and weekly leaderboard.
11. Manage profile details.

### Admin-Side Functional Requirements

1. View platform analytics summary.
2. Manage users (block/unblock/delete).
3. Monitor user goals and carbon logs.
4. Create/update badge templates and award badges.
5. Manage marketplace items.
6. Create targeted or broadcast notifications.
7. Monitor transactions.
8. Access audit logs with action filtering.
9. Enable/disable maintenance mode.

## 4.2 Non-Functional Requirements

1. **Security:** JWT-based access control, secure login handling.
2. **Performance:** responsive UI and efficient API responses.
3. **Scalability:** modular backend APIs and normalized data design.
4. **Usability:** clear navigation and role-appropriate pages.
5. **Maintainability:** layered architecture and structured modules.
6. **Availability:** maintenance control and controlled release support.

## 4.3 User Personas

### Persona A: Eco-Conscious Student

- Wants to reduce carbon impact.
- Needs simple logging and visible progress.
- Motivated by badges and rankings.

### Persona B: Working Professional

- Limited time for manual analysis.
- Requires quick dashboard insights.
- Prefers reminders and periodic progress checks.

### Persona C: Platform Administrator

- Responsible for platform quality and fairness.
- Needs user moderation and data visibility.
- Requires maintenance controls and audit trails.

---

# Chapter 5: Methodology

## 5.1 Development Approach

An iterative and modular development approach was followed:

1. requirement collection,
2. architecture planning,
3. module-wise implementation,
4. API integration,
5. testing and bug fixing,
6. deployment readiness checks.

## 5.2 Workflow

- Define module contracts.
- Implement backend APIs.
- Create frontend pages.
- Integrate with API layer.
- Validate role-based behavior.
- Test edge cases and fix issues.

## 5.3 Documentation Strategy

Parallel documentation was maintained for:

- backend API behavior,
- frontend features,
- database scripts and seed data,
- deployment configuration.

---

# Chapter 6: System Architecture and Design

## 6.1 High-Level Architecture

The system follows a client-server architecture:

1. **Frontend (React)** communicates with backend APIs.
2. **Backend (Spring Boot)** applies business logic and security.
3. **Database (PostgreSQL)** stores user and domain data.

## 6.2 Layered Backend Design

Backend structure typically includes:

- Controller Layer (API endpoints),
- Service Layer (business logic),
- Repository Layer (database access),
- Entity/Model Layer (table mapping),
- Security Layer (JWT, OAuth2, roles).

This layered design improves maintainability and testing.

## 6.3 Frontend Design Pattern

Frontend is organized into:

- pages (feature-level screens),
- shared components (layout/header/footer),
- CSS modules/stylesheets,
- route handling with role-based screen access.

## 6.4 Data Flow

1. User performs action in UI.
2. Frontend sends HTTP request to API.
3. Backend validates token/role.
4. Service processes request.
5. Repository reads/writes PostgreSQL data.
6. Response returned to frontend.
7. UI updates state and displays result.

---

# Chapter 7: Technology Stack

## 7.1 Frontend Technologies

### React

React is used to build interactive, component-based UI modules such as dashboard, goals, badges, marketplace, and admin views.

### CSS

Dedicated CSS files provide styling, responsive behavior, and visual consistency for user and admin interfaces.

### State and API Handling

State management and API integration are performed within component logic and utility patterns suitable for module-level responsibilities.

## 7.2 Backend Technologies

### Java 17 and Spring Boot 3

Spring Boot provides rapid REST API development, dependency management, and production-ready configurations.

### Spring Security

Used for:

- JWT token validation,
- role-based authorization,
- secure route protection,
- OAuth2 login support.

### JPA/Hibernate

Handles ORM mapping and database persistence for all core entities.

## 7.3 Database

### PostgreSQL

Stores transactional and analytical data including users, logs, goals, badges, notifications, and leaderboard snapshots.

## 7.4 Build and Tooling

- Maven for backend build lifecycle.
- npm for frontend dependencies and scripts.
- Environment-based configuration for local/deployment flexibility.

---

# Chapter 8: Implementation Details

## 8.1 Authentication Module

Implemented with:

- credential-based login endpoint,
- OAuth2 login integration,
- JWT issuance and validation,
- protected route handling.

Special behavior implemented:

- maintenance mode blocks non-admin login while allowing admin access for service management.

## 8.2 User Dashboard Module

Dashboard combines:

- carbon metrics,
- trend insights,
- goal progress indicators,
- action-oriented summaries.

The module serves as the user’s primary decision panel.

## 8.3 Carbon Log Module

Users can:

- add log entries,
- review historical records,
- edit existing entries.

Admin can monitor logs across users for system-level analytics and governance.

## 8.4 Goals Module

Users define reduction targets and monitor completion percentages. Goal states support progression tracking such as active, completed, and expired.

Admin view enables oversight of platform-wide goal participation.

## 8.5 Badges Module

Gamification is implemented using:

- badge templates,
- badge awarding workflow,
- earned/locked badge visualization.

This improves user engagement and long-term retention.

## 8.6 Marketplace and Transactions Module

Marketplace allows users to view available items and perform transaction flow. Transaction pages normalize and display data in a user-friendly format with relevant status details.

Admin can manage marketplace entries and monitor all transactions.

## 8.7 Notifications Module

Supports:

- admin-generated targeted/broadcast notifications,
- user read/hide functionality,
- practical communication without external tools.

## 8.8 Leaderboard Module

Two modes are supported:

1. **Live leaderboard** for current performance.
2. **Weekly leaderboard** for historical comparison.

Backend stores weekly snapshots for stable "last week" views.

## 8.9 Admin Dashboard Module

Admin dashboard consolidates:

- analytics cards,
- user moderation,
- badge template controls,
- marketplace controls,
- transaction oversight,
- audit log filtering,
- maintenance mode settings.

This module ensures administrative completeness and production operability.

---

# Chapter 9: Database Design

## 9.1 Database Overview

Database name: `carbon_tracker`

Core tables include:

1. users  
2. auth_tokens  
3. badge_templates  
4. badges  
5. carbon_logs  
6. goals  
7. marketplace  
8. marketplace_items  
9. notifications  
10. surveys  
11. transactions  
12. admin_audit_logs  
13. weekly_leaderboard

## 9.2 Data Relationships (Conceptual)

- One user can have many carbon logs.
- One user can have many goals.
- One user can have many badges.
- One user can have many notifications.
- One user can have many transactions.
- Admin actions are persisted in audit logs.
- Weekly leaderboard stores periodic performance snapshots.

## 9.3 Schema Management

Schema reference scripts are maintained under database scripts, while runtime updates are managed via Hibernate update strategy.

## 9.4 Seed Data Strategy

Seed scripts support:

- bulk demo users with realistic data,
- focused one-user historical data for chart testing,
- goal coherence patching for consistency.

This improves testing quality and UI validation speed.

---

# Chapter 10: API Design and Integration

## 10.1 API Categories

Major REST groups:

- `/api/auth/*`
- `/api/admin/settings`
- `/api/users/*`
- `/api/carbon/*`
- `/api/goals/*`
- `/api/badges/*` and `/api/badge-templates/*`
- `/api/marketplace/*`
- `/api/transactions/*`
- `/api/notifications/*`
- `/api/leaderboard/*`

## 10.2 Integration Principles

1. Frontend modules map to dedicated API domains.
2. Protected endpoints require valid JWT.
3. Admin-only routes enforce role checks.
4. Response shaping is optimized for UI consumption.

## 10.3 Error Handling Approach

- Authentication failures return proper unauthorized responses.
- Validation issues return clear messages.
- Frontend shows contextual messages and fallback behavior.

---

# Chapter 11: Security and Access Control

## 11.1 Authentication Security

- JWT-based stateless authentication.
- OAuth2 integration for external provider login.
- Token storage and request attachment in frontend flow.

## 11.2 Authorization Security

Role-based route protection ensures:

- user routes are isolated from admin controls,
- sensitive operations are admin restricted,
- moderation and settings changes are traceable.

## 11.3 Operational Security

- Maintenance mode prevents unauthorized general usage during updates.
- Admin access remains available for controlled operations.
- Audit logs support action-level transparency.

## 11.4 Data-Level Considerations

- Controlled schema updates.
- Structured relational modeling.
- Notification and transaction history persistence for traceability.

---

# Chapter 12: Testing and Validation

## 12.1 Testing Types

1. **Functional testing** for all key modules.
2. **Integration testing** between frontend and backend APIs.
3. **Role-based testing** for user/admin access correctness.
4. **Database validation** for CRUD consistency.
5. **Regression checks** after feature updates.

## 12.2 Sample Test Scenarios

### Authentication

- Login with valid credentials.
- Reject invalid credentials.
- Verify OAuth login redirection.
- Verify maintenance behavior for user/admin.

### Carbon Logs and Goals

- Create and edit log entries.
- Retrieve history correctly.
- Create goals and verify progress.
- Validate completed/expired display logic.

### Badges and Leaderboard

- Award badge to user.
- Confirm earned badge visibility.
- Validate live leaderboard ranking.
- Validate weekly leaderboard retrieval.

### Marketplace and Transactions

- Fetch items for users.
- Create item as admin.
- Perform transaction and verify records.

### Notifications

- Create broadcast and targeted notifications.
- Mark notification read/hide from user side.

### Admin Controls

- Block/unblock/delete user flow.
- Toggle maintenance mode.
- Verify audit entries for admin operations.

## 12.3 Validation Outcome

Core modules were validated across normal and admin roles, and end-to-end flow from login to analytics was confirmed.

---

# Chapter 13: Results and Discussion

## 13.1 Key Outcomes

1. Full-stack platform successfully implemented.
2. Carbon tracking, goals, and behavior modules integrated.
3. Gamification and leaderboard improve engagement.
4. Admin panel provides operational control.
5. Data model supports growth and reporting.

## 13.2 Behavioral Impact Potential

The platform encourages users to:

- become aware of emission patterns,
- set realistic reduction goals,
- stay motivated through rewards and community ranking,
- act consistently over time.

## 13.3 Technical Strengths

- Clear separation of frontend and backend concerns.
- Secure authentication with multi-login support.
- Comprehensive module coverage.
- Practical admin controls for maintainability.
- Database support for both transactional and analytical use.

## 13.4 Discussion

The project demonstrates that climate-tech applications benefit from both technical rigor and human-centric design. Data collection alone is insufficient; users respond better when metrics are accompanied by goals, rewards, and social feedback mechanisms.

The combination of dashboard insights, progress tracking, and gamification provides a practical framework for sustained engagement.

---

# Chapter 14: Challenges Faced

## 14.1 Technical Challenges

1. Managing role-based flows across many pages.
2. Keeping frontend state synchronized with evolving backend responses.
3. Ensuring consistency across marketplace, badges, and leaderboard modules.
4. Handling maintenance mode logic across login methods.
5. Maintaining clean database state for realistic testing.

## 14.2 Project Challenges

1. Coordinating multi-module feature delivery.
2. Balancing usability with feature richness.
3. Maintaining documentation parity with implementation updates.

## 14.3 Resolution Strategies

- Introduced modular endpoint grouping.
- Used incremental testing with seeded data.
- Improved admin controls for operational visibility.
- Added historical weekly leaderboard persistence.

---

# Chapter 15: Conclusion

The **Personal Carbon Footprint Application (CarbonCalc)** successfully meets its core purpose of enabling individuals to monitor and reduce their carbon impact through a structured digital platform.

The application combines practical tracking features with motivation and governance features:

- personal carbon logs and goals,
- reward and ranking mechanisms,
- marketplace and transactions,
- notification workflows,
- admin-level controls and analytics.

From a technical standpoint, the system is built on a modern and maintainable stack using React, Spring Boot, and PostgreSQL. Security and role-based access control are integrated into the architecture rather than added as an afterthought. Operational readiness is strengthened through maintenance mode and audit logging.

The project validates that climate-awareness software can be made both technically robust and behaviorally engaging. It can serve as a strong foundation for future sustainability-focused digital systems.

---

# Chapter 16: Future Scope

1. **AI-Based Recommendations:** personalized emission reduction suggestions.
2. **Mobile App:** Android/iOS app for improved accessibility.
3. **IoT Integration:** automatic data capture from smart meters and devices.
4. **Advanced Analytics:** predictive trends and household comparison dashboards.
5. **Carbon Offset Integration:** verified third-party offset purchase APIs.
6. **Community Challenges:** team-based sustainability campaigns.
7. **Multilingual Support:** broader accessibility for diverse user groups.
8. **Exportable Reports:** monthly downloadable sustainability statements for users.
9. **Enterprise Mode:** organization-level dashboards and employee-level tracking.
10. **Enhanced Security:** adaptive risk scoring and anomaly alerts for admin actions.

---

# Chapter 17: References

1. React Documentation. [https://react.dev](https://react.dev)  
2. Spring Boot Documentation. [https://spring.io/projects/spring-boot](https://spring.io/projects/spring-boot)  
3. Spring Security Reference. [https://docs.spring.io/spring-security/reference](https://docs.spring.io/spring-security/reference)  
4. PostgreSQL Documentation. [https://www.postgresql.org/docs](https://www.postgresql.org/docs)  
5. Maven Documentation. [https://maven.apache.org/guides](https://maven.apache.org/guides)  
6. IPCC Climate Change Reports. [https://www.ipcc.ch/reports](https://www.ipcc.ch/reports)  
7. United Nations Sustainable Development Goals. [https://sdgs.un.org/goals](https://sdgs.un.org/goals)  
8. OAuth 2.0 Framework (RFC 6749). [https://datatracker.ietf.org/doc/html/rfc6749](https://datatracker.ietf.org/doc/html/rfc6749)  
9. JSON Web Token (JWT) RFC 7519. [https://datatracker.ietf.org/doc/html/rfc7519](https://datatracker.ietf.org/doc/html/rfc7519)  
10. Carbon Footprint and Behavioral Change Studies (various peer-reviewed journals).

---

# Chapter 18: Appendix

## Appendix A: Suggested List of Figures for 40-45 Page Formatting

1. System architecture diagram  
2. Login page  
3. Registration page  
4. Dashboard page  
5. Carbon history page  
6. Carbon log details page  
7. Goals page  
8. Badges page  
9. Leaderboard page (live)  
10. Leaderboard page (weekly)  
11. Notifications page  
12. Marketplace page  
13. Transactions page  
14. Profile page  
15. Admin dashboard analytics  
16. Admin user management  
17. Admin badge template management  
18. Admin marketplace management  
19. Admin notifications management  
20. Admin transactions monitoring  
21. Admin audit log screen  
22. Maintenance mode settings  
23. Database ER diagram  
24. API flow diagram  
25. Test case summary table screenshot

## Appendix B: Suggested List of Tables

1. Functional requirement matrix  
2. Non-functional requirement matrix  
3. Module responsibility table  
4. API endpoint summary table  
5. Database table summary  
6. Test scenario summary  
7. Known issues and mitigation table  
8. Future enhancement roadmap

## Appendix C: Formatting Guide for Final Submission

To convert this draft into a 40-45 page final report:

1. Use Times New Roman, 12 pt, 1.5 line spacing.
2. Add institutional cover pages and signatures.
3. Insert page breaks before each chapter.
4. Add at least 20-25 screenshots from the running project.
5. Add architecture and ER diagrams.
6. Add test tables and figure captions.
7. Generate TOC, list of figures, and list of tables in Word.

With screenshots, tables, and standard formatting, this content is suitable for a **40-45 page** academic project report.

