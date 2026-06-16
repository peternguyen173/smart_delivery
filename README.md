# Smart Delivery

A logistics management platform for end-to-end courier operations — from order intake to last-mile delivery. Built with a Spring Boot API and a React SPA.

## Highlights

- **Genetic Algorithm** auto-assigns orders to drivers/collectors by minimizing total travel distance across all active routes
- **Real-time routing** using GraphHopper and Leaflet with live map visualization
- **Event-driven notifications** via RabbitMQ pushed to the browser
- **5 user roles** with Keycloak-backed OAuth2/JWT: Admin, Hub Manager, Driver, Collector, Shipper

## Stack

**Backend** — Java 21, Spring Boot 3, PostgreSQL, Redis, RabbitMQ, GraphHopper, Keycloak

**Frontend** — React 18, Redux Toolkit, Material-UI, Leaflet, Recharts

**Infra** — Docker, Keycloak

## Quick Start

```bash
# Backend
cd smart_delivery_backend
./mvnw spring-boot:run          # http://localhost:8080/api

# Frontend
cd smart_delivery_frontend
npm install && npm start         # http://localhost:3000
```

Requires: Java 21, Node 16+, PostgreSQL, Redis, RabbitMQ, Keycloak.

## Structure

```
smart_delivery/
├── smart_delivery_backend/    # Spring Boot — controller / service / entity / repository
└── smart_delivery_frontend/   # React SPA  — screens per role, Redux state, Leaflet maps
```

## Key Modules

| Module | Description |
|---|---|
| `GAAutoAssign` | Genetic Algorithm for optimal order-to-resource assignment |
| `DistanceCalculator` | GraphHopper road routing + Haversine fallback |
| Middle-mile | Inter-hub transfer scheduling |
| Analytics | Delivery KPIs, statistics dashboard, PDF export |

---

Graduation thesis — Hanoi University of Science and Technology (SOICT)
