# MQTT Topics Specification

## Overview

The Telemetry Service relies on MQTT to establish low-latency communication between autonomous rovers and the backend platform. Each topic has a specific responsibility within the rover lifecycle, including mission initialization, telemetry streaming, command execution, event reporting, diagnostics, and fault notification.

---

# MQTT Topic Hierarchy

```text
rovex/
└── {roverId}/
    ├── telemetry
    ├── command
    ├── init
    ├── event
    ├── alert
    ├── heartbeat
    ├── charging
    └── diagnostics
```

---

# 1. Telemetry Topic

## Topic

```text
rovex/{roverId}/telemetry
```

### Purpose

Continuously publishes the rover's live telemetry data.

### Publisher

- Rover

### Subscriber

- Telemetry Service

### QoS

```text
QoS 1
```

### Publish Frequency

```text
Every 1 second
```

### Payload

```json
{
  "label": "ROVEX-01",
  "color": "#2196F3",

  "lat": 30.0438,
  "lng": 31.2357,

  "bearing": 125.3,

  "speed": 2.4,

  "status": "moving",

  "battery": 87.5,

  "distanceTraveled": 1230,

  "totalDistance": 4500,

  "eta": 620,

  "trail": [
    {
      "lat": 30.043,
      "lng": 31.234
    }
  ],

  "startAddress": "Warehouse A",
  "endAddress": "Customer",

  "startLat": 30.041,
  "startLng": 31.223,

  "endLat": 30.080,
  "endLng": 31.320,

  "speedMs": 2.4,

  "speedMultiplier": 1
}
```

---

# 2. Command Topic

## Topic

```text
rovex/{roverId}/command
```

> This topic is responsible for robot control commands.

### Publisher

- Fleet Dashboard
- Telemetry Service

### Subscriber

- Rover

### QoS

```text
QoS 1
```

### Payload

```json
{
  "cmd": "pause"
}
```

or

```json
{
  "cmd": "setspeed",
  "value": 2
}
```

### Supported Commands

| Command | Description |
|----------|-------------|
| start | Start mission |
| resume | Resume movement |
| pause | Pause rover |
| stop | Stop rover |
| emergencystop | Emergency stop |
| returnhome | Return to warehouse |
| setspeed | Change rover speed |
| reset | Reset rover state |

---

# 3. Mission Initialization Topic

## Topic

```text
rovex/{roverId}/init
```

### Purpose

Initializes the rover before starting a delivery mission.

### Publisher

- Dispatch Service
- Telemetry Service

### Subscriber

- Rover

### QoS

```text
QoS 1
```

### Payload

```json
{
  "missionId": "MIS001",

  "orderId": "ORD1001",

  "companyId": "CMP001",

  "customerId": "USR001",

  "pickup": {
    "lat": 30.10,
    "lng": 31.22,
    "address": "Warehouse A"
  },

  "dropoff": {
    "lat": 30.20,
    "lng": 31.30,
    "address": "Customer"
  },

  "estimatedDistance": 4200,

  "estimatedDuration": 840
}
```

---

# 4. Mission Events Topic

## Topic

```text
rovex/{roverId}/event
```

### Purpose

Reports mission lifecycle events.

### Publisher

- Rover

### Subscriber

- Telemetry Service

### QoS

```text
QoS 1
```

### Payload

```json
{
  "event": "ARRIVED_PICKUP",

  "orderId": "ORD1001",

  "missionId": "MIS001",

  "timestamp": "2026-07-10T12:45:00Z"
}
```

### Supported Events

- MISSION_INITIALIZED
- ARRIVED_PICKUP
- ORDER_LOADED
- DELIVERY_STARTED
- ARRIVED_DESTINATION
- ORDER_DELIVERED
- RETURN_HOME
- DOCKED

---

# 5. Alert Topic

## Topic

```text
rovex/{roverId}/alert
```

### Purpose

Publishes emergency and warning events.

### Publisher

- Rover

### Subscriber

- Telemetry Service

### QoS

```text
QoS 1
```

### Payload

```json
{
  "type": "LOW_BATTERY",

  "severity": "warning",

  "message": "Battery level below 20%",

  "battery": 18,

  "timestamp": "2026-07-10T12:00:00Z"
}
```

Possible Alerts

- LOW_BATTERY
- GPS_LOST
- MOTOR_FAILURE
- OBSTACLE_DETECTED
- EMERGENCY_STOP

---

# 6. Heartbeat Topic

## Topic

```text
rovex/{roverId}/heartbeat
```

### Purpose

Maintains rover connectivity.

### Publisher

- Rover

### Subscriber

- Telemetry Service

### QoS

```text
QoS 0
```

### Publish Frequency

```text
Every 5 seconds
```

### Payload

```json
{
  "timestamp": "2026-07-10T12:30:00Z",

  "uptime": 5421,

  "online": true
}
```

---

# 7. Charging Topic

## Topic

```text
rovex/{roverId}/charging
```

### Purpose

Reports charging progress.

### Publisher

- Rover

### Subscriber

- Telemetry Service

### Payload

```json
{
  "status": "charging",

  "battery": 62,

  "estimatedCompletion": 900
}
```

---

# 8. Diagnostics Topic

## Topic

```text
rovex/{roverId}/diagnostics
```

### Purpose

Reports rover hardware diagnostics.

### Publisher

- Rover

### Subscriber

- Telemetry Service

### Payload

```json
{
  "cpu": 32,

  "memory": 48,

  "temperature": 44,

  "network": "good",

  "gps": "connected",

  "motors": "healthy",

  "sensors": "healthy"
}
```

---

# MQTT Communication Summary

| Topic | Publisher | Subscriber |
|---------|------------|-------------|
| telemetry | Rover | Telemetry Service |
| command | Fleet Dashboard / Telemetry Service | Rover |
| init | Dispatch / Telemetry Service | Rover |
| event | Rover | Telemetry Service |
| alert | Rover | Telemetry Service |
| heartbeat | Rover | Telemetry Service |
| charging | Rover | Telemetry Service |
| diagnostics | Rover | Telemetry Service |

---

# Complete Rover Lifecycle

```text
Dispatch Service
        │
        │ init
        ▼
 Rover
        │
        ├──────── telemetry ─────────► Telemetry Service
        │
        ├──────── event ─────────────► Telemetry Service
        │
        ├──────── alert ─────────────► Telemetry Service
        │
        ├──────── heartbeat ─────────► Telemetry Service
        │
        ├──────── diagnostics ───────► Telemetry Service
        │
        ├──────── charging ──────────► Telemetry Service
        │
        ◄──────── command ─────────── Fleet Dashboard
```