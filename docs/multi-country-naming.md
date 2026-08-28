# Multi-Country Data Model Naming Conventions

Status: **Adopted 2026-08-28**
Applies to: all new tables, all new columns, all new API contracts

## Purpose

Novala is a global payroll and accounting SaaS targeting 10+ countries.
Consistent naming lets us:

- Reason about data across countries without ambiguity
- Onboard developers quickly
- Query safely (`WHERE country_code = 'US'` works everywhere)
- Interoperate with external systems (VoPay, Wise, tax authorities) that already
  use these standards

## The Canonical Names

### `country_code`
- **Type:** `VARCHAR(2)` NOT NULL
- **Standard:** ISO 3166-1 alpha-2 (`CA`, `US`, `GB`, `AU`, `NZ`, `SG`, `JP`, `DE`, `FR`, `ZA`)
- **Case:** UPPERCASE stored, case-insensitive matching in queries
- **Why alpha-2:** Universal standard. What VoPay, Wise, IRS, HMRC, CRA all use.
  Faster to type, index better than 3-letter, unambiguous.
- **NOT:** `country` (too vague), `country_name` (never store names, always codes),
  `country_id` (opaque, breaks external interop)

### `currency`
- **Type:** `VARCHAR(3)` NOT NULL
- **Standard:** ISO 4217 (`CAD`, `USD`, `GBP`, `AUD`, `NZD`, `SGD`, `JPY`, `EUR`, `ZAR`)
- **Case:** UPPERCASE stored
- **Applies to:** every table that stores money amounts. Money without currency is
  a bug waiting to happen at scale.
- **NOT:** `currency_code` (redundant, `currency` is already a code), `currency_symbol`
  (never store symbols, always codes)

### `region_code` *(target name — not yet adopted everywhere)*
- **Type:** `VARCHAR(10)` NOT NULL (varies by country)
- **Standard:** ISO 3166-2 subdivision codes
  - Canada: `CA-AB`, `CA-BC`, `CA-ON`, `CA-QC`, etc.
  - US: `US-CA`, `US-NY`, `US-TX`, etc.
  - UK: `GB-ENG`, `GB-SCT`, `GB-WLS`, `GB-NIR`
  - Germany: `DE-BY`, `DE-BE`, `DE-HH`, etc.
  - France: `FR-IDF`, `FR-PAC`, etc. (régions)
  - Japan: `JP-13` (Tokyo), `JP-27` (Osaka), etc. (prefectures)
- **NOT:** `province`, `state`, `province_or_state`, `province_state`. These
  concepts don't scale — Germany has Länder, France has régions, Japan has
  prefectures, UK has countries. `region_code` is neutral.
- **Migration status:** existing tables use `province`, `province_or_state`,
  `province_state`, `province_or_state`, `state` interchangeably. Do NOT rename
  in place — too risky. New tables and columns use `region_code`. Old fields
  migrated opportunistically when touching related code.

### `locale`
- **Type:** `VARCHAR(10)` NOT NULL
- **Standard:** BCP 47 (`en-CA`, `fr-CA`, `en-US`, `en-GB`, `de-DE`, `ja-JP`)
- **For:** UI language + regional formatting (dates, numbers, currency display)
- **Independent of `country_code`:** a Canadian company may want French UI
  (`locale=fr-CA`, `country_code=CA`). Don't infer one from the other.

### `timezone`
- **Type:** `VARCHAR(50)` NOT NULL
- **Standard:** IANA timezone database (`America/Edmonton`, `America/New_York`,
  `Europe/London`, `Asia/Tokyo`)
- **NOT:** `EST`, `PST`, `-05:00`, or any abbreviation. IANA IDs handle DST correctly.

## Current State Audit (as of 2026-08-28)

| Concept | Preferred Name | Where Correct | Where Inconsistent |
|---|---|---|---|
| Country | `country_code` (or `country` for legacy compat) | User, Payment (new), CompanyProfile, most tables | — |
| Currency | `currency` | Payment (new), PayRun, PayStub, Invoice, Transaction, Budget, Document, PayrollSettings | — |
| Region | `region_code` (target) | *none yet* | `province`, `province_or_state`, `province_state`, `state`, `work_province`, `mailing_province_or_state`, `provincial_or_state_tax` |
| Locale | `locale` | *none yet* | — |
| Timezone | `timezone` | *check per-table* | — |

## Rules for New Code

1. **Every new table storing money MUST have a `currency` column.**
2. **Every new table representing a tenant, transaction, or entity with a jurisdiction
   MUST have a `country_code` column.**
3. **New region columns use `region_code` (ISO 3166-2), never `province` or `state`.**
4. **NEVER store currency symbols (`$`, `€`, `¥`) — always ISO 4217 codes.**
5. **NEVER store country full names (`Canada`, `United States`) — always ISO 3166-1 alpha-2 codes.**
6. **NEVER compute currency by inferring from country.** Some countries share
   currencies (EUR: DE, FR, IE, IT, ES, NL, ...). Store both explicitly.

## Rules for Existing Code

- Do NOT rename existing `province`, `province_or_state`, etc. in place.
  Cross-cutting rename is high-risk; do it gradually when touching related code.
- When touching a legacy field, add a comment noting the target rename:
  `# TODO: rename to region_code (see docs/multi-country-naming.md)`
- If you must add a new field to an existing table with inconsistent names,
  match the existing table's convention for that table, not the new standard.

## Rationale

The alternative is what Novala's DB looks like TODAY: 5 different names for
province across 8 tables. That's fine at 1 country. At 10 countries with
different subdivision types, it's chaos.

Standards exist. Use them. ISO codes are 60 years old and are what every
serious payroll/tax/banking system on Earth already uses.