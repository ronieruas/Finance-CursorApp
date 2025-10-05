--
-- PostgreSQL database dump
--

\restrict bSQ8MNnU7wb1rk5B3YaIf6xxJuJpvgzB5jMKXmA6ddFvn2eT6aEFjPuIeFJJBNb

-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS finance;
--
-- Name: finance; Type: DATABASE; Schema: -; Owner: finance
--

CREATE DATABASE finance WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.UTF-8';


ALTER DATABASE finance OWNER TO finance;

\unrestrict bSQ8MNnU7wb1rk5B3YaIf6xxJuJpvgzB5jMKXmA6ddFvn2eT6aEFjPuIeFJJBNb
\connect finance
\restrict bSQ8MNnU7wb1rk5B3YaIf6xxJuJpvgzB5jMKXmA6ddFvn2eT6aEFjPuIeFJJBNb

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: finance
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO finance;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: finance
--

COMMENT ON SCHEMA public IS '';


--
-- Name: enum_accounts_currency; Type: TYPE; Schema: public; Owner: finance
--

CREATE TYPE public.enum_accounts_currency AS ENUM (
    'BRL',
    'USD',
    'EUR'
);


ALTER TYPE public.enum_accounts_currency OWNER TO finance;

--
-- Name: enum_accounts_status; Type: TYPE; Schema: public; Owner: finance
--

CREATE TYPE public.enum_accounts_status AS ENUM (
    'ativa',
    'inativa'
);


ALTER TYPE public.enum_accounts_status OWNER TO finance;

--
-- Name: enum_accounts_type; Type: TYPE; Schema: public; Owner: finance
--

CREATE TYPE public.enum_accounts_type AS ENUM (
    'corrente',
    'poupanca',
    'investimento'
);


ALTER TYPE public.enum_accounts_type OWNER TO finance;

--
-- Name: enum_budgets_type; Type: TYPE; Schema: public; Owner: finance
--

CREATE TYPE public.enum_budgets_type AS ENUM (
    'geral',
    'cartao'
);


ALTER TYPE public.enum_budgets_type OWNER TO finance;

--
-- Name: enum_credit_cards_status; Type: TYPE; Schema: public; Owner: finance
--

CREATE TYPE public.enum_credit_cards_status AS ENUM (
    'ativa',
    'inativa'
);


ALTER TYPE public.enum_credit_cards_status OWNER TO finance;

--
-- Name: enum_expenses_status; Type: TYPE; Schema: public; Owner: finance
--

CREATE TYPE public.enum_expenses_status AS ENUM (
    'paga',
    'pendente',
    'atrasada'
);


ALTER TYPE public.enum_expenses_status OWNER TO finance;

--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: finance
--

CREATE TYPE public.enum_users_role AS ENUM (
    'admin',
    'user'
);


ALTER TYPE public.enum_users_role OWNER TO finance;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: finance
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO finance;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: finance
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    bank character varying(255),
    type public.enum_accounts_type NOT NULL,
    balance numeric(14,2) DEFAULT 0,
    status public.enum_accounts_status DEFAULT 'ativa'::public.enum_accounts_status,
    currency public.enum_accounts_currency DEFAULT 'BRL'::public.enum_accounts_currency NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.accounts OWNER TO finance;

--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: finance
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.accounts_id_seq OWNER TO finance;

--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finance
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: budgets; Type: TABLE; Schema: public; Owner: finance
--

CREATE TABLE public.budgets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    type public.enum_budgets_type NOT NULL,
    credit_card_id integer,
    period_start date NOT NULL,
    period_end date NOT NULL,
    planned_value numeric(14,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.budgets OWNER TO finance;

--
-- Name: budgets_id_seq; Type: SEQUENCE; Schema: public; Owner: finance
--

CREATE SEQUENCE public.budgets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.budgets_id_seq OWNER TO finance;

--
-- Name: budgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finance
--

ALTER SEQUENCE public.budgets_id_seq OWNED BY public.budgets.id;


--
-- Name: credit_card_payments; Type: TABLE; Schema: public; Owner: finance
--

CREATE TABLE public.credit_card_payments (
    id integer NOT NULL,
    card_id integer NOT NULL,
    user_id integer NOT NULL,
    account_id integer NOT NULL,
    value numeric(14,2) NOT NULL,
    payment_date date NOT NULL,
    is_full_payment boolean DEFAULT true,
    auto_debit boolean DEFAULT false,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.credit_card_payments OWNER TO finance;

--
-- Name: credit_card_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: finance
--

CREATE SEQUENCE public.credit_card_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.credit_card_payments_id_seq OWNER TO finance;

--
-- Name: credit_card_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finance
--

ALTER SEQUENCE public.credit_card_payments_id_seq OWNED BY public.credit_card_payments.id;


--
-- Name: credit_cards; Type: TABLE; Schema: public; Owner: finance
--

CREATE TABLE public.credit_cards (
    id integer NOT NULL,
    user_id integer NOT NULL,
    bank character varying(255),
    brand character varying(255),
    limit_value numeric(14,2) NOT NULL,
    due_day integer NOT NULL,
    closing_day integer NOT NULL,
    name character varying(255),
    status public.enum_credit_cards_status DEFAULT 'ativa'::public.enum_credit_cards_status,
    debito_automatico boolean DEFAULT false,
    conta_debito_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.credit_cards OWNER TO finance;

--
-- Name: credit_cards_id_seq; Type: SEQUENCE; Schema: public; Owner: finance
--

CREATE SEQUENCE public.credit_cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.credit_cards_id_seq OWNER TO finance;

--
-- Name: credit_cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finance
--

ALTER SEQUENCE public.credit_cards_id_seq OWNED BY public.credit_cards.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: finance
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    user_id integer NOT NULL,
    account_id integer,
    credit_card_id integer,
    installment_number integer DEFAULT 1,
    installment_total integer DEFAULT 1,
    description character varying(255) NOT NULL,
    value numeric(14,2) NOT NULL,
    due_date date NOT NULL,
    category character varying(255),
    status public.enum_expenses_status DEFAULT 'pendente'::public.enum_expenses_status,
    is_recurring boolean DEFAULT false,
    auto_debit boolean DEFAULT false,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    bill_closed_at timestamp with time zone
);


ALTER TABLE public.expenses OWNER TO finance;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: finance
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.expenses_id_seq OWNER TO finance;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finance
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: incomes; Type: TABLE; Schema: public; Owner: finance
--

CREATE TABLE public.incomes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    account_id integer NOT NULL,
    description character varying(255) NOT NULL,
    value numeric(14,2) NOT NULL,
    date date NOT NULL,
    category character varying(255),
    is_recurring boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    posted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.incomes OWNER TO finance;

--
-- Name: incomes_id_seq; Type: SEQUENCE; Schema: public; Owner: finance
--

CREATE SEQUENCE public.incomes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.incomes_id_seq OWNER TO finance;

--
-- Name: incomes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finance
--

ALTER SEQUENCE public.incomes_id_seq OWNED BY public.incomes.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: finance
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(255) NOT NULL,
    message character varying(255) NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO finance;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: finance
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO finance;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finance
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: transfers; Type: TABLE; Schema: public; Owner: finance
--

CREATE TABLE public.transfers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    from_account_id integer,
    to_account_id integer,
    value numeric(14,2) NOT NULL,
    description character varying(255),
    date date NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.transfers OWNER TO finance;

--
-- Name: transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: finance
--

CREATE SEQUENCE public.transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.transfers_id_seq OWNER TO finance;

--
-- Name: transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finance
--

ALTER SEQUENCE public.transfers_id_seq OWNED BY public.transfers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: finance
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role public.enum_users_role DEFAULT 'user'::public.enum_users_role,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    password_changed_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO finance;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: finance
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO finance;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: finance
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: budgets id; Type: DEFAULT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.budgets ALTER COLUMN id SET DEFAULT nextval('public.budgets_id_seq'::regclass);


--
-- Name: credit_card_payments id; Type: DEFAULT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.credit_card_payments ALTER COLUMN id SET DEFAULT nextval('public.credit_card_payments_id_seq'::regclass);


--
-- Name: credit_cards id; Type: DEFAULT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.credit_cards ALTER COLUMN id SET DEFAULT nextval('public.credit_cards_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: incomes id; Type: DEFAULT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.incomes ALTER COLUMN id SET DEFAULT nextval('public.incomes_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: transfers id; Type: DEFAULT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.transfers ALTER COLUMN id SET DEFAULT nextval('public.transfers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public."SequelizeMeta" (name) FROM stdin;
20240101000000-create-users-table.js
20240101001000-create-accounts-table.js
20240101002000-create-incomes-table.js
20250709024000-create-credit-cards-table.js
20250709025310-create-expenses-table.js
20250709030000-create-credit-card-payments-table.js
20250709032000-create-notifications-table.js
20250709033000-add-foreign-keys-credit-card-payment.js
20250710000000-create-credit-card-transactions-table.js
20250710001000-drop-credit-card-transactions-table.js
20250710002000-create-budgets-table.js
20250717000000-fix-credit-card-payments-timestamps.js
20250730010000-create-transfers-table.js
20250730011000-allow-null-from-account-id.js
20250730012000-allow-null-to-account-id.js
20250821093000-add-password-changed-at-to-users.js
20250824091500-add-posted-to-incomes.js
20250101010000-add-bill-closed-at-to-expenses.js
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.accounts (id, user_id, name, bank, type, balance, status, currency, created_at, updated_at) FROM stdin;
12	6	teste 1	brb	corrente	0.00	ativa	BRL	2025-09-01 14:13:32.066-03	2025-09-01 14:13:32.066-03
10	2	Nomad	Nomad	investimento	218.00	ativa	USD	2025-08-18 20:45:00.418-03	2025-09-18 22:08:15.687-03
11	2	C6 invest	C6	investimento	58487.39	ativa	BRL	2025-08-20 11:50:57.643-03	2025-09-23 15:15:38.879-03
9	2	Nubank	Nubank	corrente	2084.92	ativa	BRL	2025-08-18 20:44:20.654-03	2025-10-04 16:23:46.708-03
8	2	C6	C6	corrente	736.42	ativa	BRL	2025-08-18 15:09:17.358-03	2025-10-04 16:34:06.958-03
7	2	BRB	BRB	corrente	NaN	ativa	BRL	2025-08-18 15:09:10.762-03	2025-10-04 17:24:40.421-03
\.


--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.budgets (id, user_id, name, type, credit_card_id, period_start, period_end, planned_value, created_at, updated_at) FROM stdin;
4	2	Agosto	geral	\N	2025-08-01	2025-08-31	13000.00	2025-08-18 16:43:47.756-03	2025-08-18 16:43:47.756-03
8	2	Cartão C6	cartao	6	2025-09-09	2025-10-08	6000.00	2025-09-16 13:38:12.559-03	2025-09-16 13:38:12.559-03
9	2	cartão Nubank	cartao	8	2025-08-28	2025-09-27	1000.00	2025-09-16 13:38:49.544-03	2025-09-16 13:39:00.35-03
10	2	Setembro	geral	\N	2025-09-01	2025-09-30	14000.00	2025-09-18 18:06:38.02-03	2025-09-18 18:06:38.02-03
\.


--
-- Data for Name: credit_card_payments; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.credit_card_payments (id, card_id, user_id, account_id, value, payment_date, is_full_payment, auto_debit, created_at, updated_at) FROM stdin;
4	6	2	8	8388.57	2025-08-18	t	f	2025-08-18 16:20:38.413-03	2025-08-18 16:20:38.414-03
6	8	2	8	259.49	2025-08-06	t	f	2025-08-18 16:28:54.952-03	2025-08-18 16:28:54.953-03
7	8	2	8	1218.78	2025-09-05	t	f	2025-09-13 00:46:48.703-03	2025-09-13 00:46:48.703-03
8	6	2	8	6700.92	2025-09-15	t	f	2025-09-15 15:28:08.226-03	2025-09-15 15:28:08.227-03
\.


--
-- Data for Name: credit_cards; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.credit_cards (id, user_id, bank, brand, limit_value, due_day, closing_day, name, status, debito_automatico, conta_debito_id, created_at, updated_at) FROM stdin;
8	2	Nubank	Mastercard	17350.00	5	28	Nubank	ativa	f	8	2025-08-18 16:27:36.429-03	2025-09-13 00:46:48.763-03
6	2	C6	Mastercard	40000.00	15	8	C6	ativa	f	8	2025-08-18 15:11:56.416-03	2025-09-15 15:28:08.386-03
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.expenses (id, user_id, account_id, credit_card_id, installment_number, installment_total, description, value, due_date, category, status, is_recurring, auto_debit, paid_at, created_at, updated_at, bill_closed_at) FROM stdin;
24	2	8	\N	1	1	condomínio	1600.00	2025-08-10	\N	paga	f	f	2025-08-11 18:11:00-03	2025-08-18 15:11:28.901-03	2025-08-18 15:11:28.902-03	\N
27	2	\N	7	1	1	Padaria	50.00	2025-08-17	compras	paga	f	f	2025-08-17 21:00:00-03	2025-08-18 15:55:10.833-03	2025-08-18 15:55:31.022-03	\N
28	2	\N	6	1	1	fatura inicial	8388.57	2025-07-31	\N	paga	f	f	2025-08-17 21:00:00-03	2025-08-18 16:20:06.204-03	2025-08-18 16:20:38.42-03	\N
26	2	\N	7	1	1	fatura agosto	259.49	2025-07-24	\N	paga	f	f	2025-08-07 21:00:00-03	2025-08-18 15:52:44.168-03	2025-08-18 16:21:23.725-03	\N
30	2	\N	8	1	1	fatura inicial	259.49	2025-07-24	\N	paga	f	f	2025-08-05 21:00:00-03	2025-08-18 16:28:34.228-03	2025-08-18 16:28:54.957-03	\N
31	2	7	\N	1	1	Net+Claro	272.89	2025-08-09	\N	paga	f	f	2025-08-11 19:30:00-03	2025-08-18 16:30:21.88-03	2025-08-18 16:30:21.88-03	\N
32	2	7	\N	1	1	Church	1300.00	2025-08-10	\N	paga	f	f	2025-08-10 19:32:00-03	2025-08-18 16:32:11.812-03	2025-08-18 16:32:11.812-03	\N
33	2	7	\N	1	1	Financimento Imobiliário 	1460.70	2025-08-09	\N	paga	f	f	2025-08-11 19:33:00-03	2025-08-18 16:33:21.891-03	2025-08-18 16:33:21.891-03	\N
34	2	8	\N	1	1	faculdade Isabelle	1768.48	2025-08-10	\N	paga	t	f	2025-08-11 19:33:00-03	2025-08-18 16:34:03.671-03	2025-08-18 16:34:03.671-03	\N
42	2	\N	6	2	9	Seguro tiggo (2/9)	174.85	2025-09-17	\N	pendente	f	f	\N	2025-08-18 16:48:16.06-03	2025-08-18 16:48:16.06-03	\N
43	2	\N	6	3	9	Seguro tiggo (3/9)	174.85	2025-10-17	\N	pendente	f	f	\N	2025-08-18 16:48:16.064-03	2025-08-18 16:48:16.064-03	\N
44	2	\N	6	4	9	Seguro tiggo (4/9)	174.85	2025-11-17	\N	pendente	f	f	\N	2025-08-18 16:48:16.067-03	2025-08-18 16:48:16.067-03	\N
45	2	\N	6	5	9	Seguro tiggo (5/9)	174.85	2025-12-17	\N	pendente	f	f	\N	2025-08-18 16:48:16.07-03	2025-08-18 16:48:16.07-03	\N
46	2	\N	6	6	9	Seguro tiggo (6/9)	174.85	2026-01-17	\N	pendente	f	f	\N	2025-08-18 16:48:16.073-03	2025-08-18 16:48:16.073-03	\N
47	2	\N	6	7	9	Seguro tiggo (7/9)	174.85	2026-02-17	\N	pendente	f	f	\N	2025-08-18 16:48:16.076-03	2025-08-18 16:48:16.076-03	\N
48	2	\N	6	8	9	Seguro tiggo (8/9)	174.85	2026-03-17	\N	pendente	f	f	\N	2025-08-18 16:48:16.079-03	2025-08-18 16:48:16.079-03	\N
49	2	\N	6	9	9	Seguro tiggo (9/9)	174.85	2026-04-17	\N	pendente	f	f	\N	2025-08-18 16:48:16.082-03	2025-08-18 16:48:16.082-03	\N
51	2	\N	6	2	5	óculos  (2/5)	110.00	2025-09-10	\N	pendente	f	f	\N	2025-08-18 16:49:49.283-03	2025-08-18 16:49:49.283-03	\N
52	2	\N	6	3	5	óculos  (3/5)	110.00	2025-10-10	\N	pendente	f	f	\N	2025-08-18 16:49:49.287-03	2025-08-18 16:49:49.287-03	\N
53	2	\N	6	4	5	óculos  (4/5)	110.00	2025-11-10	\N	pendente	f	f	\N	2025-08-18 16:49:49.291-03	2025-08-18 16:49:49.291-03	\N
54	2	\N	6	5	5	óculos  (5/5)	110.00	2025-12-10	\N	pendente	f	f	\N	2025-08-18 16:49:49.294-03	2025-08-18 16:49:49.295-03	\N
61	2	\N	6	2	2	Farmácia Isabelle (2/2)	108.33	2025-09-12	\N	pendente	f	f	\N	2025-08-18 16:53:28.341-03	2025-08-18 16:53:28.341-03	\N
81	2	\N	8	2	2	Farmacia (2/2)	107.50	2025-08-29	Isabelle	pendente	f	f	\N	2025-08-18 23:21:41.633-03	2025-08-18 23:21:41.633-03	\N
36	2	8	\N	1	1	India Mission	50.00	2025-08-25	\N	paga	t	f	2025-08-12 16:36:00-03	2025-08-18 16:35:54.936-03	2025-08-19 10:02:09.396-03	\N
38	2	8	\N	1	1	Ultragaz	58.82	2025-08-25	\N	paga	f	f	2025-08-19 19:26:00-03	2025-08-18 16:41:01.686-03	2025-08-19 00:23:04.539-03	\N
40	2	8	\N	1	1	Neo Energia	368.51	2025-08-28	\N	paga	f	f	2025-08-28 19:42:00-03	2025-08-18 16:42:23.517-03	2025-08-28 00:01:00.028-03	\N
39	2	8	\N	1	1	caesb	182.85	2025-08-31	\N	paga	f	f	2025-08-29 19:41:00-03	2025-08-18 16:41:58.278-03	2025-08-29 00:01:00.035-03	\N
64	2	8	\N	1	1	India Mission	50.00	2025-09-25	\N	paga	t	f	2025-09-02 00:00:00-03	2025-08-18 21:01:00.057-03	2025-09-02 00:01:00.027-03	\N
80	2	\N	8	1	2	Farmacia (1/2)	107.50	2025-07-29	Isabelle	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:21:41.614-03	2025-09-13 00:46:48.712-03	\N
65	2	\N	8	1	1	Paypal Trae	18.27	2025-08-17	Internet	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:13:18.883-03	2025-09-13 00:46:48.712-03	\N
66	2	\N	8	1	1	zinco varejista	9.90	2025-08-12	Luciana	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:14:31.277-03	2025-09-13 00:46:48.712-03	\N
68	2	\N	8	1	1	pamonha	18.00	2025-08-04	alimentação	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:15:19.932-03	2025-09-13 00:46:48.713-03	\N
69	2	\N	8	1	1	creche	20.00	2025-08-03	doação	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:15:46.46-03	2025-09-13 00:46:48.713-03	\N
70	2	\N	8	1	1	Padaria	9.63	2025-08-02	alimentação	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:16:06.233-03	2025-09-13 00:46:48.713-03	\N
71	2	\N	8	1	1	Estacionamente	18.00	2025-08-02	Ronie	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:16:31.797-03	2025-09-13 00:46:48.713-03	\N
72	2	\N	8	1	1	Chama Grill	175.85	2025-08-02	alimentação	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:16:57.167-03	2025-09-13 00:46:48.713-03	\N
73	2	\N	8	1	1	Padaria	21.17	2025-08-01	\N	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:17:20.36-03	2025-09-13 00:46:48.713-03	\N
74	2	\N	8	1	1	hering 	119.99	2025-08-01	Presentes	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:17:42.248-03	2025-09-13 00:46:48.713-03	\N
75	2	\N	8	1	1	Abastecimento	100.00	2025-08-01	transporte	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:18:56.088-03	2025-09-13 00:46:48.714-03	\N
78	2	\N	8	1	1	Minerinho	15.00	2025-07-30	mercado	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:20:11.245-03	2025-09-13 00:46:48.715-03	\N
82	2	\N	8	1	1	Pão de Açucar	52.90	2025-07-29	Mercado	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:22:20.14-03	2025-09-13 00:46:48.715-03	\N
83	2	\N	8	1	1	Geriva	5.00	2025-07-29	alimentação	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:22:40.123-03	2025-09-13 00:46:48.715-03	\N
84	2	\N	8	1	1	BellaVia	10.43	2025-07-29	Mercado	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:23:13.243-03	2025-09-13 00:46:48.715-03	\N
86	2	\N	8	1	1	Zinco varejista	54.00	2025-08-06	Luciana	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:25:18.133-03	2025-09-13 00:46:48.715-03	\N
87	2	\N	8	1	1	Queijos II	57.00	2025-08-04	Mercado	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:26:55.079-03	2025-09-13 00:46:48.715-03	\N
77	2	\N	8	1	1	Mercado livre	24.92	2025-07-30	Internet	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:19:49.294-03	2025-09-13 00:46:48.716-03	\N
94	2	\N	6	1	1	Bellavia	14.02	2025-08-16	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:37:04.673-03	2025-09-15 15:28:08.231-03	\N
41	2	\N	6	1	9	Seguro tiggo (1/9)	174.85	2025-08-17	\N	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 16:48:16.054-03	2025-09-15 15:28:08.231-03	\N
50	2	\N	6	1	5	óculos  (1/5)	110.00	2025-08-10	\N	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 16:49:49.267-03	2025-09-15 15:28:08.231-03	\N
56	2	\N	6	1	1	Implante Luciana	566.66	2025-08-09	\N	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 16:51:21.846-03	2025-09-15 15:28:08.231-03	\N
57	2	\N	6	1	1	Perfume You	88.58	2025-08-09	\N	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 16:51:40.012-03	2025-09-15 15:28:08.231-03	\N
58	2	\N	6	1	1	Hotel caldas novas	535.34	2025-08-08	\N	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 16:52:06.089-03	2025-09-15 15:28:08.231-03	\N
59	2	\N	6	1	1	C&A	80.00	2025-08-09	vestuário	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 16:52:30.631-03	2025-09-15 15:28:08.231-03	\N
60	2	\N	6	1	2	Farmácia Isabelle (1/2)	108.33	2025-08-12	\N	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 16:53:28.322-03	2025-09-15 15:28:08.231-03	\N
89	2	\N	6	1	1	metrô	5.50	2025-08-17	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:34:36.415-03	2025-09-15 15:28:08.231-03	\N
90	2	\N	6	1	1	Bella Joias	63.92	2025-08-17	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:35:07.455-03	2025-09-15 15:28:08.232-03	\N
91	2	\N	6	1	1	armarinho	6.00	2025-08-17	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:35:39.889-03	2025-09-15 15:28:08.232-03	\N
92	2	\N	6	1	1	Metro	5.50	2025-08-17	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:36:02.912-03	2025-09-15 15:28:08.232-03	\N
93	2	\N	6	1	1	Hollywood Pães	9.29	2025-08-16	Padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:36:34.623-03	2025-09-15 15:28:08.232-03	\N
96	2	\N	6	1	1	Bellavia	38.98	2025-08-16	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:37:49.206-03	2025-09-15 15:28:08.232-03	\N
97	2	\N	6	1	1	café do flávio	36.00	2025-08-16	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:38:05.843-03	2025-09-15 15:28:08.232-03	\N
100	2	\N	6	1	1	Line Bakery	13.11	2025-08-16	\N	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:39:10.95-03	2025-09-15 15:28:08.232-03	\N
101	2	\N	6	1	1	drogasil	59.99	2025-08-15	farmácia	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:39:58.74-03	2025-09-15 15:28:08.232-03	\N
102	2	\N	6	1	1	Drogasil	22.99	2025-08-15	Farmácia	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:40:38.807-03	2025-09-15 15:28:08.232-03	\N
163	2	8	\N	1	1	teste	0.15	2025-08-20	\N	paga	f	f	2025-08-20 00:00:00-03	2025-08-19 13:46:46.116-03	2025-08-20 00:01:00.029-03	\N
160	2	8	\N	1	1	Tosa Patrick	170.00	2025-08-26	\N	paga	f	f	2025-08-26 00:00:00-03	2025-08-19 13:24:02.608-03	2025-08-22 08:14:52.685-03	\N
106	2	\N	6	1	1	hollywood 	10.27	2025-08-15	padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:42:48.543-03	2025-09-15 15:28:08.232-03	\N
108	2	\N	6	1	1	dia a dia	222.63	2025-08-14	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:43:30.939-03	2025-09-15 15:28:08.232-03	\N
109	2	\N	6	1	1	Padaria	10.69	2025-08-14	padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:43:49.99-03	2025-09-15 15:28:08.232-03	\N
110	2	\N	6	1	1	bellavia	5.99	2025-08-14	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:44:10.747-03	2025-09-15 15:28:08.232-03	\N
112	2	\N	6	1	1	salão	40.00	2025-08-14	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:45:06.192-03	2025-09-15 15:28:08.233-03	\N
113	2	\N	6	1	1	Gasolina	119.80	2025-08-14	transporte	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:45:36.931-03	2025-09-15 15:28:08.233-03	\N
115	2	\N	6	1	1	shoppe	36.61	2025-08-13	Internet	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:46:22.083-03	2025-09-15 15:28:08.233-03	\N
116	2	\N	6	1	1	idm águas claras	28.98	2025-08-13	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:47:21.823-03	2025-09-15 15:28:08.233-03	\N
117	2	\N	6	1	1	Padaria	12.13	2025-08-13	padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:47:44.825-03	2025-09-15 15:28:08.233-03	\N
118	2	\N	6	1	1	bellavia	21.51	2025-08-13	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:48:08.58-03	2025-09-15 15:28:08.233-03	\N
119	2	\N	6	1	1	Rodrigo Frutas	12.00	2025-08-13	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:48:33.28-03	2025-09-15 15:28:08.233-03	\N
120	2	\N	6	1	1	Minerinho	30.00	2025-08-13	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:48:52.121-03	2025-09-15 15:28:08.233-03	\N
121	2	\N	6	1	1	shoppe	111.72	2025-08-12	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:49:12.369-03	2025-09-15 15:28:08.233-03	\N
122	2	\N	6	1	1	bellavia	40.29	2025-08-12	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:49:33.719-03	2025-09-15 15:28:08.233-03	\N
123	2	\N	6	1	1	Dunkin donuts	39.90	2025-08-12	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:49:58.589-03	2025-09-15 15:28:08.233-03	\N
125	2	\N	6	1	1	amazon	48.97	2025-08-11	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:50:55.947-03	2025-09-15 15:28:08.233-03	\N
126	2	\N	6	1	1	Padaria	11.96	2025-08-11	Padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:51:17.243-03	2025-09-15 15:28:08.233-03	\N
127	2	\N	6	1	1	biomundo	10.07	2025-08-11	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:51:37.453-03	2025-09-15 15:28:08.233-03	\N
128	2	\N	6	1	1	bellavia	9.84	2025-08-11	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:51:56.618-03	2025-09-15 15:28:08.233-03	\N
129	2	\N	6	1	1	quiosque	30.98	2025-08-11	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:52:17.264-03	2025-09-15 15:28:08.233-03	\N
130	2	\N	6	1	1	metro	3.80	2025-08-11	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:52:41.924-03	2025-09-15 15:28:08.233-03	\N
131	2	\N	6	1	1	C&A	59.99	2025-08-11	Presentes	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:53:03.859-03	2025-09-15 15:28:08.233-03	\N
132	2	\N	6	1	1	fada doceira	3.50	2025-08-11	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:53:19.262-03	2025-09-15 15:28:08.234-03	\N
134	2	\N	6	1	1	bellavia	6.56	2025-08-10	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:54:04.391-03	2025-09-15 15:28:08.234-03	\N
135	2	\N	6	1	1	Padaria	17.85	2025-08-10	padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:54:30.086-03	2025-09-15 15:28:08.234-03	\N
136	2	\N	6	1	1	quiosque	25.39	2025-08-10	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:54:58.275-03	2025-09-15 15:28:08.234-03	\N
137	2	\N	6	1	1	estacionamento	5.00	2025-08-10	transporte	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:55:25.874-03	2025-09-15 15:28:08.234-03	\N
138	2	\N	6	1	1	drogaria	8.99	2025-08-09	Farmácia	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:55:49.613-03	2025-09-15 15:28:08.234-03	\N
139	2	\N	6	1	1	Padaria	11.05	2025-08-09	\N	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:56:03.162-03	2025-09-15 15:28:08.234-03	\N
140	2	\N	6	1	1	rosário	83.66	2025-08-09	Farmácia	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:56:39.491-03	2025-09-15 15:28:08.235-03	\N
141	2	\N	6	1	1	Padaria	8.63	2025-08-08	padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:57:02.68-03	2025-09-15 15:28:08.235-03	\N
142	2	\N	6	1	1	frutela	47.00	2025-08-08	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:57:19.735-03	2025-09-15 15:28:08.235-03	\N
143	2	\N	6	1	1	fuji	26.26	2025-08-08	farmácia	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:57:44.631-03	2025-09-15 15:28:08.235-03	\N
144	2	\N	6	1	1	drogaria SP	12.99	2025-08-08	Farmácia	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:58:16.05-03	2025-09-15 15:28:08.235-03	\N
148	2	\N	6	2	2	C&A (2/2)	45.00	2025-09-07	Presentes	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 00:00:31.17-03	2025-09-15 15:28:08.235-03	\N
145	2	\N	6	1	1	barbearia	40.00	2025-08-09	beleza	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:58:49.092-03	2025-09-15 15:28:08.235-03	\N
146	2	\N	6	1	1	Padaria	45.78	2025-08-09	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:59:11.203-03	2025-09-15 15:28:08.235-03	\N
147	2	\N	6	1	2	C&A (1/2)	45.00	2025-08-09	Presentes	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 00:00:31.16-03	2025-09-15 15:28:08.235-03	\N
150	2	\N	6	1	1	bellavia	32.69	2025-08-09	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 00:01:02.091-03	2025-09-15 15:28:08.235-03	\N
151	2	\N	6	1	1	metro	5.50	2025-08-09	transporte	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 00:01:28.105-03	2025-09-15 15:28:08.235-03	\N
152	2	\N	6	1	1	biscoitos	14.00	2025-08-09	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 00:01:50.197-03	2025-09-15 15:28:08.235-03	\N
153	2	\N	6	1	1	estacionamento	5.00	2025-08-14	transporte	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 00:11:25.378-03	2025-09-15 15:28:08.235-03	\N
166	2	\N	6	1	1	transporte	5.50	2025-08-19	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 23:49:32.936-03	2025-09-15 15:28:08.235-03	\N
159	2	\N	6	1	1	Burger King	37.90	2025-08-18	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 13:18:08.638-03	2025-09-15 15:28:08.235-03	\N
168	2	\N	6	1	1	americanas	9.99	2025-08-19	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 23:50:27.652-03	2025-09-15 15:28:08.235-03	\N
169	2	\N	6	1	1	Padaria	9.44	2025-08-19	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 23:50:44.023-03	2025-09-15 15:28:08.235-03	\N
170	2	\N	6	1	1	Padaria	7.49	2025-08-19	\N	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 23:50:54.712-03	2025-09-15 15:28:08.235-03	\N
171	2	\N	6	1	1	BellaVia	20.17	2025-08-19	mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 23:51:26.342-03	2025-09-15 15:28:08.236-03	\N
172	2	\N	6	1	1	Padaria	28.02	2025-08-19	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 23:51:45.031-03	2025-09-15 15:28:08.236-03	\N
173	2	\N	6	1	1	uber	19.93	2025-08-19	transporte	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 23:52:27.828-03	2025-09-15 15:28:08.236-03	\N
175	2	\N	6	1	1	uber	17.92	2025-08-20	transporte	paga	f	f	2025-09-14 21:00:00-03	2025-08-20 11:49:23.668-03	2025-09-15 15:28:08.236-03	\N
176	2	\N	6	1	1	mane mercado 	76.72	2025-08-20	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-20 14:38:24.857-03	2025-09-15 15:28:08.236-03	\N
178	2	\N	6	1	1	Padaria	9.08	2025-08-20	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-20 17:07:12.546-03	2025-09-15 15:28:08.236-03	\N
177	2	\N	6	1	1	perfume ML	129.00	2025-08-20	Ronie 	paga	f	f	2025-09-14 21:00:00-03	2025-08-20 15:43:40.75-03	2025-09-15 15:28:08.236-03	\N
180	2	\N	6	1	1	Metrô	5.50	2025-08-20	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-21 09:27:28.049-03	2025-09-15 15:28:08.236-03	\N
181	2	\N	6	1	1	Oba 	87.84	2025-08-21	mercado 	paga	f	f	2025-09-14 21:00:00-03	2025-08-21 11:00:41.842-03	2025-09-15 15:28:08.236-03	\N
183	2	\N	6	1	1	Mineirinho	15.00	2025-08-21	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-21 14:10:18.317-03	2025-09-15 15:28:08.236-03	\N
184	2	\N	6	1	1	Bonnapan	28.54	2025-08-21	Padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-21 19:20:34.678-03	2025-09-15 15:28:08.236-03	\N
174	2	8	\N	1	1	Ração	308.55	2025-09-16	\N	paga	f	f	2025-09-16 00:00:00-03	2025-08-20 11:47:07.879-03	2025-09-16 00:01:00.03-03	\N
35	2	8	\N	1	1	Cartão BRB	104.30	2025-08-25	\N	paga	t	f	2025-08-25 19:34:00-03	2025-08-18 16:34:48.761-03	2025-08-25 09:11:44.938-03	\N
208	2	8	\N	1	1	Inas	1473.40	2025-08-29	Saúde	paga	f	f	2025-08-26 00:00:00-03	2025-08-25 13:44:58.211-03	2025-08-26 00:01:00.017-03	\N
235	2	\N	8	1	1	Frutas	10.00	2025-08-28	Mercado	pendente	f	f	\N	2025-08-28 18:35:04.58-03	2025-08-28 18:35:04.581-03	\N
236	2	\N	8	1	1	Minerinho	16.12	2025-08-28	Mercado	pendente	f	f	\N	2025-08-28 18:35:44.681-03	2025-08-28 18:35:44.681-03	\N
240	2	\N	8	1	1	casa reparos 	44.90	2025-08-29	\N	pendente	f	f	\N	2025-08-29 10:50:45.372-03	2025-08-29 10:50:45.373-03	\N
241	2	\N	8	1	1	lepain rustic	16.10	2025-08-29	padaria 	pendente	f	f	\N	2025-08-29 13:04:01.274-03	2025-08-29 13:04:01.274-03	\N
242	2	\N	8	1	1	pizza II	30.00	2025-08-29	alimentação	pendente	f	f	\N	2025-08-29 15:35:51.773-03	2025-08-29 15:35:51.773-03	\N
245	2	\N	8	1	1	Mercado livre	24.90	2025-08-30	Internet	pendente	t	f	\N	2025-08-30 17:39:30.57-03	2025-08-30 17:39:30.571-03	\N
246	2	\N	8	1	1	Dunkin donuts	14.00	2025-08-30	Alimentação	pendente	f	f	\N	2025-08-30 17:40:03.407-03	2025-08-30 17:40:03.408-03	\N
248	2	\N	8	1	1	Reikocandies	14.40	2025-08-30	Alimentação	pendente	f	f	\N	2025-08-31 10:30:37.621-03	2025-08-31 10:30:37.621-03	\N
249	2	\N	8	1	1	Espertinho do jamal	25.00	2025-08-30	Alimentação	pendente	f	f	\N	2025-08-31 10:31:29.896-03	2025-08-31 10:31:29.896-03	\N
250	2	\N	8	1	1	Coke	8.00	2025-08-30	Alimentação	pendente	f	f	\N	2025-08-31 10:31:50.833-03	2025-08-31 10:31:50.834-03	\N
251	2	\N	8	1	1	combustível 	150.00	2025-08-31	transporte 	pendente	f	f	\N	2025-08-31 17:39:23.715-03	2025-08-31 17:39:23.715-03	\N
215	2	7	\N	1	1	church	960.00	2025-09-10	\N	paga	f	f	2025-09-10 00:00:00-03	2025-08-25 18:42:51.087-03	2025-09-12 21:01:00.069-03	\N
220	2	7	\N	1	1	Financiamento Imobiliário	1460.70	2025-09-09	\N	paga	f	f	2025-09-09 00:00:00-03	2025-08-25 18:52:31.376-03	2025-09-12 21:01:00.076-03	\N
213	2	8	\N	1	1	condomínio	1600.00	2025-09-10	\N	paga	f	f	2025-09-10 00:00:00-03	2025-08-25 18:41:18.068-03	2025-09-13 00:45:13.917-03	\N
187	2	\N	8	1	1	farmácia 	8.99	2025-08-21	Luciana 	paga	f	f	2025-09-04 21:00:00-03	2025-08-21 22:46:12.202-03	2025-09-13 00:46:48.716-03	\N
252	2	\N	8	1	1	burger King 	50.80	2025-08-31	Alimentação 	pendente	f	f	\N	2025-09-01 10:10:48.752-03	2025-09-01 10:10:48.752-03	\N
253	2	\N	6	1	1	festival koreano	22.00	2025-10-31	presentes	pendente	f	f	\N	2025-09-01 15:05:24.489-03	2025-09-01 15:05:24.489-03	\N
191	2	\N	6	1	1	Padaria	11.87	2025-08-22	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-08-22 20:17:44.115-03	2025-09-15 15:28:08.236-03	\N
193	2	\N	6	1	1	Bellavia	18.57	2025-08-22	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-22 20:19:04.618-03	2025-09-15 15:28:08.236-03	\N
195	2	\N	6	1	1	Miami festas	24.77	2025-08-22	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-22 20:20:16.166-03	2025-09-15 15:28:08.236-03	\N
196	2	\N	6	1	1	bellavia 	7.98	2025-08-22	mercado 	paga	f	f	2025-09-14 21:00:00-03	2025-08-22 22:47:43.336-03	2025-09-15 15:28:08.236-03	\N
197	2	\N	6	1	1	dunkin donuts	20.60	2025-08-23	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-23 09:14:22.667-03	2025-09-15 15:28:08.237-03	\N
198	2	\N	6	1	1	Alpinus	34.99	2025-08-23	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-23 14:59:53.015-03	2025-09-15 15:28:08.237-03	\N
199	2	\N	6	1	1	TakeandGo refri	1.43	2025-08-23	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-23 15:00:50.36-03	2025-09-15 15:28:08.237-03	\N
200	2	\N	6	1	1	takeango refri	1.26	2025-08-23	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-23 15:01:16.467-03	2025-09-15 15:28:08.237-03	\N
202	2	\N	6	1	1	padaria 	10.05	2025-08-23	Padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-23 20:05:16.466-03	2025-09-15 15:28:08.237-03	\N
203	2	\N	6	1	1	bellavia 	58.07	2025-08-23	mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-23 20:47:06.005-03	2025-09-15 15:28:08.237-03	\N
204	2	\N	6	1	1	McDonald's 	31.90	2025-08-23	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-23 20:47:58.031-03	2025-09-15 15:28:08.237-03	\N
205	2	\N	6	1	1	Madero	58.00	2025-08-23	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-23 20:48:55.405-03	2025-09-15 15:28:08.237-03	\N
206	2	\N	6	1	1	Pão dourado	7.38	2025-08-24	Padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-24 18:41:43.396-03	2025-09-15 15:28:08.237-03	\N
209	2	\N	6	1	1	line Bakery	10.50	2025-08-25	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-25 17:58:37.793-03	2025-09-15 15:28:08.237-03	\N
210	2	\N	6	1	1	Hollywood paes	11.08	2025-08-25	Padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-25 17:59:11.441-03	2025-09-15 15:28:08.237-03	\N
221	2	\N	6	1	1	shopee	15.30	2025-08-25	Isabelle 	paga	f	f	2025-09-14 21:00:00-03	2025-08-25 23:05:21.201-03	2025-09-15 15:28:08.237-03	\N
222	2	\N	6	1	1	Line bakery	3.11	2025-08-26	Padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-26 11:57:00.14-03	2025-09-15 15:28:08.237-03	\N
223	2	\N	6	1	1	Padaria	12.47	2025-08-26	Padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-26 19:06:55.821-03	2025-09-15 15:28:08.237-03	\N
224	2	\N	6	1	1	Farmácia	17.99	2025-08-26	Farmácia	paga	f	f	2025-09-14 21:00:00-03	2025-08-26 19:07:19.001-03	2025-09-15 15:28:08.237-03	\N
225	2	\N	6	1	1	OBA	8.99	2025-08-26	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-26 19:07:47.401-03	2025-09-15 15:28:08.237-03	\N
226	2	\N	6	1	1	Dia a Dia	181.37	2025-08-26	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-26 21:35:24.977-03	2025-09-15 15:28:08.237-03	\N
227	2	\N	6	1	1	Armarinho	17.90	2025-08-26	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-26 23:33:11.722-03	2025-09-15 15:28:08.237-03	\N
229	2	\N	6	1	1	line Bakery	8.55	2025-08-27	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-27 13:54:25.226-03	2025-09-15 15:28:08.238-03	\N
230	2	\N	6	1	1	bella Via 	33.82	2025-08-27	mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-27 18:17:47.082-03	2025-09-15 15:28:08.238-03	\N
231	2	\N	6	1	1	pão dourado 	18.62	2025-08-27	padaria 	paga	f	f	2025-09-14 21:00:00-03	2025-08-27 22:39:56.148-03	2025-09-15 15:28:08.238-03	\N
234	2	\N	6	1	1	Life Insurance	292.03	2025-08-28	Seguro	paga	f	f	2025-09-14 21:00:00-03	2025-08-28 09:38:48.572-03	2025-09-15 15:28:08.239-03	\N
237	2	\N	6	1	1	Farmácia	11.29	2025-08-28	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-28 18:37:07.736-03	2025-09-15 15:28:08.239-03	\N
238	2	\N	6	1	1	Padaria	29.77	2025-08-28	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-08-28 18:37:54.888-03	2025-09-15 15:28:08.239-03	\N
243	2	\N	6	1	1	BellaVia	10.79	2025-08-29	Padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-29 17:58:57.916-03	2025-09-15 15:28:08.239-03	\N
244	2	\N	6	1	1	padaria 	12.13	2025-08-29	\N	paga	f	f	2025-09-14 21:00:00-03	2025-08-30 00:42:34.382-03	2025-09-15 15:28:08.239-03	\N
247	2	\N	6	1	1	Bellavia	39.24	2025-08-30	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-30 17:40:43.868-03	2025-09-15 15:28:08.239-03	\N
254	2	\N	6	1	1	festival koreano	12.00	2025-08-30	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-09-01 15:05:45.508-03	2025-09-15 15:28:08.239-03	\N
255	2	\N	6	1	1	festival koreano	54.00	2025-08-30	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-09-01 15:06:00.72-03	2025-09-15 15:28:08.239-03	\N
256	2	\N	6	1	1	festival koreano	25.00	2025-08-30	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-09-01 15:06:18.233-03	2025-09-15 15:28:08.239-03	\N
257	2	\N	6	1	1	festival koreano	10.00	2025-08-30	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-09-01 15:06:34.454-03	2025-09-15 15:28:08.239-03	\N
216	2	8	\N	1	1	ultragaz	49.53	2025-09-20	\N	paga	f	f	2025-09-19 00:00:00-03	2025-08-25 18:43:31.651-03	2025-09-19 00:01:00.034-03	\N
262	2	\N	8	1	1	Pamonha	10.00	2025-09-01	alimentação	pendente	f	f	\N	2025-09-01 18:18:12.325-03	2025-09-01 18:18:12.325-03	\N
63	2	8	\N	1	1	faculdade Isabelle	1768.48	2025-09-10	\N	paga	t	f	2025-09-12 21:01:00.039-03	2025-08-18 21:01:00.048-03	2025-09-12 21:01:00.039-03	\N
211	2	7	\N	1	1	net+claro	272.89	2025-09-09	\N	paga	f	t	2025-09-09 00:00:00-03	2025-08-25 18:38:31.997-03	2025-09-12 21:01:00.053-03	\N
268	2	8	\N	1	1	faculdade Isabelle	1768.48	2025-10-10	\N	pendente	t	f	\N	2025-09-12 21:01:00.094-03	2025-09-12 21:01:00.094-03	\N
67	2	\N	8	1	1	Le Pain Rustique	13.86	2025-08-05	alimentação	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:15:00.099-03	2025-09-13 00:46:48.712-03	\N
76	2	\N	8	1	1	Line Bakery	16.00	2025-07-31	alimentação	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:19:19.657-03	2025-09-13 00:46:48.715-03	\N
85	2	\N	8	1	1	Line Bakery	7.00	2025-08-06	alimentação	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:24:52.479-03	2025-09-13 00:46:48.715-03	\N
79	2	\N	8	1	1	Cobasi	248.80	2025-07-30	Pet	paga	f	f	2025-09-04 21:00:00-03	2025-08-18 23:20:27.632-03	2025-09-13 00:46:48.716-03	\N
158	2	\N	8	1	1	vinhos	60.92	2025-08-18	\N	paga	f	f	2025-09-04 21:00:00-03	2025-08-19 11:25:50.845-03	2025-09-13 00:46:48.716-03	\N
182	2	\N	8	1	1	bella Via 	25.65	2025-08-21	Mercado	paga	f	f	2025-09-04 21:00:00-03	2025-08-21 13:37:53.568-03	2025-09-13 00:46:48.716-03	\N
286	2	\N	8	1	1	bomba lanche	13.99	2025-09-03	alimentação	pendente	f	f	\N	2025-09-13 01:08:27.129-03	2025-09-13 01:08:27.13-03	\N
287	2	\N	8	1	1	leroy melin	56.37	2025-09-03	casa	pendente	f	f	\N	2025-09-13 01:08:52.741-03	2025-09-13 01:08:52.741-03	\N
288	2	\N	8	1	1	café	22.50	2025-09-03	alimentação	pendente	f	f	\N	2025-09-13 01:09:13.987-03	2025-09-13 01:09:13.987-03	\N
289	2	\N	8	1	1	assai atacadista	130.76	2025-09-03	Mercado	pendente	f	f	\N	2025-09-13 01:09:34.982-03	2025-09-13 01:09:34.982-03	\N
290	2	\N	8	1	1	le pain rustique	16.10	2025-09-05	Padaria	pendente	f	f	\N	2025-09-13 01:10:23.882-03	2025-09-13 01:10:23.882-03	\N
291	2	\N	8	1	1	line bakery	9.00	2025-09-05	alimentação	pendente	f	f	\N	2025-09-13 01:10:43.132-03	2025-09-13 01:10:43.132-03	\N
292	2	\N	8	1	1	alpinus	29.90	2025-09-06	alimentação	pendente	f	f	\N	2025-09-13 01:10:59.193-03	2025-09-13 01:10:59.194-03	\N
218	2	8	\N	1	1	Neo Energia	411.18	2025-09-28	\N	paga	f	f	2025-09-26 00:00:00-03	2025-08-25 18:47:47.309-03	2025-10-04 16:17:01.679-03	\N
217	2	8	\N	1	1	Inas	741.11	2025-09-29	\N	paga	f	f	2025-09-29 00:00:00-03	2025-08-25 18:44:14.974-03	2025-10-04 16:17:06.814-03	\N
219	2	8	\N	1	1	caesb	178.98	2025-09-30	\N	paga	f	f	2025-09-30 00:00:00-03	2025-08-25 18:48:34.813-03	2025-10-04 16:17:12.265-03	\N
214	2	8	\N	1	1	Tosa Patrick	170.00	2025-10-11	Pet	pendente	f	f	2025-10-11 00:00:00-03	2025-08-25 18:42:03.807-03	2025-10-04 16:17:56.314-03	\N
267	2	8	\N	1	1	India Mission	50.00	2025-10-25	\N	paga	t	f	2025-10-03 00:00:00-03	2025-09-02 00:01:00.04-03	2025-10-04 16:34:06.962-03	\N
293	2	\N	8	1	1	Padaria	1.00	2025-09-06	alimentação	pendente	f	f	\N	2025-09-13 01:11:10.457-03	2025-09-13 01:11:10.457-03	\N
294	2	\N	8	1	1	drogaria	20.59	2025-09-06	farmacia	pendente	f	f	\N	2025-09-13 01:11:39.58-03	2025-09-13 01:11:39.58-03	\N
295	2	\N	8	1	1	amazon	125.10	2025-09-07	Internet	pendente	f	f	\N	2025-09-13 01:11:56.282-03	2025-09-13 01:11:56.282-03	\N
296	2	\N	8	1	1	Padaria	12.43	2025-09-07	Padaria	pendente	f	f	\N	2025-09-13 01:12:15.123-03	2025-09-13 01:12:15.123-03	\N
297	2	\N	6	1	1	hollywood paes	12.35	2025-09-12	Isabelle	pendente	f	f	\N	2025-09-13 01:25:01.637-03	2025-09-13 01:25:01.637-03	\N
298	2	\N	6	1	1	droga fuji	26.98	2025-09-12	Isabelle	pendente	f	f	\N	2025-09-13 01:25:24.698-03	2025-09-13 01:25:24.698-03	\N
299	2	\N	6	1	1	Dia a Dia	313.87	2025-09-12	Isabelle	pendente	f	f	\N	2025-09-13 01:25:40.139-03	2025-09-13 01:25:40.139-03	\N
300	2	\N	6	1	1	Padaria	15.69	2025-09-12	Padaria	pendente	f	f	\N	2025-09-13 01:26:01.337-03	2025-09-13 01:26:01.337-03	\N
301	2	\N	6	1	1	le pan rustique	9.90	2025-09-12	\N	pendente	f	f	\N	2025-09-13 01:26:19.878-03	2025-09-13 01:26:19.878-03	\N
302	2	\N	6	1	1	Padaria	12.40	2025-09-12	\N	pendente	f	f	\N	2025-09-13 01:26:32.949-03	2025-09-13 01:26:32.949-03	\N
303	2	\N	6	1	1	bellavia	11.15	2025-09-12	Mercado	pendente	f	f	\N	2025-09-13 01:26:50.483-03	2025-09-13 01:26:50.483-03	\N
304	2	\N	6	1	1	disquinhos	59.00	2025-09-10	Mercado	pendente	f	f	\N	2025-09-13 01:27:57.714-03	2025-09-13 01:27:57.714-03	\N
305	2	\N	6	1	1	seara	56.60	2025-09-10	Mercado	pendente	f	f	\N	2025-09-13 01:28:20.216-03	2025-09-13 01:28:20.216-03	\N
306	2	\N	6	1	1	oba	93.04	2025-09-10	Mercado	pendente	f	f	\N	2025-09-13 01:28:38.807-03	2025-09-13 01:28:38.807-03	\N
307	2	\N	6	1	1	macdonald	23.00	2025-09-09	Luciana	pendente	f	f	\N	2025-09-13 01:29:02.304-03	2025-09-13 01:29:02.304-03	\N
309	2	\N	6	1	1	drogaria	59.99	2025-09-09	Luciana	pendente	f	f	\N	2025-09-13 01:29:38.748-03	2025-09-13 01:29:38.749-03	\N
310	2	\N	6	1	1	Macdnald	40.00	2025-09-09	Isabelle	pendente	f	f	\N	2025-09-13 01:30:19.292-03	2025-09-13 01:30:19.292-03	\N
311	2	\N	6	1	1	marisa	122.98	2025-09-09	Luciana	pendente	f	f	\N	2025-09-13 01:30:35.034-03	2025-09-13 01:30:35.034-03	\N
312	2	\N	6	1	1	volta a natureza	165.44	2025-09-09	remedios	pendente	f	f	\N	2025-09-13 01:31:33.908-03	2025-09-13 01:31:33.909-03	\N
313	2	\N	6	1	1	creche	20.00	2025-09-09	\N	pendente	f	f	\N	2025-09-13 01:31:47.748-03	2025-09-13 01:31:47.749-03	\N
314	2	\N	6	1	1	line	14.00	2025-09-09	alimentação	pendente	f	f	\N	2025-09-13 01:32:14.086-03	2025-09-13 01:32:14.086-03	\N
315	2	\N	6	1	1	drogaria	11.99	2025-09-09	\N	pendente	f	f	\N	2025-09-13 01:32:33.14-03	2025-09-13 01:32:33.14-03	\N
316	2	\N	6	1	2	volta a natureza (1/2)	129.00	2025-09-08	remedios	pendente	f	f	\N	2025-09-13 01:33:07.995-03	2025-09-13 01:33:07.995-03	\N
317	2	\N	6	2	2	volta a natureza (2/2)	129.00	2025-10-08	remedios	pendente	f	f	\N	2025-09-13 01:33:08-03	2025-09-13 01:33:08.001-03	\N
318	2	\N	6	1	1	bellavia	29.20	2025-09-08	Mercado	pendente	f	f	\N	2025-09-13 01:33:46.907-03	2025-09-13 01:33:46.907-03	\N
319	2	\N	6	1	1	pamonha	5.00	2025-09-08	alimentação	pendente	f	f	\N	2025-09-13 01:34:07.577-03	2025-09-13 01:34:07.578-03	\N
259	2	\N	6	1	1	brb mobilidade	3.80	2025-09-01	transporte	paga	f	f	2025-09-14 21:00:00-03	2025-09-01 15:07:29.274-03	2025-09-15 15:28:08.239-03	\N
261	2	\N	6	1	1	BellaVia	46.70	2025-08-31	mercado	paga	f	f	2025-09-14 21:00:00-03	2025-09-01 15:08:20.14-03	2025-09-15 15:28:08.239-03	\N
265	2	\N	6	1	1	mimos do lar	20.00	2025-09-01	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-09-01 22:05:03.028-03	2025-09-15 15:28:08.239-03	\N
269	2	\N	6	1	1	ATACADAO DIA A DIA	181.43	2025-09-02	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 00:57:55.599-03	2025-09-15 15:28:08.24-03	\N
270	2	\N	6	1	1	HOLLYWOOD PAES	10.82	2025-09-02	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 00:58:27.016-03	2025-09-15 15:28:08.24-03	\N
271	2	\N	6	1	1	BELLAVIA SUPERMERCADO	12.98	2025-09-02	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 00:58:51.221-03	2025-09-15 15:28:08.24-03	\N
272	2	\N	6	1	1	HOLLYWOOD PAES	12.13	2025-09-04	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 00:59:18.798-03	2025-09-15 15:28:08.24-03	\N
274	2	\N	6	1	1	BELLAVIA 	10.55	2025-09-05	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 01:00:16.077-03	2025-09-15 15:28:08.24-03	\N
275	2	\N	6	1	1	HOLLYWOOD	12.44	2025-09-05	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 01:00:44.418-03	2025-09-15 15:28:08.24-03	\N
276	2	\N	6	1	1	HOLLYWOOD	7.45	2025-09-05	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 01:01:07.256-03	2025-09-15 15:28:08.24-03	\N
277	2	\N	6	1	1	uber	11.97	2025-09-07	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 01:01:25.828-03	2025-09-15 15:28:08.24-03	\N
278	2	\N	6	1	1	BELLAVIA	33.48	2025-09-07	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 01:01:48.495-03	2025-09-15 15:28:08.24-03	\N
279	2	\N	6	1	1	uber	5.97	2025-09-02	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 01:02:10.142-03	2025-09-15 15:28:08.24-03	\N
280	2	\N	6	1	1	SEARA ALIMENTOS	13.90	2025-09-05	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 01:02:28.772-03	2025-09-15 15:28:08.24-03	\N
281	2	\N	6	1	1	BONNAPAN	19.34	2025-09-03	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 01:02:51.732-03	2025-09-15 15:28:08.24-03	\N
282	2	\N	6	1	1	SUPREMA PAPELARIA	11.60	2025-09-05	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 01:03:11.732-03	2025-09-15 15:28:08.24-03	\N
283	2	\N	6	1	1	uber	15.98	2025-09-06	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 01:03:29.052-03	2025-09-15 15:28:08.24-03	\N
284	2	\N	6	1	1	BELLAVIA 	82.84	2025-09-06	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 01:03:54.866-03	2025-09-15 15:28:08.241-03	\N
322	2	\N	8	1	1	Paypal Trae	58.60	2025-09-14	Internet	pendente	f	f	\N	2025-09-15 15:00:02.118-03	2025-09-15 15:17:09.235-03	\N
29	2	\N	6	1	1	atelie	30.00	2025-08-17	\N	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 16:23:44.367-03	2025-09-15 15:28:08.231-03	\N
55	2	\N	6	1	1	Curso Isabelle	75.83	2025-08-13	Educação	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 16:50:42.359-03	2025-09-15 15:28:08.231-03	\N
88	2	\N	6	1	1	Padaria	13.44	2025-08-17	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:34:08.471-03	2025-09-15 15:28:08.231-03	\N
95	2	\N	6	1	1	Take	3.30	2025-08-16	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:37:29.481-03	2025-09-15 15:28:08.232-03	\N
98	2	\N	6	1	1	Le Pain	15.80	2025-08-16	Padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:38:31.784-03	2025-09-15 15:28:08.232-03	\N
99	2	\N	6	1	1	assai 	155.70	2025-08-16	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:38:53.498-03	2025-09-15 15:28:08.232-03	\N
103	2	\N	6	1	1	Mané mercado	168.89	2025-08-15	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:41:02.333-03	2025-09-15 15:28:08.232-03	\N
104	2	\N	6	1	1	Galpão 17	19.90	2025-08-15	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:41:29.584-03	2025-09-15 15:28:08.232-03	\N
105	2	\N	6	1	1	cobasi	121.90	2025-08-15	Pet	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:41:52.354-03	2025-09-15 15:28:08.232-03	\N
107	2	\N	6	1	1	dunkin donuts	25.00	2025-08-15	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:43:07.58-03	2025-09-15 15:28:08.232-03	\N
111	2	\N	6	1	1	A mundial	15.49	2025-08-14	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:44:42.033-03	2025-09-15 15:28:08.233-03	\N
114	2	\N	6	1	1	burger king	29.90	2025-08-13	alimentação	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:45:58.626-03	2025-09-15 15:28:08.233-03	\N
124	2	\N	6	1	1	line bakery	5.54	2025-08-12	padaria	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:50:33.883-03	2025-09-15 15:28:08.233-03	\N
133	2	\N	6	1	1	uber	12.98	2025-08-11	transporte	paga	f	f	2025-09-14 21:00:00-03	2025-08-18 23:53:46.04-03	2025-09-15 15:28:08.234-03	\N
149	2	\N	6	1	1	Padaria	9.00	2025-08-09	\N	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 00:00:43.54-03	2025-09-15 15:28:08.235-03	\N
167	2	\N	6	1	1	enxoval joão vinicius	29.99	2025-08-19	Presentes	paga	f	f	2025-09-14 21:00:00-03	2025-08-19 23:50:07.302-03	2025-09-15 15:28:08.235-03	\N
179	2	\N	6	1	1	bellvia	23.58	2025-08-20	mercado 	paga	f	f	2025-09-14 21:00:00-03	2025-08-20 18:51:11.894-03	2025-09-15 15:28:08.236-03	\N
185	2	\N	6	1	1	Farmacia	4.99	2025-08-21	isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-08-21 19:23:01.225-03	2025-09-15 15:28:08.236-03	\N
186	2	\N	6	1	1	Bellavia	15.23	2025-08-21	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-08-21 19:26:16.719-03	2025-09-15 15:28:08.236-03	\N
188	2	\N	6	1	1	uber	17.92	2025-08-22	Luciana 	paga	f	f	2025-09-14 21:00:00-03	2025-08-22 09:00:02.463-03	2025-09-15 15:28:08.236-03	\N
189	2	\N	6	1	1	gasolina 	150.00	2025-08-22	transporte 	paga	f	f	2025-09-14 21:00:00-03	2025-08-22 10:15:16.449-03	2025-09-15 15:28:08.236-03	\N
190	2	\N	6	1	1	lava jato 	50.00	2025-08-22	transporte 	paga	f	f	2025-09-14 21:00:00-03	2025-08-22 11:00:42.268-03	2025-09-15 15:28:08.236-03	\N
194	2	\N	6	1	1	metrô	5.50	2025-08-22	transporte	paga	f	f	2025-09-14 21:00:00-03	2025-08-22 20:19:36.452-03	2025-09-15 15:28:08.236-03	\N
201	2	\N	6	1	1	bolo do Flávio 	50.00	2025-08-23	Luciana 	paga	f	f	2025-09-14 21:00:00-03	2025-08-23 20:04:15.096-03	2025-09-15 15:28:08.237-03	\N
228	2	\N	6	1	1	Bellavia	33.70	2025-08-25	Marcado	paga	f	f	2025-09-14 21:00:00-03	2025-08-26 23:34:29.502-03	2025-09-15 15:28:08.238-03	\N
239	2	\N	6	1	1	Farmácia 	27.99	2025-08-28	Luciana 	paga	f	f	2025-09-14 21:00:00-03	2025-08-29 08:43:09.315-03	2025-09-15 15:28:08.239-03	\N
258	2	\N	6	1	1	hollywood paes	8.32	2025-08-30	Padaria	paga	f	f	2025-09-14 21:00:00-03	2025-09-01 15:06:58.424-03	2025-09-15 15:28:08.239-03	\N
260	2	\N	6	1	1	padaria	13.53	2025-08-31	Padaria	paga	f	f	2025-09-14 21:00:00-03	2025-09-01 15:08:02.716-03	2025-09-15 15:28:08.239-03	\N
263	2	\N	6	1	1	hollywood paes	11.08	2025-09-01	Padaria	paga	f	f	2025-09-14 21:00:00-03	2025-09-01 22:03:44.658-03	2025-09-15 15:28:08.239-03	\N
264	2	\N	6	1	1	bellavia	17.03	2025-09-01	Mercado	paga	f	f	2025-09-14 21:00:00-03	2025-09-01 22:04:23.772-03	2025-09-15 15:28:08.239-03	\N
266	2	\N	6	1	1	ipe verde	21.00	2025-09-01	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-09-01 22:05:23.699-03	2025-09-15 15:28:08.239-03	\N
273	2	\N	6	1	1	PROPARK ESTACIONAMEN	5.00	2025-09-05	Isabelle	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 00:59:53.079-03	2025-09-15 15:28:08.24-03	\N
285	2	\N	6	1	1	bellavia	22.11	2025-09-01	Luciana	paga	f	f	2025-09-14 21:00:00-03	2025-09-13 01:06:14.574-03	2025-09-15 15:28:08.241-03	\N
324	2	\N	6	1	1	hollywood paes	9.77	2025-09-14	Padaria	pendente	f	f	\N	2025-09-15 15:33:03.764-03	2025-09-15 15:33:03.764-03	\N
325	2	\N	6	1	1	Drogaria Distrital	109.37	2025-09-14	Isabelle	pendente	f	f	\N	2025-09-15 15:33:29.502-03	2025-09-15 15:33:29.502-03	\N
326	2	\N	6	1	1	Auto posto	100.00	2025-09-14	transporte	pendente	f	f	\N	2025-09-15 15:34:44.336-03	2025-09-15 15:34:44.337-03	\N
327	2	\N	6	1	1	hollywood paes	6.31	2025-09-13	Padaria	pendente	f	f	\N	2025-09-15 15:35:06.587-03	2025-09-15 15:35:06.588-03	\N
328	2	\N	6	1	1	BellaVia	28.01	2025-09-13	mercado	pendente	f	f	\N	2025-09-15 15:35:23.526-03	2025-09-15 15:35:23.526-03	\N
329	2	\N	6	1	1	estacionamento	18.00	2025-09-13	transporte	pendente	f	f	\N	2025-09-15 15:42:44.456-03	2025-09-15 15:42:44.456-03	\N
330	2	\N	6	1	1	Starbucks	27.80	2025-09-13	alimentação	pendente	f	f	\N	2025-09-15 15:43:31.425-03	2025-09-15 15:43:31.425-03	\N
331	2	\N	6	1	1	cosmeticos	47.79	2025-09-13	Isabelle	pendente	f	f	\N	2025-09-15 15:43:54.06-03	2025-09-15 15:43:54.06-03	\N
332	2	\N	6	1	1	lindt chocolates	38.49	2025-09-13	presentes	pendente	f	f	\N	2025-09-15 15:46:29.501-03	2025-09-15 15:46:29.502-03	\N
333	2	\N	6	1	1	milano	99.90	2025-09-13	presentes	pendente	f	f	\N	2025-09-15 15:46:54.833-03	2025-09-15 15:46:54.833-03	\N
334	2	\N	6	1	1	atlantico restaurante	34.80	2025-09-13	alimentação	pendente	f	f	\N	2025-09-15 15:47:26.258-03	2025-09-15 15:47:26.259-03	\N
335	2	\N	6	1	1	Droga Fuji	12.99	2025-09-15	Isabelle	pendente	f	f	\N	2025-09-15 17:33:09.275-03	2025-09-15 17:33:09.275-03	\N
336	2	\N	6	1	1	Padaria	9.46	2025-09-15	Padaria	pendente	f	f	\N	2025-09-15 18:05:39.291-03	2025-09-15 18:05:39.291-03	\N
337	2	\N	6	1	3	rede de proteção  (1/3)	199.50	2025-09-16	manutenção 	pendente	f	f	\N	2025-09-16 10:10:25.985-03	2025-09-16 10:10:25.986-03	\N
338	2	\N	6	2	3	rede de proteção  (2/3)	199.50	2025-10-16	manutenção 	pendente	f	f	\N	2025-09-16 10:10:25.995-03	2025-09-16 10:10:25.995-03	\N
339	2	\N	6	3	3	rede de proteção  (3/3)	199.50	2025-11-16	manutenção 	pendente	f	f	\N	2025-09-16 10:10:25.999-03	2025-09-16 10:10:25.999-03	\N
340	2	\N	6	1	1	Padaria	11.17	2025-09-16	alimentação	pendente	f	f	\N	2025-09-16 13:26:14.293-03	2025-09-16 13:26:14.294-03	\N
341	2	\N	6	1	1	monstro bebidas	12.42	2025-09-16	alimentação	pendente	f	f	\N	2025-09-16 15:36:52.124-03	2025-09-16 15:36:52.124-03	\N
342	2	\N	6	1	1	line bakery	9.00	2025-09-16	alimentação	pendente	f	f	\N	2025-09-17 07:44:52.482-03	2025-09-17 07:44:52.483-03	\N
343	2	\N	6	1	1	hollywood paes	12.94	2025-09-16	padaria	pendente	f	f	\N	2025-09-17 07:45:19.965-03	2025-09-17 07:45:19.965-03	\N
344	2	\N	6	1	1	cell city	15.00	2025-09-16	Luciana	pendente	f	f	\N	2025-09-17 07:45:59.995-03	2025-09-17 07:45:59.995-03	\N
345	2	\N	6	1	1	bellavia	24.02	2025-09-16	Mercado	pendente	f	f	\N	2025-09-17 07:46:30.298-03	2025-09-17 07:46:30.298-03	\N
346	2	\N	6	1	1	metrô	3.80	2025-09-17	luciana	pendente	f	f	\N	2025-09-17 10:49:08.257-03	2025-09-17 10:49:08.257-03	\N
347	2	\N	6	1	1	quiosque do gaúcho 	33.60	2025-09-17	alimentação	pendente	f	f	\N	2025-09-17 13:37:33.375-03	2025-09-17 13:37:33.375-03	\N
348	2	\N	6	1	1	imd águas claras 	10.98	2025-09-17	Luciana 	pendente	f	f	\N	2025-09-17 13:39:27.749-03	2025-09-17 13:40:02.03-03	\N
349	2	\N	6	1	1	rosário 	63.61	2025-09-17	Luciana 	pendente	f	f	\N	2025-09-17 13:41:13.869-03	2025-09-17 13:41:13.87-03	\N
323	2	\N	6	1	1	DFU	3.35	2025-09-15	Luciana	pendente	f	f	\N	2025-09-15 15:32:40.333-03	2025-09-17 21:40:23.559-03	\N
350	2	\N	6	1	1	droga fuji	16.99	2025-09-15	Isabelle	pendente	f	f	\N	2025-09-17 21:41:38.128-03	2025-09-17 21:41:38.129-03	\N
351	2	\N	6	1	1	bolo do flávio	24.00	2025-09-17	Luciana	pendente	f	f	\N	2025-09-17 21:42:01.36-03	2025-09-17 21:42:01.36-03	\N
352	2	\N	6	1	1	hollywood paes	16.84	2025-09-17	Padaria	pendente	f	f	\N	2025-09-17 21:42:20.59-03	2025-09-17 21:42:20.59-03	\N
354	2	\N	6	1	1	uber	52.69	2025-09-17	Isabelle	pendente	f	f	\N	2025-09-18 10:38:10.286-03	2025-09-18 10:42:02.703-03	\N
355	2	\N	6	1	1	Frutas Rodrigo	13.00	2025-09-18	mercado	pendente	f	f	\N	2025-09-18 13:53:45.425-03	2025-09-18 13:53:45.426-03	\N
356	2	\N	6	1	1	minerinho	9.35	2025-09-18	mercado	pendente	f	f	\N	2025-09-18 13:54:08.932-03	2025-09-18 13:54:08.933-03	\N
357	2	\N	6	1	1	BellaVia	20.47	2025-09-18	mercado	pendente	f	f	\N	2025-09-18 18:17:13.999-03	2025-09-18 18:17:13.999-03	\N
358	2	\N	6	1	1	Padaria	8.54	2025-09-18	Padaria	pendente	f	f	\N	2025-09-18 18:17:28.939-03	2025-09-18 18:17:28.94-03	\N
359	2	\N	6	1	1	uber	11.98	2025-09-19	Isabelle	pendente	f	f	\N	2025-09-19 09:33:35.197-03	2025-09-19 09:33:35.198-03	\N
360	2	\N	6	1	1	espaço da beleza 	6.99	2025-09-19	Luciana	pendente	f	f	\N	2025-09-19 19:21:22.801-03	2025-09-19 19:21:22.801-03	\N
361	2	\N	6	1	1	Hollywood paes	4.62	2025-09-19	Luciana	pendente	f	f	\N	2025-09-19 19:22:39.234-03	2025-09-19 19:22:39.234-03	\N
362	2	\N	6	1	1	Hop Capital cafe	6.00	2025-09-19	Ronie 	pendente	f	f	\N	2025-09-19 19:23:21.471-03	2025-09-19 19:23:21.471-03	\N
363	2	\N	6	1	1	bellavia 	9.09	2025-09-19	Isabelle 	pendente	f	f	\N	2025-09-19 19:24:04.331-03	2025-09-19 19:24:51.767-03	\N
364	2	\N	6	1	1	dia a dia 	129.46	2025-09-19	mercado 	pendente	f	f	\N	2025-09-19 19:25:32.919-03	2025-09-19 19:25:32.919-03	\N
365	2	\N	6	1	1	barbeiro	40.00	2025-09-19	Ronie	pendente	f	f	\N	2025-09-19 21:15:07.069-03	2025-09-19 21:15:07.069-03	\N
366	2	\N	6	1	1	A bonita studio	40.00	2025-09-19	Luciana	pendente	f	f	\N	2025-09-19 21:17:12.674-03	2025-09-19 21:17:12.674-03	\N
367	2	\N	6	1	1	Drogaria distrital	27.99	2025-09-19	Luciana	pendente	f	f	\N	2025-09-19 21:18:26.858-03	2025-09-19 21:18:26.858-03	\N
368	2	\N	6	1	1	the coffe	45.50	2025-09-20	alimentação	pendente	f	f	\N	2025-09-20 10:50:09.038-03	2025-09-20 10:50:09.039-03	\N
369	2	\N	6	1	1	espaço da beleza	26.97	2025-09-20	Isabelle	pendente	f	f	\N	2025-09-20 10:50:35.169-03	2025-09-20 10:50:35.169-03	\N
370	2	\N	6	1	1	MacDonald's	10.90	2025-09-20	alimentação	pendente	f	f	\N	2025-09-20 17:44:58.902-03	2025-09-20 17:44:58.903-03	\N
371	2	\N	6	1	1	MacDonald's	79.60	2025-09-20	alimentação	pendente	f	f	\N	2025-09-20 17:45:08.592-03	2025-09-20 17:45:08.593-03	\N
372	2	\N	6	1	1	Cia Toy	140.00	2025-09-20	Presentes	pendente	f	f	\N	2025-09-20 17:45:23.432-03	2025-09-20 17:45:23.432-03	\N
353	2	\N	6	1	1	c&A 2/2	89.99	2025-09-17	Luciana	pendente	f	f	\N	2025-09-17 21:49:43.099-03	2025-09-20 18:39:51.758-03	\N
373	2	\N	6	1	1	hollywood paes	9.62	2025-09-09	Isabelle	pendente	f	f	\N	2025-09-20 18:40:59.334-03	2025-09-20 18:40:59.334-03	\N
374	2	\N	6	1	1	Spoleto	64.90	2025-09-20	Alimentação	pendente	f	f	\N	2025-09-21 00:35:51.229-03	2025-09-21 00:35:51.229-03	\N
376	2	\N	6	1	1	Milano	99.90	2025-09-20	Presente dani	pendente	f	f	\N	2025-09-21 00:36:53.427-03	2025-09-21 00:36:53.427-03	\N
377	2	\N	6	1	1	Hollywood	6.09	2025-09-20	Padaria	pendente	f	f	\N	2025-09-21 00:37:40.576-03	2025-09-21 00:37:40.577-03	\N
375	2	\N	6	1	1	Xiang	33.79	2025-09-20	Alimentação	pendente	f	f	\N	2025-09-21 00:36:20.244-03	2025-09-21 00:37:56.944-03	\N
378	2	\N	6	1	1	Americanas	10.98	2025-09-20	Luciana	pendente	f	f	\N	2025-09-21 11:44:28.09-03	2025-09-21 11:44:28.091-03	\N
379	2	\N	6	1	1	bellavia 	49.47	2025-09-21	Isabelle 	pendente	f	f	\N	2025-09-21 12:54:17.222-03	2025-09-21 12:54:17.222-03	\N
380	2	\N	6	1	1	pão dourado 	4.68	2025-09-21	padaria 	pendente	f	f	\N	2025-09-22 08:59:26.53-03	2025-09-22 08:59:26.531-03	\N
381	2	\N	6	1	1	Hollywood 	14.00	2025-09-22	Luciana l	pendente	f	f	\N	2025-09-22 09:40:34.238-03	2025-09-22 09:40:34.239-03	\N
382	2	\N	6	1	1	BellaVia	12.14	2025-09-22	Isabelle	pendente	f	f	\N	2025-09-22 18:13:10.808-03	2025-09-22 18:13:10.808-03	\N
383	2	\N	6	1	1	hollywood paes	9.68	2025-09-22	Padaria	pendente	f	f	\N	2025-09-22 18:13:26.441-03	2025-09-22 18:13:26.441-03	\N
384	2	\N	6	1	1	bellavia 	14.01	2025-09-23	Isabelle 	pendente	f	f	\N	2025-09-23 15:17:25.77-03	2025-09-23 15:17:25.771-03	\N
385	2	\N	6	1	1	Hollywood 	25.11	2025-09-23	padaria 	pendente	f	f	\N	2025-09-23 21:45:54.74-03	2025-09-23 21:45:54.74-03	\N
386	2	\N	6	1	1	gasolina 	100.00	2025-09-23	transporte 	pendente	f	f	\N	2025-09-23 21:46:51.71-03	2025-09-23 21:46:51.71-03	\N
388	2	\N	6	1	1	estacionamento 	5.00	2025-09-24	Isabelle 	pendente	f	f	\N	2025-09-24 12:31:52.885-03	2025-09-24 12:31:52.885-03	\N
389	2	\N	6	1	1	BellaVia	20.52	2025-09-24	Isabelle	pendente	f	f	\N	2025-09-24 13:57:08.354-03	2025-09-24 13:57:08.355-03	\N
390	2	\N	6	1	1	Pamonha	10.00	2025-09-24	alimentação	pendente	f	f	\N	2025-09-24 16:17:22.332-03	2025-09-24 16:17:22.332-03	\N
391	2	\N	6	1	1	hollywood paes	11.94	2025-09-24	Padaria	pendente	f	f	\N	2025-09-24 18:41:05.733-03	2025-09-24 18:41:05.733-03	\N
207	2	8	\N	1	1	Cartão BRB	104.30	2025-09-25	\N	paga	t	f	2025-09-25 00:00:00-03	2025-08-25 12:01:00.044-03	2025-10-04 16:16:43.55-03	\N
392	2	\N	6	1	1	hollywood padaria	9.50	2025-09-24	Padaria	pendente	f	f	\N	2025-10-04 16:45:11.385-03	2025-10-04 16:45:11.385-03	\N
393	2	\N	6	1	1	Bellavia	56.80	2025-09-24	Mercado	pendente	f	f	\N	2025-10-04 16:45:41.514-03	2025-10-04 16:45:41.515-03	\N
394	2	\N	6	1	1	estacionamento	5.00	2025-09-25	Isabelle	pendente	f	f	\N	2025-10-04 16:46:02.172-03	2025-10-04 16:46:02.173-03	\N
395	2	\N	6	1	1	Rodrigo Frutas	13.00	2025-09-25	Mercado	pendente	f	f	\N	2025-10-04 16:46:25.153-03	2025-10-04 16:46:25.154-03	\N
396	2	\N	6	1	1	Minerinho	24.92	2025-10-25	Mercado	pendente	f	f	\N	2025-10-04 16:46:49.451-03	2025-10-04 16:46:49.451-03	\N
397	2	\N	6	1	1	Riachuelo	25.98	2025-09-25	Luciana	pendente	f	f	\N	2025-10-04 16:47:10.026-03	2025-10-04 16:47:10.026-03	\N
398	2	\N	6	1	1	hollywood padaria	8.45	2025-09-25	Padaria	pendente	f	f	\N	2025-10-04 16:47:29.706-03	2025-10-04 16:47:29.707-03	\N
399	2	\N	6	1	1	hollywood padaria	15.09	2025-09-25	Padaria	pendente	f	f	\N	2025-10-04 16:47:44.008-03	2025-10-04 16:47:44.008-03	\N
400	2	\N	6	1	1	Drogaria São Paulo	72.21	2025-09-26	Farmácia	pendente	f	f	\N	2025-10-04 16:48:24.474-03	2025-10-04 16:48:24.474-03	\N
401	2	\N	6	1	1	DrogaCenter	40.52	2025-09-26	Farmácia	pendente	f	f	\N	2025-10-04 16:48:59.939-03	2025-10-04 16:48:59.939-03	\N
402	2	\N	6	1	1	Dia a dia	196.44	2025-09-26	Mercado	pendente	f	f	\N	2025-10-04 16:49:23.923-03	2025-10-04 16:49:23.923-03	\N
403	2	\N	6	1	1	hollywood padaria	16.73	2025-09-26	Padaria	pendente	f	f	\N	2025-10-04 16:49:41.399-03	2025-10-04 16:49:41.399-03	\N
404	2	\N	6	1	1	Potiguar	207.53	2025-09-27	Alimentação	pendente	f	f	\N	2025-10-04 16:50:08.512-03	2025-10-04 16:50:08.512-03	\N
405	2	\N	6	1	1	Drogasil	37.19	2025-09-27	Isabelle	pendente	f	f	\N	2025-10-04 16:50:35.497-03	2025-10-04 16:50:35.497-03	\N
406	2	\N	6	1	1	Pão Dourado	9.31	2025-09-27	Padaria	pendente	f	f	\N	2025-10-04 16:51:01.402-03	2025-10-04 16:52:06.516-03	\N
407	2	\N	6	1	1	Oba	9.99	2025-09-27	Mercado	pendente	f	f	\N	2025-10-04 16:52:30.13-03	2025-10-04 16:52:30.13-03	\N
408	2	\N	6	1	1	Porto Seguro vida	292.03	2025-09-28	Seguro	pendente	t	f	\N	2025-10-04 16:53:08.533-03	2025-10-04 16:53:08.533-03	\N
409	2	\N	6	1	1	Droga Fuji	17.99	2025-09-28	Farmácia	pendente	f	f	\N	2025-10-04 17:05:28.108-03	2025-10-04 17:05:28.109-03	\N
410	2	\N	6	1	1	BellaVia	45.28	2025-09-28	Mercado	pendente	f	f	\N	2025-10-04 17:05:45.1-03	2025-10-04 17:05:59.827-03	\N
411	2	\N	6	1	1	Rosário	62.99	2025-09-28	Farmácia	pendente	f	f	\N	2025-10-04 17:06:24.774-03	2025-10-04 17:06:24.775-03	\N
412	2	\N	6	1	1	Pão Dourado	9.49	2025-09-28	Padaria	pendente	f	f	\N	2025-10-04 17:06:45.266-03	2025-10-04 17:06:45.267-03	\N
413	2	\N	6	1	1	distrital	9.98	2025-09-28	Farmácia	pendente	f	f	\N	2025-10-04 17:06:59.431-03	2025-10-04 17:06:59.432-03	\N
414	2	\N	6	1	1	estacionament	5.00	2025-09-29	Isabelle	pendente	f	f	\N	2025-10-04 17:07:15.781-03	2025-10-04 17:07:15.781-03	\N
415	2	\N	6	1	1	Monster	12.42	2025-09-29	Alimentação	pendente	f	f	\N	2025-10-04 17:07:57.683-03	2025-10-04 17:07:57.683-03	\N
416	2	\N	6	1	1	Bellavia	22.45	2025-09-29	Mercado	pendente	f	f	\N	2025-10-04 17:08:19.181-03	2025-10-04 17:08:19.181-03	\N
417	2	\N	6	1	1	hollywood padaria	10.77	2025-09-29	Padaria	pendente	f	f	\N	2025-10-04 17:08:37.198-03	2025-10-04 17:08:37.198-03	\N
418	2	\N	6	1	1	estacionamento	5.00	2025-09-30	Isabelle	pendente	f	f	\N	2025-10-04 17:08:57.893-03	2025-10-04 17:08:57.894-03	\N
419	2	\N	6	1	1	metro	5.50	2025-09-30	Luciana	pendente	f	f	\N	2025-10-04 17:09:14.589-03	2025-10-04 17:09:14.589-03	\N
420	2	\N	6	1	1	Big box	18.41	2025-09-30	Mercado	pendente	f	f	\N	2025-10-04 17:09:32.407-03	2025-10-04 17:09:32.407-03	\N
421	2	\N	6	1	1	metro	5.50	2025-09-30	Luciana	pendente	f	f	\N	2025-10-04 17:09:47.912-03	2025-10-04 17:09:47.913-03	\N
422	2	\N	6	1	1	hollywood padaria	11.08	2025-09-30	Padaria	pendente	f	f	\N	2025-10-04 17:10:03.192-03	2025-10-04 17:10:03.192-03	\N
423	2	\N	6	1	1	kmixshop	13.20	2025-10-01	Luciana	pendente	f	f	\N	2025-10-04 17:10:23.818-03	2025-10-04 17:10:23.818-03	\N
424	2	\N	6	1	1	estacionamento	5.00	2025-10-01	Isabelle	pendente	f	f	\N	2025-10-04 17:10:40.727-03	2025-10-04 17:10:40.727-03	\N
425	2	\N	6	1	1	Bellavia	22.29	2025-10-01	Mercado	pendente	f	f	\N	2025-10-04 17:11:03.192-03	2025-10-04 17:11:03.192-03	\N
426	2	\N	6	1	1	metro	3.80	2025-10-01	Luciana	pendente	f	f	\N	2025-10-04 17:11:25.587-03	2025-10-04 17:11:25.587-03	\N
427	2	\N	6	1	1	bonapan	15.06	2025-10-01	Padaria	pendente	f	f	\N	2025-10-04 17:11:45.176-03	2025-10-04 17:11:45.176-03	\N
428	2	\N	6	1	1	Drogasil	19.26	2025-10-01	Farmácia	pendente	f	f	\N	2025-10-04 17:12:00.331-03	2025-10-04 17:12:00.331-03	\N
429	2	\N	6	1	2	Volta a natureza (1/2)	139.49	2025-10-01	Farmácia	pendente	f	f	\N	2025-10-04 17:12:26.749-03	2025-10-04 17:12:26.75-03	\N
430	2	\N	6	2	2	Volta a natureza (2/2)	139.49	2025-11-01	Farmácia	pendente	f	f	\N	2025-10-04 17:12:26.753-03	2025-10-04 17:12:26.753-03	\N
431	2	\N	6	1	1	hollywood padaria	8.45	2025-10-02	Padaria	pendente	f	f	\N	2025-10-04 17:13:27.34-03	2025-10-04 17:13:27.34-03	\N
432	2	\N	6	1	1	bellavia	33.61	2025-10-02	Mercado	pendente	f	f	\N	2025-10-04 17:13:52.053-03	2025-10-04 17:13:52.053-03	\N
433	2	\N	6	1	1	C&A	89.99	2025-10-04	Isabelle	pendente	f	f	\N	2025-10-04 17:14:08.309-03	2025-10-04 17:14:08.309-03	\N
434	2	\N	6	1	1	plasticoweb	34.99	2025-10-02	Isabelle	pendente	f	f	\N	2025-10-04 17:15:08.742-03	2025-10-04 17:15:08.742-03	\N
435	2	\N	6	1	1	ajuste	33.27	2025-09-19	ajuste	pendente	f	f	\N	2025-10-04 17:16:02.413-03	2025-10-04 17:16:02.413-03	\N
436	2	\N	8	1	1	Drogaria sã paulo	19.59	2025-09-29	Farmácia	pendente	f	f	\N	2025-10-04 17:17:51.862-03	2025-10-04 17:17:51.862-03	\N
437	2	\N	8	1	1	Le pain rustique	16.10	2025-09-30	Padaria	pendente	f	f	\N	2025-10-04 17:18:12.723-03	2025-10-04 17:18:12.723-03	\N
438	2	\N	8	1	1	Mercado Livre	24.90	2025-09-30	Internet	pendente	t	f	\N	2025-10-04 17:18:39.966-03	2025-10-04 17:18:39.966-03	\N
439	2	\N	8	1	1	Bellavia	13.12	2025-09-30	Mercado	pendente	f	f	\N	2025-10-04 17:18:58.691-03	2025-10-04 17:18:58.691-03	\N
440	2	\N	8	1	1	Pamonha show	10.00	2025-10-01	alimentação	pendente	f	f	\N	2025-10-04 17:19:18.344-03	2025-10-04 17:19:18.344-03	\N
441	2	\N	8	1	1	Rest Esc MJ	26.01	2025-10-01	Alimentação	pendente	f	f	\N	2025-10-04 17:19:44.646-03	2025-10-04 17:19:44.647-03	\N
442	2	\N	8	1	1	Gasolina	150.00	2025-10-02	transporte	pendente	f	f	\N	2025-10-04 17:20:02.587-03	2025-10-04 17:20:02.587-03	\N
443	2	\N	8	1	1	Pão Dourado	31.34	2025-10-02	Padaria	pendente	f	f	\N	2025-10-04 17:20:34.575-03	2025-10-04 17:20:34.575-03	\N
444	2	\N	8	1	1	line bakery	7.00	2025-10-02	Padaria	pendente	f	f	\N	2025-10-04 17:20:51.868-03	2025-10-04 17:20:51.868-03	\N
445	2	\N	8	1	1	Minerinho	32.32	2025-10-03	Mercado	pendente	f	f	\N	2025-10-04 17:21:08.445-03	2025-10-04 17:21:08.445-03	\N
446	2	\N	8	1	1	Rodrigo Frutas	18.00	2025-10-03	Mercado	pendente	f	f	\N	2025-10-04 17:21:26.96-03	2025-10-04 17:21:26.96-03	\N
447	2	\N	8	1	1	Pão Dourado	9.58	2025-10-03	Padaria	pendente	f	f	\N	2025-10-04 17:21:42.126-03	2025-10-04 17:21:42.126-03	\N
448	2	\N	8	1	1	quitinete	6.00	2025-10-03	Alimentação	pendente	f	f	\N	2025-10-04 17:22:01.724-03	2025-10-04 17:22:01.724-03	\N
449	2	7	\N	1	1	Financiamento	1458.91	2025-10-09	Moradia	pendente	f	t	2025-10-09 00:00:00-03	2025-10-04 17:25:59.327-03	2025-10-04 17:25:59.328-03	\N
450	2	7	\N	1	1	Claro +cel+internet	261.37	2025-10-10	\N	pendente	f	t	2025-10-10 00:00:00-03	2025-10-04 17:26:42.69-03	2025-10-04 17:26:42.691-03	\N
451	2	8	\N	1	1	condomínio	1160.00	2025-10-10	\N	pendente	f	f	2025-10-10 00:00:00-03	2025-10-04 17:27:36.588-03	2025-10-04 17:27:36.588-03	\N
452	2	7	\N	1	1	Church	960.00	2025-10-05	\N	pendente	f	f	2025-10-05 00:00:00-03	2025-10-04 17:30:32.129-03	2025-10-04 17:30:32.13-03	\N
453	2	8	\N	1	1	ultragaz	50.00	2025-10-17	\N	pendente	f	f	\N	2025-10-04 17:31:01.378-03	2025-10-04 17:31:01.378-03	\N
454	2	8	\N	1	1	Neo Energia	400.00	2025-10-25	\N	pendente	f	f	\N	2025-10-04 17:31:34.592-03	2025-10-04 17:31:34.593-03	\N
455	2	8	\N	1	1	Inas	1000.00	2025-10-29	\N	pendente	f	f	\N	2025-10-04 17:32:04.619-03	2025-10-04 17:32:04.619-03	\N
456	2	8	\N	1	1	caesb	180.00	2025-10-31	\N	pendente	f	f	\N	2025-10-04 17:32:21.946-03	2025-10-04 17:32:21.946-03	\N
457	2	8	\N	1	1	India Mission	50.00	2025-11-25	\N	pendente	t	f	\N	2025-10-04 18:01:00.041-03	2025-10-04 18:01:00.041-03	\N
458	2	8	\N	1	1	Cartão BRB	104.30	2025-10-25	\N	pendente	t	f	\N	2025-10-04 18:01:00.046-03	2025-10-04 18:01:00.046-03	\N
459	2	\N	6	1	1	dunkin Donuts 	18.00	2025-10-04	Isabelle	pendente	f	f	\N	2025-10-04 19:42:14.182-03	2025-10-04 19:42:14.183-03	\N
460	2	\N	6	1	1	pão dourado 	12.77	2025-10-04	padaria 	pendente	f	f	\N	2025-10-04 22:59:51.975-03	2025-10-04 22:59:51.975-03	\N
461	2	\N	8	1	1	pizza 	52.40	2025-10-04	alimentação 	pendente	f	f	\N	2025-10-04 23:01:07.078-03	2025-10-04 23:01:07.078-03	\N
462	2	\N	8	1	1	Sam club 	334.43	2025-10-04	mercado 	pendente	f	f	\N	2025-10-04 23:01:55.991-03	2025-10-04 23:01:55.991-03	\N
\.


--
-- Data for Name: incomes; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.incomes (id, user_id, account_id, description, value, date, category, is_recurring, created_at, updated_at, posted) FROM stdin;
6	2	7	salario	14880.21	2025-08-05	salario	t	2025-08-18 15:10:16.163-03	2025-08-18 15:10:16.164-03	t
7	2	7	SVG	3000.00	2025-08-04		f	2025-08-18 15:10:27.703-03	2025-08-18 15:10:27.704-03	t
16	2	7	GDF	1551.73	2025-09-02	Salário	f	2025-08-29 13:43:06.772-03	2025-09-12 20:28:34.91-03	t
13	2	7	PCDF	13341.21	2025-09-03	Salário	f	2025-08-24 12:54:58.831-03	2025-09-12 20:28:43.989-03	t
15	2	7	SVG	1200.00	2025-09-02	Salário	f	2025-08-25 18:36:07.073-03	2025-09-13 01:15:29.39-03	t
17	2	7	GDF	1701.80	2025-10-02	Salário	f	2025-09-18 18:19:13.565-03	2025-10-04 17:24:00.17-03	t
20	2	7	SVG	1800.00	2025-10-02	Salário	f	2025-10-04 17:24:18.186-03	2025-10-04 17:24:18.187-03	t
21	2	7	PCDF	13341.21	2025-10-02	Salário	f	2025-10-04 17:24:40.415-03	2025-10-04 17:24:40.415-03	t
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.notifications (id, user_id, type, message, read, created_at, updated_at) FROM stdin;
1	5	security_password_change	Senha alterada em 2025-08-21T03:06:32.865Z (IP: ::ffff:172.22.0.4)	f	2025-08-21 00:06:32.865-03	2025-08-21 00:06:32.865-03
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.transfers (id, user_id, from_account_id, to_account_id, value, description, date, created_at, updated_at) FROM stdin;
4	2	7	8	12000.00		2025-08-05	2025-08-18 15:10:45.803-03	2025-08-18 15:11:02.302-03
5	2	7	8	2800.00		2025-08-11	2025-08-19 10:04:59.766-03	2025-08-19 10:04:59.767-03
6	2	7	8	46.62		2025-08-12	2025-08-19 23:48:05.936-03	2025-08-19 23:48:05.937-03
7	2	8	11	1491.29		2025-08-19	2025-08-20 11:54:11.306-03	2025-08-20 11:54:11.306-03
12	2	11	\N	50.00		2025-08-14	2025-08-20 12:48:54.899-03	2025-08-20 12:48:54.899-03
13	2	8	\N	2.50	vigia	2025-08-20	2025-08-20 17:07:37.132-03	2025-08-20 17:07:37.132-03
14	2	\N	9	0.15		2025-08-20	2025-08-20 18:50:02.126-03	2025-08-20 18:50:02.127-03
15	2	\N	8	175.00	Ajuste inicial	2025-08-21	2025-08-21 09:35:18.038-03	2025-08-21 09:35:18.039-03
16	2	9	11	59.85	Ajuste	2025-08-21	2025-08-21 09:37:30.119-03	2025-08-21 09:37:30.119-03
17	2	8	\N	10.00	açai	2025-08-22	2025-08-22 11:00:11.812-03	2025-08-22 11:00:11.813-03
18	2	\N	11	5960.00	ajuste 	2025-08-22	2025-08-22 21:29:18.302-03	2025-08-22 21:29:18.303-03
19	2	\N	9	7.00	Amiga Isabelle	2025-08-30	2025-08-30 17:38:29.078-03	2025-08-30 17:38:29.079-03
20	2	7	8	9000.00		2025-09-04	2025-09-12 20:30:29.848-03	2025-09-12 20:30:29.849-03
21	2	7	8	4398.00		2025-09-10	2025-09-13 01:16:10.726-03	2025-09-13 01:17:01.475-03
22	2	\N	8	69.68	ajuste	2025-09-10	2025-09-13 01:18:10.557-03	2025-09-13 01:18:10.558-03
23	2	9	\N	34.41	ajuste	2025-09-10	2025-09-13 01:19:34.43-03	2025-09-13 01:19:34.43-03
24	2	7	\N	2.50	picolé ibe	2025-09-13	2025-09-15 14:48:53.409-03	2025-09-15 14:48:53.409-03
25	2	9	\N	35.00	Luciana	2025-09-14	2025-09-15 14:50:48.563-03	2025-09-15 14:50:48.563-03
26	2	9	\N	90.00	Espetinhos feira de Missões	2025-09-13	2025-09-15 14:51:20.467-03	2025-09-15 14:51:20.467-03
27	2	9	\N	50.00	Feira de Missões	2025-09-13	2025-09-15 14:51:50.311-03	2025-09-15 14:51:50.311-03
28	2	\N	9	12.50	Daniel monster	2025-09-16	2025-09-16 17:13:54.916-03	2025-09-16 17:13:54.916-03
29	2	\N	9	20.00	Isabelle 	2025-09-17	2025-09-18 09:41:57.276-03	2025-09-18 09:41:57.277-03
30	2	\N	11	432.05	rendimentos	2025-09-18	2025-09-18 21:13:11.936-03	2025-09-18 21:13:11.937-03
31	2	\N	11	611.00	rendimentos	2025-09-20	2025-09-20 10:52:23.692-03	2025-09-20 10:52:23.692-03
32	2	8	11	33.20	reinvestimento 	2025-09-23	2025-09-23 15:15:38.883-03	2025-09-23 15:15:38.883-03
33	2	9	\N	15.00	Luciana	2025-10-28	2025-10-04 16:21:46.313-03	2025-10-04 16:21:46.313-03
34	2	\N	9	13.31	ajuste	2025-09-29	2025-10-04 16:23:46.71-03	2025-10-04 16:23:46.71-03
35	2	\N	8	100.00	yuri 	2025-09-30	2025-10-04 16:28:50.733-03	2025-10-04 16:28:50.733-03
36	2	\N	8	250.00	ricardo	2025-09-30	2025-10-04 16:29:15.068-03	2025-10-04 16:29:15.068-03
37	2	8	\N	500.00	Rodrigo Sião	2025-10-01	2025-10-04 16:30:00.969-03	2025-10-04 16:30:00.97-03
38	2	8	\N	40.00	william	2025-10-02	2025-10-04 16:33:14.318-03	2025-10-04 16:33:14.318-03
39	2	8	\N	10.00	ilton II	2025-10-03	2025-10-04 16:33:45.306-03	2025-10-04 16:33:45.306-03
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.users (id, name, email, password, role, created_at, updated_at, password_changed_at) FROM stdin;
2	ronieruas	ronieruas@gmail.com	$2b$10$/2oAtnwKTqeWDBn6/gfUB.1NxdL8E6IgJwONk37t4avNwc.RybAo.	admin	2025-08-17 01:42:40.272-03	2025-08-17 01:42:40.273-03	\N
3	ronie	ronie@ronieruas.com.br	$2b$10$KrAQapHFsoKCVbnojRyTlehZWJyPXSYjxdBc4eSIf4WmBvi4RrUhW	admin	2025-08-17 01:45:19.069-03	2025-08-17 01:45:19.069-03	\N
4	Default User	user@example.com	$2b$10$eitSo3niRZskMDxi1O9w3e9guUIWwxJBEf2IIhCbrke2zgk9ghjNK	admin	2025-08-18 14:15:14.618-03	2025-08-18 14:15:14.618-03	\N
5	Isabelle	isabelleruasferreira@gmail.com	$2b$10$8dA37uly/wRAYy8Fe.dPw.Q54GdI1XttSncs97GrSTFvDI4luHpbu	user	2025-08-20 22:56:01.954-03	2025-08-21 00:06:32.859-03	2025-08-21 00:06:32.858-03
6	Filipe Gouveia	lipegouveia@hotmail.com	$2b$10$wm9F9Jb7cPWSpV0kvNsw8.czOCJ7leYDDbXzsINrfCHaFbGn3Xraq	user	2025-08-28 17:24:49.229-03	2025-08-28 17:24:49.229-03	\N
\.


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.accounts_id_seq', 12, true);


--
-- Name: budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.budgets_id_seq', 10, true);


--
-- Name: credit_card_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.credit_card_payments_id_seq', 8, true);


--
-- Name: credit_cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.credit_cards_id_seq', 8, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.expenses_id_seq', 462, true);


--
-- Name: incomes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.incomes_id_seq', 21, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, true);


--
-- Name: transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.transfers_id_seq', 39, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);


--
-- Name: credit_card_payments credit_card_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.credit_card_payments
    ADD CONSTRAINT credit_card_payments_pkey PRIMARY KEY (id);


--
-- Name: credit_cards credit_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.credit_cards
    ADD CONSTRAINT credit_cards_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: incomes incomes_pkey; Type: CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.incomes
    ADD CONSTRAINT incomes_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: incomes_account_id; Type: INDEX; Schema: public; Owner: finance
--

CREATE INDEX incomes_account_id ON public.incomes USING btree (account_id);


--
-- Name: incomes_date; Type: INDEX; Schema: public; Owner: finance
--

CREATE INDEX incomes_date ON public.incomes USING btree (date);


--
-- Name: incomes_user_id; Type: INDEX; Schema: public; Owner: finance
--

CREATE INDEX incomes_user_id ON public.incomes USING btree (user_id);


--
-- Name: transfers_date; Type: INDEX; Schema: public; Owner: finance
--

CREATE INDEX transfers_date ON public.transfers USING btree (date);


--
-- Name: transfers_from_account_id; Type: INDEX; Schema: public; Owner: finance
--

CREATE INDEX transfers_from_account_id ON public.transfers USING btree (from_account_id);


--
-- Name: transfers_to_account_id; Type: INDEX; Schema: public; Owner: finance
--

CREATE INDEX transfers_to_account_id ON public.transfers USING btree (to_account_id);


--
-- Name: transfers_user_id; Type: INDEX; Schema: public; Owner: finance
--

CREATE INDEX transfers_user_id ON public.transfers USING btree (user_id);


--
-- Name: budgets budgets_credit_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_credit_card_id_fkey FOREIGN KEY (credit_card_id) REFERENCES public.credit_cards(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: budgets budgets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: credit_card_payments fk_credit_card_payments_account_id; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.credit_card_payments
    ADD CONSTRAINT fk_credit_card_payments_account_id FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: credit_card_payments fk_credit_card_payments_card_id; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.credit_card_payments
    ADD CONSTRAINT fk_credit_card_payments_card_id FOREIGN KEY (card_id) REFERENCES public.credit_cards(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: credit_card_payments fk_credit_card_payments_user_id; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.credit_card_payments
    ADD CONSTRAINT fk_credit_card_payments_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: incomes incomes_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.incomes
    ADD CONSTRAINT incomes_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: incomes incomes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.incomes
    ADD CONSTRAINT incomes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transfers transfers_from_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_from_account_id_fkey FOREIGN KEY (from_account_id) REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transfers transfers_to_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_to_account_id_fkey FOREIGN KEY (to_account_id) REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transfers transfers_to_account_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_to_account_id_fkey1 FOREIGN KEY (to_account_id) REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transfers transfers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: finance
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict bSQ8MNnU7wb1rk5B3YaIf6xxJuJpvgzB5jMKXmA6ddFvn2eT6aEFjPuIeFJJBNb

