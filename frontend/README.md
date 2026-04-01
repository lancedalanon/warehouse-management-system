# Warehouse Management System (WMS) - Frontend

## Summary

The Warehouse Management System (WMS) frontend is a modern, responsive web application designed to provide warehouse managers and staff with an intuitive interface for real-time inventory control. Built with a feature-based architecture, it ensures seamless interaction with the WMS Backend API for order processing, stock movements, and data visualization.

> The application is fully functional as a prototype and can be tested live. Both backend and frontend are actively being improved, including unit tests, feature enhancements, and frontend refinements.

# Technology Stack

### React.js & TypeScript

Leverages **React** for a component-based UI and **TypeScript** to ensure strict type safety across the application, reducing runtime errors and improving developer experience.

### Vite

A lightning-fast build tool and development server that provides a significantly optimized frontend workflow compared to traditional bundlers.

### Tailwind CSS

A utility-first CSS framework used for rapid UI development. It allows for a highly customizable and responsive design without leaving the HTML/JSX.

### Redux Toolkit (RTK)

The official, opinionated toolset that simplifies Redux development by providing built-in functions to handle store setup, reducer logic, and immutable state updates with significantly less boilerplate.

### React Router

The standard routing library for React, managing navigation and deep-linking within the single-page application (SPA).

### Lucide React

A clean and consistent icon library used throughout the dashboard and navigation to provide visual cues for warehouse actions.

### Zod & React Hook Form

Combines **Zod** for schema validation and **React Hook Form** for performant, flexible, and extensible forms with minimal re-renders.

## Features

### Dashboard & Analytics

- Visual overview of warehouse health.
- Real-time charts showing stock levels and order fulfillment rates.

### Inventory Management

- **Search & Filter**: Advanced filtering by location, status, or product type.
- **Stock Actions**: Easy-to-use interfaces for transferring, reserving, or writing off stock.
- **History**: Paginated views of stock movements and audit trails.

### Order Processing

- **Workflows**: Visual tracking of orders through Pending, Confirmed, and Completed stages.
- **Dynamic Fulfillment**: Add or remove items from active orders with real-time stock validation.

### User & Access Control

- **Role-Based Views**: UI elements adapt based on whether the user is an Admin or an Operator.
- **Invitations**: Management interface for approving or declining new user requests.
- **Responsive Design**: Fully optimized for desktop and tablet use, ensuring warehouse managers can use the system on the go.

## Project Structure

```text
src/
├── apis
├── assets
├── components
├── configs
├── enums
├── features
├── hooks
├── lib
├── pages
├── routes
├── stores
├── types
├── utils
├── App.tsx
├── main.tsx
└── index.css
```

## Project Structure Description

Based on the provided frontend directory structure, here is the updated breakdown of the project organization:

- **apis/**
  Contains the service layer for API calls. It centralizes all axios instances and request logic to ensure API interactions are reusable, easy to update, and consistent across the application.

- **assets/**
  Stores static files such as images, SVG icons, and global CSS files that are imported directly into components or the main entry point.

- **components/**
  Houses "dumb" or "stateless" UI components. These are the atomic building blocks of the interface—like custom buttons, inputs, modals, and navigation bars—designed to be highly reusable and independent of business logic.

- **configs/**
  Centralizes application configuration, including environment variable mappings, global constants, and third-party library settings.

- **enums/**
  Stores TypeScript enumerations for fixed sets of values, such as order statuses, user roles, or API response codes, ensuring type safety and reducing magic strings.

- **features/**
  Follows a feature-based architecture. Complex logic (like "Order Management" or "Inventory Tracking") is grouped here, containing its own local components, logic, and Redux slices specific to that domain.

- **hooks/**
  Contains custom React hooks to encapsulate and share stateful logic. This keeps components DRY (Don't Repeat Yourself) by extracting logic for things like authentication checks, debouncing, or fetching specific data.

- **lib/**
  Dedicated to third-party library initializations and wrappers. This often includes utility setups for tailwind-merge or configurations for external SDKs.

- **pages/**
  Contains the main view components that represent different routes in the application (e.g., Dashboard, Login, Inventory). These act as containers that assemble various features and components.

- **routes/**
  Defines the application's URL structure and routing logic. This includes route protection (guards) to redirect unauthenticated users away from private dashboard pages.

- **stores/**
  The Redux store setup. It manages the global state of the application, such as the current user's session, theme preferences, and global UI states like sidebar toggles.

- **types/**
  A centralized location for TypeScript interfaces and type definitions used throughout the codebase to ensure data consistency between the frontend and the backend API.

- **utils/**
  Small, pure helper functions and utility modules for tasks like date formatting, currency conversion, and string manipulation that don't fit into a specific feature.

## Local Setup

### 1. Clone the repository

```bash
git clone git@github.com:lancedalanon/warehouse-management-system.git
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update VITE_API_URL to point to your local or hosted backend (e.g., `http://localhost:3000/api`).

4. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

Build and Deployment
To create a production-ready bundle:

```bash
npm run build
```

The output will be in the dist/ folder, which can be served by any static web server (Nginx, Vercel, Netlify).

## Optional: Docker Setup

You can run the frontend using Docker instead of setting it up manually.

### 1. Start the frontend with Docker

Open a terminal in the frontend directory:

```frontend
cd frontend
docker compose up -d --build
```

This will build the Docker image and start the frontend in detached mode.

### 2. Notes

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

- [React 19](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [React Router](https://reactrouter.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Axios](https://axios-http.com/)
- [Zod](https://github.com/colinhacks/zod)
- [Lucide React](https://lucide.dev/)
- [Recharts](https://recharts.org/)
- [TypeScript](https://www.typescriptlang.org/)
