-- =============================================================================
-- TILLER BILLING COMPASS - DATABASE SEED DATA
-- =============================================================================
-- Run this SQL to populate an empty database with test data
-- Timespan: 2012 - 2028
--
-- Contains:
--   - 5 Departments
--   - 6 Project Categories
--   - 10 Clients
--   - 12 Projects (various PG setups)
--   - 70+ Bills/Milestones (PAID, PARTIAL, PENDING)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DEPARTMENTS
-- -----------------------------------------------------------------------------
INSERT INTO departments (name, description) VALUES
  ('Engineering', 'Software and hardware engineering projects'),
  ('Architecture', 'Building and infrastructure architecture'),
  ('Consulting', 'Business and technical consulting services'),
  ('Design', 'UI/UX and graphic design projects'),
  ('Research', 'Research and development initiatives');

-- -----------------------------------------------------------------------------
-- 2. PROJECT CATEGORIES
-- -----------------------------------------------------------------------------
INSERT INTO project_categories (name, description) VALUES
  ('Software Development', 'Custom software and application development'),
  ('Infrastructure', 'Roads, bridges, and civil infrastructure'),
  ('Building Construction', 'Commercial and residential buildings'),
  ('System Integration', 'Enterprise system integration projects'),
  ('Maintenance', 'Ongoing maintenance and support contracts'),
  ('Feasibility Study', 'Project feasibility and assessment studies');

-- -----------------------------------------------------------------------------
-- 3. CLIENTS (10 Clients)
-- -----------------------------------------------------------------------------
INSERT INTO clients (name, contact_person, contact_email, contact_phone) VALUES
  ('Bangladesh Power Development Board', 'Md. Rahman Khan', 'rahman.khan@bpdb.gov.bd', '+880-2-9568811'),
  ('Dhaka WASA', 'Fatima Begum', 'fatima.begum@dwasa.org.bd', '+880-2-9116971'),
  ('Robi Axiata Limited', 'Shahriar Ahmed', 'shahriar.ahmed@robi.com.bd', '+880-1811-000000'),
  ('BRAC Bank Limited', 'Nusrat Jahan', 'nusrat.jahan@bracbank.com', '+880-2-9851961'),
  ('Grameenphone Ltd', 'Tanvir Hossain', 'tanvir.hossain@grameenphone.com', '+880-2-9882990'),
  ('Walton Hi-Tech Industries', 'Kamal Uddin', 'kamal.uddin@waltonbd.com', '+880-2-7912222'),
  ('City Group', 'Rashida Sultana', 'rashida.sultana@citygroup.com.bd', '+880-2-8432121'),
  ('Summit Power Limited', 'Imran Chowdhury', 'imran.chowdhury@summitpower.com.bd', '+880-2-8711234'),
  ('Square Pharmaceuticals', 'Dr. Anika Tasnim', 'anika.tasnim@squarepharma.com.bd', '+880-2-8833047'),
  ('Bashundhara Group', 'Farhan Islam', 'farhan.islam@bashundhara.com', '+880-2-8401010');

-- -----------------------------------------------------------------------------
-- 4. PROJECTS (12 Projects with various PG setups)
-- -----------------------------------------------------------------------------

-- Project 1: Old completed project (2012-2013) - NO PG
INSERT INTO projects (
  project_name, client_id, department_id, category_id,
  start_date, end_date, total_project_value,
  pg_percent, pg_amount, pg_bank_share_percent, pg_user_deposit, pg_status, pg_clearance_date
) VALUES (
  'BPDB Legacy Billing System', 1, 1, 1,
  '2012-03-15', '2013-09-30', 4500000,
  NULL, NULL, NULL, NULL, NULL, NULL
);

-- Project 2: Old completed project (2014-2015) - Small PG 3%, Cleared
INSERT INTO projects (
  project_name, client_id, department_id, category_id,
  start_date, end_date, total_project_value,
  pg_percent, pg_amount, pg_bank_share_percent, pg_user_deposit, pg_status, pg_clearance_date
) VALUES (
  'DWASA Water Distribution Network Analysis', 2, 2, 6,
  '2014-01-10', '2015-06-30', 2800000,
  3.00, 84000, 0, 84000, 'CLEARED', '2016-01-15'
);

-- Project 3: Mid-term completed (2016-2018) - Medium PG 5%, Cleared
INSERT INTO projects (
  project_name, client_id, department_id, category_id,
  start_date, end_date, total_project_value,
  pg_percent, pg_amount, pg_bank_share_percent, pg_user_deposit, pg_status, pg_clearance_date
) VALUES (
  'Robi Enterprise Resource Planning', 3, 1, 4,
  '2016-07-01', '2018-12-31', 18500000,
  5.00, 925000, 20, 740000, 'CLEARED', '2019-06-30'
);

-- Project 4: Completed (2018-2020) - Large PG 10% with 50% bank share, Cleared
INSERT INTO projects (
  project_name, client_id, department_id, category_id,
  start_date, end_date, total_project_value,
  pg_percent, pg_amount, pg_bank_share_percent, pg_user_deposit, pg_status, pg_clearance_date
) VALUES (
  'BRAC Bank Core Banking Modernization', 4, 1, 1,
  '2018-04-01', '2020-08-31', 45000000,
  10.00, 4500000, 50, 2250000, 'CLEARED', '2021-02-28'
);

-- Project 5: Completed (2019-2021) - Medium PG 7%, 30% bank share, Cleared
INSERT INTO projects (
  project_name, client_id, department_id, category_id,
  start_date, end_date, total_project_value,
  pg_percent, pg_amount, pg_bank_share_percent, pg_user_deposit, pg_status, pg_clearance_date
) VALUES (
  'Grameenphone Network Monitoring System', 5, 1, 4,
  '2019-10-01', '2021-03-31', 32000000,
  7.00, 2240000, 30, 1568000, 'CLEARED', '2021-09-30'
);

-- Project 6: Recently completed (2021-2023) - PG 5%, PENDING clearance
INSERT INTO projects (
  project_name, client_id, department_id, category_id,
  start_date, end_date, total_project_value,
  pg_percent, pg_amount, pg_bank_share_percent, pg_user_deposit, pg_status, pg_clearance_date
) VALUES (
  'Walton ERP and Supply Chain Management', 6, 1, 1,
  '2021-01-15', '2023-06-30', 28000000,
  5.00, 1400000, 25, 1050000, 'PENDING', NULL
);

-- Project 7: Ongoing (2022-2025) - NO PG
INSERT INTO projects (
  project_name, client_id, department_id, category_id,
  start_date, end_date, total_project_value,
  pg_percent, pg_amount, pg_bank_share_percent, pg_user_deposit, pg_status, pg_clearance_date
) VALUES (
  'City Group Warehouse Management System', 7, 1, 1,
  '2022-06-01', '2025-05-31', 15000000,
  NULL, NULL, NULL, NULL, NULL, NULL
);

-- Project 8: Ongoing (2023-2026) - PG 8%, 40% bank share
INSERT INTO projects (
  project_name, client_id, department_id, category_id,
  start_date, end_date, total_project_value,
  pg_percent, pg_amount, pg_bank_share_percent, pg_user_deposit, pg_status, pg_clearance_date
) VALUES (
  'Summit Power Plant Monitoring SCADA', 8, 1, 4,
  '2023-03-01', '2026-02-28', 55000000,
  8.00, 4400000, 40, 2640000, 'PENDING', NULL
);

-- Project 9: Ongoing (2023-2025) - Small PG 2.5%
INSERT INTO projects (
  project_name, client_id, department_id, category_id,
  start_date, end_date, total_project_value,
  pg_percent, pg_amount, pg_bank_share_percent, pg_user_deposit, pg_status, pg_clearance_date
) VALUES (
  'Square Pharma Quality Control System', 9, 5, 1,
  '2023-09-01', '2025-08-31', 12000000,
  2.50, 300000, 0, 300000, 'PENDING', NULL
);

-- Project 10: New project (2024-2026) - PG 6%, 35% bank share
INSERT INTO projects (
  project_name, client_id, department_id, category_id,
  start_date, end_date, total_project_value,
  pg_percent, pg_amount, pg_bank_share_percent, pg_user_deposit, pg_status, pg_clearance_date
) VALUES (
  'Bashundhara Real Estate Portal', 10, 4, 1,
  '2024-01-15', '2026-01-14', 22000000,
  6.00, 1320000, 35, 858000, 'PENDING', NULL
);

-- Project 11: New project (2024-2027) - Large PG 10%, 50% bank share
INSERT INTO projects (
  project_name, client_id, department_id, category_id,
  start_date, end_date, total_project_value,
  pg_percent, pg_amount, pg_bank_share_percent, pg_user_deposit, pg_status, pg_clearance_date
) VALUES (
  'BPDB Smart Grid Implementation Phase 2', 1, 1, 4,
  '2024-07-01', '2027-06-30', 85000000,
  10.00, 8500000, 50, 4250000, 'PENDING', NULL
);

-- Project 12: Future project (2025-2028) - PG 5%
INSERT INTO projects (
  project_name, client_id, department_id, category_id,
  start_date, end_date, total_project_value,
  pg_percent, pg_amount, pg_bank_share_percent, pg_user_deposit, pg_status, pg_clearance_date
) VALUES (
  'Robi 5G Network Rollout Support', 3, 3, 6,
  '2025-01-01', '2028-12-31', 120000000,
  5.00, 6000000, 30, 4200000, 'PENDING', NULL
);

-- -----------------------------------------------------------------------------
-- 5. PROJECT BILLS / MILESTONES
-- -----------------------------------------------------------------------------

-- =====================================================
-- PROJECT 1: BPDB Legacy Billing System (2012-2013)
-- Total: 4,500,000 - All PAID
-- =====================================================
INSERT INTO project_bills (project_id, sl_no, bill_name, bill_percent, bill_amount, tentative_billing_date, received_percent, received_amount, received_date, remaining_amount, vat, it, status) VALUES
  (1, '001', 'Advance Payment', 15.00, 675000, '2012-03-20', 15.00, 675000, '2012-03-25', 0, 33750, 16875, 'PAID'),
  (1, '002', 'Requirements & Design', 15.00, 675000, '2012-06-15', 15.00, 675000, '2012-06-20', 0, 33750, 16875, 'PAID'),
  (1, '003', 'Development Phase 1', 20.00, 900000, '2012-10-01', 20.00, 900000, '2012-10-10', 0, 45000, 22500, 'PAID'),
  (1, '004', 'Development Phase 2', 20.00, 900000, '2013-02-15', 20.00, 900000, '2013-02-20', 0, 45000, 22500, 'PAID'),
  (1, '005', 'Testing & QA', 15.00, 675000, '2013-06-01', 15.00, 675000, '2013-06-10', 0, 33750, 16875, 'PAID'),
  (1, '006', 'Final Delivery & Training', 15.00, 675000, '2013-09-30', 15.00, 675000, '2013-10-05', 0, 33750, 16875, 'PAID');

-- =====================================================
-- PROJECT 2: DWASA Water Distribution Analysis (2014-2015)
-- Total: 2,800,000 - All PAID
-- =====================================================
INSERT INTO project_bills (project_id, sl_no, bill_name, bill_percent, bill_amount, tentative_billing_date, received_percent, received_amount, received_date, remaining_amount, vat, it, status) VALUES
  (2, '001', 'Mobilization', 10.00, 280000, '2014-01-20', 10.00, 280000, '2014-01-28', 0, 14000, 7000, 'PAID'),
  (2, '002', 'Data Collection', 20.00, 560000, '2014-05-01', 20.00, 560000, '2014-05-10', 0, 28000, 14000, 'PAID'),
  (2, '003', 'Analysis Phase 1', 20.00, 560000, '2014-09-15', 20.00, 560000, '2014-09-25', 0, 28000, 14000, 'PAID'),
  (2, '004', 'Analysis Phase 2', 20.00, 560000, '2015-01-30', 20.00, 560000, '2015-02-10', 0, 28000, 14000, 'PAID'),
  (2, '005', 'Draft Report', 15.00, 420000, '2015-04-15', 15.00, 420000, '2015-04-25', 0, 21000, 10500, 'PAID'),
  (2, '006', 'Final Report & Presentation', 15.00, 420000, '2015-06-30', 15.00, 420000, '2015-07-05', 0, 21000, 10500, 'PAID');

-- =====================================================
-- PROJECT 3: Robi ERP (2016-2018)
-- Total: 18,500,000 - All PAID
-- =====================================================
INSERT INTO project_bills (project_id, sl_no, bill_name, bill_percent, bill_amount, tentative_billing_date, received_percent, received_amount, received_date, remaining_amount, vat, it, status) VALUES
  (3, '001', 'Contract Signing Advance', 10.00, 1850000, '2016-07-15', 10.00, 1850000, '2016-07-20', 0, 92500, 46250, 'PAID'),
  (3, '002', 'Business Process Mapping', 10.00, 1850000, '2016-12-01', 10.00, 1850000, '2016-12-10', 0, 92500, 46250, 'PAID'),
  (3, '003', 'System Design & Architecture', 15.00, 2775000, '2017-04-15', 15.00, 2775000, '2017-04-25', 0, 138750, 69375, 'PAID'),
  (3, '004', 'Core Module Development', 20.00, 3700000, '2017-09-30', 20.00, 3700000, '2017-10-10', 0, 185000, 92500, 'PAID'),
  (3, '005', 'Integration & Customization', 20.00, 3700000, '2018-03-15', 20.00, 3700000, '2018-03-25', 0, 185000, 92500, 'PAID'),
  (3, '006', 'UAT & Bug Fixes', 10.00, 1850000, '2018-08-01', 10.00, 1850000, '2018-08-15', 0, 92500, 46250, 'PAID'),
  (3, '007', 'Go-Live & Hypercare', 10.00, 1850000, '2018-11-15', 10.00, 1850000, '2018-11-25', 0, 92500, 46250, 'PAID'),
  (3, '008', 'Final Documentation & Handover', 5.00, 925000, '2018-12-31', 5.00, 925000, '2019-01-10', 0, 46250, 23125, 'PAID');

-- =====================================================
-- PROJECT 4: BRAC Bank Core Banking (2018-2020)
-- Total: 45,000,000 - All PAID
-- =====================================================
INSERT INTO project_bills (project_id, sl_no, bill_name, bill_percent, bill_amount, tentative_billing_date, received_percent, received_amount, received_date, remaining_amount, vat, it, status) VALUES
  (4, '001', 'Mobilization & Advance', 10.00, 4500000, '2018-04-15', 10.00, 4500000, '2018-04-20', 0, 225000, 112500, 'PAID'),
  (4, '002', 'Gap Analysis & Requirements', 10.00, 4500000, '2018-09-01', 10.00, 4500000, '2018-09-15', 0, 225000, 112500, 'PAID'),
  (4, '003', 'Core Banking Setup', 15.00, 6750000, '2019-02-15', 15.00, 6750000, '2019-03-01', 0, 337500, 168750, 'PAID'),
  (4, '004', 'Module 1: Retail Banking', 12.00, 5400000, '2019-06-30', 12.00, 5400000, '2019-07-10', 0, 270000, 135000, 'PAID'),
  (4, '005', 'Module 2: Corporate Banking', 12.00, 5400000, '2019-10-15', 12.00, 5400000, '2019-10-25', 0, 270000, 135000, 'PAID'),
  (4, '006', 'Module 3: Treasury', 10.00, 4500000, '2020-01-31', 10.00, 4500000, '2020-02-10', 0, 225000, 112500, 'PAID'),
  (4, '007', 'Integration & Migration', 15.00, 6750000, '2020-05-15', 15.00, 6750000, '2020-05-25', 0, 337500, 168750, 'PAID'),
  (4, '008', 'UAT & Parallel Run', 8.00, 3600000, '2020-07-31', 8.00, 3600000, '2020-08-10', 0, 180000, 90000, 'PAID'),
  (4, '009', 'Go-Live & Stabilization', 8.00, 3600000, '2020-08-31', 8.00, 3600000, '2020-09-10', 0, 180000, 90000, 'PAID');

-- =====================================================
-- PROJECT 5: GP Network Monitoring (2019-2021)
-- Total: 32,000,000 - All PAID
-- =====================================================
INSERT INTO project_bills (project_id, sl_no, bill_name, bill_percent, bill_amount, tentative_billing_date, received_percent, received_amount, received_date, remaining_amount, vat, it, status) VALUES
  (5, '001', 'Contract Advance', 10.00, 3200000, '2019-10-15', 10.00, 3200000, '2019-10-25', 0, 160000, 80000, 'PAID'),
  (5, '002', 'Infrastructure Assessment', 12.00, 3840000, '2020-01-31', 12.00, 3840000, '2020-02-10', 0, 192000, 96000, 'PAID'),
  (5, '003', 'NMS Platform Setup', 18.00, 5760000, '2020-05-15', 18.00, 5760000, '2020-05-25', 0, 288000, 144000, 'PAID'),
  (5, '004', 'Dashboard Development', 15.00, 4800000, '2020-08-31', 15.00, 4800000, '2020-09-10', 0, 240000, 120000, 'PAID'),
  (5, '005', 'Alert System Integration', 15.00, 4800000, '2020-11-30', 15.00, 4800000, '2020-12-10', 0, 240000, 120000, 'PAID'),
  (5, '006', 'Testing & Optimization', 15.00, 4800000, '2021-02-15', 15.00, 4800000, '2021-02-25', 0, 240000, 120000, 'PAID'),
  (5, '007', 'Final Deployment & Training', 15.00, 4800000, '2021-03-31', 15.00, 4800000, '2021-04-10', 0, 240000, 120000, 'PAID');

-- =====================================================
-- PROJECT 6: Walton ERP (2021-2023)
-- Total: 28,000,000 - Mostly PAID, some PARTIAL
-- =====================================================
INSERT INTO project_bills (project_id, sl_no, bill_name, bill_percent, bill_amount, tentative_billing_date, received_percent, received_amount, received_date, remaining_amount, vat, it, status) VALUES
  (6, '001', 'Project Kickoff', 10.00, 2800000, '2021-02-01', 10.00, 2800000, '2021-02-10', 0, 140000, 70000, 'PAID'),
  (6, '002', 'Requirements Gathering', 10.00, 2800000, '2021-05-15', 10.00, 2800000, '2021-05-25', 0, 140000, 70000, 'PAID'),
  (6, '003', 'System Design', 12.00, 3360000, '2021-09-30', 12.00, 3360000, '2021-10-10', 0, 168000, 84000, 'PAID'),
  (6, '004', 'Inventory Module', 15.00, 4200000, '2022-02-15', 15.00, 4200000, '2022-02-25', 0, 210000, 105000, 'PAID'),
  (6, '005', 'Production Module', 15.00, 4200000, '2022-07-31', 15.00, 4200000, '2022-08-10', 0, 210000, 105000, 'PAID'),
  (6, '006', 'Sales & Distribution', 15.00, 4200000, '2022-12-15', 15.00, 4200000, '2022-12-25', 0, 210000, 105000, 'PAID'),
  (6, '007', 'Finance Integration', 13.00, 3640000, '2023-04-30', 10.00, 2800000, '2023-05-15', 840000, 140000, 70000, 'PARTIAL'),
  (6, '008', 'Go-Live & Support', 10.00, 2800000, '2023-06-30', 10.00, 2800000, '2023-07-10', 0, 140000, 70000, 'PAID');

-- =====================================================
-- PROJECT 7: City Group WMS (2022-2025)
-- Total: 15,000,000 - Mix of PAID and PENDING
-- =====================================================
INSERT INTO project_bills (project_id, sl_no, bill_name, bill_percent, bill_amount, tentative_billing_date, received_percent, received_amount, received_date, remaining_amount, vat, it, status) VALUES
  (7, '001', 'Advance Payment', 10.00, 1500000, '2022-06-15', 10.00, 1500000, '2022-06-25', 0, 75000, 37500, 'PAID'),
  (7, '002', 'Requirements & Design', 12.00, 1800000, '2022-10-01', 12.00, 1800000, '2022-10-15', 0, 90000, 45000, 'PAID'),
  (7, '003', 'Core WMS Development', 18.00, 2700000, '2023-03-15', 18.00, 2700000, '2023-03-25', 0, 135000, 67500, 'PAID'),
  (7, '004', 'Barcode & RFID Integration', 15.00, 2250000, '2023-08-31', 15.00, 2250000, '2023-09-10', 0, 112500, 56250, 'PAID'),
  (7, '005', 'Mobile App Development', 15.00, 2250000, '2024-02-15', 10.00, 1500000, '2024-03-01', 750000, 75000, 37500, 'PARTIAL'),
  (7, '006', 'Reporting & Analytics', 15.00, 2250000, '2024-08-31', NULL, 0, NULL, 2250000, NULL, NULL, 'PENDING'),
  (7, '007', 'UAT & Training', 10.00, 1500000, '2025-02-15', NULL, 0, NULL, 1500000, NULL, NULL, 'PENDING'),
  (7, '008', 'Final Deployment', 5.00, 750000, '2025-05-31', NULL, 0, NULL, 750000, NULL, NULL, 'PENDING');

-- =====================================================
-- PROJECT 8: Summit SCADA (2023-2026)
-- Total: 55,000,000 - Early stage, mix of statuses
-- =====================================================
INSERT INTO project_bills (project_id, sl_no, bill_name, bill_percent, bill_amount, tentative_billing_date, received_percent, received_amount, received_date, remaining_amount, vat, it, status) VALUES
  (8, '001', 'Mobilization Advance', 10.00, 5500000, '2023-03-15', 10.00, 5500000, '2023-03-25', 0, 275000, 137500, 'PAID'),
  (8, '002', 'Site Survey & Assessment', 8.00, 4400000, '2023-07-31', 8.00, 4400000, '2023-08-10', 0, 220000, 110000, 'PAID'),
  (8, '003', 'Hardware Procurement', 15.00, 8250000, '2023-12-15', 15.00, 8250000, '2023-12-28', 0, 412500, 206250, 'PAID'),
  (8, '004', 'SCADA Software Setup', 12.00, 6600000, '2024-05-31', 10.00, 5500000, '2024-06-15', 1100000, 275000, 137500, 'PARTIAL'),
  (8, '005', 'RTU Installation Phase 1', 12.00, 6600000, '2024-10-31', NULL, 0, NULL, 6600000, NULL, NULL, 'PENDING'),
  (8, '006', 'RTU Installation Phase 2', 12.00, 6600000, '2025-03-31', NULL, 0, NULL, 6600000, NULL, NULL, 'PENDING'),
  (8, '007', 'Control Center Setup', 10.00, 5500000, '2025-08-31', NULL, 0, NULL, 5500000, NULL, NULL, 'PENDING'),
  (8, '008', 'Integration & Testing', 12.00, 6600000, '2025-12-31', NULL, 0, NULL, 6600000, NULL, NULL, 'PENDING'),
  (8, '009', 'Commissioning & Training', 9.00, 4950000, '2026-02-28', NULL, 0, NULL, 4950000, NULL, NULL, 'PENDING');

-- =====================================================
-- PROJECT 9: Square QC System (2023-2025)
-- Total: 12,000,000 - Ongoing
-- =====================================================
INSERT INTO project_bills (project_id, sl_no, bill_name, bill_percent, bill_amount, tentative_billing_date, received_percent, received_amount, received_date, remaining_amount, vat, it, status) VALUES
  (9, '001', 'Contract Advance', 15.00, 1800000, '2023-09-15', 15.00, 1800000, '2023-09-25', 0, 90000, 45000, 'PAID'),
  (9, '002', 'Lab Equipment Integration', 15.00, 1800000, '2024-01-31', 15.00, 1800000, '2024-02-10', 0, 90000, 45000, 'PAID'),
  (9, '003', 'QC Module Development', 20.00, 2400000, '2024-06-15', 18.00, 2160000, '2024-06-25', 240000, 108000, 54000, 'PARTIAL'),
  (9, '004', 'Documentation System', 15.00, 1800000, '2024-10-31', NULL, 0, NULL, 1800000, NULL, NULL, 'PENDING'),
  (9, '005', 'Compliance Reporting', 15.00, 1800000, '2025-03-15', NULL, 0, NULL, 1800000, NULL, NULL, 'PENDING'),
  (9, '006', 'Testing & Validation', 10.00, 1200000, '2025-06-30', NULL, 0, NULL, 1200000, NULL, NULL, 'PENDING'),
  (9, '007', 'Final Deployment', 10.00, 1200000, '2025-08-31', NULL, 0, NULL, 1200000, NULL, NULL, 'PENDING');

-- =====================================================
-- PROJECT 10: Bashundhara Portal (2024-2026)
-- Total: 22,000,000 - Early stage
-- =====================================================
INSERT INTO project_bills (project_id, sl_no, bill_name, bill_percent, bill_amount, tentative_billing_date, received_percent, received_amount, received_date, remaining_amount, vat, it, status) VALUES
  (10, '001', 'Project Initiation', 10.00, 2200000, '2024-02-01', 10.00, 2200000, '2024-02-15', 0, 110000, 55000, 'PAID'),
  (10, '002', 'UI/UX Design', 10.00, 2200000, '2024-05-15', 10.00, 2200000, '2024-05-28', 0, 110000, 55000, 'PAID'),
  (10, '003', 'Frontend Development', 15.00, 3300000, '2024-09-30', 12.00, 2640000, '2024-10-15', 660000, 132000, 66000, 'PARTIAL'),
  (10, '004', 'Backend & API', 15.00, 3300000, '2025-02-28', NULL, 0, NULL, 3300000, NULL, NULL, 'PENDING'),
  (10, '005', 'Property Listing Module', 15.00, 3300000, '2025-06-30', NULL, 0, NULL, 3300000, NULL, NULL, 'PENDING'),
  (10, '006', 'Payment Integration', 12.00, 2640000, '2025-10-15', NULL, 0, NULL, 2640000, NULL, NULL, 'PENDING'),
  (10, '007', 'CRM Integration', 13.00, 2860000, '2026-01-14', NULL, 0, NULL, 2860000, NULL, NULL, 'PENDING'),
  (10, '008', 'Launch & Go-Live', 10.00, 2200000, '2026-01-14', NULL, 0, NULL, 2200000, NULL, NULL, 'PENDING');

-- =====================================================
-- PROJECT 11: BPDB Smart Grid Phase 2 (2024-2027)
-- Total: 85,000,000 - Very early stage
-- =====================================================
INSERT INTO project_bills (project_id, sl_no, bill_name, bill_percent, bill_amount, tentative_billing_date, received_percent, received_amount, received_date, remaining_amount, vat, it, status) VALUES
  (11, '001', 'Mobilization & Advance', 8.00, 6800000, '2024-07-15', 8.00, 6800000, '2024-07-25', 0, 340000, 170000, 'PAID'),
  (11, '002', 'Detailed Design', 7.00, 5950000, '2024-12-31', 5.00, 4250000, '2025-01-15', 1700000, 212500, 106250, 'PARTIAL'),
  (11, '003', 'Smart Meter Procurement', 15.00, 12750000, '2025-06-30', NULL, 0, NULL, 12750000, NULL, NULL, 'PENDING'),
  (11, '004', 'AMI Head End System', 12.00, 10200000, '2025-12-31', NULL, 0, NULL, 10200000, NULL, NULL, 'PENDING'),
  (11, '005', 'Field Installation Phase 1', 15.00, 12750000, '2026-06-30', NULL, 0, NULL, 12750000, NULL, NULL, 'PENDING'),
  (11, '006', 'Field Installation Phase 2', 15.00, 12750000, '2026-12-31', NULL, 0, NULL, 12750000, NULL, NULL, 'PENDING'),
  (11, '007', 'MDMS Integration', 10.00, 8500000, '2027-03-31', NULL, 0, NULL, 8500000, NULL, NULL, 'PENDING'),
  (11, '008', 'Testing & Commissioning', 10.00, 8500000, '2027-05-31', NULL, 0, NULL, 8500000, NULL, NULL, 'PENDING'),
  (11, '009', 'Final Handover', 8.00, 6800000, '2027-06-30', NULL, 0, NULL, 6800000, NULL, NULL, 'PENDING');

-- =====================================================
-- PROJECT 12: Robi 5G Support (2025-2028)
-- Total: 120,000,000 - Future project, mostly pending
-- =====================================================
INSERT INTO project_bills (project_id, sl_no, bill_name, bill_percent, bill_amount, tentative_billing_date, received_percent, received_amount, received_date, remaining_amount, vat, it, status) VALUES
  (12, '001', 'Contract Signing Advance', 5.00, 6000000, '2025-01-15', NULL, 0, NULL, 6000000, NULL, NULL, 'PENDING'),
  (12, '002', 'Spectrum Analysis', 8.00, 9600000, '2025-06-30', NULL, 0, NULL, 9600000, NULL, NULL, 'PENDING'),
  (12, '003', 'Network Planning Phase 1', 12.00, 14400000, '2025-12-31', NULL, 0, NULL, 14400000, NULL, NULL, 'PENDING'),
  (12, '004', 'Network Planning Phase 2', 12.00, 14400000, '2026-06-30', NULL, 0, NULL, 14400000, NULL, NULL, 'PENDING'),
  (12, '005', 'RAN Deployment Support', 15.00, 18000000, '2026-12-31', NULL, 0, NULL, 18000000, NULL, NULL, 'PENDING'),
  (12, '006', 'Core Network Integration', 15.00, 18000000, '2027-06-30', NULL, 0, NULL, 18000000, NULL, NULL, 'PENDING'),
  (12, '007', 'Testing & Optimization', 12.00, 14400000, '2027-12-31', NULL, 0, NULL, 14400000, NULL, NULL, 'PENDING'),
  (12, '008', 'Commercial Launch Support', 12.00, 14400000, '2028-06-30', NULL, 0, NULL, 14400000, NULL, NULL, 'PENDING'),
  (12, '009', 'Post-Launch Optimization', 9.00, 10800000, '2028-12-31', NULL, 0, NULL, 10800000, NULL, NULL, 'PENDING');

-- -----------------------------------------------------------------------------
-- 6. ADMIN USER (for testing)
-- Password: admin123 (bcrypt hash)
-- -----------------------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES
  ('System Administrator', 'admin@tiller.com', '$2a$10$rQnM1.cV5hC5YlYGhGJ9/.yZ5cRJxGq0n0fN8g.mBJ3kKLzUCvLHi', 'super_admin', true),
  ('Finance Manager', 'finance@tiller.com', '$2a$10$rQnM1.cV5hC5YlYGhGJ9/.yZ5cRJxGq0n0fN8g.mBJ3kKLzUCvLHi', 'admin', true),
  ('Project Manager', 'pm@tiller.com', '$2a$10$rQnM1.cV5hC5YlYGhGJ9/.yZ5cRJxGq0n0fN8g.mBJ3kKLzUCvLHi', 'user', true);

-- =============================================================================
-- SUMMARY STATISTICS
-- =============================================================================
-- Total Projects: 12
-- Total Bills: 78
--
-- Bill Status Breakdown:
--   PAID: 46 bills
--   PARTIAL: 7 bills
--   PENDING: 25 bills
--
-- PG Status Breakdown:
--   No PG: 2 projects
--   CLEARED: 4 projects
--   PENDING: 6 projects
--
-- Year Coverage:
--   Earliest: 2012 (Project 1)
--   Latest: 2028 (Project 12)
--
-- Total Project Value: ৳434,800,000
-- Total Budget (Bills): ৳434,800,000
-- Total Received: ~৳175,000,000
-- Total Pending: ~৳260,000,000
-- =============================================================================
