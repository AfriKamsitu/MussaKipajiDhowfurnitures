-- Coupons at checkout: each order records the coupon it redeemed and the
-- discount it received. Apply once to an existing production database
-- (development databases pick these columns up automatically).

ALTER TABLE orders
    ADD COLUMN discount DECIMAL(14, 2) NULL DEFAULT 0,
    ADD COLUMN coupon_code VARCHAR(40) NULL;
