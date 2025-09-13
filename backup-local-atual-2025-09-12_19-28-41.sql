--
-- PostgreSQL database dump
--

\restrict Bad9jwevw4q0ZGxvpjbCXKw3yNOHmHrfFbdTVQAj9jEH4uxQck0caRvbsepPmce

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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.accounts (id, user_id, name, bank, type, balance, status, currency, created_at, updated_at) FROM stdin;
10	2	Nomad	Nomad	investimento	218.00	ativa	USD	2025-08-18 23:45:00.418+00	2025-08-18 23:45:00.418+00
9	2	Nubank	Nubank	corrente	2263.52	ativa	BRL	2025-08-18 23:44:20.654+00	2025-08-30 20:38:29.068+00
12	6	teste 1	brb	corrente	0.00	ativa	BRL	2025-09-01 17:13:32.066+00	2025-09-01 17:13:32.066+00
8	2	C6	C6	corrente	-1134.71	ativa	BRL	2025-08-18 18:09:17.358+00	2025-09-12 03:01:00.048+00
11	2	C6 invest	C6	investimento	55811.14	ativa	BRL	2025-08-20 14:50:57.643+00	2025-09-12 03:01:00.062+00
7	2	BRB	BRB	corrente	-2690.45	ativa	BRL	2025-08-18 18:09:10.762+00	2025-09-12 03:01:00.073+00
\.


--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.budgets (id, user_id, name, type, credit_card_id, period_start, period_end, planned_value, created_at, updated_at) FROM stdin;
4	2	Agosto	geral	\N	2025-08-01	2025-08-31	13000.00	2025-08-18 19:43:47.756+00	2025-08-18 19:43:47.756+00
5	2	NUBANK	cartao	8	2025-07-28	2025-08-27	2000.00	2025-08-18 19:44:41.235+00	2025-08-18 19:44:41.235+00
6	2	C6	cartao	6	2025-08-08	2025-09-07	7000.00	2025-08-18 19:45:19.259+00	2025-08-18 19:45:19.259+00
7	2	Setembro	geral	\N	2025-09-01	2025-08-31	14000.00	2025-08-27 02:30:49.898+00	2025-08-27 02:30:49.898+00
\.


--
-- Data for Name: credit_card_payments; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.credit_card_payments (id, card_id, user_id, account_id, value, payment_date, is_full_payment, auto_debit, created_at, updated_at) FROM stdin;
4	6	2	8	8388.57	2025-08-18	t	f	2025-08-18 19:20:38.413+00	2025-08-18 19:20:38.414+00
6	8	2	8	259.49	2025-08-06	t	f	2025-08-18 19:28:54.952+00	2025-08-18 19:28:54.953+00
\.


--
-- Data for Name: credit_cards; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.credit_cards (id, user_id, bank, brand, limit_value, due_day, closing_day, name, status, debito_automatico, conta_debito_id, created_at, updated_at) FROM stdin;
6	2	C6	Mastercard	40000.00	15	8	C6	ativa	f	8	2025-08-18 18:11:56.416+00	2025-08-18 19:20:38.423+00
8	2	Nubank	Mastercard	17350.00	5	28	Nubank	ativa	f	8	2025-08-18 19:27:36.429+00	2025-08-18 19:28:54.96+00
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.expenses (id, user_id, account_id, credit_card_id, installment_number, installment_total, description, value, due_date, category, status, is_recurring, auto_debit, paid_at, created_at, updated_at) FROM stdin;
24	2	8	\N	1	1	condomínio	1600.00	2025-08-10	\N	paga	f	f	2025-08-11 21:11:00+00	2025-08-18 18:11:28.901+00	2025-08-18 18:11:28.902+00
27	2	\N	7	1	1	Padaria	50.00	2025-08-17	compras	paga	f	f	2025-08-18 00:00:00+00	2025-08-18 18:55:10.833+00	2025-08-18 18:55:31.022+00
28	2	\N	6	1	1	fatura inicial	8388.57	2025-07-31	\N	paga	f	f	2025-08-18 00:00:00+00	2025-08-18 19:20:06.204+00	2025-08-18 19:20:38.42+00
26	2	\N	7	1	1	fatura agosto	259.49	2025-07-24	\N	paga	f	f	2025-08-08 00:00:00+00	2025-08-18 18:52:44.168+00	2025-08-18 19:21:23.725+00
29	2	\N	6	1	1	atelie	30.00	2025-08-17	\N	pendente	f	f	\N	2025-08-18 19:23:44.367+00	2025-08-18 19:23:44.367+00
30	2	\N	8	1	1	fatura inicial	259.49	2025-07-24	\N	paga	f	f	2025-08-06 00:00:00+00	2025-08-18 19:28:34.228+00	2025-08-18 19:28:54.957+00
31	2	7	\N	1	1	Net+Claro	272.89	2025-08-09	\N	paga	f	f	2025-08-11 22:30:00+00	2025-08-18 19:30:21.88+00	2025-08-18 19:30:21.88+00
32	2	7	\N	1	1	Church	1300.00	2025-08-10	\N	paga	f	f	2025-08-10 22:32:00+00	2025-08-18 19:32:11.812+00	2025-08-18 19:32:11.812+00
33	2	7	\N	1	1	Financimento Imobiliário 	1460.70	2025-08-09	\N	paga	f	f	2025-08-11 22:33:00+00	2025-08-18 19:33:21.891+00	2025-08-18 19:33:21.891+00
34	2	8	\N	1	1	faculdade Isabelle	1768.48	2025-08-10	\N	paga	t	f	2025-08-11 22:33:00+00	2025-08-18 19:34:03.671+00	2025-08-18 19:34:03.671+00
94	2	\N	6	1	1	Bellavia	14.02	2025-08-16	Mercado	pendente	f	f	\N	2025-08-19 02:37:04.673+00	2025-08-21 12:29:09.233+00
80	2	\N	8	1	2	Farmacia (1/2)	107.50	2025-07-29	Isabelle	pendente	f	f	\N	2025-08-19 02:21:41.614+00	2025-08-19 02:21:41.614+00
41	2	\N	6	1	9	Seguro tiggo (1/9)	174.85	2025-08-17	\N	pendente	f	f	\N	2025-08-18 19:48:16.054+00	2025-08-18 19:48:16.054+00
42	2	\N	6	2	9	Seguro tiggo (2/9)	174.85	2025-09-17	\N	pendente	f	f	\N	2025-08-18 19:48:16.06+00	2025-08-18 19:48:16.06+00
43	2	\N	6	3	9	Seguro tiggo (3/9)	174.85	2025-10-17	\N	pendente	f	f	\N	2025-08-18 19:48:16.064+00	2025-08-18 19:48:16.064+00
44	2	\N	6	4	9	Seguro tiggo (4/9)	174.85	2025-11-17	\N	pendente	f	f	\N	2025-08-18 19:48:16.067+00	2025-08-18 19:48:16.067+00
45	2	\N	6	5	9	Seguro tiggo (5/9)	174.85	2025-12-17	\N	pendente	f	f	\N	2025-08-18 19:48:16.07+00	2025-08-18 19:48:16.07+00
46	2	\N	6	6	9	Seguro tiggo (6/9)	174.85	2026-01-17	\N	pendente	f	f	\N	2025-08-18 19:48:16.073+00	2025-08-18 19:48:16.073+00
47	2	\N	6	7	9	Seguro tiggo (7/9)	174.85	2026-02-17	\N	pendente	f	f	\N	2025-08-18 19:48:16.076+00	2025-08-18 19:48:16.076+00
48	2	\N	6	8	9	Seguro tiggo (8/9)	174.85	2026-03-17	\N	pendente	f	f	\N	2025-08-18 19:48:16.079+00	2025-08-18 19:48:16.079+00
49	2	\N	6	9	9	Seguro tiggo (9/9)	174.85	2026-04-17	\N	pendente	f	f	\N	2025-08-18 19:48:16.082+00	2025-08-18 19:48:16.082+00
50	2	\N	6	1	5	óculos  (1/5)	110.00	2025-08-10	\N	pendente	f	f	\N	2025-08-18 19:49:49.267+00	2025-08-18 19:49:49.267+00
51	2	\N	6	2	5	óculos  (2/5)	110.00	2025-09-10	\N	pendente	f	f	\N	2025-08-18 19:49:49.283+00	2025-08-18 19:49:49.283+00
52	2	\N	6	3	5	óculos  (3/5)	110.00	2025-10-10	\N	pendente	f	f	\N	2025-08-18 19:49:49.287+00	2025-08-18 19:49:49.287+00
53	2	\N	6	4	5	óculos  (4/5)	110.00	2025-11-10	\N	pendente	f	f	\N	2025-08-18 19:49:49.291+00	2025-08-18 19:49:49.291+00
54	2	\N	6	5	5	óculos  (5/5)	110.00	2025-12-10	\N	pendente	f	f	\N	2025-08-18 19:49:49.294+00	2025-08-18 19:49:49.295+00
55	2	\N	6	1	1	Curso Isabelle	75.83	2025-08-13	Educação	pendente	f	f	\N	2025-08-18 19:50:42.359+00	2025-08-18 19:50:42.359+00
56	2	\N	6	1	1	Implante Luciana	566.66	2025-08-09	\N	pendente	f	f	\N	2025-08-18 19:51:21.846+00	2025-08-18 19:51:21.846+00
57	2	\N	6	1	1	Perfume You	88.58	2025-08-09	\N	pendente	f	f	\N	2025-08-18 19:51:40.012+00	2025-08-18 19:51:40.012+00
58	2	\N	6	1	1	Hotel caldas novas	535.34	2025-08-08	\N	pendente	f	f	\N	2025-08-18 19:52:06.089+00	2025-08-18 19:52:06.089+00
59	2	\N	6	1	1	C&A	80.00	2025-08-09	vestuário	pendente	f	f	\N	2025-08-18 19:52:30.631+00	2025-08-18 19:52:30.631+00
60	2	\N	6	1	2	Farmácia Isabelle (1/2)	108.33	2025-08-12	\N	pendente	f	f	\N	2025-08-18 19:53:28.322+00	2025-08-18 19:53:28.322+00
61	2	\N	6	2	2	Farmácia Isabelle (2/2)	108.33	2025-09-12	\N	pendente	f	f	\N	2025-08-18 19:53:28.341+00	2025-08-18 19:53:28.341+00
81	2	\N	8	2	2	Farmacia (2/2)	107.50	2025-08-29	Isabelle	pendente	f	f	\N	2025-08-19 02:21:41.633+00	2025-08-19 02:21:41.633+00
36	2	8	\N	1	1	India Mission	50.00	2025-08-25	\N	paga	t	f	2025-08-12 19:36:00+00	2025-08-18 19:35:54.936+00	2025-08-19 13:02:09.396+00
65	2	\N	8	1	1	Paypal Trae	18.27	2025-08-17	Internet	pendente	f	f	\N	2025-08-19 02:13:18.883+00	2025-08-19 02:13:18.883+00
66	2	\N	8	1	1	zinco varejista	9.90	2025-08-12	Luciana	pendente	f	f	\N	2025-08-19 02:14:31.277+00	2025-08-19 02:14:31.278+00
67	2	\N	8	1	1	Le Pain Rustique	13.86	2025-08-05	alimentação	pendente	f	f	\N	2025-08-19 02:15:00.099+00	2025-08-19 02:15:00.099+00
68	2	\N	8	1	1	pamonha	18.00	2025-08-04	alimentação	pendente	f	f	\N	2025-08-19 02:15:19.932+00	2025-08-19 02:15:19.932+00
69	2	\N	8	1	1	creche	20.00	2025-08-03	doação	pendente	f	f	\N	2025-08-19 02:15:46.46+00	2025-08-19 02:15:46.461+00
70	2	\N	8	1	1	Padaria	9.63	2025-08-02	alimentação	pendente	f	f	\N	2025-08-19 02:16:06.233+00	2025-08-19 02:16:06.233+00
71	2	\N	8	1	1	Estacionamente	18.00	2025-08-02	Ronie	pendente	f	f	\N	2025-08-19 02:16:31.797+00	2025-08-19 02:16:31.797+00
72	2	\N	8	1	1	Chama Grill	175.85	2025-08-02	alimentação	pendente	f	f	\N	2025-08-19 02:16:57.167+00	2025-08-19 02:16:57.167+00
73	2	\N	8	1	1	Padaria	21.17	2025-08-01	\N	pendente	f	f	\N	2025-08-19 02:17:20.36+00	2025-08-19 02:17:20.36+00
74	2	\N	8	1	1	hering 	119.99	2025-08-01	Presentes	pendente	f	f	\N	2025-08-19 02:17:42.248+00	2025-08-19 02:18:01.615+00
75	2	\N	8	1	1	Abastecimento	100.00	2025-08-01	transporte	pendente	f	f	\N	2025-08-19 02:18:56.088+00	2025-08-19 02:18:56.088+00
76	2	\N	8	1	1	Line Bakery	16.00	2025-07-31	alimentação	pendente	f	f	\N	2025-08-19 02:19:19.657+00	2025-08-19 02:19:19.658+00
78	2	\N	8	1	1	Minerinho	15.00	2025-07-30	mercado	pendente	f	f	\N	2025-08-19 02:20:11.245+00	2025-08-19 02:20:11.245+00
82	2	\N	8	1	1	Pão de Açucar	52.90	2025-07-29	Mercado	pendente	f	f	\N	2025-08-19 02:22:20.14+00	2025-08-19 02:22:20.14+00
83	2	\N	8	1	1	Geriva	5.00	2025-07-29	alimentação	pendente	f	f	\N	2025-08-19 02:22:40.123+00	2025-08-19 02:22:40.123+00
84	2	\N	8	1	1	BellaVia	10.43	2025-07-29	Mercado	pendente	f	f	\N	2025-08-19 02:23:13.243+00	2025-08-19 02:23:13.243+00
85	2	\N	8	1	1	Line Bakery	7.00	2025-08-06	alimentação	pendente	f	f	\N	2025-08-19 02:24:52.479+00	2025-08-19 02:24:52.479+00
86	2	\N	8	1	1	Zinco varejista	54.00	2025-08-06	Luciana	pendente	f	f	\N	2025-08-19 02:25:18.133+00	2025-08-19 02:25:18.133+00
87	2	\N	8	1	1	Queijos II	57.00	2025-08-04	Mercado	pendente	f	f	\N	2025-08-19 02:26:55.079+00	2025-08-19 02:26:55.079+00
79	2	\N	8	1	1	Cobasi	248.80	2025-07-30	Pet	pendente	f	f	\N	2025-08-19 02:20:27.632+00	2025-08-19 02:27:47.525+00
77	2	\N	8	1	1	Mercado livre	24.92	2025-07-30	Internet	pendente	f	f	\N	2025-08-19 02:19:49.294+00	2025-08-19 02:29:31.542+00
88	2	\N	6	1	1	Padaria	13.44	2025-08-17	alimentação	pendente	f	f	\N	2025-08-19 02:34:08.471+00	2025-08-19 02:34:08.471+00
89	2	\N	6	1	1	metrô	5.50	2025-08-17	Luciana	pendente	f	f	\N	2025-08-19 02:34:36.415+00	2025-08-19 02:34:36.415+00
90	2	\N	6	1	1	Bella Joias	63.92	2025-08-17	Luciana	pendente	f	f	\N	2025-08-19 02:35:07.455+00	2025-08-19 02:35:07.456+00
91	2	\N	6	1	1	armarinho	6.00	2025-08-17	Luciana	pendente	f	f	\N	2025-08-19 02:35:39.889+00	2025-08-19 02:35:39.889+00
92	2	\N	6	1	1	Metro	5.50	2025-08-17	Luciana	pendente	f	f	\N	2025-08-19 02:36:02.912+00	2025-08-19 02:36:02.912+00
93	2	\N	6	1	1	Hollywood Pães	9.29	2025-08-16	Padaria	pendente	f	f	\N	2025-08-19 02:36:34.623+00	2025-08-19 02:36:34.623+00
95	2	\N	6	1	1	Take	3.30	2025-08-16	alimentação	pendente	f	f	\N	2025-08-19 02:37:29.481+00	2025-08-19 02:37:29.481+00
96	2	\N	6	1	1	Bellavia	38.98	2025-08-16	Mercado	pendente	f	f	\N	2025-08-19 02:37:49.206+00	2025-08-19 02:37:49.206+00
38	2	8	\N	1	1	Ultragaz	58.82	2025-08-25	\N	paga	f	f	2025-08-19 22:26:00+00	2025-08-18 19:41:01.686+00	2025-08-19 03:23:04.539+00
40	2	8	\N	1	1	Neo Energia	368.51	2025-08-28	\N	paga	f	f	2025-08-28 22:42:00+00	2025-08-18 19:42:23.517+00	2025-08-28 03:01:00.028+00
39	2	8	\N	1	1	caesb	182.85	2025-08-31	\N	paga	f	f	2025-08-29 22:41:00+00	2025-08-18 19:41:58.278+00	2025-08-29 03:01:00.035+00
64	2	8	\N	1	1	India Mission	50.00	2025-09-25	\N	paga	t	f	2025-09-02 03:00:00+00	2025-08-19 00:01:00.057+00	2025-09-02 03:01:00.027+00
97	2	\N	6	1	1	café do flávio	36.00	2025-08-16	alimentação	pendente	f	f	\N	2025-08-19 02:38:05.843+00	2025-08-19 02:38:05.843+00
98	2	\N	6	1	1	Le Pain	15.80	2025-08-16	Padaria	pendente	f	f	\N	2025-08-19 02:38:31.784+00	2025-08-19 02:38:31.784+00
99	2	\N	6	1	1	assai 	155.70	2025-08-16	Mercado	pendente	f	f	\N	2025-08-19 02:38:53.498+00	2025-08-19 02:38:53.498+00
100	2	\N	6	1	1	Line Bakery	13.11	2025-08-16	\N	pendente	f	f	\N	2025-08-19 02:39:10.95+00	2025-08-19 02:39:10.95+00
101	2	\N	6	1	1	drogasil	59.99	2025-08-15	farmácia	pendente	f	f	\N	2025-08-19 02:39:58.74+00	2025-08-19 02:39:58.741+00
102	2	\N	6	1	1	Drogasil	22.99	2025-08-15	Farmácia	pendente	f	f	\N	2025-08-19 02:40:38.807+00	2025-08-19 02:40:38.807+00
103	2	\N	6	1	1	Mané mercado	168.89	2025-08-15	alimentação	pendente	f	f	\N	2025-08-19 02:41:02.333+00	2025-08-19 02:41:02.333+00
104	2	\N	6	1	1	Galpão 17	19.90	2025-08-15	Isabelle	pendente	f	f	\N	2025-08-19 02:41:29.584+00	2025-08-19 02:41:29.584+00
105	2	\N	6	1	1	cobasi	121.90	2025-08-15	Pet	pendente	f	f	\N	2025-08-19 02:41:52.354+00	2025-08-19 02:41:52.354+00
106	2	\N	6	1	1	hollywood 	10.27	2025-08-15	padaria	pendente	f	f	\N	2025-08-19 02:42:48.543+00	2025-08-19 02:42:48.543+00
107	2	\N	6	1	1	dunkin donuts	25.00	2025-08-15	alimentação	pendente	f	f	\N	2025-08-19 02:43:07.58+00	2025-08-19 02:43:07.58+00
108	2	\N	6	1	1	dia a dia	222.63	2025-08-14	Mercado	pendente	f	f	\N	2025-08-19 02:43:30.939+00	2025-08-19 02:43:30.939+00
109	2	\N	6	1	1	Padaria	10.69	2025-08-14	padaria	pendente	f	f	\N	2025-08-19 02:43:49.99+00	2025-08-19 02:43:49.99+00
110	2	\N	6	1	1	bellavia	5.99	2025-08-14	Mercado	pendente	f	f	\N	2025-08-19 02:44:10.747+00	2025-08-19 02:44:10.747+00
111	2	\N	6	1	1	A mundial	15.49	2025-08-14	Luciana	pendente	f	f	\N	2025-08-19 02:44:42.033+00	2025-08-19 02:44:42.033+00
112	2	\N	6	1	1	salão	40.00	2025-08-14	Luciana	pendente	f	f	\N	2025-08-19 02:45:06.192+00	2025-08-19 02:45:06.192+00
113	2	\N	6	1	1	Gasolina	119.80	2025-08-14	transporte	pendente	f	f	\N	2025-08-19 02:45:36.931+00	2025-08-19 02:45:36.931+00
114	2	\N	6	1	1	burger king	29.90	2025-08-13	alimentação	pendente	f	f	\N	2025-08-19 02:45:58.626+00	2025-08-19 02:45:58.627+00
115	2	\N	6	1	1	shoppe	36.61	2025-08-13	Internet	pendente	f	f	\N	2025-08-19 02:46:22.083+00	2025-08-19 02:46:22.083+00
116	2	\N	6	1	1	idm águas claras	28.98	2025-08-13	alimentação	pendente	f	f	\N	2025-08-19 02:47:21.823+00	2025-08-19 02:47:21.823+00
117	2	\N	6	1	1	Padaria	12.13	2025-08-13	padaria	pendente	f	f	\N	2025-08-19 02:47:44.825+00	2025-08-19 02:47:44.825+00
118	2	\N	6	1	1	bellavia	21.51	2025-08-13	Mercado	pendente	f	f	\N	2025-08-19 02:48:08.58+00	2025-08-19 02:48:08.58+00
119	2	\N	6	1	1	Rodrigo Frutas	12.00	2025-08-13	Mercado	pendente	f	f	\N	2025-08-19 02:48:33.28+00	2025-08-19 02:48:33.28+00
120	2	\N	6	1	1	Minerinho	30.00	2025-08-13	Mercado	pendente	f	f	\N	2025-08-19 02:48:52.121+00	2025-08-19 02:48:52.121+00
121	2	\N	6	1	1	shoppe	111.72	2025-08-12	Luciana	pendente	f	f	\N	2025-08-19 02:49:12.369+00	2025-08-19 02:49:12.369+00
122	2	\N	6	1	1	bellavia	40.29	2025-08-12	Mercado	pendente	f	f	\N	2025-08-19 02:49:33.719+00	2025-08-19 02:49:33.719+00
123	2	\N	6	1	1	Dunkin donuts	39.90	2025-08-12	alimentação	pendente	f	f	\N	2025-08-19 02:49:58.589+00	2025-08-19 02:49:58.589+00
124	2	\N	6	1	1	line bakery	5.54	2025-08-12	padaria	pendente	f	f	\N	2025-08-19 02:50:33.883+00	2025-08-19 02:50:33.883+00
125	2	\N	6	1	1	amazon	48.97	2025-08-11	Isabelle	pendente	f	f	\N	2025-08-19 02:50:55.947+00	2025-08-19 02:50:55.948+00
126	2	\N	6	1	1	Padaria	11.96	2025-08-11	Padaria	pendente	f	f	\N	2025-08-19 02:51:17.243+00	2025-08-19 02:51:17.243+00
127	2	\N	6	1	1	biomundo	10.07	2025-08-11	Luciana	pendente	f	f	\N	2025-08-19 02:51:37.453+00	2025-08-19 02:51:37.453+00
128	2	\N	6	1	1	bellavia	9.84	2025-08-11	Mercado	pendente	f	f	\N	2025-08-19 02:51:56.618+00	2025-08-19 02:51:56.618+00
129	2	\N	6	1	1	quiosque	30.98	2025-08-11	alimentação	pendente	f	f	\N	2025-08-19 02:52:17.264+00	2025-08-19 02:52:17.265+00
130	2	\N	6	1	1	metro	3.80	2025-08-11	Isabelle	pendente	f	f	\N	2025-08-19 02:52:41.924+00	2025-08-19 02:52:41.924+00
131	2	\N	6	1	1	C&A	59.99	2025-08-11	Presentes	pendente	f	f	\N	2025-08-19 02:53:03.859+00	2025-08-19 02:53:03.859+00
132	2	\N	6	1	1	fada doceira	3.50	2025-08-11	alimentação	pendente	f	f	\N	2025-08-19 02:53:19.262+00	2025-08-19 02:53:19.262+00
133	2	\N	6	1	1	uber	12.98	2025-08-11	transporte	pendente	f	f	\N	2025-08-19 02:53:46.04+00	2025-08-19 02:53:46.04+00
134	2	\N	6	1	1	bellavia	6.56	2025-08-10	Mercado	pendente	f	f	\N	2025-08-19 02:54:04.391+00	2025-08-19 02:54:04.391+00
135	2	\N	6	1	1	Padaria	17.85	2025-08-10	padaria	pendente	f	f	\N	2025-08-19 02:54:30.086+00	2025-08-19 02:54:30.086+00
136	2	\N	6	1	1	quiosque	25.39	2025-08-10	alimentação	pendente	f	f	\N	2025-08-19 02:54:58.275+00	2025-08-19 02:54:58.275+00
137	2	\N	6	1	1	estacionamento	5.00	2025-08-10	transporte	pendente	f	f	\N	2025-08-19 02:55:25.874+00	2025-08-19 02:55:25.874+00
138	2	\N	6	1	1	drogaria	8.99	2025-08-09	Farmácia	pendente	f	f	\N	2025-08-19 02:55:49.613+00	2025-08-19 02:55:49.613+00
139	2	\N	6	1	1	Padaria	11.05	2025-08-09	\N	pendente	f	f	\N	2025-08-19 02:56:03.162+00	2025-08-19 02:56:03.162+00
140	2	\N	6	1	1	rosário	83.66	2025-08-09	Farmácia	pendente	f	f	\N	2025-08-19 02:56:39.491+00	2025-08-19 02:56:39.491+00
141	2	\N	6	1	1	Padaria	8.63	2025-08-08	padaria	pendente	f	f	\N	2025-08-19 02:57:02.68+00	2025-08-19 02:57:02.681+00
142	2	\N	6	1	1	frutela	47.00	2025-08-08	Mercado	pendente	f	f	\N	2025-08-19 02:57:19.735+00	2025-08-19 02:57:19.736+00
143	2	\N	6	1	1	fuji	26.26	2025-08-08	farmácia	pendente	f	f	\N	2025-08-19 02:57:44.631+00	2025-08-19 02:57:44.631+00
144	2	\N	6	1	1	drogaria SP	12.99	2025-08-08	Farmácia	pendente	f	f	\N	2025-08-19 02:58:16.05+00	2025-08-19 02:58:16.05+00
148	2	\N	6	2	2	C&A (2/2)	45.00	2025-09-07	Presentes	pendente	f	f	\N	2025-08-19 03:00:31.17+00	2025-08-19 03:00:31.17+00
145	2	\N	6	1	1	barbearia	40.00	2025-08-09	beleza	pendente	f	f	\N	2025-08-19 02:58:49.092+00	2025-08-19 03:09:27.276+00
146	2	\N	6	1	1	Padaria	45.78	2025-08-09	alimentação	pendente	f	f	\N	2025-08-19 02:59:11.203+00	2025-08-19 03:09:47.798+00
147	2	\N	6	1	2	C&A (1/2)	45.00	2025-08-09	Presentes	pendente	f	f	\N	2025-08-19 03:00:31.16+00	2025-08-19 03:10:04.859+00
149	2	\N	6	1	1	Padaria	9.00	2025-08-09	\N	pendente	f	f	\N	2025-08-19 03:00:43.54+00	2025-08-19 03:10:16.023+00
150	2	\N	6	1	1	bellavia	32.69	2025-08-09	Mercado	pendente	f	f	\N	2025-08-19 03:01:02.091+00	2025-08-19 03:10:23.486+00
151	2	\N	6	1	1	metro	5.50	2025-08-09	transporte	pendente	f	f	\N	2025-08-19 03:01:28.105+00	2025-08-19 03:10:29.648+00
152	2	\N	6	1	1	biscoitos	14.00	2025-08-09	alimentação	pendente	f	f	\N	2025-08-19 03:01:50.197+00	2025-08-19 03:10:36.027+00
153	2	\N	6	1	1	estacionamento	5.00	2025-08-14	transporte	pendente	f	f	\N	2025-08-19 03:11:25.378+00	2025-08-19 03:11:25.378+00
166	2	\N	6	1	1	transporte	5.50	2025-08-19	Luciana	pendente	f	f	\N	2025-08-20 02:49:32.936+00	2025-08-20 02:49:32.936+00
167	2	\N	6	1	1	enxoval joão vinicius	29.99	2025-08-19	Presentes	pendente	f	f	\N	2025-08-20 02:50:07.302+00	2025-08-20 02:50:07.302+00
158	2	\N	8	1	1	vinhos	60.92	2025-08-18	\N	pendente	f	f	\N	2025-08-19 14:25:50.845+00	2025-08-19 14:25:50.845+00
159	2	\N	6	1	1	Burger King	37.90	2025-08-18	alimentação	pendente	f	f	\N	2025-08-19 16:18:08.638+00	2025-08-19 16:18:08.64+00
168	2	\N	6	1	1	americanas	9.99	2025-08-19	Luciana	pendente	f	f	\N	2025-08-20 02:50:27.652+00	2025-08-20 02:50:27.652+00
169	2	\N	6	1	1	Padaria	9.44	2025-08-19	Luciana	pendente	f	f	\N	2025-08-20 02:50:44.023+00	2025-08-20 02:50:44.023+00
170	2	\N	6	1	1	Padaria	7.49	2025-08-19	\N	pendente	f	f	\N	2025-08-20 02:50:54.712+00	2025-08-20 02:50:54.712+00
171	2	\N	6	1	1	BellaVia	20.17	2025-08-19	mercado	pendente	f	f	\N	2025-08-20 02:51:26.342+00	2025-08-20 02:51:26.342+00
172	2	\N	6	1	1	Padaria	28.02	2025-08-19	alimentação	pendente	f	f	\N	2025-08-20 02:51:45.031+00	2025-08-20 02:51:45.031+00
173	2	\N	6	1	1	uber	19.93	2025-08-19	transporte	pendente	f	f	\N	2025-08-20 02:52:27.828+00	2025-08-20 02:52:27.828+00
163	2	8	\N	1	1	teste	0.15	2025-08-20	\N	paga	f	f	2025-08-20 03:00:00+00	2025-08-19 16:46:46.116+00	2025-08-20 03:01:00.029+00
174	2	8	\N	1	1	Ração	308.55	2025-09-16	\N	pendente	f	f	2025-09-16 03:00:00+00	2025-08-20 14:47:07.879+00	2025-08-20 14:47:07.881+00
160	2	8	\N	1	1	Tosa Patrick	170.00	2025-08-26	\N	paga	f	f	2025-08-26 03:00:00+00	2025-08-19 16:24:02.608+00	2025-08-22 11:14:52.685+00
175	2	\N	6	1	1	uber	17.92	2025-08-20	transporte	pendente	f	f	\N	2025-08-20 14:49:23.668+00	2025-08-20 14:49:23.668+00
176	2	\N	6	1	1	mane mercado 	76.72	2025-08-20	alimentação	pendente	f	f	\N	2025-08-20 17:38:24.857+00	2025-08-20 17:38:24.858+00
177	2	\N	6	1	1	perfume ML	129.00	2025-08-20	Ronie 	pendente	f	f	\N	2025-08-20 18:43:40.75+00	2025-08-20 18:43:40.751+00
178	2	\N	6	1	1	Padaria	9.08	2025-08-20	alimentação	pendente	f	f	\N	2025-08-20 20:07:12.546+00	2025-08-20 20:07:12.547+00
179	2	\N	6	1	1	bellvia	23.58	2025-08-20	mercado 	pendente	f	f	\N	2025-08-20 21:51:11.894+00	2025-08-20 21:51:11.894+00
180	2	\N	6	1	1	Metrô	5.50	2025-08-20	Luciana	pendente	f	f	\N	2025-08-21 12:27:28.049+00	2025-08-21 12:27:28.051+00
181	2	\N	6	1	1	Oba 	87.84	2025-08-21	mercado 	pendente	f	f	\N	2025-08-21 14:00:41.842+00	2025-08-21 14:00:41.842+00
183	2	\N	6	1	1	Mineirinho	15.00	2025-08-21	Mercado	pendente	f	f	\N	2025-08-21 17:10:18.317+00	2025-08-21 17:10:18.318+00
184	2	\N	6	1	1	Bonnapan	28.54	2025-08-21	Padaria	pendente	f	f	\N	2025-08-21 22:20:34.678+00	2025-08-21 22:20:34.68+00
185	2	\N	6	1	1	Farmacia	4.99	2025-08-21	isabelle	pendente	f	f	\N	2025-08-21 22:23:01.225+00	2025-08-21 22:23:01.225+00
186	2	\N	6	1	1	Bellavia	15.23	2025-08-21	Mercado	pendente	f	f	\N	2025-08-21 22:26:16.719+00	2025-08-21 22:26:16.719+00
187	2	\N	8	1	1	farmácia 	8.99	2025-08-21	Luciana 	pendente	f	f	\N	2025-08-22 01:46:12.202+00	2025-08-22 01:46:12.204+00
188	2	\N	6	1	1	uber	17.92	2025-08-22	Luciana 	pendente	f	f	\N	2025-08-22 12:00:02.463+00	2025-08-22 12:00:02.463+00
189	2	\N	6	1	1	gasolina 	150.00	2025-08-22	transporte 	pendente	f	f	\N	2025-08-22 13:15:16.449+00	2025-08-22 13:15:16.449+00
190	2	\N	6	1	1	lava jato 	50.00	2025-08-22	transporte 	pendente	f	f	\N	2025-08-22 14:00:42.268+00	2025-08-22 14:00:42.269+00
191	2	\N	6	1	1	Padaria	11.87	2025-08-22	Isabelle	pendente	f	f	\N	2025-08-22 23:17:44.115+00	2025-08-22 23:17:44.117+00
193	2	\N	6	1	1	Bellavia	18.57	2025-08-22	Mercado	pendente	f	f	\N	2025-08-22 23:19:04.618+00	2025-08-22 23:19:04.618+00
194	2	\N	6	1	1	metrô	5.50	2025-08-22	transporte	pendente	f	f	\N	2025-08-22 23:19:36.452+00	2025-08-22 23:19:36.452+00
195	2	\N	6	1	1	Miami festas	24.77	2025-08-22	Luciana	pendente	f	f	\N	2025-08-22 23:20:16.166+00	2025-08-22 23:20:16.167+00
196	2	\N	6	1	1	bellavia 	7.98	2025-08-22	mercado 	pendente	f	f	\N	2025-08-23 01:47:43.336+00	2025-08-23 01:47:43.336+00
197	2	\N	6	1	1	dunkin donuts	20.60	2025-08-23	alimentação	pendente	f	f	\N	2025-08-23 12:14:22.667+00	2025-08-23 12:14:22.668+00
198	2	\N	6	1	1	Alpinus	34.99	2025-08-23	alimentação	pendente	f	f	\N	2025-08-23 17:59:53.015+00	2025-08-23 17:59:53.015+00
199	2	\N	6	1	1	TakeandGo refri	1.43	2025-08-23	alimentação	pendente	f	f	\N	2025-08-23 18:00:50.36+00	2025-08-23 18:00:50.361+00
200	2	\N	6	1	1	takeango refri	1.26	2025-08-23	alimentação	pendente	f	f	\N	2025-08-23 18:01:16.467+00	2025-08-23 18:01:16.467+00
182	2	\N	8	1	1	bella Via 	25.65	2025-08-21	Mercado	pendente	f	f	\N	2025-08-21 16:37:53.568+00	2025-08-23 18:22:03.162+00
201	2	\N	6	1	1	bolo do Flávio 	50.00	2025-08-23	Luciana 	pendente	f	f	\N	2025-08-23 23:04:15.096+00	2025-08-23 23:04:15.096+00
202	2	\N	6	1	1	padaria 	10.05	2025-08-23	Padaria	pendente	f	f	\N	2025-08-23 23:05:16.466+00	2025-08-23 23:05:16.466+00
203	2	\N	6	1	1	bellavia 	58.07	2025-08-23	mercado	pendente	f	f	\N	2025-08-23 23:47:06.005+00	2025-08-23 23:47:06.005+00
204	2	\N	6	1	1	McDonald's 	31.90	2025-08-23	Luciana	pendente	f	f	\N	2025-08-23 23:47:58.031+00	2025-08-23 23:47:58.031+00
205	2	\N	6	1	1	Madero	58.00	2025-08-23	alimentação	pendente	f	f	\N	2025-08-23 23:48:55.405+00	2025-08-23 23:48:55.405+00
206	2	\N	6	1	1	Pão dourado	7.38	2025-08-24	Padaria	pendente	f	f	\N	2025-08-24 21:41:43.396+00	2025-08-24 21:41:43.397+00
35	2	8	\N	1	1	Cartão BRB	104.30	2025-08-25	\N	paga	t	f	2025-08-25 22:34:00+00	2025-08-18 19:34:48.761+00	2025-08-25 12:11:44.938+00
207	2	8	\N	1	1	Cartão BRB	104.30	2025-09-25	\N	pendente	t	f	\N	2025-08-25 15:01:00.044+00	2025-08-25 15:01:00.045+00
209	2	\N	6	1	1	line Bakery	10.50	2025-08-25	alimentação	pendente	f	f	\N	2025-08-25 20:58:37.793+00	2025-08-25 20:58:37.794+00
210	2	\N	6	1	1	Hollywood paes	11.08	2025-08-25	Padaria	pendente	f	f	\N	2025-08-25 20:59:11.441+00	2025-08-25 20:59:11.441+00
214	2	11	\N	1	1	Tosa Patrick	170.00	2025-09-27	Pet	pendente	f	f	2025-09-27 03:00:00+00	2025-08-25 21:42:03.807+00	2025-08-25 21:42:03.807+00
216	2	11	\N	1	1	ultragaz	58.82	2025-09-17	\N	pendente	f	f	2025-09-17 03:00:00+00	2025-08-25 21:43:31.651+00	2025-08-25 21:43:31.652+00
217	2	11	\N	1	1	Inas	1400.00	2025-09-29	\N	pendente	f	f	2025-09-29 03:00:00+00	2025-08-25 21:44:14.974+00	2025-08-25 21:44:14.975+00
218	2	11	\N	1	1	Neo Energia	360.00	2025-09-29	\N	pendente	f	f	2025-09-29 03:00:00+00	2025-08-25 21:47:47.309+00	2025-08-25 21:47:47.309+00
219	2	11	\N	1	1	caesb	180.00	2025-09-30	\N	pendente	f	f	2025-09-30 03:00:00+00	2025-08-25 21:48:34.813+00	2025-08-25 21:48:34.813+00
221	2	\N	6	1	1	shopee	15.30	2025-08-25	Isabelle 	pendente	f	f	\N	2025-08-26 02:05:21.201+00	2025-08-26 02:05:21.201+00
208	2	8	\N	1	1	Inas	1473.40	2025-08-29	Saúde	paga	f	f	2025-08-26 03:00:00+00	2025-08-25 16:44:58.211+00	2025-08-26 03:01:00.017+00
222	2	\N	6	1	1	Line bakery	3.11	2025-08-26	Padaria	pendente	f	f	\N	2025-08-26 14:57:00.14+00	2025-08-26 14:57:00.14+00
223	2	\N	6	1	1	Padaria	12.47	2025-08-26	Padaria	pendente	f	f	\N	2025-08-26 22:06:55.821+00	2025-08-26 22:06:55.822+00
224	2	\N	6	1	1	Farmácia	17.99	2025-08-26	Farmácia	pendente	f	f	\N	2025-08-26 22:07:19.001+00	2025-08-26 22:07:19.001+00
225	2	\N	6	1	1	OBA	8.99	2025-08-26	Mercado	pendente	f	f	\N	2025-08-26 22:07:47.401+00	2025-08-26 22:07:47.401+00
226	2	\N	6	1	1	Dia a Dia	181.37	2025-08-26	Mercado	pendente	f	f	\N	2025-08-27 00:35:24.977+00	2025-08-27 00:35:24.978+00
227	2	\N	6	1	1	Armarinho	17.90	2025-08-26	Luciana	pendente	f	f	\N	2025-08-27 02:33:11.722+00	2025-08-27 02:33:11.722+00
228	2	\N	6	1	1	Bellavia	33.70	2025-08-25	Marcado	pendente	f	f	\N	2025-08-27 02:34:29.502+00	2025-08-27 02:34:29.502+00
229	2	\N	6	1	1	line Bakery	8.55	2025-08-27	alimentação	pendente	f	f	\N	2025-08-27 16:54:25.226+00	2025-08-27 16:54:25.227+00
230	2	\N	6	1	1	bella Via 	33.82	2025-08-27	mercado	pendente	f	f	\N	2025-08-27 21:17:47.082+00	2025-08-27 21:17:47.082+00
231	2	\N	6	1	1	pão dourado 	18.62	2025-08-27	padaria 	pendente	f	f	\N	2025-08-28 01:39:56.148+00	2025-08-28 01:39:56.148+00
234	2	\N	6	1	1	Life Insurance	292.03	2025-08-28	Seguro	pendente	f	f	\N	2025-08-28 12:38:48.572+00	2025-08-28 12:39:12.535+00
235	2	\N	8	1	1	Frutas	10.00	2025-08-28	Mercado	pendente	f	f	\N	2025-08-28 21:35:04.58+00	2025-08-28 21:35:04.581+00
236	2	\N	8	1	1	Minerinho	16.12	2025-08-28	Mercado	pendente	f	f	\N	2025-08-28 21:35:44.681+00	2025-08-28 21:35:44.681+00
237	2	\N	6	1	1	Farmácia	11.29	2025-08-28	Luciana	pendente	f	f	\N	2025-08-28 21:37:07.736+00	2025-08-28 21:37:07.736+00
238	2	\N	6	1	1	Padaria	29.77	2025-08-28	Isabelle	pendente	f	f	\N	2025-08-28 21:37:54.888+00	2025-08-28 21:37:54.889+00
239	2	\N	6	1	1	Farmácia 	27.99	2025-08-28	Luciana 	pendente	f	f	\N	2025-08-29 11:43:09.315+00	2025-08-29 11:43:09.316+00
240	2	\N	8	1	1	casa reparos 	44.90	2025-08-29	\N	pendente	f	f	\N	2025-08-29 13:50:45.372+00	2025-08-29 13:50:45.373+00
241	2	\N	8	1	1	lepain rustic	16.10	2025-08-29	padaria 	pendente	f	f	\N	2025-08-29 16:04:01.274+00	2025-08-29 16:04:01.274+00
242	2	\N	8	1	1	pizza II	30.00	2025-08-29	alimentação	pendente	f	f	\N	2025-08-29 18:35:51.773+00	2025-08-29 18:35:51.773+00
243	2	\N	6	1	1	BellaVia	10.79	2025-08-29	Padaria	pendente	f	f	\N	2025-08-29 20:58:57.916+00	2025-08-29 20:58:57.916+00
244	2	\N	6	1	1	padaria 	12.13	2025-08-29	\N	pendente	f	f	\N	2025-08-30 03:42:34.382+00	2025-08-30 03:42:34.384+00
245	2	\N	8	1	1	Mercado livre	24.90	2025-08-30	Internet	pendente	t	f	\N	2025-08-30 20:39:30.57+00	2025-08-30 20:39:30.571+00
246	2	\N	8	1	1	Dunkin donuts	14.00	2025-08-30	Alimentação	pendente	f	f	\N	2025-08-30 20:40:03.407+00	2025-08-30 20:40:03.408+00
247	2	\N	6	1	1	Bellavia	39.24	2025-08-30	Mercado	pendente	f	f	\N	2025-08-30 20:40:43.868+00	2025-08-30 20:40:43.869+00
248	2	\N	8	1	1	Reikocandies	14.40	2025-08-30	Alimentação	pendente	f	f	\N	2025-08-31 13:30:37.621+00	2025-08-31 13:30:37.621+00
249	2	\N	8	1	1	Espertinho do jamal	25.00	2025-08-30	Alimentação	pendente	f	f	\N	2025-08-31 13:31:29.896+00	2025-08-31 13:31:29.896+00
250	2	\N	8	1	1	Coke	8.00	2025-08-30	Alimentação	pendente	f	f	\N	2025-08-31 13:31:50.833+00	2025-08-31 13:31:50.834+00
251	2	\N	8	1	1	combustível 	150.00	2025-08-31	transporte 	pendente	f	f	\N	2025-08-31 20:39:23.715+00	2025-08-31 20:39:23.715+00
213	2	11	\N	1	1	condomínio	1600.00	2025-09-10	\N	paga	f	f	2025-09-10 03:00:00+00	2025-08-25 21:41:18.068+00	2025-09-12 03:01:00.058+00
215	2	7	\N	1	1	church	960.00	2025-09-10	\N	paga	f	f	2025-09-10 03:00:00+00	2025-08-25 21:42:51.087+00	2025-09-12 03:01:00.065+00
220	2	7	\N	1	1	Financiamento Imobiliário	1460.70	2025-09-09	\N	paga	f	f	2025-09-09 03:00:00+00	2025-08-25 21:52:31.376+00	2025-09-12 03:01:00.07+00
252	2	\N	8	1	1	burger King 	50.80	2025-08-31	Alimentação 	pendente	f	f	\N	2025-09-01 13:10:48.752+00	2025-09-01 13:10:48.752+00
253	2	\N	6	1	1	festival koreano	22.00	2025-10-31	presentes	pendente	f	f	\N	2025-09-01 18:05:24.489+00	2025-09-01 18:05:24.489+00
254	2	\N	6	1	1	festival koreano	12.00	2025-08-30	Luciana	pendente	f	f	\N	2025-09-01 18:05:45.508+00	2025-09-01 18:05:45.508+00
255	2	\N	6	1	1	festival koreano	54.00	2025-08-30	alimentação	pendente	f	f	\N	2025-09-01 18:06:00.72+00	2025-09-01 18:06:00.72+00
256	2	\N	6	1	1	festival koreano	25.00	2025-08-30	alimentação	pendente	f	f	\N	2025-09-01 18:06:18.233+00	2025-09-01 18:06:18.233+00
257	2	\N	6	1	1	festival koreano	10.00	2025-08-30	Luciana	pendente	f	f	\N	2025-09-01 18:06:34.454+00	2025-09-01 18:06:34.454+00
258	2	\N	6	1	1	hollywood paes	8.32	2025-08-30	Padaria	pendente	f	f	\N	2025-09-01 18:06:58.424+00	2025-09-01 18:06:58.425+00
259	2	\N	6	1	1	brb mobilidade	3.80	2025-09-01	transporte	pendente	f	f	\N	2025-09-01 18:07:29.274+00	2025-09-01 18:07:29.274+00
260	2	\N	6	1	1	padaria	13.53	2025-08-31	Padaria	pendente	f	f	\N	2025-09-01 18:08:02.716+00	2025-09-01 18:08:02.716+00
261	2	\N	6	1	1	BellaVia	46.70	2025-08-31	mercado	pendente	f	f	\N	2025-09-01 18:08:20.14+00	2025-09-01 18:08:20.14+00
262	2	\N	8	1	1	Pamonha	10.00	2025-09-01	alimentação	pendente	f	f	\N	2025-09-01 21:18:12.325+00	2025-09-01 21:18:12.325+00
263	2	\N	6	1	1	hollywood paes	11.08	2025-09-01	Padaria	pendente	f	f	\N	2025-09-02 01:03:44.658+00	2025-09-02 01:03:44.658+00
264	2	\N	6	1	1	bellavia	17.03	2025-09-01	Mercado	pendente	f	f	\N	2025-09-02 01:04:23.772+00	2025-09-02 01:04:23.773+00
265	2	\N	6	1	1	mimos do lar	20.00	2025-09-01	Luciana	pendente	f	f	\N	2025-09-02 01:05:03.028+00	2025-09-02 01:05:03.029+00
266	2	\N	6	1	1	ipe verde	21.00	2025-09-01	Luciana	pendente	f	f	\N	2025-09-02 01:05:23.699+00	2025-09-02 01:05:23.699+00
267	2	8	\N	1	1	India Mission	50.00	2025-10-25	\N	pendente	t	f	\N	2025-09-02 03:01:00.04+00	2025-09-02 03:01:00.04+00
63	2	8	\N	1	1	faculdade Isabelle	1768.48	2025-09-10	\N	paga	t	f	2025-09-12 03:01:00.041+00	2025-08-19 00:01:00.048+00	2025-09-12 03:01:00.041+00
211	2	7	\N	1	1	net+claro	272.89	2025-09-09	\N	paga	f	t	2025-09-09 03:00:00+00	2025-08-25 21:38:31.997+00	2025-09-12 03:01:00.052+00
268	2	8	\N	1	1	faculdade Isabelle	1768.48	2025-10-10	\N	pendente	t	f	\N	2025-09-12 03:01:00.083+00	2025-09-12 03:01:00.084+00
\.


--
-- Data for Name: incomes; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.incomes (id, user_id, account_id, description, value, date, category, is_recurring, created_at, updated_at, posted) FROM stdin;
6	2	7	salario	14880.21	2025-08-05	salario	t	2025-08-18 18:10:16.163+00	2025-08-18 18:10:16.164+00	t
7	2	7	SVG	3000.00	2025-08-04		f	2025-08-18 18:10:27.703+00	2025-08-18 18:10:27.704+00	t
13	2	7	PCDF	13341.21	2025-09-03	Salário	f	2025-08-24 15:54:58.831+00	2025-08-24 15:54:58.833+00	f
16	2	7	GDF	1551.73	2025-09-02	Salário	f	2025-08-29 16:43:06.772+00	2025-09-02 01:05:54.537+00	f
15	2	7	SVG	1200.00	2025-09-02	Salário	f	2025-08-25 21:36:07.073+00	2025-09-02 01:06:04.333+00	f
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.notifications (id, user_id, type, message, read, created_at, updated_at) FROM stdin;
1	5	security_password_change	Senha alterada em 2025-08-21T03:06:32.865Z (IP: ::ffff:172.22.0.4)	f	2025-08-21 03:06:32.865+00	2025-08-21 03:06:32.865+00
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.transfers (id, user_id, from_account_id, to_account_id, value, description, date, created_at, updated_at) FROM stdin;
4	2	7	8	12000.00		2025-08-05	2025-08-18 18:10:45.803+00	2025-08-18 18:11:02.302+00
5	2	7	8	2800.00		2025-08-11	2025-08-19 13:04:59.766+00	2025-08-19 13:04:59.767+00
6	2	7	8	46.62		2025-08-12	2025-08-20 02:48:05.936+00	2025-08-20 02:48:05.937+00
7	2	8	11	1491.29		2025-08-19	2025-08-20 14:54:11.306+00	2025-08-20 14:54:11.306+00
12	2	11	\N	50.00		2025-08-14	2025-08-20 15:48:54.899+00	2025-08-20 15:48:54.899+00
13	2	8	\N	2.50	vigia	2025-08-20	2025-08-20 20:07:37.132+00	2025-08-20 20:07:37.132+00
14	2	\N	9	0.15		2025-08-20	2025-08-20 21:50:02.126+00	2025-08-20 21:50:02.127+00
15	2	\N	8	175.00	Ajuste inicial	2025-08-21	2025-08-21 12:35:18.038+00	2025-08-21 12:35:18.039+00
16	2	9	11	59.85	Ajuste	2025-08-21	2025-08-21 12:37:30.119+00	2025-08-21 12:37:30.119+00
17	2	8	\N	10.00	açai	2025-08-22	2025-08-22 14:00:11.812+00	2025-08-22 14:00:11.813+00
18	2	\N	11	5960.00	ajuste 	2025-08-22	2025-08-23 00:29:18.302+00	2025-08-23 00:29:18.303+00
19	2	\N	9	7.00	Amiga Isabelle	2025-08-30	2025-08-30 20:38:29.078+00	2025-08-30 20:38:29.079+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.users (id, name, email, password, role, created_at, updated_at, password_changed_at) FROM stdin;
5	Isabelle	isabelleruasferreira@gmail.com	$2b$10$8dA37uly/wRAYy8Fe.dPw.Q54GdI1XttSncs97GrSTFvDI4luHpbu	user	2025-08-21 01:56:01.954+00	2025-08-21 03:06:32.859+00	2025-08-21 03:06:32.858+00
6	Filipe Gouveia	lipegouveia@hotmail.com	$2b$10$wm9F9Jb7cPWSpV0kvNsw8.czOCJ7leYDDbXzsINrfCHaFbGn3Xraq	user	2025-08-28 20:24:49.229+00	2025-08-28 20:24:49.229+00	\N
2	ronieruas	ronieruas@gmail.com	$2b$10$BTOSPPZo0xglm2hxlt8PNejTjWVbCPxyTIacA102mTS1IvVt6QtYK	admin	2025-08-17 04:42:40.272+00	2025-09-12 01:30:08.926+00	\N
3	ronie	ronie@ronieruas.com.br	$2b$10$h4w5cBbGIN9nUdcnCcONDetrhy23gom.yKzxk9SaXmOFfVesPI.4u	admin	2025-08-17 04:45:19.069+00	2025-09-12 01:30:09.07+00	\N
4	Default User	user@example.com	$2b$10$0CJovDBS6v0yFVyKECynm.a0GY5FpQk9maYI6vqthkEwJPSnzsxau	admin	2025-08-18 17:15:14.618+00	2025-09-12 01:30:09.158+00	\N
\.


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.accounts_id_seq', 12, true);


--
-- Name: budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.budgets_id_seq', 7, true);


--
-- Name: credit_card_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.credit_card_payments_id_seq', 6, true);


--
-- Name: credit_cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.credit_cards_id_seq', 8, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.expenses_id_seq', 268, true);


--
-- Name: incomes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.incomes_id_seq', 16, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, true);


--
-- Name: transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.transfers_id_seq', 19, true);


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
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict Bad9jwevw4q0ZGxvpjbCXKw3yNOHmHrfFbdTVQAj9jEH4uxQck0caRvbsepPmce

