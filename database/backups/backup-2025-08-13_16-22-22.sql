--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 15.13 (Debian 15.13-1.pgdg120+1)

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

CREATE DATABASE finance WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE finance OWNER TO finance;

\connect finance

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
    user_id integer,
    name character varying(100) NOT NULL,
    bank character varying(100),
    type character varying(30) NOT NULL,
    balance numeric(14,2) DEFAULT 0,
    currency character varying(3) DEFAULT 'BRL'::character varying NOT NULL,
    status character varying(20) DEFAULT 'ativa'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
    user_id integer,
    name character varying(100) NOT NULL,
    type character varying(30) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    planned_value numeric(14,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT now(),
    credit_card_id integer
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
    updated_at timestamp with time zone NOT NULL
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
    user_id integer,
    bank character varying(100),
    brand character varying(30),
    limit_value numeric(14,2) NOT NULL,
    due_day integer NOT NULL,
    closing_day integer NOT NULL,
    name character varying(100),
    status character varying(20) DEFAULT 'ativa'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT now(),
    debito_automatico boolean DEFAULT false,
    conta_debito_id integer
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
    user_id integer,
    account_id integer,
    description character varying(255) NOT NULL,
    value numeric(14,2) NOT NULL,
    due_date date NOT NULL,
    category character varying(50),
    status character varying(20) DEFAULT 'pendente'::character varying,
    is_recurring boolean DEFAULT false,
    auto_debit boolean DEFAULT false,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT now(),
    credit_card_id integer,
    installment_number integer,
    installment_total integer
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
    user_id integer,
    account_id integer,
    description character varying(255) NOT NULL,
    value numeric(14,2) NOT NULL,
    date date NOT NULL,
    category character varying(50),
    is_recurring boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT now()
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
    created_at timestamp with time zone,
    updated_at timestamp with time zone NOT NULL
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
    created_at timestamp with time zone,
    updated_at timestamp with time zone
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
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
20250709025310-create-expenses-table.js
20250709030000-create-credit-card-payments-table.js
20250709031000-add-debito-automatico-conta-credito-cartao.js
20250709032000-create-notifications-table.js
20250709033000-add-foreign-keys-credit-card-payment.js
20250709034000-add-timestamps-credit-card-transactions.js
20240101000000-create-users-table.js
20240101001000-create-accounts-table.js
20240101002000-create-incomes-table.js
20250115000000-add-credit-card-id-to-budgets.js
20250709024000-create-credit-cards-table.js
20250710000000-create-credit-card-transactions-table.js
20250710001000-drop-credit-card-transactions-table.js
20250717000000-fix-credit-card-payments-timestamps.js
20250730000000-allow-null-from-account-id.js
20250730010000-create-transfers-table.js
20250730020000-allow-null-to-account-id.js
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.accounts (id, user_id, name, bank, type, balance, currency, status, created_at, updated_at) FROM stdin;
2	1	NUBANK	NU	corrente	2030.00	BRL	ativa	2025-07-06 21:03:24.044071	2025-07-07 23:13:33.46
1	1	BRB	PCD	corrente	450.00	BRL	ativa	2025-07-06 21:03:24.044071	2025-07-07 23:14:04.334
8	2	nomad	Nomad	investimento	540.00	USD	ativa	2025-07-08 16:36:40.535	2025-07-08 16:38:11.897
7	2	NUBANK	NU	corrente	275.00	BRL	ativa	2025-07-08 15:08:58.16	2025-07-11 13:01:32.628
4	2	C6	C6	corrente	1195.02	BRL	ativa	2025-07-07 23:31:24.098	2025-08-12 20:02:21.984
5	2	BRB	BRB	corrente	20856.81	BRL	ativa	2025-07-07 23:31:35.476	2025-08-12 23:39:06.597
\.


--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.budgets (id, user_id, name, type, period_start, period_end, planned_value, created_at, updated_at, credit_card_id) FROM stdin;
1	1	Orçamento Mensal	geral	2025-07-06	2025-08-05	4000.00	2025-07-06 21:03:24.053549	2025-07-07 23:30:10.999546	\N
5	2	C6	cartao	2025-07-08	2025-08-07	5000.00	2025-07-08 16:00:10.089	2025-07-08 16:00:10.089	\N
6	2	mensal	geral	2025-07-01	2025-07-31	10000.00	2025-07-08 16:32:05.454	2025-07-08 16:32:05.454	\N
\.


--
-- Data for Name: credit_card_payments; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.credit_card_payments (id, card_id, user_id, account_id, value, payment_date, is_full_payment, auto_debit, created_at, updated_at) FROM stdin;
1	2	2	4	750.00	2025-07-09	t	f	2025-07-10 03:36:00.343+00	2025-07-10 03:36:00.345+00
2	2	2	5	1690.00	2025-07-11	t	f	2025-07-11 12:34:28.598+00	2025-07-11 12:34:28.598+00
3	4	2	7	500.00	2025-07-11	f	f	2025-07-11 13:01:32.64+00	2025-07-11 13:01:32.641+00
4	4	2	5	1982.33	2025-08-11	t	f	2025-08-11 23:43:53.502+00	2025-08-11 23:43:53.502+00
5	2	2	5	1690.00	2025-08-11	t	f	2025-08-12 00:18:52.064+00	2025-08-12 00:18:52.064+00
6	2	2	5	258.00	2025-08-11	t	f	2025-08-12 00:19:45.626+00	2025-08-12 00:19:45.627+00
7	4	2	5	1982.33	2025-08-11	t	f	2025-08-12 00:21:28.601+00	2025-08-12 00:21:28.601+00
8	4	2	5	1982.33	2025-08-11	t	f	2025-08-12 00:21:56.9+00	2025-08-12 00:21:56.9+00
9	2	2	5	258.00	2025-08-11	t	f	2025-08-12 00:23:38.422+00	2025-08-12 00:23:38.422+00
\.


--
-- Data for Name: credit_cards; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.credit_cards (id, user_id, bank, brand, limit_value, due_day, closing_day, name, status, created_at, updated_at, debito_automatico, conta_debito_id) FROM stdin;
3	1	NU	visa	5000.00	5	28	NUBANK	ativa	2025-07-08 00:44:35.609	2025-07-08 00:44:35.609	f	\N
4	2	NU	visa	7137.00	12	8	Nubank	ativa	2025-07-08 17:33:40.871	2025-08-12 23:05:26.686	f	5
2	2	C6	mastercard	21174.00	15	9	C6	ativa	2025-07-07 23:32:55.587	2025-08-12 23:15:59.348	f	5
5	2	tese	mastercard	3030.00	13	7	ruas	ativa	2025-08-12 00:26:06.898	2025-08-12 23:16:58.312	f	\N
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.expenses (id, user_id, account_id, description, value, due_date, category, status, is_recurring, auto_debit, paid_at, created_at, updated_at, credit_card_id, installment_number, installment_total) FROM stdin;
1	1	1	Aluguel	1200.00	2025-07-11	Moradia	pendente	f	f	\N	2025-07-06 21:03:24.048832	2025-07-07 23:30:10.995594	\N	\N	\N
2	1	1	Internet	100.00	2025-07-08	Utilidades	pendente	f	f	\N	2025-07-06 21:03:24.048832	2025-07-07 23:30:10.995594	\N	\N	\N
20	1	\N	Padaria	16.00	2025-07-07	Moradia	paga	f	f	2025-07-07 21:45:00	2025-07-08 00:45:15.045	2025-07-08 00:45:15.046	3	1	1
21	1	\N	Padaria	1600.00	2025-07-07	Moradia	pendente	f	f	2025-07-07 21:49:00	2025-07-08 00:49:29.356	2025-07-08 00:49:29.357	3	1	1
51	2	4	condomínio	1100.00	2025-07-07	Moradia	paga	f	f	2025-07-07 12:02:00	2025-07-08 15:03:05.005	2025-07-08 15:03:05.006	\N	1	1
56	2	7	mercado	130.00	2025-07-07		paga	f	f	2025-07-07 13:32:00	2025-07-08 16:32:33.132	2025-07-08 16:33:13.371	\N	1	1
55	2	\N	pet	200.00	2025-07-08		pendente	f	f	\N	2025-07-08 16:01:55.94	2025-07-08 16:45:37.733	2	1	1
57	2	\N	Padaria	50.00	2025-07-08		pendente	f	f	\N	2025-07-08 17:00:08.309	2025-07-08 17:00:08.31	2	1	1
54	2	7	faculdade	870.00	2025-07-08		paga	f	f	2025-07-08 12:13:00	2025-07-08 15:13:10.08	2025-07-08 17:00:37.265	\N	1	1
70	2	\N	Dia a dia	650.00	2025-07-10	\N	paga	f	f	2025-08-11 00:00:00	2025-07-10 23:33:06.367	2025-08-12 00:18:52.072	2	1	1
71	2	\N	Dia a dia	350.00	2025-07-10	mercado	paga	f	f	2025-08-11 00:00:00	2025-07-10 23:37:33.46	2025-08-12 00:18:52.072	2	1	1
107	2	\N	tempo	6.00	2025-08-10	\N	pendente	f	f	\N	2025-08-12 23:15:59.332	2025-08-12 23:15:59.332	2	1	1
73	2	\N	Dia a dia	90.00	2025-07-09	\N	paga	f	f	2025-08-11 00:00:00	2025-07-10 23:41:29.925	2025-08-12 00:18:52.072	2	1	1
85	2	5	Fatura Cartão C6	258.00	2025-08-11	Cartão de Crédito	paga	f	f	2025-08-11 00:00:00	2025-08-12 00:19:45.633	2025-08-12 00:19:45.633	\N	1	1
47	2	\N	mercado	180.00	2025-07-07	alimentação	paga	f	f	2025-08-11 00:00:00	2025-07-08 14:54:37	2025-08-12 00:19:45.637	2	1	1
61	2	\N	ettet2	78.00	2025-07-03		paga	f	f	2025-08-11 00:00:00	2025-07-10 02:37:46.975	2025-08-12 00:19:45.637	2	1	1
46	2	4	Padaria	21.00	2025-07-08	\N	paga	f	f	2025-07-08 11:50:00	2025-07-08 14:50:31.228	2025-07-11 00:14:37.478	\N	1	1
86	2	5	Fatura Cartão Nubank	1982.33	2025-08-11	Cartão de Crédito	paga	f	f	2025-08-11 00:00:00	2025-08-12 00:21:28.605	2025-08-12 00:21:28.605	\N	1	1
79	2	4	inas	1000.00	2025-07-01	\N	paga	f	f	2025-07-01 21:22:00	2025-07-11 00:21:29.699	2025-07-11 00:22:11.334	\N	1	1
87	2	5	Fatura Cartão Nubank	1982.33	2025-08-11	Cartão de Crédito	paga	f	f	2025-08-11 00:00:00	2025-08-12 00:21:56.904	2025-08-12 00:21:56.904	\N	1	1
82	2	\N	luciana (3/3)	333.33	2025-09-10	\N	pendente	f	f	\N	2025-07-11 01:17:25.071	2025-07-11 01:17:25.071	4	3	3
88	2	5	Fatura Cartão C6	258.00	2025-08-11	Cartão de Crédito	paga	f	f	2025-08-11 00:00:00	2025-08-12 00:23:38.425	2025-08-12 00:23:38.426	\N	1	1
108	2	\N	erere	5.00	2025-08-08	\N	pendente	f	f	\N	2025-08-12 23:16:58.294	2025-08-12 23:16:58.294	5	1	1
83	2	5	Fatura Cartão Nubank	1982.33	2025-08-11	Cartão de Crédito	paga	f	f	2025-08-11 00:00:00	2025-08-11 23:43:53.51	2025-08-11 23:43:53.511	\N	1	1
59	2	\N	perfume	200.00	2025-07-08	vestuário	paga	f	f	2025-08-11 00:00:00	2025-07-08 17:34:10.11	2025-08-11 23:43:53.516	4	1	1
60	2	\N	tste	14.00	2025-07-08		paga	f	f	2025-08-11 00:00:00	2025-07-10 02:37:14.593	2025-08-11 23:43:53.517	4	1	1
69	2	\N	Dia a dia	600.00	2025-07-09	mercado	paga	f	f	2025-08-11 00:00:00	2025-07-10 23:32:22.678	2025-08-11 23:43:53.517	4	1	1
72	2	\N	Dia a dia	600.00	2025-07-10	mercado	paga	f	f	2025-08-11 00:00:00	2025-07-10 23:39:32.821	2025-08-11 23:43:53.517	4	1	1
74	2	\N	Dia a dia	56.00	2025-07-10	teste	paga	f	f	2025-08-11 00:00:00	2025-07-10 23:45:21.597	2025-08-11 23:43:53.517	4	1	1
76	2	\N	Dia a dia	89.00	2025-07-10	mercad	paga	f	f	2025-08-11 00:00:00	2025-07-10 23:50:51.864	2025-08-11 23:43:53.517	4	1	1
78	2	\N	Dia a dia	90.00	2025-07-09	\N	paga	f	f	2025-08-11 00:00:00	2025-07-10 23:54:29.638	2025-08-11 23:43:53.517	4	1	1
80	2	\N	luciana (1/3)	333.33	2025-07-09	\N	paga	f	f	2025-08-11 00:00:00	2025-07-11 01:17:25.032	2025-08-11 23:43:53.517	4	1	3
84	2	5	Fatura Cartão C6	1690.00	2025-08-11	Cartão de Crédito	paga	f	f	2025-08-11 00:00:00	2025-08-12 00:18:52.068	2025-08-12 00:18:52.068	\N	1	1
67	2	\N	Dia a dia	600.00	2025-07-09	mercado	paga	f	f	2025-08-11 00:00:00	2025-07-10 23:23:44.607	2025-08-12 00:18:52.072	2	1	1
89	2	\N	compras tests	500.00	2025-08-12	\N	pendente	f	f	\N	2025-08-12 19:47:15.515	2025-08-12 19:47:15.516	2	1	1
91	2	\N	carro 	250.00	2025-08-12	alimentação	pendente	f	f	\N	2025-08-12 19:50:43.482	2025-08-12 19:50:43.482	4	1	1
92	2	\N	pet	100.00	2025-08-11	alimentação	pendente	f	f	\N	2025-08-12 19:53:16.733	2025-08-12 19:53:16.734	4	1	1
93	2	\N	pet	100.00	2025-08-08	alimentação	pendente	f	f	\N	2025-08-12 19:55:37.981	2025-08-12 19:55:37.981	5	1	1
94	2	\N	ifoot	54.00	2025-08-12	\N	pendente	f	f	\N	2025-08-12 20:00:53.517	2025-08-12 20:00:53.518	4	1	1
58	2	4	agua	301.99	2025-07-16	\N	paga	f	f	2025-07-10 14:02:00	2025-07-08 17:02:11.083	2025-08-12 20:02:21.978	\N	1	1
95	2	5	apartameto	1000.00	2025-08-13	Moradia	pendente	f	t	\N	2025-08-12 20:02:14.854	2025-08-12 20:02:39.36	\N	1	1
96	2	\N	ronie	400.00	2025-08-12	\N	pendente	f	f	\N	2025-08-12 20:29:15.461	2025-08-12 20:29:15.462	5	1	1
97	2	\N	Implante Luciana	1600.00	2025-08-12	\N	pendente	f	f	\N	2025-08-12 21:08:05.429	2025-08-12 21:08:05.43	2	1	1
98	2	\N	Implante Luciana	1600.00	2025-08-11	\N	pendente	f	f	\N	2025-08-12 21:09:42.772	2025-08-12 21:09:42.775	2	1	1
99	2	\N	Padaria	50.00	2025-08-07	\N	pendente	f	f	\N	2025-08-12 21:16:20.743	2025-08-12 21:16:20.744	5	1	1
101	2	\N	Padaria	50.00	2025-08-12	\N	pendente	f	f	\N	2025-08-12 22:30:11.998	2025-08-12 22:30:11.999	2	1	1
102	2	\N	tee	10.00	2025-08-09	\N	pendente	f	f	\N	2025-08-12 22:30:38.658	2025-08-12 22:30:38.659	4	1	1
100	2	\N	Luz	50.00	2025-08-12	\N	pendente	f	f	\N	2025-08-12 22:29:38.55	2025-08-12 22:31:07.048	5	1	1
103	2	\N	c6	50.00	2025-08-12	\N	pendente	f	f	\N	2025-08-12 23:04:17.677	2025-08-12 23:04:17.678	2	1	1
104	2	\N	eee	4.00	2025-08-12	\N	pendente	f	f	\N	2025-08-12 23:05:26.668	2025-08-12 23:05:26.668	4	1	1
105	2	\N	rrrr	4.00	2025-08-10	\N	pendente	f	f	\N	2025-08-12 23:06:17.565	2025-08-12 23:06:17.565	2	1	1
106	2	\N	tte	15.00	2025-08-08	\N	pendente	f	f	\N	2025-08-12 23:09:07.835	2025-08-12 23:09:07.835	5	1	1
109	2	\N	uuuuuuu	8.77	2025-08-09	\N	pendente	f	f	\N	2025-08-12 23:20:48.807	2025-08-12 23:20:48.808	4	1	1
110	2	\N	rrrrrrr	40.00	2025-08-10	\N	pendente	f	f	\N	2025-08-12 23:21:13.934	2025-08-12 23:21:13.935	2	1	1
\.


--
-- Data for Name: incomes; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.incomes (id, user_id, account_id, description, value, date, category, is_recurring, created_at, updated_at) FROM stdin;
1	1	1	Salário	3000.00	2025-07-06	Salário	f	2025-07-06 21:03:24.046489	2025-07-07 23:30:10.974306
2	1	1	Freelance	800.00	2025-07-06	Freelance	f	2025-07-06 21:03:24.046489	2025-07-07 23:30:10.974306
3	2	5	PCDF	4000.01	2025-07-03	trabalho	t	2025-07-07 23:32:22.41	2025-07-08 14:43:22.988
5	2	5	salario	14000.00	2025-08-05		f	2025-08-12 23:39:06.579	2025-08-12 23:39:06.581
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.notifications (id, user_id, type, message, read, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.transfers (id, user_id, from_account_id, to_account_id, value, description, date, created_at, updated_at) FROM stdin;
1	1	1	2	30.00		2025-07-07	2025-07-07 23:13:33.464+00	2025-07-07 23:13:33.466+00
2	2	4	5	354.00	Padaria	2025-07-04	2025-07-07 23:36:02.492+00	2025-07-07 23:36:02.493+00
5	2	5	4	1500.00		2025-07-08	2025-07-08 15:39:36.181+00	2025-07-08 15:39:36.182+00
3	2	5	\N	15.50	Padaria	2025-07-07	2025-07-07 23:41:13.982+00	2025-07-08 17:39:39.549+00
6	2	7	4	25.00	pix	2025-07-10	2025-07-08 17:40:10.927+00	2025-07-08 17:40:10.927+00
7	2	\N	5	15000.00		2025-08-11	2025-08-11 23:43:28.075+00	2025-08-11 23:43:28.076+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: finance
--

COPY public.users (id, name, email, password, role, created_at, updated_at) FROM stdin;
2	Ronie Ruas	ronieruas@gmail.com	$2b$10$lETkPCS7tPj1OPolQP4UY.oEz9gXiWdt2ww10UhxijqR5Js195Abu	admin	2025-07-07 23:23:25.365	2025-07-07 23:23:25.365
1	Admin	admin@admin.com	$2b$10$uM5/5kNfz0z7NQCjRcHzSuPE.SQbCGYNn/Mql4N8.LW60bd.bSAmq	admin	2025-07-06 21:03:24.041555	2025-07-07 23:23:56.312
\.


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.accounts_id_seq', 8, true);


--
-- Name: budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.budgets_id_seq', 6, true);


--
-- Name: credit_card_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.credit_card_payments_id_seq', 9, true);


--
-- Name: credit_cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.credit_cards_id_seq', 5, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.expenses_id_seq', 110, true);


--
-- Name: incomes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.incomes_id_seq', 5, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.transfers_id_seq', 7, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: finance
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


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
-- Name: accounts accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


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
-- Name: credit_cards credit_cards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.credit_cards
    ADD CONSTRAINT credit_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: expenses expenses_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: expenses expenses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


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
    ADD CONSTRAINT incomes_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: incomes incomes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.incomes
    ADD CONSTRAINT incomes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: transfers transfers_to_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: finance
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_to_account_id_fkey FOREIGN KEY (to_account_id) REFERENCES public.accounts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

