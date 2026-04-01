# Warehouse Management System (WMS) - Backend

## Summary
The Warehouse Management System (WMS) backend is designed to efficiently manage warehouse operations including inventory tracking, order processing, and reporting. It provides a robust RESTful API to interact with warehouse data and ensures data integrity, security, and scalability. The backend serves as the foundation for handling warehouse logic, user management, notifications, and documentation.

> **Status:** The application is fully functional as a prototype and can be tested live. Both backend and frontend are actively being improved, including unit tests, feature enhancements, and frontend refinements.

## Technology Stack

### Node.js
A JavaScript runtime built on Chrome's V8 engine, Node.js allows the backend to run efficiently and handle asynchronous operations with high performance.

### Express.js
A minimal and flexible Node.js web application framework, Express.js provides a robust set of features for building RESTful APIs and handling routing, middleware, and HTTP requests.

### PostgreSQL
A powerful open-source relational database system used to store warehouse data including inventory, users, and transactions. It ensures data integrity and supports complex queries.

### TypeScript
A statically typed superset of JavaScript, TypeScript improves code quality and maintainability by enabling type safety, autocompletion, and better tooling support.

### Zod
A TypeScript-first schema validation library used to validate and parse incoming data, ensuring that API requests meet expected formats and types.

### TypeORM
An Object-Relational Mapping (ORM) library for TypeScript and JavaScript, TypeORM simplifies database interactions and allows defining database models as TypeScript classes.

### Nodemailer
A module for Node.js applications to send emails. Used in the system for notifications such as account verification, alerts, or reports.

### Swagger / OpenAPI
Used to automatically generate API documentation for the backend, making it easier for developers to understand and test endpoints.

### Docker
Containerization platform used to run the backend and database in isolated environments, simplifying setup and deployment.

## Features

### Authentication
- User login, logout, and session management
- Access token refresh
- Password reset and change
- Email verification and account updates
- Invitation requests

### Orders
- Create, update, and delete orders
- Manage order statuses: Pending, Confirmed, Completed, Cancelled
- Add or remove items from orders as needed
- Track inventory changes automatically based on order actions
- Paginated listing and detailed viewing of orders

### Inventory Movements
- View inventory movement history with pagination
- Track stock changes across actions

### Inventories
- Create, update, and delete inventory records
- Perform inventory actions such as set available, reserve, ship, transfer, or write off
- Paginated listing and detailed viewing of inventories

### Invitation Requests
- Manage and review invitation requests
- Approve or decline requests
- Paginated listing and detailed viewing

### Locations
- Create, update, delete, and view warehouse locations
- Paginated listing of locations

### Products
- Create, update, delete, and view products
- Manage product stock, including receiving new quantities
- Paginated listing of products

### Roles
- View and manage roles within the system
- Retrieve role details

### Users
- Create, update, delete, and view users
- Paginated listing of users

### Dashboard
- Access dashboard data for insights
- Export dashboard reports

### Health Check
- Endpoint to check the health status of the backend

## Project Structure

```
src/
├── controllers
├── emails
├── entities
├── enums
├── exceptions
├── lib
├── middlewares
├── migrations
├── routes
├── schemas
├── services
├── templates
├── types
├── utils
└── index.ts
```

## Project Structure Description

- **controllers/**  
  Handles incoming HTTP requests and orchestrates the response by interacting with services and returning data to clients.

- **emails/**  
  Implements the abstracted email system. Provides functionality to take templates and send emails, including notifications, alerts, or reports.

- **entities/**  
  Contains TypeORM entity definitions that represent database tables and their relationships.

- **enums/**  
  Stores enumerations used throughout the application for constants, statuses, and predefined values.

- **exceptions/**  
  Custom error classes for handling application-specific exceptions in a structured manner.

- **lib/**  
  Shared libraries, helper functions, and utility modules that can be used across the application.

- **middlewares/**  
  Express middlewares for handling authentication, validation, logging, and other pre/post-processing of requests.

- **migrations/**  
  Database migration scripts to create or update database schema in a version-controlled manner.

- **routes/**  
  API route definitions that map endpoints to controller methods.

- **schemas/**  
  Zod schemas for validating incoming request data and ensuring proper types and formats.

- **services/**  
  Business logic layer where application operations and data manipulations are performed.

- **storage/**  
  File storage for uploads, generated reports, or other static assets managed by the backend.

- **templates/**  
  Template files for generating emails, reports, or documents.

- **types/**  
  Custom TypeScript types and interfaces used across the codebase.

- **utils/**  
  Utility functions and helpers that do not fit in other specific folders.

- **index.ts**  
  Entry point of the application that initializes the server and connects all modules.

## Local Setup

Follow these steps to set up the WMS backend locally.

### 1. Clone the repository

```bash
git clone git@github.com:lancedalanon/warehouse-management-system.git
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Edit .env and update the following:

```bash
# Database
DB_TYPE=postgres
DB_NAME=warehouse_management_system
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_ACCESS_TOKEN_SECRET=default_secret
JWT_REFRESH_TOKEN_SECRET=default_secret

# Email verification
EMAIL_VERIFY_SECRET=default_secret

# Mail configuration
MAIL_DELIVERY_TYPE=smtp   # or "api" if using a mail API

# SMTP settings (if using SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your_email@example.com
MAIL_PASS=your_app_password

# API settings (if using an email API)
MAIL_PROVIDER=
MAIL_API_KEY=

MAIL_FROM="My App <no-reply@myapp.com>"
```

### 4. Run database migrations

Make sure PostgreSQL is running and the database exists:

```bash
npx typeorm-ts-node-commonjs -d src/data-source.ts migration:run
```

### 5. Start the development server

```bash
npm run dev
```

The backend will now be running, usually at `http://localhost:3000`.

### 6. Optional checks

Open `http://localhost:3000/api-docs` to view Swagger API documentation (if enabled).

Test email functionality by triggering signup or verification flows.

## Optional: Docker Setup

You can run the backend using Docker instead of setting it up manually.

### 1. Prerequisites

- Ensure Docker is installed (Docker Desktop is recommended).  
- Update your `.env` file to change the database host:

```bash
DB_HOST=host.docker.internal
```

### 2. Start the backend with Docker

Open a terminal in the backend directory:

```backend
cd backend
docker compose up -d --build
```

This will build the Docker image and start the backend in detached mode.

### 3. Notes

The backend will run inside a Docker container, connecting to the database via host.internal.docker.

You can view logs with:

```bash
docker compose logs -f
```

To stop the containers:

```bash
docker compose down
```

## Contact, Licensing & Acknowledgements

### Contact
For any questions or feedback, feel free to reach out:

- **Email:** lanceorville5@gmail.com  
- **GitHub:** [lancedalanon](https://github.com/lancedalanon)

> This is a personal project. Contributions are not accepted at the current moment.

### Licensing
This project is for personal use. All rights reserved.

### Acknowledgements
This project uses the following libraries and technologies. For more information or official documentation, please refer to their respective sites:

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://github.com/colinhacks/zod)
- [TypeORM](https://typeorm.io/)
- [Nodemailer](https://nodemailer.com/)
- [Swagger / OpenAPI](https://swagger.io/)
- [Docker](https://www.docker.com/)
