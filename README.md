# TrafficVision AI 🚦

TrafficVision AI is a smart city traffic management, forecasting, and route optimization platform. By combining a FastAPI backend, a modern React+TypeScript frontend, and a machine learning predictive pipeline, TrafficVision AI provides real-time traffic analytics, forecasts congestion, and suggests optimized routing paths to reduce travel time and carbon footprint.

---

## 🏛️ System Architecture

The platform consists of three core components:
1. **AI/ML Engine (`/ai_models`)**: Data preprocessing scripts, feature engineering, and a Random Forest classification/regression model built using Scikit-learn.
2. **Backend Services (`/backend`)**: A fast, asynchronous FastAPI REST API backed by PostgreSQL (managed via SQLAlchemy and Alembic migrations) for core logic, traffic reports, and routing algorithms.
3. **Frontend Dashboard (`/frontend`)**: A reactive dashboard built with Vite, React, TypeScript, Tailwind CSS, Leaflet Maps, and Recharts.

---

## 📅 Project Milestones

### 📍 Milestone 1: Project Initialization, Design Process & Core Setup
Focuses on establishing the database architecture, setting up developer environments, securing the APIs, and building the real-time monitoring interface.
* **Smart Traffic Workflows**: Setup workflows to track live traffic conditions, classify congestion status, and monitor city-wide traffic volume.
* **Database Schema Design**: Designed a relational schema for:
  * Users (Administrative, Traffic Operator, Viewer roles)
  * Traffic Sensors & Logs (Speed, count, junction IDs)
  * Congestion Events & Reports
* **Authentication & RBAC (Role-Based Access Control)**: Built OAuth2-compliant JWT authentication. Only authorized operator and admin users can generate reports or alter system configurations.
* **Live Traffic Dashboard**: Created a dashboard summarizing current average speeds, live congestion events, active alerts, and real-time chart integrations.

### 📍 Milestone 2: Traffic Prediction & Route Optimization
Focuses on training predictive models, utilizing maps API interfaces, and calculating alternative routing recommendations.
* **Traffic Prediction Models**: A Python-based ML training pipeline (`ai_models/saved_models/traffic_model.joblib`) that forecasts speeds and congestion levels based on historic road metadata, hour of the day, and day of the week.
* **Congestion Forecasting**: Interactive backend service that runs predictive checks to forecast traffic levels for the next 24 hours.
* **Maps & Traffic API Integration**: Integrates the TomTom Traffic API to fetch actual live traffic flows and incidents.
* **Leaflet Map Routing & Travel Time Estimation**: Renders path overlays on interactive Leaflet Maps, showcasing the primary route versus recommended alternative routes alongside estimated travel times (ETAs).

### 📍 Milestone 3: Traffic Alerts, Analytics, Heatmap & Trend Analysis
Focuses on alert management workflows, dynamic charting analytics dashboards, geospatial leaflet heatmaps, and trend forecasters.
* **Traffic Alert System**: Automatically generates critical alerts based on XGBoost model capacity thresholds. Allows operators and admins to view, search, acknowledge, resolve, and delete alerts with performance-optimized DB batch commits.
* **Advanced Analytics Dashboard**: Houses 10 dynamic KPI metrics (vehicle totals, density ratios, travel times, prediction accuracy indices) and 5 interactive Recharts charts (hourly line chart, daily bar chart, congestion pie chart, vehicle category stacked chart, timeline density area chart).
* **Interactive Congestion Heatmap**: OpenStreetMap Leaflet map drawing glowing congestion bubble overlays (Low $\to$ Green, Moderate $\to$ Yellow, High $\to$ Orange, Severe $\to$ Red) with time range sliders and markers toggle.
* **AI-driven Traffic Trends & Insights**: Tabbed comparison timelines (hourly to monthly), road forecast overlay checks, and smart AI insights recommendation cards flagging bottlenecks and rush hour warning flags.
* **High Performance Optimization**: Leverages NumPy and Pandas vectorized calculations on the 200k+ historical traffic dataset, reducing database aggregation wait times from 20 seconds to less than 20 milliseconds.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | FastAPI | High-performance Python ASGI web framework |
| | PostgreSQL | Relational database (using SQLAlchemy & Alembic) |
| | Pydantic v2 | Schema validation & configuration |
| | python-jose | JWT validation for authentication |
| **Frontend** | React 19 + TypeScript | Core component-based web framework |
| | Vite | Fast frontend build tool & dev server |
| | Tailwind CSS v4 | Styling and responsive layouts |
| | Leaflet + React-Leaflet | Map integration and routing visualizations |
| | Recharts | Dynamic traffic analytical charts |
| **AI/ML** | Scikit-learn | Machine learning pipelines (Random Forest) |
| | Joblib | Model serialization & saving |
| | Pandas & NumPy | Data cleansing and feature engineering |

---

## 🚀 Installation & Local Setup

### Prerequisites
* **Python 3.10+**
* **Node.js 18+** (with `npm`)
* **PostgreSQL** (running locally or remotely)

---

### 1. Database Setup 🗄️
1. Create a database named `trafficvision` in PostgreSQL.
   ```sql
   CREATE DATABASE trafficvision;
   ```

---

### 2. Backend Setup 🐍
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables. Copy the `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and configure:
   * `DATABASE_URL`: Set your PostgreSQL username, password, host, and port.
   * `TOMTOM_API_KEY`: Provide a valid TomTom Developer API key (optional, used for real-time routing/maps).
   * `SECRET_KEY`: Set a secure random string for signing JWT tokens.
5. Run Alembic migrations to construct the database schema:
   ```bash
   alembic upgrade head
   ```
6. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend API documentation will be available at `http://localhost:8000/docs`.

---

### 3. Frontend Setup ⚡
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

### 4. AI/ML Pipeline Setup 🤖
The model files are situated in `/ai_models`.
1. Navigate to the model directory:
   ```bash
   cd ../ai_models
   ```
2. Install modeling dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run model training:
   ```bash
   python models/train.py
   ```
   This will read raw dataset counts from `datasets/`, perform preprocessing/feature engineering, evaluate the model, and dump `traffic_model.joblib` and `road_metadata.json` into `saved_models/` which the backend services load for forecasting.

---

## 🔒 Default User Roles & Credentials
Once the seed data is populated or the database is run, you can authenticate using the following built-in accounts (or register new ones):

| Role | Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@trafficvision.ai` | `admin123` | Complete system control and configuration |
| **Operator** | `operator@trafficvision.ai` | `operator123` | Manage events, view dashboards, trigger reports |
| **Viewer** | `viewer@trafficvision.ai` | `viewer123` | Read-only dashboards and alerts |
