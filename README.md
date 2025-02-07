# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from "eslint-plugin-react";

export default tseslint.config({
  // Set the react version
  settings: { react: { version: "18.3" } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs["jsx-runtime"].rules,
  },
});
```

# HomeNurse

# Medical Care Home Services Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Application Structure](#application-structure)
5. [Features](#features)
6. [Database Schema](#database-schema)
7. [Authentication](#authentication)
8. [Internationalization](#internationalization)
9. [Security](#security)
10. [Deployment](#deployment)

## Project Overview

Medical Care Home Services is a comprehensive web application designed to manage home medical care services. The platform connects patients with healthcare providers, manages care requests, and streamlines the process of healthcare service delivery.

## Tech Stack

### Frontend

- **React (v19)**: Core framework
- **TypeScript**: Type-safe development
- **Ant Design**: UI component library
- **Styled Components**: CSS-in-JS styling
- **Framer Motion**: Animation library
- **i18next**: Internationalization

### Backend/Database

- **Supabase**: Backend as a Service
- **PostgreSQL**: Database (via Supabase)

### Build Tools

- **Vite**: Build and development tool
- **ESLint**: Code linting
- **TypeScript**: Static type checking

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository

```bash
git clone [repository-url]
cd medical-care-home
```

2. Install dependencies

```bash
yarn install
```

3. Set up environment variables
   Create a `.env` file with the following:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start development server

```bash
yarn dev
```

## Application Structure

### Core Components

```
src/
├── components/         # Reusable UI components
├── pages/             # Page components
├── utils/             # Utility functions
├── hooks/             # Custom React hooks
├── contexts/          # React contexts
├── types/             # TypeScript type definitions
└── locales/           # Translation files
```

### Key Components

1. **AuthProvider**: Manages authentication state
2. **NotificationProvider**: Handles application notifications
3. **LandingForm**: Main landing page component
4. **AuthForm**: Authentication UI handler

## Features

### 1. Care Request Management

- Regular Care Requests
- Psychiatric Care Requests
- Quick Service Requests
- Request status tracking
- Assignment management

### 2. User Management

- Role-based access control
- User profiles
- Nurse management (SuperAdmin)

### 3. Dashboard

- Service overview cards
- Statistics and metrics
- Quick access to key features

### 4. Profile Management

- Professional information
- Certifications
- Performance metrics

### 5. Payment Structure

#### Private Care Services

- Nurses have individual hourly rates that can be managed by SuperAdmin
- Default rates:
  - Normal Private Care: $3.75/hour
  - Psychiatric Care: $4.00/hour
- Rates can be customized per nurse based on:
  - Experience
  - Qualifications
  - Performance
  - Market conditions
- Rate changes are tracked with timestamps
- Payment processed by SuperAdmin
- Tracked through working hours log

#### Quick Services

- Patient pays nurse directly
- Nurse pays commission to company
- Commission rate: $3.00 per service
- Quick services include:
  - Blood tests
  - IM injections
  - IV services
  - Hemo VS
  - Patient care
  - Other quick services

#### Payment Processing

- SuperAdmin can:
  - Process payments:
    - Bulk payment for all unpaid hours
    - Individual payment for specific services
  - Manage nurse hourly rates:
    - View current rates
    - Update normal care rate
    - Update psychiatric care rate
    - Track rate change history
- Payment tracking with paid/unpaid status
- Automatic balance calculation:
  - Shows amount owed to nurse (based on their individual rates)
  - Shows commission owed by nurse
  - Calculates final balance (private care earnings - commission)

### Database Schema

#### profiles table additions:

```sql
ALTER TABLE profiles
ADD COLUMN normal_care_hourly_rate NUMERIC DEFAULT 3.75,
ADD COLUMN psychiatric_care_hourly_rate NUMERIC DEFAULT 4.00,
ADD COLUMN rates_updated_at TIMESTAMPTZ DEFAULT now();
```

#### Rate Management Function:

```sql
-- Function to update nurse rates (SuperAdmin only)
CREATE OR REPLACE FUNCTION update_nurse_rates(
    nurse_id_param UUID,
    normal_rate_param NUMERIC,
    psychiatric_rate_param NUMERIC
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Function implementation details in migration file
$$;
```

#### Triggers:

```sql
-- Trigger to track rate changes
CREATE TRIGGER update_rates_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_rates_updated_at();
```

#### Security:

```sql
-- RLS policy for rate management
CREATE POLICY "Allow superAdmin to update rates"
    ON profiles
    FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'superAdmin'));
```

## Database Schema

The application uses a PostgreSQL database hosted on Supabase with the following structure:

### Tables

#### 1. profiles

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT,
    role TEXT NOT NULL,
    full_name TEXT,
    phone_number TEXT NOT NULL,
    area TEXT,
    location TEXT,
    is_approved BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. requests

```sql
CREATE TABLE requests (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    patient_id UUID NOT NULL REFERENCES profiles(id),
    details TEXT,
    status request_status_enum NOT NULL DEFAULT 'pending',
    price NUMERIC,
    assigned_nurse_id UUID REFERENCES profiles(id),
    image_id TEXT,
    service_type service_type_enum NOT NULL DEFAULT 'other',
    updated_by UUID REFERENCES profiles(id),
    visit_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. request_nurse_assignments

```sql
CREATE TABLE request_nurse_assignments (
    request_id INTEGER NOT NULL REFERENCES requests(id),
    nurse_id UUID NOT NULL REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    working_hours NUMERIC DEFAULT 0,
    PRIMARY KEY (request_id, nurse_id)
);
```

#### 4. nurse_working_hours_log

```sql
CREATE TABLE nurse_working_hours_log (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    request_id INTEGER REFERENCES requests(id),
    nurse_id UUID REFERENCES profiles(id),
    hours NUMERIC NOT NULL,
    work_date DATE NOT NULL,
    notes TEXT,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Database Relationships

1. **Profiles (Users)**

   - Central table storing all user types (nurses, patients, admins)
   - Tracks user approval and blocking status
   - Stores location and contact information
   - Referenced by:
     - `requests.assigned_nurse_id` (FK: fk_nurse)
     - `requests.patient_id` (FK: fk_patient)
     - `request_nurse_assignments.nurse_id`
     - `nurse_working_hours_log.nurse_id`

2. **Requests**

   - Links to profiles through multiple foreign keys:
     - `patient_id` → `profiles.id` (FK: fk_patient)
     - `assigned_nurse_id` → `profiles.id` (FK: fk_nurse)
   - Referenced by:
     - `request_nurse_assignments.request_id`
     - `nurse_working_hours_log.request_id`
   - Includes service type and status tracking
   - Tracks pricing and visit scheduling

3. **Request-Nurse Assignments**

   - Creates many-to-many relationship between nurses and requests
   - Foreign Keys:
     - `nurse_id` → `profiles.id`
     - `request_id` → `requests.id`
   - Tracks working hours per assignment
   - Composite Primary Key (request_id, nurse_id)

4. **Working Hours Log**
   - Foreign Keys:
     - `nurse_id` → `profiles.id`
     - `request_id` → `requests.id`
   - Tracks detailed work hours for payment purposes
   - Includes payment status tracking

### Entity Relationship Diagram (ERD)

```
profiles
+---------------+
| id (PK)       |
| email         |
| role          |
| full_name     |
| phone_number  |
+---------------+
       ↑
       |
       |    +----------------+
       +----| assigned_nurse |
       |    +----------------+
       |
requests
+------------------+
| id (PK)          |
| patient_id (FK)  |
| assigned_nurse_id|
| status           |
| service_type     |
+------------------+
       ↑
       |
       |
request_nurse_assignments
+------------------+
| request_id (FK)  |
| nurse_id (FK)    |
| working_hours    |
+------------------+
       ↑
       |
nurse_working_hours_log
+------------------+
| id (PK)          |
| request_id (FK)  |
| nurse_id (FK)    |
| hours            |
| is_paid          |
+------------------+
```

### Foreign Key Constraints

1. **Requests Table**

   ```sql
   ALTER TABLE requests
   ADD CONSTRAINT fk_nurse
   FOREIGN KEY (assigned_nurse_id)
   REFERENCES profiles(id);

   ALTER TABLE requests
   ADD CONSTRAINT fk_patient
   FOREIGN KEY (patient_id)
   REFERENCES profiles(id);
   ```

2. **Request-Nurse Assignments Table**

   ```sql
   ALTER TABLE request_nurse_assignments
   ADD CONSTRAINT request_nurse_assignments_nurse_id_fkey
   FOREIGN KEY (nurse_id)
   REFERENCES profiles(id);

   ALTER TABLE request_nurse_assignments
   ADD CONSTRAINT request_nurse_assignments_request_id_fkey
   FOREIGN KEY (request_id)
   REFERENCES requests(id);
   ```

3. **Nurse Working Hours Log Table**

   ```sql
   ALTER TABLE nurse_working_hours_log
   ADD CONSTRAINT nurse_working_hours_log_nurse_id_fkey
   FOREIGN KEY (nurse_id)
   REFERENCES profiles(id);

   ALTER TABLE nurse_working_hours_log
   ADD CONSTRAINT nurse_working_hours_log_request_id_fkey
   FOREIGN KEY (request_id)
   REFERENCES requests(id);
   ```

### Custom Enums

1. **request_status_enum**

   ```sql
   CREATE TYPE request_status_enum AS ENUM (
       'pending',         -- Initial state
       'claimed',        -- Nurse has shown interest
       'price_confirmed', -- Price has been set and confirmed
       'accepted',       -- Request is actively being handled
       'completed',      -- Service has been completed
       'cancelled'       -- Request was cancelled
   );
   ```

2. **service_type_enum**
   ```sql
   CREATE TYPE service_type_enum AS ENUM (
       'full_time_private_normal',        -- Full-time regular nursing care
       'full_time_private_psychiatric',    -- Full-time psychiatric care
       'part_time_private_normal',        -- Part-time regular nursing care
       'part_time_private_psychiatric',    -- Part-time psychiatric care
       'blood_test',                      -- Blood testing service
       'im',                              -- Intramuscular injection
       'iv',                              -- Intravenous therapy
       'care_for_patients',               -- General patient care
       'hemo_plus_vs',                    -- Hemodialysis plus vital signs
       'medicine_supply',                 -- Medication delivery
       'hemo_vs',                         -- Hemodialysis vital signs
       'patient_care',                    -- Basic patient care
       'other'                           -- Other services
   );
   ```

### Row Level Security (RLS) Policies

1. **Requests Table**

   ```sql
   -- Update Policy
   CREATE POLICY "Users can update requests if they are a nurse or admin" ON requests
   FOR UPDATE TO public
   USING (
       auth.uid() IN (
           SELECT id FROM profiles
           WHERE role = ANY(ARRAY['nurse', 'superAdmin'])
       )
   );
   ```

2. **Nurse Working Hours Log Table**

   ```sql
   -- Read Policy
   CREATE POLICY "Enable read access for authenticated users" ON nurse_working_hours_log
   FOR SELECT TO authenticated
   USING (true);

   -- Insert Policy
   CREATE POLICY "Enable insert for authenticated users" ON nurse_working_hours_log
   FOR INSERT TO authenticated
   WITH CHECK (true);

   -- Update Policy
   CREATE POLICY "Enable update for nurse and superAdmin" ON nurse_working_hours_log
   FOR UPDATE TO authenticated
   USING (
       auth.uid() = nurse_id
       OR EXISTS (
           SELECT 1 FROM profiles
           WHERE id = auth.uid() AND role = 'superAdmin'
       )
   );
   ```

### Database Usage Statistics

Current database statistics (as of last check):

1. **Users and Profiles**

   - Total profiles: 38 records
   - Active users across different roles
   - Maintenance needed: 20 dead tuples

2. **Care Requests**

   - Total requests: 33
   - Last auto-vacuum: 2025-02-04
   - Maintenance needed: 23 dead tuples

3. **Nurse Assignments**

   - Active assignments: 16
   - Historical assignments tracked
   - Maintenance needed: 45 dead tuples

4. **Working Hours**
   - Logged entries: 14
   - Time tracking records
   - Maintenance needed: 22 dead tuples

### Request Lifecycle

1. **Status Flow**

   ```
   pending → claimed → price_confirmed → accepted → completed
                                               └→ cancelled
   ```

2. **Service Categories**
   - Full-time Services
     - Regular nursing care
     - Psychiatric care
   - Part-time Services
     - Regular nursing care
     - Psychiatric care
   - Medical Procedures
     - Blood tests
     - Injections (IM/IV)
     - Hemodialysis
   - General Care
     - Patient care
     - Medicine supply
     - Vital signs monitoring

### Maintenance Recommendations

Based on the usage statistics:

1. Consider running VACUUM on tables with high dead tuple counts
2. Set up regular maintenance schedule
3. Monitor auto-vacuum effectiveness
4. Consider table optimization for frequently accessed data

## Authentication

### Flow

1. User registration/login via Supabase Auth
2. JWT token management
3. Role-based access control
4. Protected routes

### User Roles

- SuperAdmin: Full system access
- Nurse: Limited access to assignments and profiles
- Patient: Access to care requests and profile

## Internationalization

### Supported Languages

- English (default)
- Arabic
- French

### Implementation

- Uses i18next
- Language detection
- RTL support for Arabic
- Locale-specific formatting

## Security

### Features

1. **Authentication**

   - JWT-based authentication
   - Secure password handling
   - Session management

2. **Authorization**

   - Role-based access control
   - Protected routes
   - API access control

3. **Data Security**
   - Environment variables
   - Secure API endpoints
   - Data encryption

## Deployment

### Requirements

- Node.js environment
- Supabase instance
- Environment variables configured

### Build Process

1. Build the application:

```bash
yarn build
```

2. Preview the build:

```bash
yarn preview
```

### Deployment Steps

1. Configure environment variables
2. Build the application
3. Deploy to hosting platform
4. Configure domain and SSL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

For more information or support, please contact the development team.

### Database Functions

The application uses several PostgreSQL functions to handle business logic. Here are the main functions:

#### Request Management Functions

1. **approve_request**

```sql
-- Allows a nurse to approve and assign themselves to a pending request
FUNCTION approve_request(request_id integer) RETURNS void
```

2. **cancel_request**

```sql
-- Allows superAdmin or assigned nurse to cancel an accepted request
FUNCTION cancel_request(request_id integer) RETURNS void
```

3. **complete_request**

```sql
-- Marks a request as completed
FUNCTION complete_request(rid integer) RETURNS void
```

4. **update_price**

```sql
-- Updates the price of a request (superAdmin or assigned nurse only)
FUNCTION update_price(rid integer, price double precision) RETURNS void
```

5. **set_request_visit_date**

```sql
-- Sets the visit date for a request (superAdmin or assigned nurse only)
FUNCTION set_request_visit_date(rid integer, visit_date text) RETURNS void
```

#### Nurse Assignment Functions

1. **assign_nurse_to_request**

```sql
-- Assigns a nurse to a request (superAdmin or self-assignment)
FUNCTION assign_nurse_to_request(rid integer, nid uuid) RETURNS void
```

2. **remove_nurse_from_request**

```sql
-- Removes a nurse from a request assignment
FUNCTION remove_nurse_from_request(rid integer, nid uuid) RETURNS void
```

#### Working Hours Management

1. **add_nurse_working_hours**

```sql
-- Logs working hours for a nurse on a specific request
FUNCTION add_nurse_working_hours(
    rid integer,
    nid uuid,
    hours numeric,
    work_date date,
    notes text DEFAULT NULL::text
) RETURNS jsonb
```

2. **delete_working_hours_log**

```sql
-- Deletes a working hours log entry
FUNCTION delete_working_hours_log(log_id_param bigint) RETURNS void
```

#### Payment Processing

1. **process_nurse_payment**

```sql
-- Marks all unpaid working hours as paid for a specific nurse
FUNCTION process_nurse_payment(nurse_id_param uuid) RETURNS void
```

2. **process_single_payment**

```sql
-- Marks a single working hours log entry as paid
FUNCTION process_single_payment(log_id_param bigint) RETURNS void
```

#### Nurse Management

1. **approve_nurse**

```sql
-- Approves or revokes approval for a nurse (superAdmin only)
FUNCTION approve_nurse(nurse_id_param uuid, should_approve boolean) RETURNS json
```

2. **toggle_nurse_block**

```sql
-- Blocks or unblocks a nurse (superAdmin only)
FUNCTION toggle_nurse_block(nurse_id_param uuid, should_block boolean) RETURNS json
```

### Security Considerations

All functions are created with `SECURITY DEFINER`, meaning they execute with the privileges of the function owner rather than the calling user. Each function includes:

1. **Authorization Checks**

   - Role-based access control (superAdmin, nurse, patient)
   - Ownership verification
   - Status-based validations

2. **Data Validation**

   - Input parameter validation
   - Status transitions validation
   - Business rule enforcement

3. **Error Handling**
   - Descriptive error messages
   - Proper exception handling
   - Transaction management

### Usage Examples

1. **Approving a Request**

```sql
SELECT approve_request(123);  -- Nurse approving request ID 123
```

2. **Logging Working Hours**

```sql
SELECT add_nurse_working_hours(
    123,                    -- request_id
    'nurse-uuid',          -- nurse_id
    8.5,                   -- hours
    '2024-02-06',         -- work_date
    'Regular shift'        -- notes
);
```

3. **Managing Nurse Status**

```sql
SELECT approve_nurse('nurse-uuid', true);  -- Approve a nurse
SELECT toggle_nurse_block('nurse-uuid', true);  -- Block a nurse
```

### Function Dependencies

1. **Table Dependencies**

   - `profiles`
   - `requests`
   - `request_nurse_assignments`
   - `nurse_working_hours_log`

2. **Auth Dependencies**
   - `auth.uid()` - Current user's ID
   - Role-based permissions

To view all functions and their definitions in the database, run:

```sql
SELECT
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition,
    CASE
        WHEN p.prokind = 'f' THEN 'function'
        WHEN p.prokind = 'p' THEN 'procedure'
        WHEN p.prokind = 'a' THEN 'aggregate'
        WHEN p.prokind = 'w' THEN 'window'
    END as type,
    l.lanname as language
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname = 'public'
ORDER BY schema, function_name;
```
