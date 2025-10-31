/**
 * Application configuration
 */

export const appConfig = {
  // Mock API configuration
  MOCK_API: false, // Set to true to use mock data instead of real API calls
}

// Mock cost provider data
export const MOCK_COST_PROVIDER_DATA = {
  "cost_providers": [
    {
      "id": 395,
      "tenant_id": 1,
      "organization": "Landratsamt Breisgau-Hochschwarzwald",
      "department": "Jugendamt",
      "street_address": "Berliner Allee 3",
      "zip": "79114",
      "city": "Freiburg"
    },
    {
      "id": 402,
      "tenant_id": 1,
      "organization": "Stadtkreis Ulm",
      "department": "Jugendamt", 
      "street_address": "Olgastraße 152",
      "zip": "89073",
      "city": "Ulm"
    },
    {
      "id": 403,
      "tenant_id": 1,
      "organization": "Stadt Stuttgart",
      "department": "Jugendamt",
      "street_address": "Wilhelmstraße 3",
      "zip": "70182",
      "city": "Stuttgart"
    },
    {
      "id": 404,
      "tenant_id": 1,
      "organization": "Landkreis Esslingen",
      "department": "Jugendamt",
      "street_address": "Pulverwiesen 11",
      "zip": "73728",
      "city": "Esslingen am Neckar"
    },
    {
      "id": 405,
      "tenant_id": 1,
      "organization": "Stadt Karlsruhe",
      "department": "Jugendamt",
      "street_address": "Kaiserallee 4",
      "zip": "76133",
      "city": "Karlsruhe"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 50
}

// Mock client data for development/testing
export const MOCK_CLIENT_DATA = {
  "clients": [
    {
      "id": 461,
      "tenant_id": 1,
      "cost_provider_id": 395,
      "cost_provider": {
        "id": 395,
        "tenant_id": 1,
        "organization": "Landratsamt Breisgau-Hochschwarzwald",
        "department": "Jugendamt",
        "street_address": "Berliner Allee 3",
        "zip": "79114",
        "city": "Freiburg",
        "created_at": "2025-10-30T09:23:45.378309+01:00",
        "updated_at": "2025-10-30T09:23:45.378309+01:00"
      },
      "first_name": "Emma",
      "last_name": "Johnson",
      "date_of_birth": "2017-08-01T00:00:00Z",
      "gender": "female",
      "primary_language": "English",
      "contact_first_name": "Christina",
      "contact_last_name": "Johnson",
      "contact_email": "Christina.Johnson@email.com",
      "contact_phone": "+1-555-2936",
      "alternative_first_name": "Gregory",
      "alternative_last_name": "Johnson",
      "alternative_phone": "+1-555-2375",
      "alternative_email": "Gregory.Johnson@work.com",
      "street_address": "123 Maple Street",
      "zip": "62701",
      "city": "Springfield",
      "email": "Emma.Johnson@academy.edu",
      "phone": "+1-555-3584",
      "invoiced_individually": false,
      "therapy_title": "Leichte Intelligenzminderung",
      "provider_approval_code": "APPR-20253480",
      "provider_approval_date": "2025-02-28T00:00:00Z",
      "status": "active",
      "notes": "8-year-old student. Parents: Christina (mother) and Gregory (father). rder. Parents: Sarah (mother) and Michael (father)",
      "created_at": "2025-10-30T09:23:45.384251+01:00",
      "updated_at": "2025-10-30T09:23:45.384251+01:00"
    },
    {
      "id": 462,
      "tenant_id": 1,
      "first_name": "Michael",
      "last_name": "Chen",
      "date_of_birth": "2008-06-11T00:00:00Z",
      "gender": "male",
      "primary_language": "English",
      "contact_first_name": "Patricia",
      "contact_last_name": "Chen",
      "contact_email": "Patricia.Chen@email.com",
      "contact_phone": "+1-555-2537",
      "alternative_first_name": "Eric",
      "alternative_last_name": "Chen",
      "alternative_phone": "+1-555-8441",
      "alternative_email": "Eric.Chen@work.com",
      "street_address": "456 Oak Avenue",
      "zip": "60601",
      "city": "Chicago",
      "email": "Michael.Chen@academy.edu",
      "phone": "+1-555-7301",
      "invoiced_individually": false,
      "therapy_title": "Isolierte Rechtschreibstörung",
      "provider_approval_code": "APP-20250872",
      "status": "waiting",
      "notes": "17-year-old student. Parents: Patricia (mother) and Eric (father).  trauma. Parents: Lisa (mother) and David (father)",
      "created_at": "2025-10-30T09:23:45.387506+01:00",
      "updated_at": "2025-10-30T09:23:45.387506+01:00"
    },
    {
      "id": 463,
      "tenant_id": 1,
      "first_name": "Sarah",
      "last_name": "Williams",
      "date_of_birth": "2012-11-08T00:00:00Z",
      "gender": "female",
      "primary_language": "English",
      "contact_first_name": "Michelle",
      "contact_last_name": "Williams",
      "contact_email": "Michelle.Williams@email.com",
      "contact_phone": "+1-555-0736",
      "alternative_first_name": "Michael",
      "alternative_last_name": "Williams",
      "alternative_phone": "+1-555-1472",
      "alternative_email": "Michael.Williams@work.com",
      "street_address": "789 Pine Road",
      "zip": "53703",
      "city": "Madison",
      "email": "Sarah.Williams@school.org",
      "phone": "+1-555-2400",
      "invoiced_individually": false,
      "therapy_title": "Anpassungsstörung",
      "provider_approval_code": "APP-20254373",
      "provider_approval_date": "2021-04-01T00:00:00Z",
      "status": "archived",
      "notes": "13-year-old student. Parents: Michelle (mother) and Michael (father). es. Parents: Jennifer (mother) and Robert (father)",
      "created_at": "2025-10-30T09:23:45.388064+01:00",
      "updated_at": "2025-10-30T09:23:45.388064+01:00"
    },
    {
      "id": 464,
      "tenant_id": 1,
      "cost_provider_id": 402,
      "cost_provider": {
        "id": 402,
        "tenant_id": 1,
        "organization": "Stadtkreis Ulm",
        "department": "Jugendamt",
        "street_address": "Olgastraße 152",
        "zip": "89073",
        "city": "Ulm",
        "created_at": "2025-10-30T09:23:45.382037+01:00",
        "updated_at": "2025-10-30T09:23:45.382037+01:00"
      },
      "first_name": "David",
      "last_name": "Rodriguez",
      "date_of_birth": "2011-05-14T00:00:00Z",
      "gender": "male",
      "primary_language": "Spanish",
      "contact_first_name": "Patricia",
      "contact_last_name": "Rodriguez",
      "contact_email": "Patricia.Rodriguez@email.com",
      "contact_phone": "+1-555-9270",
      "alternative_first_name": "Brandon",
      "alternative_last_name": "Rodriguez",
      "alternative_phone": "+1-555-9845",
      "alternative_email": "Brandon.Rodriguez@work.com",
      "street_address": "321 Elm Street",
      "zip": "53202",
      "city": "Milwaukee",
      "email": "David.Rodriguez@student.edu",
      "phone": "+1-555-5074",
      "invoiced_individually": false,
      "therapy_title": "Leichte Intelligenzminderung",
      "provider_approval_code": "PROV-20251585",
      "provider_approval_date": "2024-08-19T00:00:00Z",
      "status": "active",
      "notes": "14-year-old student. Parents: Patricia (mother) and Brandon (father). s (father). Prefers Spanish for family discussions",
      "created_at": "2025-10-30T09:23:45.388664+01:00",
      "updated_at": "2025-10-30T09:23:45.388664+01:00"
    },
    {
      "id": 465,
      "tenant_id": 1,
      "first_name": "Lisa",
      "last_name": "Anderson",
      "date_of_birth": "2014-11-27T00:00:00Z",
      "gender": "female",
      "primary_language": "English",
      "contact_first_name": "Melissa",
      "contact_last_name": "Anderson",
      "contact_email": "Melissa.Anderson@email.com",
      "contact_phone": "+1-555-6828",
      "alternative_first_name": "Andrew",
      "alternative_last_name": "Anderson",
      "alternative_phone": "+1-555-4631",
      "alternative_email": "Andrew.Anderson@work.com",
      "street_address": "654 Birch Lane",
      "zip": "54301",
      "city": "Green Bay",
      "email": "Lisa.Anderson@highschool.edu",
      "phone": "+1-555-7696",
      "invoiced_individually": false,
      "therapy_title": "Leichte Intelligenzminderung",
      "provider_approval_code": "PROV-20251109",
      "status": "waiting",
      "notes": "11-year-old student. Parents: Melissa (mother) and Andrew (father). ) and James (father). Responds well to mindfulness",
      "created_at": "2025-10-30T09:23:45.389298+01:00",
      "updated_at": "2025-10-30T09:23:45.389298+01:00"
    }
  ],
  "limit": 500,
  "page": 1,
  "total": 46
}

// Mock diagnostic standards data
export const MOCK_DIAGNOSTIC_STANDARDS_DATA = {
  "diagnostic_standards": [
    {
      "id": 1,
      "code": "F70.1",
      "title": "Leichte Intelligenzminderung",
      "category": "Intelligenzminderung",
      "description": "IQ zwischen 50-69"
    },
    {
      "id": 2,
      "code": "F81.1",
      "title": "Isolierte Rechtschreibstörung", 
      "category": "Entwicklungsstörungen schulischer Fertigkeiten",
      "description": "Spezifische Rechtschreibstörung"
    },
    {
      "id": 3,
      "code": "F43.2",
      "title": "Anpassungsstörung",
      "category": "Reaktionen auf schwere Belastungen",
      "description": "Anpassungsstörungen"
    },
    {
      "id": 4,
      "code": "F90.0",
      "title": "Einfache Aktivitäts- und Aufmerksamkeitsstörung",
      "category": "ADHS",
      "description": "Aufmerksamkeitsdefizit-/Hyperaktivitätsstörung"
    },
    {
      "id": 5,
      "code": "F81.0",
      "title": "Lese- und Rechtschreibstörung",
      "category": "Entwicklungsstörungen schulischer Fertigkeiten", 
      "description": "Kombinierte Störung des Schriftspracherwerbs"
    },
    {
      "id": 6,
      "code": "F84.0",
      "title": "Frühkindlicher Autismus",
      "category": "Tiefgreifende Entwicklungsstörungen",
      "description": "Autistische Störung"
    },
    {
      "id": 7,
      "code": "F41.9",
      "title": "Angststörung, nicht näher bezeichnet",
      "category": "Angststörungen",
      "description": "Nicht spezifizierte Angststörung"
    },
    {
      "id": 8,
      "code": "F32.1",
      "title": "Mittelgradige depressive Episode",
      "category": "Affektive Störungen",
      "description": "Depression mittleren Schweregrades"
    },
    {
      "id": 9,
      "code": "F80.1",
      "title": "Expressive Sprachstörung",
      "category": "Entwicklungsstörungen des Sprechens und der Sprache",
      "description": "Störung der Sprachproduktion"
    },
    {
      "id": 10,
      "code": "F93.0",
      "title": "Emotionale Störung mit Trennungsangst des Kindesalters",
      "category": "Emotionale Störungen des Kindesalters",
      "description": "Trennungsangst bei Kindern"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 100
}