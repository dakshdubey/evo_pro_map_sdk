# evo_map_SDK
evo_map_SDK
Overview

evo_map_SDK is a fully custom, Google-style map data and API platform built completely from scratch for Evo-Pro.

The project provides a vector-based map data system, raw and editable APIs, and a rendering-agnostic architecture that allows complete control over how maps are visualized and used.

This system does not rely on Google Maps, OpenStreetMap, or any third-party map providers. All map data, logic, and APIs are fully owned and controlled by the developer.

Design Philosophy

The core philosophy of evo_map_SDK is data first, rendering second.

Instead of locking developers into a fixed SDK or UI, the platform exposes clean, structured map data through APIs, enabling full freedom to render, style, filter, and modify maps according to specific product needs.

Core Features

Vector-based map data model (nodes, ways, areas, layers)

Raw JSON APIs with full client-side editability

Layer-driven architecture inspired by Google Maps internals

Rendering-agnostic design (Canvas, WebGL, or custom engines)

MySQL as the single source of truth

No third-party map data or services

Built for extensibility, customization, and experimentation

Architecture Overview
MySQL (Vector Map Data)
        ↓
Map Data APIs (Editable JSON)
        ↓
Custom Logic / SDK / UI
        ↓
Rendered Maps (Web, Mobile, Internal Tools)

Data Model

The platform follows a Google-style internal structure:

Nodes: points such as POIs, markers, and junctions

Ways: lines such as paths, connections, and routes

Areas: polygons such as venues, zones, and boundaries

Layers: grouping, visibility control, and styling

All entities are stored as vector data with metadata, not as images or tiles.

Use Cases

Event venue and layout mapping

Wedding and exhibition halls

Stadiums and campuses

Vendor service and delivery zones

Booking and discovery platforms

Private and internal geospatial systems

Technology Stack

Backend: Node.js

Database: MySQL

Data Format: JSON (vector-based)

Rendering: Client-defined (no enforced SDK)

License

Evo Pro Software License – Version 2.0
A permissive license allowing modification, redistribution, and commercial use.

Project Status

Actively developed as a core mapping and data infrastructure layer for Evo-Pro.