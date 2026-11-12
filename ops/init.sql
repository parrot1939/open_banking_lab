CREATE TABLE demo_balance (
  account_id text PRIMARY KEY,
  balance_cents integer NOT NULL CHECK (balance_cents >= 0)
);
INSERT INTO demo_balance VALUES ('DEMO-01', 12500), ('DEMO-02', 4520);
