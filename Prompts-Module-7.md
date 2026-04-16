Cursor AI - Module 7

Student exercises

Exercises 1: Build a blog api

Objective: Create a REST API for a blogging platform

Create a Flask REST API for a blogging platform. 
Include 
user authentication with JWT, 
blog post CRUD operations, 
comment system, 
category management, 
and search functionality. 
Use SQLAlchemy, Marshmallow, and Swagger UI. 
Include proper error handling and validation.

Required features: 

User authentication (register, login)
Post CRUD operations
Comment system (create, read, delete)
Category management
Search posts by keyword
Pagination (20 posts per page)
Swagger documentation

POST   /api/auth/register
POST   /api/auth/login
GET    /api/posts              # List posts (paginated)
POST   /api/posts              # Create post
GET    /api/posts/<id>         # Get single post
PUT    /api/posts/<id>         # Update post
DELETE /api/posts/<id>         # Delete post
POST   /api/posts/<id>/comments
GET    /api/posts/<id>/comments
GET    /api/categories
GET    /api/search?q=keyword

-------------------------------------------------


Exercises 2: Add caching and testing

Objective: Enhance the blog API with Redis caching and comprehensive tests

Tasks: 
	Install and configure Redis caching
	Cache post listings and individual posts
	Implement cache invalidation on updates
	Write 15+ pytest test cases
	Achieve 85%+ test coverage
	Add database indexes for optimization

Performance Goals: 
	Reduce response time by 50%
	Handle 3x more concurrent requests

-------------------------------------------------


Exercises 3: Build from the PRD

Objective: Implement the Customer Support Ticket System from the provided PRD.

Implement the customer support ticket system according to PRD_Customer_Support_System.md. 
Focus on implementing functional requirements FR-001 through FR-015 (core ticket 
management). Include all validation rules, error handling, and security measures 
as specified in the PRD.

Core requirements to implement:

	Ticket creation with validation (FR-001)
	Auto-generate ticket numbers (FR-002)
	Ticket assignment system (FR-005, FR-006)
	Status management with transitions (FR-011, FR-012)
	Comments system (FR-015, FR-016)
	Priority levels with SLA (FR-020, FR-021)
	Priority levels with SLA (FR-020, FR-021)
	Email notifications (FR-035)

Expected Deliverables:

	Complete Flask API with all models
	Comprehensive validation
	Custom error handling
	20+ pytest test cases
	Swagger documentation
	README with setup instructions