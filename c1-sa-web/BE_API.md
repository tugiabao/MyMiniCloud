# Backend API Documentation

This document lists all available API endpoints for the Smart Aquarium backend.

## 1. Authentication (`/auth`)

| Method | URL | Headers | Body / Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/register` | None | `{ "email": "...", "password": "...", "fullName": "...", "phone": "...", "address": "...", "gender": "...", "birthday": "..." }`<br>Register a new user account. |
| **POST** | `/auth/login` | None | `{ "email": "user@example.com", "password": "securePass" }`<br>Login to receive an internal JWT token. |
| **GET** | `/auth/google` | None | Get the Google OAuth login URL. |
| **POST** | `/auth/logout` | None | Logout the current user (Supabase session). |
| **DELETE** | `/auth/me` | `Authorization: Bearer <token>` | Delete the current user's account. |
| **DELETE** | `/auth/test-delete/:id` | None | `{ "secret": "..." }`<br>**(Dev Only)** Force delete a user by ID. |

---

## 2. Device Management (`/device`)

| Method | URL | Headers | Body / Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/device/my-systems` | `Authorization: Bearer <token>` | Get a list of aquarium systems owned by the user. |
| **POST** | `/device/control` | `Authorization: Bearer <token>` | `{ "systemName": "SA01", "device": "relay1", "status": true }`<br>Turn a device on/off (relay1-3, camera, servo). |

---

## 3. Automation / Schedule (`/schedule`)

| Method | URL | Headers | Body / Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/schedule` | `Authorization: Bearer <token>` | Get all automation schedules. |
| **POST** | `/schedule` | `Authorization: Bearer <token>` | `{ "systemName": "SA01", "device": "relay1", "startTime": "08:00", "duration": 15, "value": 1 }`<br>Create a new automation schedule. |
| **DELETE** | `/schedule/:id` | `Authorization: Bearer <token>` | Delete a specific schedule (by ID). |
| **PATCH** | `/schedule/:id/toggle` | `Authorization: Bearer <token>` | `{ "isActive": true, "systemName": "SA01" }`<br>Enable or disable a specific schedule. |

---

## 4. Sensor Data (`/sensor`)

| Method | URL | Headers | Body / Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/sensor/events` | None | **Server-Sent Events (SSE)**<br>Real-time stream of sensor data updates. |
| **POST** | `/sensor/status` | `Authorization: Bearer <token>` | `{ "systemName": "SA01" }`<br>Get the latest sensor status for a system. |
| **GET** | `/sensor/history` | `Authorization: Bearer <token>` | **Query Params:** `?systemName=SA01&limit=20`<br>Get historical sensor logs. |
| **GET** | `/sensor/info/:systemName` | `Authorization: Bearer <token>` | Get detailed information about a specific system. |
| **DELETE** | `/sensor/:systemName` | `Authorization: Bearer <token>` | Clear all sensor logs for a specific system. |

---

## 5. Camera Streaming (`/stream`)

| Method | URL | Headers | Body / Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/stream/start` | `Authorization: Bearer <token>` | `{ "systemName": "SA01" }`<br>Start the camera stream (returns Live & AI URLs). |
| **POST** | `/stream/stop` | `Authorization: Bearer <token>` | Stop the currently running stream for the user. |
