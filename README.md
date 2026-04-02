# 📦 Warehouse Management System (WMS)

A full-stack Warehouse Management System built to simulate the operational complexity of real-world inventory and order fulfillment workflows. This project was developed as both a system design challenge and a portfolio demonstration of full-stack development using Node.js and React.

**[🚀 Live Demo](https://lance-dalanon-wms.netlify.app/)**

> ⚠️ The backend is hosted on Render's free tier and the database on Supabase. Cold starts may cause slightly slower initial response times.

---

## 🧠 About the Project

At first glance, a WMS appears simple — products come in, orders go out. But under the hood, the workflow is significantly more complex. Products must be imported, recorded, placed into specific warehouse locations, tracked during every movement, and eventually allocated and fulfilled — all while maintaining an accurate, real-time representation of inventory.

This project was created after researching various enterprise systems to tackle that complexity head-on. The goal was to build a simplified yet structurally sound version of a WMS, while deepening my backend development skills in Node.js (coming from a background in Laravel, React, Vue, and TypeScript).

---

## ⚙️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | Node.js, Express.js               |
| Frontend   | React.js                          |
| Database   | PostgreSQL (hosted on Supabase)   |
| Hosting    | Render (Backend), Netlify (Frontend) |

---

## 🏗️ Architecture Highlights

### Ledger-Based Inventory System

One of the core design challenges was building a reliable way to track every inventory movement while maintaining an accurate current state — without data corruption or loss of history.

Inspired by financial transaction systems used in fintech, each inventory movement is recorded as an **immutable transaction entry** rather than directly mutating the current state. This means:

- **Traceability** — every movement (import, transfer, allocation, fulfillment) is logged historically
- **Consistency** — current inventory state is always derivable from the full transaction ledger
- **Auditability** — operations can be reviewed and validated at any point in time

### Bucket-Based Location Structure

Warehouse storage is modeled using a **bucket-like location system**, allowing products to be organized within specific, named storage locations across the warehouse floor.

### Inventory Lifecycle

The system supports the following inventory transitions:

```
Product Import → Stock Placement → Inventory Transfer → Order Allocation → Order Fulfillment
```

---

## 🔐 Roles & Permissions

The system uses role-based access control (RBAC) to simulate how responsibilities are separated in a real warehouse environment.

| Role               | Capabilities                                                                 |
|--------------------|------------------------------------------------------------------------------|
| **Super Admin**    | Full system access                                                           |
| **Warehouse Manager** | Full warehouse operations; cannot manage users                            |
| **Inventory Staff**   | Manage warehouse operations and inventory; cannot manage user accounts    |
| **Auditor**           | Read-only access to dashboard, inventory, products, locations, and orders |

---

## 🔑 Demo Accounts

You can explore the system using the following credentials:

| Role               | Email                              | Password   |
|--------------------|------------------------------------|------------|
| Super Admin        | superadmin@example.com             | `password` |
| Warehouse Manager  | warehouse-manager@example.com      | `password` |
| Inventory Staff    | inventory-staff@example.com        | `password` |
| Auditor            | auditor@example.com                | `password` |

---

## 📁 Repository Documentation

Each part of the application has its own dedicated README:

- 📘 [Backend README](https://github.com/lancedalanon/warehouse-management-system/blob/main/backend/README.md)
- 📗 [Frontend README](https://github.com/lancedalanon/warehouse-management-system/blob/main/frontend/README.md)

---

## 📬 Contact

**Lance Dalanon**

- 📧 Email: [lanceorville5@gmail.com](mailto:lanceorville5@gmail.com)
- 🐙 GitHub: [github.com/lancedalanon](https://github.com/lancedalanon)

---

## 📄 License

This project is for **personal and portfolio use only**. All rights reserved. Contributions are not currently accepted.