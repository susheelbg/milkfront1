-- Partner catalog (Our Partners). Run in Supabase SQL editor ONLY if you do not want
-- the backend to create the tables itself on startup (it does so idempotently).
-- Cargill + its six verified products are seeded by the backend on first start.

CREATE TABLE IF NOT EXISTS public.partners (
    id             SERIAL PRIMARY KEY,
    slug           VARCHAR NOT NULL UNIQUE,
    name           VARCHAR NOT NULL,
    tagline_en     VARCHAR,
    tagline_kn     VARCHAR,
    description_en TEXT,
    description_kn TEXT,
    logo_url       VARCHAR,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    display_order  INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMP DEFAULT now(),
    updated_at     TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_products (
    id                        SERIAL PRIMARY KEY,
    partner_id                INTEGER NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    name                      VARCHAR NOT NULL,
    brand                     VARCHAR,
    category                  VARCHAR,
    animal_type               VARCHAR,
    milk_production_range     VARCHAR,
    milk_production_range_kn  VARCHAR,
    description_en            TEXT,
    description_kn            TEXT,
    recommended_use_en        TEXT,
    recommended_use_kn        TEXT,
    feeding_instructions_en   TEXT,
    feeding_instructions_kn   TEXT,
    nutrition_data            JSONB,
    image_url                 VARCHAR,
    image_status              VARCHAR NOT NULL DEFAULT 'pending_approval',
    source_url                VARCHAR,
    source_checked_at         TIMESTAMP,
    is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
    display_order             INTEGER NOT NULL DEFAULT 0,
    needs_review              BOOLEAN NOT NULL DEFAULT FALSE,
    review_note               VARCHAR,
    created_at                TIMESTAMP DEFAULT now(),
    updated_at                TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_partner_products_partner_id ON public.partner_products(partner_id);
