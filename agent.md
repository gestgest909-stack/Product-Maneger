Distributor Pricing Portal (Agent Instructions)
1. Project Overview

This project is a web-based "Distributor Portal" for a car accessories e-commerce store. The store owner (Admin) selects products they wish to order and sends them to the distributor. The distributor accesses a specific web page, views the requested products, inputs the cost_price and suggested_selling_price, and saves the data.The admin then views the updated prices to list them on their actual e-commerce store.
2. Tech Stack

    Frontend: HTML5, CSS3, Vanilla JavaScript (ES6+).
    Backend/Database: Supabase (PostgreSQL). 
    Hosting: GitHub Pages (Static site).
    Dependencies: Supabase JS Client (@supabase/supabase-js via CDN).

3. Database Schema (Supabase)

Table Name: products

    id (int8, Primary Key, Auto-increment)
    name (varchar, Name of the car accessory)
    status (varchar, Default: 'pending'. Options: 'pending', 'priced')
    cost_price (numeric, Default: NULL - filled by distributor)
    selling_price (numeric, Default: NULL - filled by distributor)
    created_at (timestamptz, Default: now())

4. Application Architecture

The app consists of two main interfaces:
A. Admin Panel (index.html & js/admin.js)

    Displays a list of products (either fetched from a local JSON or existing in the DB).
    Allows the admin to select multiple products via checkboxes.
    "Send to Distributor" button: Inserts selected products into the Supabase products table with status='pending'.
    "View Priced Products" section: Fetches and displays products where status='priced' to show the admin the final costs and selling prices.

B. Distributor Portal (distributor.html & js/distributor.js)

    Simple password protection (hardcoded string in JS for now, e.g., password123).
    Fetches all products from Supabase where status = 'pending'.
    Displays them in an editable HTML table with input fields for cost_price and selling_price.
    "Save Prices" button: Updates the rows in Supabase with the inputted prices and changes status to 'priced'.

5. Environment Variables / Supabase Keys

The Supabase URL and Anon Key should be stored in a js/config.js file (which must be added to .gitignore if keys are sensitive, though Anon Key is safe for frontend if RLS is enabled).Example js/config.js:

export const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';export const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

6. Coding Guidelines for the Agent

     Vanilla JS: Do not use frameworks like React or Vue. Keep it pure JavaScript.
     Modularity: Separate HTML, CSS, and JS into distinct folders (/css, /js, /pages if needed).
     Supabase Calls: Use asynchronous functions (async/await) for all database operations (Insert, Select, Update).
     UI/UX: Keep the UI clean, simple, and responsive using basic CSS or a lightweight library like Bootstrap/PicoCSS if needed.
     Error Handling: Implement basic try...catch blocks for Supabase requests and show alert() or a message div if an operation fails.

7. Step-by-Step Execution Plan

When asked to implement a feature, follow this order:

    Create the js/config.js file structure.
    Implement the Supabase client initialization.
    Build the Admin UI (index.html) to select products and insert them into the DB.
    Build the Distributor UI (distributor.html) to fetch, display, and update products.
    Add the "View Priced Products" functionality back in the Admin UI.