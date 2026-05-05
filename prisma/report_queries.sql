-- =====================================================================
-- TripPlanner Pro: DBMS Mini Project – All Report Queries
-- Matches Sahayata-style report structure (Chapters 3–5)
-- Database: MySQL 8.0  |  Schema: trip_planner
-- =====================================================================

-- =============================================================
-- CHAPTER 3.1: CONSTRAINTS
-- =============================================================

-- Q1: Ensure trip status is limited to valid values
-- (Run DROP only if constraint already exists from a previous run)
-- ALTER TABLE trips DROP CHECK chk_trip_status;
ALTER TABLE trips
ADD CONSTRAINT chk_trip_status
CHECK (status IN ('Planning', 'Ongoing', 'Completed', 'Cancelled'));

-- Show all trips with their current valid statuses
SELECT id, name, status
FROM trips;
-- Output:
-- id | name               | status
-- 1  | European Adventure | Planning
-- 2  | Tokyo Explorer     | Planning
-- 3  | Bali Group Retreat | Planning

-- Attempting invalid status will be blocked:
-- INSERT INTO trips (name, owner_id, start_date, end_date, status)
-- VALUES ('Test', 1, '2025-01-01', '2025-01-05', 'InvalidStatus');
-- ERROR: Check constraint 'chk_trip_status' is violated.

-- Q2: Ensure hotel rating stays between 0 and 5
-- ALTER TABLE hotels DROP CHECK chk_hotel_rating;
ALTER TABLE hotels
ADD CONSTRAINT chk_hotel_rating
CHECK (rating >= 0 AND rating <= 5);

-- Show all hotels with their valid ratings
SELECT id, name, rating
FROM hotels
ORDER BY rating DESC;
-- Output:
-- id | name                   | rating
-- 5  | The London Ritz        | 4.9
-- 4  | Bali Zen Villas        | 4.8
-- 3  | Manhattan Grand        | 4.7
-- 6  | Burj View Hotel        | 4.6
-- 1  | Le Grand Paris Hotel   | 4.5
-- 10 | Table Mountain Lodge   | 4.5
-- 8  | Sydney Harbour Suites  | 4.4
-- 2  | Tokyo Bay Resort       | 4.3
-- 7  | Roma Antica Inn        | 4.2
-- 9  | Bangkok Palace Hotel   | 4.1

-- Q3: Ensure trip budget is non-negative
-- ALTER TABLE trips DROP CHECK chk_trip_budget;
ALTER TABLE trips
ADD CONSTRAINT chk_trip_budget
CHECK (total_budget >= 0);

-- Show all trips with their valid budgets
SELECT id, name, total_budget
FROM trips
ORDER BY total_budget DESC;
-- Output:
-- id | name               | total_budget
-- 3  | Bali Group Retreat | 8000.00
-- 1  | European Adventure | 5000.00
-- 2  | Tokyo Explorer     | 3500.00

-- =============================================================
-- CHAPTER 3.2: AGGREGATE FUNCTIONS
-- =============================================================

-- Q1: Total budget across all trips
SELECT SUM(total_budget) AS total_budget_all_trips
FROM trips;
-- Output:
-- total_budget_all_trips
-- 16500.00

-- Q2: Average hotel price per destination
SELECT d.city, d.country,
       ROUND(AVG(h.price_per_night), 2) AS avg_price,
       COUNT(*) AS hotel_count
FROM hotels h
JOIN destinations d ON h.destination_id = d.id
GROUP BY d.city, d.country
ORDER BY avg_price DESC;
-- Output:
-- city       | country     | avg_price | hotel_count
-- London     | UK          | 400.00    | 1
-- New York   | USA         | 350.00    | 1
-- Dubai      | UAE         | 300.00    | 1
-- ...

-- Q3: Number of trips per status
SELECT status, COUNT(*) AS trip_count
FROM trips
GROUP BY status
ORDER BY trip_count DESC;
-- Output:
-- status   | trip_count
-- Planning | 3

-- =============================================================
-- CHAPTER 3.3: SET OPERATIONS
-- =============================================================

-- Q1: Destinations that have BOTH hotels AND itinerary visits
SELECT city FROM destinations WHERE id IN (SELECT destination_id FROM hotels)
INTERSECT
SELECT city FROM destinations WHERE id IN (SELECT destination_id FROM itinerary_days);
-- Output: Paris, Tokyo, Bali, Rome

-- Q2: Destinations in France OR with hotel price > 300
SELECT id, city, country FROM destinations WHERE country = 'France'
UNION
SELECT d.id, d.city, d.country FROM destinations d
JOIN hotels h ON d.id = h.destination_id WHERE h.price_per_night > 300;
-- Output:
-- id | city     | country
-- 1  | Paris    | France
-- 3  | New York | USA
-- 5  | London   | UK

-- Q3: Destinations with reviews but NO itinerary visits
SELECT DISTINCT d.city FROM destinations d
JOIN place_reviews pr ON d.id = pr.destination_id
EXCEPT
SELECT DISTINCT d.city FROM destinations d
JOIN itinerary_days id2 ON d.id = id2.destination_id;
-- Output: New York, London, Dubai, Sydney, Bangkok, Cape Town

-- =============================================================
-- CHAPTER 3.4: SUBQUERIES
-- =============================================================

-- Q1: Trips with budget above average
SELECT id, name, total_budget
FROM trips
WHERE total_budget > (SELECT AVG(total_budget) FROM trips);
-- Output:
-- id | name               | total_budget
-- 3  | Bali Group Retreat | 8000.00

-- Q2: Hotel with highest price per destination
SELECT h1.id, h1.name, d.city, h1.price_per_night
FROM hotels h1
JOIN destinations d ON h1.destination_id = d.id
WHERE h1.price_per_night = (
  SELECT MAX(h2.price_per_night)
  FROM hotels h2
  WHERE h2.destination_id = h1.destination_id
);
-- Output: All 10 hotels (one per destination)

-- Q3: Users who spent more than average across all expenses
SELECT u.id, u.name, SUM(e.amount) AS total_spent
FROM users u
JOIN expenses e ON u.id = e.paid_by
GROUP BY u.id, u.name
HAVING SUM(e.amount) > (SELECT AVG(amount) FROM expenses);
-- Output:
-- id | name           | total_spent
-- 1  | Admin User     | 500.00
-- 3  | Bob Smith      | 1200.00

-- =============================================================
-- CHAPTER 3.5: JOINS
-- =============================================================

-- Q1: List each trip with its owner and member count
SELECT t.id AS trip_id, t.name AS trip_name, t.status,
       u.name AS owner_name,
       COUNT(DISTINCT tm.user_id) AS member_count
FROM trips t
JOIN users u ON t.owner_id = u.id
LEFT JOIN trip_members tm ON t.id = tm.trip_id
GROUP BY t.id, t.name, t.status, u.name
ORDER BY t.start_date;
-- Output:
-- trip_id | trip_name           | status   | owner_name   | member_count
-- 1       | European Adventure  | Planning | Admin User   | 2
-- 2       | Tokyo Explorer      | Planning | Alice Johnson| 1
-- 3       | Bali Group Retreat  | Planning | Bob Smith    | 4

-- Q2: Full itinerary with activities for each trip
SELECT t.name AS trip, id2.day_number, d.city,
       a.time AS activity_time, a.name AS activity, a.cost
FROM trips t
JOIN itinerary_days id2 ON t.id = id2.trip_id
JOIN destinations d ON id2.destination_id = d.id
LEFT JOIN activities a ON id2.id = a.itinerary_day_id
ORDER BY t.id, id2.day_number, a.time;
-- Output: 15 rows showing Paris Day1-2, Rome Day3, Tokyo Day1, Bali Day1

-- Q3: Expense splits showing who owes whom
SELECT t.name AS trip, e.description, u_paid.name AS paid_by,
       u_owe.name AS owed_by, es.share_amount, es.is_settled
FROM expense_splits es
JOIN expenses e ON es.expense_id = e.id
JOIN trips t ON e.trip_id = t.id
JOIN users u_paid ON e.paid_by = u_paid.id
JOIN users u_owe ON es.user_id = u_owe.id
ORDER BY t.id, e.id;
-- Output: Shows split amounts per member per expense

-- =============================================================
-- CHAPTER 3.6: VIEWS (already created in advanced_db_objects.sql)
-- =============================================================

-- Q1: View – Upcoming trips within 30 days
SELECT * FROM v_upcoming_trips;
-- Output: Trips starting within 30 days with member_count, total_spent, days_until_start

-- Q2: View – Group balance (who owes whom)
SELECT * FROM v_group_balance
WHERE trip_id = 3
ORDER BY net_balance DESC;
-- Output:
-- trip_name          | user_name      | total_paid | total_owed | net_balance
-- Bali Group Retreat | Bob Smith      | 1200.00    | 420.00     | 780.00
-- Bali Group Retreat | Dave Brown     | 200.00     | 420.00     | -220.00
-- ...

-- Q3: View – Full trip itinerary
SELECT * FROM v_trip_itinerary_full
WHERE trip_id = 1
ORDER BY day_number, activity_time;
-- Output: Hierarchical Trip -> Day -> Activity rows for European Adventure

-- =============================================================
-- CHAPTER 3.7: TRIGGERS (already created in advanced_db_objects.sql)
-- =============================================================

-- Q1: Trigger – Auto group discount on hotel booking
-- trg_apply_group_discount fires AFTER INSERT ON hotel_bookings
-- Demo: Insert a booking for trip 3 (4 members → 5% discount)
INSERT INTO hotel_bookings (trip_id, hotel_id, user_id, check_in, check_out, rooms, total_price, status)
VALUES (3, 4, 3, '2025-09-10', '2025-09-15', 1, 600.00, 'Confirmed');

SELECT id, total_price, discount_applied
FROM hotel_bookings WHERE trip_id = 3 ORDER BY id DESC LIMIT 1;
-- Output:
-- id | total_price | discount_applied
-- 1  | 570.00      | 5.00
-- (600 * 0.95 = 570, 5% discount applied for 4-member group)

-- Q2: Trigger – Auto split expense among trip members
-- trg_auto_split_expense fires AFTER INSERT ON expenses
INSERT INTO expenses (trip_id, paid_by, description, amount, currency, category)
VALUES (1, 1, 'Museum tickets', 100.00, 'EUR', 'Activities');

SELECT es.user_id, u.name, es.share_amount
FROM expense_splits es
JOIN users u ON es.user_id = u.id
JOIN expenses e ON es.expense_id = e.id
WHERE e.description = 'Museum tickets';
-- Output:
-- user_id | name         | share_amount
-- 1       | Admin User   | 50.00
-- 2       | Alice Johnson| 50.00
-- (100 / 2 members = 50 each)

-- Q3: Trigger – Price drop notification
-- trg_price_drop_notification fires AFTER INSERT ON flight_price_history
-- User 1 has alert for NYC-PAR at $500
INSERT INTO flight_price_history (route_key, travel_date, days_before_travel, price)
VALUES ('NYC-PAR', '2025-08-15', 14, 450.00);

SELECT user_id, message, type
FROM notifications
WHERE type = 'price_alert'
ORDER BY created_at DESC LIMIT 1;
-- Output:
-- user_id | message                                                    | type
-- 1       | Price drop alert! Route NYC-PAR is now $450 (target: $500)| price_alert

-- =============================================================
-- CHAPTER 3.8: CURSORS (Stored Procedures)
-- =============================================================

-- Q1: Cursor – List all trips with budget info row by row
DELIMITER $$
CREATE PROCEDURE trip_budget_cursor()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE t_id INT;
  DECLARE t_name VARCHAR(200);
  DECLARE t_budget DECIMAL(12,2);
  DECLARE t_status VARCHAR(20);
  DECLARE cur CURSOR FOR
    SELECT id, name, total_budget, status FROM trips;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO t_id, t_name, t_budget, t_status;
    IF done = 1 THEN LEAVE read_loop; END IF;
    SELECT CONCAT('Trip ', t_id, ' | ', t_name, ' | Budget=$', t_budget, ' | ', t_status) AS Message;
  END LOOP;
  CLOSE cur;
END$$
DELIMITER ;

CALL trip_budget_cursor();
-- Output:
-- Trip 1 | European Adventure | Budget=$5000.00 | Planning
-- Trip 2 | Tokyo Explorer | Budget=$3500.00 | Planning
-- Trip 3 | Bali Group Retreat | Budget=$8000.00 | Planning

-- Q2: Cursor – Flag expensive hotels (price > $250/night)
DELIMITER $$
CREATE PROCEDURE expensive_hotels_cursor()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE h_id INT;
  DECLARE h_name VARCHAR(200);
  DECLARE h_price DECIMAL(10,2);
  DECLARE cur CURSOR FOR
    SELECT id, name, price_per_night FROM hotels WHERE price_per_night > 250;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO h_id, h_name, h_price;
    IF done = 1 THEN LEAVE read_loop; END IF;
    SELECT CONCAT('Expensive: ', h_name, ' $', h_price, '/night') AS Message;
  END LOOP;
  CLOSE cur;
END$$
DELIMITER ;

CALL expensive_hotels_cursor();
-- Output:
-- Expensive: Manhattan Grand $350.00/night
-- Expensive: The London Ritz $400.00/night
-- Expensive: Burj View Hotel $300.00/night
-- Expensive: Sydney Harbour Suites $280.00/night

-- Q3: Cursor – Print member count per trip
DELIMITER $$
CREATE PROCEDURE trip_members_cursor()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE t_id INT;
  DECLARE t_name VARCHAR(200);
  DECLARE m_count INT;
  DECLARE cur CURSOR FOR
    SELECT t.id, t.name, COUNT(tm.user_id) AS cnt
    FROM trips t LEFT JOIN trip_members tm ON t.id = tm.trip_id
    GROUP BY t.id, t.name;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO t_id, t_name, m_count;
    IF done = 1 THEN LEAVE read_loop; END IF;
    SELECT CONCAT('Trip ', t_id, ' (', t_name, ') members=', m_count) AS Message;
  END LOOP;
  CLOSE cur;
END$$
DELIMITER ;

CALL trip_members_cursor();
-- Output:
-- Trip 1 (European Adventure) members=2
-- Trip 2 (Tokyo Explorer) members=1
-- Trip 3 (Bali Group Retreat) members=4

-- =============================================================
-- CHAPTER 5: TRANSACTIONS (TCL)
-- =============================================================

-- 5.2.1 Savepoint
BEGIN;
UPDATE hotels SET price_per_night = price_per_night + 10 WHERE id = 1;
SAVEPOINT sp_after_safe_update;
UPDATE hotels SET price_per_night = -999 WHERE id = 1;  -- bad update
ROLLBACK TO SAVEPOINT sp_after_safe_update;
COMMIT;
-- Result: Only +10 is kept; negative price rolled back

-- 5.2.2 Commit (booking + expense in one transaction)
BEGIN;
INSERT INTO expenses (trip_id, paid_by, description, amount, currency, category)
VALUES (2, 2, 'Tokyo street food tour', 80.00, 'JPY', 'Food');
UPDATE trips SET total_budget = total_budget - 80 WHERE id = 2;
COMMIT;
-- Result: Both expense and budget update saved permanently

-- 5.2.3 Rollback
BEGIN;
INSERT INTO expenses (trip_id, paid_by, description, amount, currency, category)
VALUES (1, 1, 'Invalid expense', 99999.00, 'USD', 'Other');
UPDATE trips SET total_budget = total_budget - 99999 WHERE id = 1;
ROLLBACK;
-- Result: Nothing saved; database unchanged

-- Transaction 1: Hotel booking with group discount check
BEGIN;
INSERT INTO hotel_bookings (trip_id, hotel_id, user_id, check_in, check_out, rooms, total_price, status)
VALUES (1, 1, 1, '2025-07-15', '2025-07-20', 1, 1250.00, 'Confirmed');
UPDATE trips SET status = 'Ongoing' WHERE id = 1;
COMMIT;

-- Transaction 2: Savepoint + partial rollback on expenses
BEGIN;
INSERT INTO expenses (trip_id, paid_by, description, amount, currency, category)
VALUES (3, 4, 'Group lunch', 150.00, 'USD', 'Food');
SAVEPOINT sp_expense;
INSERT INTO expenses (trip_id, paid_by, description, amount, currency, category)
VALUES (3, 4, 'Wrong item', 99999.00, 'USD', 'Other');
ROLLBACK TO SAVEPOINT sp_expense;
INSERT INTO expenses (trip_id, paid_by, description, amount, currency, category)
VALUES (3, 5, 'Spa session', 200.00, 'USD', 'Activities');
COMMIT;
-- Result: Group lunch + Spa saved; Wrong item rolled back

-- Transaction 3: Full rollback recovery
BEGIN;
DELETE FROM trip_members WHERE trip_id = 3 AND user_id = 5;
UPDATE trips SET total_budget = 0 WHERE id = 3;
ROLLBACK;
-- Result: No changes; member and budget preserved

-- Transaction 4: Flight booking atomic transaction
BEGIN;
INSERT INTO flight_bookings (trip_id, flight_id, user_id, pnr, price_paid, class, status)
VALUES (1, 1, 1, 'ABC123', 650.00, 'Economy', 'Confirmed');
SAVEPOINT sp_flight;
INSERT INTO flight_bookings (trip_id, flight_id, user_id, pnr, price_paid, class, status)
VALUES (1, 7, 1, 'DEF456', 150.00, 'Economy', 'Confirmed');
COMMIT;
-- Result: Both flight bookings saved

-- Transaction 5: Currency rate update with notification
BEGIN;
UPDATE exchange_rates SET rate = 0.91 WHERE from_currency = 'USD' AND to_currency = 'EUR';
SAVEPOINT sp_rate;
UPDATE exchange_rates SET rate = -1 WHERE from_currency = 'USD' AND to_currency = 'GBP';
ROLLBACK TO SAVEPOINT sp_rate;
UPDATE exchange_rates SET rate = 0.80 WHERE from_currency = 'USD' AND to_currency = 'GBP';
COMMIT;
-- Result: EUR rate=0.91, GBP rate=0.80; negative rate rolled back

-- =============================================================
-- CONCURRENCY CONTROL DEMO (Two-session row lock)
-- =============================================================

-- Session 1:
BEGIN;
SELECT id, price_per_night FROM hotels WHERE id = 1 FOR UPDATE;
-- (keep open)

-- Session 2:
BEGIN;
UPDATE hotels SET price_per_night = price_per_night + 20 WHERE id = 1;
-- (waits for Session 1 lock)

-- Session 1:
COMMIT;
-- Session 2 now proceeds
COMMIT;
-- Observation: Session 2 waits until Session 1 commits. Prevents lost updates.

-- =============================================================
-- STORED PROCEDURES (already in advanced_db_objects.sql)
-- =============================================================

-- Call 1: Cheap booking advice for NYC-PAR route
CALL GetCheapBookingAdvice('NYC-PAR');
-- Output: days_before_travel | avg_price | min_price | max_price | savings_pct

-- Call 2: Generate packing list for trip 1
CALL GeneratePackingList(1);
-- Output: item_name | category | reason (weather/activity/essential)

-- Call 3: Budget savings suggestions for trip 3
CALL SuggestBudgetSavings(3);
-- Output: suggestion_type | description | potential_savings

-- Call 4: AI destination recommendations for user 1
CALL RecommendDestinations(1);
-- Output: destination_id | city | country | score | explanation

-- Call 5: Refresh admin stats cache
CALL sp_refresh_admin_stats();
SELECT * FROM admin_stats_cache;
-- Output: metric_name | metric_value (JSON)
