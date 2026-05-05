-- =====================================================================
-- Trip Planner: MySQL 8.0 Advanced Database Objects
-- Triggers (4), Stored Procedures (4+1), Views (3), Events (1)
-- Run AFTER Prisma migration with: mysql -u root -p trip_planner < this_file.sql
-- =====================================================================

-- Enable Event Scheduler
SET GLOBAL event_scheduler = ON;

-- =====================================================================
-- FULLTEXT INDEX for destination search
-- =====================================================================
-- ALTER TABLE destinations ADD FULLTEXT INDEX ft_destinations (city, country, description);

-- =====================================================================
-- VIEW 1: v_upcoming_trips
-- Shows trips starting within 30 days with member count and budget
-- =====================================================================
CREATE OR REPLACE VIEW v_upcoming_trips AS
SELECT
  t.id AS trip_id,
  t.name AS trip_name,
  t.start_date,
  t.end_date,
  t.total_budget,
  t.status,
  t.cover_image,
  t.owner_id,
  u.name AS owner_name,
  COUNT(DISTINCT tm.user_id) AS member_count,
  COALESCE(SUM(e.amount), 0) AS total_spent,
  DATEDIFF(t.start_date, CURDATE()) AS days_until_start
FROM trips t
JOIN users u ON t.owner_id = u.id
LEFT JOIN trip_members tm ON t.id = tm.trip_id
LEFT JOIN expenses e ON t.id = e.trip_id
WHERE t.start_date >= CURDATE()
  AND t.start_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
GROUP BY t.id, t.name, t.start_date, t.end_date, t.total_budget, t.status, t.cover_image, t.owner_id, u.name;

-- =====================================================================
-- VIEW 2: v_group_balance
-- Net balance per member per trip (who owes whom)
-- =====================================================================
CREATE OR REPLACE VIEW v_group_balance AS
SELECT
  t.id AS trip_id,
  t.name AS trip_name,
  u.id AS user_id,
  u.name AS user_name,
  COALESCE(paid.total_paid, 0) AS total_paid,
  COALESCE(owed.total_owed, 0) AS total_owed,
  COALESCE(paid.total_paid, 0) - COALESCE(owed.total_owed, 0) AS net_balance
FROM trips t
JOIN trip_members tm ON t.id = tm.trip_id
JOIN users u ON tm.user_id = u.id
LEFT JOIN (
  SELECT e.trip_id, e.paid_by AS user_id, SUM(e.amount) AS total_paid
  FROM expenses e
  GROUP BY e.trip_id, e.paid_by
) paid ON paid.trip_id = t.id AND paid.user_id = u.id
LEFT JOIN (
  SELECT e.trip_id, es.user_id, SUM(es.share_amount) AS total_owed
  FROM expense_splits es
  JOIN expenses e ON es.expense_id = e.id
  GROUP BY e.trip_id, es.user_id
) owed ON owed.trip_id = t.id AND owed.user_id = u.id;

-- =====================================================================
-- VIEW 3: v_trip_itinerary_full
-- Hierarchical: Trip -> Days -> Activities
-- =====================================================================
CREATE OR REPLACE VIEW v_trip_itinerary_full AS
SELECT
  t.id AS trip_id,
  t.name AS trip_name,
  id2.id AS day_id,
  id2.day_number,
  id2.date AS day_date,
  d.city AS destination_city,
  d.country AS destination_country,
  a.id AS activity_id,
  a.time AS activity_time,
  a.name AS activity_name,
  a.cost AS activity_cost,
  a.category AS activity_category,
  a.notes AS activity_notes,
  a.image_url AS activity_image
FROM trips t
JOIN itinerary_days id2 ON t.id = id2.trip_id
JOIN destinations d ON id2.destination_id = d.id
LEFT JOIN activities a ON id2.id = a.itinerary_day_id
ORDER BY t.id, id2.day_number, a.time;

-- =====================================================================
-- TRIGGER 1: trg_apply_group_discount
-- Before hotel booking, if trip has >= 3 members, apply group discount
-- =====================================================================
DROP TRIGGER IF EXISTS trg_apply_group_discount;

DELIMITER //
CREATE TRIGGER trg_apply_group_discount
BEFORE INSERT ON hotel_bookings
FOR EACH ROW
BEGIN
  DECLARE member_count INT;
  DECLARE discount DECIMAL(5,2) DEFAULT 0;

  -- Count trip members
  SELECT COUNT(*) INTO member_count
  FROM trip_members
  WHERE trip_id = NEW.trip_id;

  -- Find applicable discount
  SELECT COALESCE(MAX(discount_pct), 0) INTO discount
  FROM group_discounts
  WHERE min_members <= member_count;

  -- Apply discount if available
  IF discount > 0 THEN
    SET NEW.discount_applied = discount;
    SET NEW.total_price = NEW.total_price * (1 - discount / 100);
  END IF;
END //
DELIMITER ;

-- =====================================================================
-- TRIGGER 2: trg_price_drop_notification
-- After new flight price history entry, notify users if below alert price
-- =====================================================================
DROP TRIGGER IF EXISTS trg_price_drop_notification;

DELIMITER //
CREATE TRIGGER trg_price_drop_notification
AFTER INSERT ON flight_price_history
FOR EACH ROW
BEGIN
  INSERT INTO notifications (user_id, message, type, is_read, created_at)
  SELECT
    pa.user_id,
    CONCAT('Price drop alert! Route ', NEW.route_key, ' is now $', NEW.price,
           ' (your target: $', pa.desired_price, ')'),
    'price_alert',
    FALSE,
    NOW()
  FROM price_alerts pa
  WHERE pa.route_key = NEW.route_key
    AND pa.is_active = TRUE
    AND NEW.price <= pa.desired_price;
END //
DELIMITER ;

-- =====================================================================
-- TRIGGER 3: trg_auto_split_expense
-- After new expense, create equal splits for all trip members
-- =====================================================================
DROP TRIGGER IF EXISTS trg_auto_split_expense;

DELIMITER //
CREATE TRIGGER trg_auto_split_expense
AFTER INSERT ON expenses
FOR EACH ROW
BEGIN
  DECLARE member_count INT;
  DECLARE share DECIMAL(12,2);

  SELECT COUNT(*) INTO member_count
  FROM trip_members
  WHERE trip_id = NEW.trip_id;

  IF member_count > 0 THEN
    SET share = NEW.amount / member_count;

    INSERT INTO expense_splits (expense_id, user_id, share_amount, is_settled)
    SELECT NEW.id, tm.user_id, share, FALSE
    FROM trip_members tm
    WHERE tm.trip_id = NEW.trip_id;
  END IF;
END //
DELIMITER ;

-- =====================================================================
-- TRIGGER 4: trg_update_currency_log
-- After exchange rate update, log for cache invalidation
-- =====================================================================
DROP TRIGGER IF EXISTS trg_update_currency_log;

DELIMITER //
CREATE TRIGGER trg_update_currency_log
AFTER UPDATE ON exchange_rates
FOR EACH ROW
BEGIN
  INSERT INTO notifications (user_id, message, type, is_read, created_at)
  SELECT DISTINCT u.id,
    CONCAT('Exchange rate updated: ', NEW.from_currency, '/', NEW.to_currency,
           ' = ', NEW.rate),
    'system',
    FALSE,
    NOW()
  FROM users u
  WHERE u.preferred_currency = NEW.to_currency
  LIMIT 5;
END //
DELIMITER ;

-- =====================================================================
-- STORED PROCEDURE 1: GetCheapBookingAdvice
-- Returns best booking window (optimal days_before_travel) for a route
-- =====================================================================
DROP PROCEDURE IF EXISTS GetCheapBookingAdvice;

DELIMITER //
CREATE PROCEDURE GetCheapBookingAdvice(IN p_route_key VARCHAR(50))
BEGIN
  SELECT
    days_before_travel,
    ROUND(AVG(price), 2) AS avg_price,
    ROUND(MIN(price), 2) AS min_price,
    ROUND(MAX(price), 2) AS max_price,
    COUNT(*) AS sample_size,
    ROUND(
      (AVG(price) - MIN(price)) / NULLIF(AVG(price), 0) * 100, 1
    ) AS potential_savings_pct,
    RANK() OVER (ORDER BY AVG(price) ASC) AS price_rank
  FROM flight_price_history
  WHERE route_key = p_route_key
  GROUP BY days_before_travel
  ORDER BY avg_price ASC
  LIMIT 10;
END //
DELIMITER ;

-- =====================================================================
-- STORED PROCEDURE 2: GeneratePackingList
-- Joins trip weather + activities to suggest packing items
-- =====================================================================
DROP PROCEDURE IF EXISTS GeneratePackingList;

DELIMITER //
CREATE PROCEDURE GeneratePackingList(IN p_trip_id INT)
BEGIN
  -- Weather-based items
  SELECT DISTINCT
    pi.name AS item_name,
    pi.category,
    CONCAT('Weather: ', wc.condition) AS reason
  FROM itinerary_days id2
  JOIN weather_cache wc ON id2.destination_id = wc.destination_id
    AND wc.forecast_date = id2.date
  JOIN weather_item_mapping wim ON wim.weather_condition = wc.condition
  JOIN packing_items pi ON wim.item_id = pi.id
  WHERE id2.trip_id = p_trip_id

  UNION

  -- Activity-based items
  SELECT DISTINCT
    pi.name AS item_name,
    pi.category,
    CONCAT('Activity: ', a.category) AS reason
  FROM itinerary_days id2
  JOIN activities a ON id2.id = a.itinerary_day_id
  JOIN activity_item_mapping aim ON aim.activity_category = a.category
  JOIN packing_items pi ON aim.item_id = pi.id
  WHERE id2.trip_id = p_trip_id

  UNION

  -- Default items always included
  SELECT
    pi.name AS item_name,
    pi.category,
    'Essential item' AS reason
  FROM packing_items pi
  WHERE pi.is_default = TRUE

  ORDER BY category, item_name;
END //
DELIMITER ;

-- =====================================================================
-- STORED PROCEDURE 3: SuggestBudgetSavings
-- Analyzes trip and suggests cost savings
-- =====================================================================
DROP PROCEDURE IF EXISTS SuggestBudgetSavings;

DELIMITER //
CREATE PROCEDURE SuggestBudgetSavings(IN p_trip_id INT)
BEGIN
  -- Check for multiple separate hotel rooms
  SELECT
    'shared_accommodation' AS suggestion_type,
    CONCAT('Members ', GROUP_CONCAT(u.name SEPARATOR ', '),
           ' booked ', COUNT(*), ' separate rooms at ', h.name,
           '. Consider sharing – potential savings: $',
           ROUND(SUM(hb.total_price) - MIN(hb.total_price), 2)) AS description,
    ROUND(SUM(hb.total_price) - MIN(hb.total_price), 2) AS potential_savings
  FROM hotel_bookings hb
  JOIN hotels h ON hb.hotel_id = h.id
  JOIN users u ON hb.user_id = u.id
  WHERE hb.trip_id = p_trip_id
  GROUP BY hb.hotel_id, h.name
  HAVING COUNT(*) > 1

  UNION ALL

  -- Check for individual flight bookings on same route
  SELECT
    'group_transport' AS suggestion_type,
    CONCAT(COUNT(*), ' members booked separate flights on ',
           f.origin, ' → ', f.destination,
           '. Group booking could save ~15%: $',
           ROUND(SUM(fb.price_paid) * 0.15, 2)) AS description,
    ROUND(SUM(fb.price_paid) * 0.15, 2) AS potential_savings
  FROM flight_bookings fb
  JOIN flights f ON fb.flight_id = f.id
  WHERE fb.trip_id = p_trip_id
  GROUP BY f.origin, f.destination
  HAVING COUNT(*) > 1

  UNION ALL

  -- Budget vs actual comparison
  SELECT
    'budget_overview' AS suggestion_type,
    CONCAT('Trip budget: $', t.total_budget,
           ', Spent so far: $', COALESCE(SUM(e.amount), 0),
           ', Remaining: $', t.total_budget - COALESCE(SUM(e.amount), 0)) AS description,
    t.total_budget - COALESCE(SUM(e.amount), 0) AS potential_savings
  FROM trips t
  LEFT JOIN expenses e ON t.id = e.trip_id
  WHERE t.id = p_trip_id
  GROUP BY t.id, t.total_budget;
END //
DELIMITER ;

-- =====================================================================
-- STORED PROCEDURE 4: RecommendDestinations
-- Scoring: (avg_rating * 0.4) + ((10 - crowd) * 0.3) + (weather_match * 0.3)
-- =====================================================================
DROP PROCEDURE IF EXISTS RecommendDestinations;

DELIMITER //
CREATE PROCEDURE RecommendDestinations(IN p_user_id INT)
BEGIN
  DECLARE v_weather_pref VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_crowd_tolerance INT;

  SELECT weather_preference, crowd_tolerance
  INTO v_weather_pref, v_crowd_tolerance
  FROM user_preferences
  WHERE user_id = p_user_id;

  -- If no preferences found, use defaults
  IF v_weather_pref IS NULL THEN SET v_weather_pref = 'Sunny'; END IF;
  IF v_crowd_tolerance IS NULL THEN SET v_crowd_tolerance = 5; END IF;

  -- Calculate scores and return top 5
  INSERT INTO recommendation_logs (user_id, destination_id, score, explanation, created_at)
  SELECT
    p_user_id,
    d.id,
    ROUND(
      (COALESCE(avg_rating, 3.0) * 0.4) +
      ((10 - COALESCE(avg_crowd, 5)) * 0.3) +
      (CASE WHEN wc.`condition` COLLATE utf8mb4_unicode_ci = v_weather_pref THEN 10 ELSE 5 END * 0.3)
    , 2) AS score,
    CONCAT(
      d.city, ', ', d.country, ': ',
      'Rating ', ROUND(COALESCE(avg_rating, 3.0), 1), '/5, ',
      'Crowd level ', ROUND(COALESCE(avg_crowd, 5), 0), '/10, ',
      CASE WHEN wc.`condition` COLLATE utf8mb4_unicode_ci = v_weather_pref
           THEN CONCAT('Perfect weather (', wc.`condition`, ')')
           ELSE CONCAT('Weather: ', COALESCE(wc.`condition`, 'Unknown'))
      END
    ) AS explanation,
    NOW()
  FROM destinations d
  LEFT JOIN (
    SELECT destination_id, AVG(rating) AS avg_rating
    FROM place_reviews GROUP BY destination_id
  ) pr ON d.id = pr.destination_id
  LEFT JOIN (
    SELECT destination_id, AVG(expected_crowd_level) AS avg_crowd
    FROM crowd_forecasts
    WHERE forecast_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    GROUP BY destination_id
  ) cf ON d.id = cf.destination_id
  LEFT JOIN weather_cache wc ON d.id = wc.destination_id
    AND wc.forecast_date = CURDATE()
  ORDER BY score DESC
  LIMIT 5;

  -- Return the recommendations
  SELECT
    rl.destination_id,
    d.city,
    d.country,
    d.hero_image_url,
    rl.score,
    rl.explanation
  FROM recommendation_logs rl
  JOIN destinations d ON rl.destination_id = d.id
  WHERE rl.user_id = p_user_id
  ORDER BY rl.created_at DESC, rl.score DESC
  LIMIT 5;
END //
DELIMITER ;

-- =====================================================================
-- STORED PROCEDURE 5: sp_refresh_admin_stats
-- Replaces materialized view - populates admin_stats_cache
-- =====================================================================
DROP PROCEDURE IF EXISTS sp_refresh_admin_stats;

DELIMITER //
CREATE PROCEDURE sp_refresh_admin_stats()
BEGIN
  TRUNCATE TABLE admin_stats_cache;

  -- 1. Most popular destinations
  INSERT INTO admin_stats_cache (metric_name, metric_value)
  SELECT 'popular_destinations', JSON_ARRAYAGG(JSON_OBJECT(
    'city', city, 'country', country, 'trip_count', trip_count, 'rank_pos', rnk
  ))
  FROM (
    SELECT d.city, d.country, COUNT(DISTINCT id2.trip_id) AS trip_count,
           RANK() OVER (ORDER BY COUNT(DISTINCT id2.trip_id) DESC) AS rnk
    FROM destinations d
    LEFT JOIN itinerary_days id2 ON d.id = id2.destination_id
    GROUP BY d.id, d.city, d.country
    LIMIT 10
  ) ranked;

  -- 2. Monthly revenue from bookings
  INSERT INTO admin_stats_cache (metric_name, metric_value)
  SELECT 'monthly_revenue', JSON_ARRAYAGG(JSON_OBJECT(
    'month', month_label, 'hotel_revenue', hotel_rev, 'flight_revenue', flight_rev
  ))
  FROM (
    SELECT
      DATE_FORMAT(COALESCE(hb.created_at, fb.booked_at), '%Y-%m') AS month_label,
      COALESCE(SUM(hb.total_price), 0) AS hotel_rev,
      COALESCE(SUM(fb.price_paid), 0) AS flight_rev
    FROM hotel_bookings hb
    LEFT JOIN flight_bookings fb ON DATE_FORMAT(hb.created_at, '%Y-%m') = DATE_FORMAT(fb.booked_at, '%Y-%m')
    GROUP BY month_label
    ORDER BY month_label DESC
    LIMIT 12
  ) revenue;

  -- 3. User retention (repeat planners using LAG)
  INSERT INTO admin_stats_cache (metric_name, metric_value)
  SELECT 'user_retention', JSON_ARRAYAGG(JSON_OBJECT(
    'user_name', user_name, 'trip_count', trip_count,
    'latest_trip', latest_trip, 'prev_trip', prev_trip
  ))
  FROM (
    SELECT
      u.name AS user_name,
      COUNT(t.id) AS trip_count,
      MAX(t.created_at) AS latest_trip,
      LAG(MAX(t.created_at)) OVER (ORDER BY MAX(t.created_at)) AS prev_trip
    FROM users u
    JOIN trips t ON u.id = t.owner_id
    GROUP BY u.id, u.name
    HAVING COUNT(t.id) > 0
  ) retention;

  -- 4. Average budget vs actual spend
  INSERT INTO admin_stats_cache (metric_name, metric_value)
  SELECT 'budget_vs_actual', JSON_ARRAYAGG(JSON_OBJECT(
    'trip_name', trip_name, 'budget', budget, 'actual', actual_spent
  ))
  FROM (
    SELECT
      t.name AS trip_name,
      t.total_budget AS budget,
      COALESCE(SUM(e.amount), 0) AS actual_spent
    FROM trips t
    LEFT JOIN expenses e ON t.id = e.trip_id
    GROUP BY t.id, t.name, t.total_budget
  ) bva;

  -- 5. Total stats summary
  INSERT INTO admin_stats_cache (metric_name, metric_value)
  SELECT 'summary', JSON_OBJECT(
    'total_users', (SELECT COUNT(*) FROM users),
    'total_trips', (SELECT COUNT(*) FROM trips),
    'total_bookings', (SELECT COUNT(*) FROM hotel_bookings) + (SELECT COUNT(*) FROM flight_bookings),
    'total_revenue', (SELECT COALESCE(SUM(total_price), 0) FROM hotel_bookings) + (SELECT COALESCE(SUM(price_paid), 0) FROM flight_bookings)
  );
END //
DELIMITER ;

-- =====================================================================
-- EVENT: refresh_admin_stats_event (daily)
-- =====================================================================
DROP EVENT IF EXISTS refresh_admin_stats_event;

DELIMITER //
CREATE EVENT refresh_admin_stats_event
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  CALL sp_refresh_admin_stats();
END //
DELIMITER ;

-- =====================================================================
-- MySQL FUNCTION: fn_convert (currency conversion)
-- =====================================================================
DROP FUNCTION IF EXISTS fn_convert;

DELIMITER //
CREATE FUNCTION fn_convert(p_amount DECIMAL(12,2), p_from VARCHAR(3), p_to VARCHAR(3))
RETURNS DECIMAL(14,2)
DETERMINISTIC
BEGIN
  DECLARE v_rate DECIMAL(14,6);

  IF p_from = p_to THEN RETURN p_amount; END IF;

  SELECT rate INTO v_rate
  FROM exchange_rates
  WHERE from_currency = p_from AND to_currency = p_to
  LIMIT 1;

  IF v_rate IS NULL THEN RETURN p_amount; END IF;

  RETURN ROUND(p_amount * v_rate, 2);
END //
DELIMITER ;
