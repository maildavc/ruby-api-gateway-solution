SET search_path TO "SeaBaasAPIGateway-Core";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO products (id, name, description, owner_team, is_enabled)
VALUES (gen_random_uuid(), 'SeaBaaS SmartAdapter', 'SeaBaaS SmartAdapter services', 'Seabaas', true)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, owner_team = EXCLUDED.owner_team;

WITH product AS (
  SELECT id FROM products WHERE name = 'SeaBaaS SmartAdapter' LIMIT 1
), upsert_service AS (
  INSERT INTO services (
    id, product_id, service_name, base_path, version, description, owner_team,
    is_enabled, environment, cluster_id, destinations, load_balancing_policy,
    health_check_enabled, health_check_path, health_check_interval_seconds,
    enable_tracing, enable_metrics, log_sampling,
    requires_jwt, required_scopes,
    cache_enabled, cache_ttl_seconds,
    emit_events, topic_prefix, event_schema_version,
    default_crypto_algorithm, default_key_source, default_iv_source,
    default_encoding, default_require_iv
  )
  SELECT
    gen_random_uuid(),
    product.id,
    'CustomerManagement',
    '/gateway/customermanagement-smartadapter',
    'v1',
    'SeaBaas.SmartAdapter.CustomerManagement Middleware',
    'Seabaas',
    true,
    'dev',
    'customermanagement-cluster',
    '["https://test-gateway.seabaas.co/gateway/customermanagement-smartadapter"]'::jsonb,
    'RoundRobin',
    false, NULL, 30,
    true, true, 1.0,
    true, NULL,
    false, 60,
    false, NULL, NULL,
    'AES_256_GCM', 'UserProfileKey', 'UserProfileIv',
    'Base64', true
  FROM product
  ON CONFLICT (product_id, service_name, version) DO UPDATE SET
    base_path = EXCLUDED.base_path,
    description = EXCLUDED.description,
    owner_team = EXCLUDED.owner_team,
    environment = EXCLUDED.environment,
    cluster_id = EXCLUDED.cluster_id,
    destinations = EXCLUDED.destinations
  RETURNING id
)
INSERT INTO endpoints (
  id, service_id, endpoint_name, http_method, relative_path, upstream_path_template, is_enabled
)
SELECT
  gen_random_uuid(),
  upsert_service.id,
  data.endpoint_name,
  data.http_method,
  data.relative_path,
  data.upstream_path_template,
  true
FROM upsert_service
CROSS JOIN (VALUES
  ('issuecustomercheque', 'POST', '/IssueCustomerCheque/IssueCustomerCheque', '/IssueCustomerCheque/IssueCustomerCheque'),
  ('createindividualcustomer', 'POST', '/CustomerManager/CreateIndividualCustomer', '/CustomerManager/CreateIndividualCustomer'),
  ('createcorporatecustomer', 'POST', '/CustomerManager/CreateCorporateCustomer', '/CustomerManager/CreateCorporateCustomer'),
  ('createfulltierindividualcustomer', 'POST', '/CustomerManager/CreateFullTierIndividualCustomer', '/CustomerManager/CreateFullTierIndividualCustomer'),
  ('createfulltiercorporatecustomer', 'POST', '/CustomerManager/CreateFullTierCorporateCustomer', '/CustomerManager/CreateFullTierCorporateCustomer'),
  ('updatecustomerapprovalstatus', 'PATCH', '/CustomerManager/UpdateCustomerApprovalStatus/{customerId}', '/CustomerManager/UpdateCustomerApprovalStatus/{customerId}'),
  ('updatetransactionrules', 'POST', '/CustomerManager/UpdateTransactionRules', '/CustomerManager/UpdateTransactionRules'),
  ('getbranchlist', 'GET', '/CustomerManager/GetBranchList', '/CustomerManager/GetBranchList'),
  ('getcheque', 'GET', '/CustomerManager/GetCheque', '/CustomerManager/GetCheque'),
  ('getcustomerdetailsbycustomerid', 'GET', '/CustomerManager/GetCustomerDetailsByCustomerId', '/CustomerManager/GetCustomerDetailsByCustomerId'),
  ('getcustomerbynin', 'GET', '/CustomerManager/GetCustomerByNIN', '/CustomerManager/GetCustomerByNIN'),
  ('validatecustomerbvn', 'GET', '/CustomerManager/ValidateCustomerBVN', '/CustomerManager/ValidateCustomerBVN'),
  ('getindividualcustomerbycustomerid', 'GET', '/CustomerManager/GetIndividualCustomerByCustomerId', '/CustomerManager/GetIndividualCustomerByCustomerId'),
  ('getcustomercustomernumber', 'GET', '/CustomerManager/GetCustomerCustomerNumber', '/CustomerManager/GetCustomerCustomerNumber'),
  ('updatecustomer', 'POST', '/CustomerManager/UpdateCustomer', '/CustomerManager/UpdateCustomer'),
  ('getstatelistbycountryid', 'GET', '/CustomerManager/GetStateListByCountryId', '/CustomerManager/GetStateListByCountryId'),
  ('getregionlistbycountryid', 'GET', '/CustomerManager/GetRegionListByCountryId', '/CustomerManager/GetRegionListByCountryId'),
  ('getcountrylist', 'GET', '/CustomerManager/GetCountryList', '/CustomerManager/GetCountryList'),
  ('getlgalistbystateid', 'GET', '/CustomerManager/GetLgaListByStateId', '/CustomerManager/GetLgaListByStateId'),
  ('getcustmerbyphonenumber', 'GET', '/CustomerManager/GetCustmerByPhoneNumber', '/CustomerManager/GetCustmerByPhoneNumber'),
  ('getcurrencylist', 'GET', '/CustomerManager/GetCurrencyList', '/CustomerManager/GetCurrencyList'),
  ('updatecustomerdetails', 'POST', '/CustomerManager/UpdateCustomerDetails', '/CustomerManager/UpdateCustomerDetails'),
  ('addcustomersignatories', 'POST', '/CustomerManager/AddCustomerSignatories', '/CustomerManager/AddCustomerSignatories'),
  ('updatecustomerriskstatus', 'POST', '/CustomerManager/UpdateCustomerRiskStatus', '/CustomerManager/UpdateCustomerRiskStatus'),
  ('getmandatebycustomerid', 'GET', '/CustomerManager/GetMandateByCustomerId', '/CustomerManager/GetMandateByCustomerId'),
  ('endpoint-retrieves-customer-details-by-nin-bvn-tax-identification', 'GET', '/CustomerManager/GetCustomerDetailsByField', '/CustomerManager/GetCustomerDetailsByField'),
  ('add-executive-description', 'POST', '/CustomerManager/AddExecutive', '/CustomerManager/AddExecutive'),
  ('validate-existing-phone-numberdescription', 'POST', '/CustomerManager/ValidateExistingPhoneNumber', '/CustomerManager/ValidateExistingPhoneNumber'),
  ('searchcustomer', 'GET', '/CustomerManager/SearchCustomer', '/CustomerManager/SearchCustomer')
) AS data(endpoint_name, http_method, relative_path, upstream_path_template)
ON CONFLICT (service_id, endpoint_name) DO UPDATE SET
  http_method = EXCLUDED.http_method,
  relative_path = EXCLUDED.relative_path,
  upstream_path_template = EXCLUDED.upstream_path_template,
  is_enabled = true;

WITH product AS (
  SELECT id FROM products WHERE name = 'SeaBaaS SmartAdapter' LIMIT 1
), upsert_service AS (
  INSERT INTO services (
    id, product_id, service_name, base_path, version, description, owner_team,
    is_enabled, environment, cluster_id, destinations, load_balancing_policy,
    health_check_enabled, health_check_path, health_check_interval_seconds,
    enable_tracing, enable_metrics, log_sampling,
    requires_jwt, required_scopes,
    cache_enabled, cache_ttl_seconds,
    emit_events, topic_prefix, event_schema_version,
    default_crypto_algorithm, default_key_source, default_iv_source,
    default_encoding, default_require_iv
  )
  SELECT
    gen_random_uuid(),
    product.id,
    'AccountEnquiries',
    '/gateway/seabaas-accountenquiries-smartadapter',
    'v1',
    'SeaBaas.SmartAdapter.AccountEnquiries Middleware',
    'Seabaas',
    true,
    'dev',
    'accountenquiries-cluster',
    '["https://test-gateway.seabaas.co/gateway/seabaas-accountenquiries-smartadapter"]'::jsonb,
    'RoundRobin',
    false, NULL, 30,
    true, true, 1.0,
    true, NULL,
    false, 60,
    false, NULL, NULL,
    'AES_256_GCM', 'UserProfileKey', 'UserProfileIv',
    'Base64', true
  FROM product
  ON CONFLICT (product_id, service_name, version) DO UPDATE SET
    base_path = EXCLUDED.base_path,
    description = EXCLUDED.description,
    owner_team = EXCLUDED.owner_team,
    environment = EXCLUDED.environment,
    cluster_id = EXCLUDED.cluster_id,
    destinations = EXCLUDED.destinations
  RETURNING id
)
INSERT INTO endpoints (
  id, service_id, endpoint_name, http_method, relative_path, upstream_path_template, is_enabled
)
SELECT
  gen_random_uuid(),
  upsert_service.id,
  data.endpoint_name,
  data.http_method,
  data.relative_path,
  data.upstream_path_template,
  true
FROM upsert_service
CROSS JOIN (VALUES
  ('get-accounts-getaccountsbybranchcodeandcategory', 'GET', '/Accounts/GetAccountsByBranchCodeAndCategory', '/Accounts/GetAccountsByBranchCodeAndCategory'),
  ('get-accounts-getaccountsbycustomerid', 'GET', '/Accounts/GetAccountsByCustomerId', '/Accounts/GetAccountsByCustomerId'),
  ('get-accounts-getaccountbyparentglandbranchcode', 'GET', '/Accounts/GetAccountByParentGlAndBranchCode', '/Accounts/GetAccountByParentGlAndBranchCode'),
  ('get-accounts-getaccountbyaccountname', 'GET', '/Accounts/GetAccountByAccountName', '/Accounts/GetAccountByAccountName'),
  ('get-accounts-donameenquirybyaccountno', 'GET', '/Accounts/DoNameEnquiryByAccountNo', '/Accounts/DoNameEnquiryByAccountNo'),
  ('get-accounts-getaccountage', 'GET', '/Accounts/GetAccountAge', '/Accounts/GetAccountAge'),
  ('get-accounts-getaccountdetailsbybvn', 'GET', '/Accounts/GetAccountDetailsByBvn', '/Accounts/GetAccountDetailsByBvn'),
  ('get-accounts-getaccountbymobile', 'GET', '/Accounts/GetAccountByMobile', '/Accounts/GetAccountByMobile'),
  ('get-accounts-getaccountsbynin', 'GET', '/Accounts/GetAccountsByNIN', '/Accounts/GetAccountsByNIN'),
  ('get-accounts-getaccountsbyaccountnoorphoneno', 'GET', '/Accounts/GetAccountsByAccountNoOrPhoneNo', '/Accounts/GetAccountsByAccountNoOrPhoneNo'),
  ('get-accounts-dobalanceenquirybyaccountno', 'GET', '/Accounts/DoBalanceEnquiryByAccountNo', '/Accounts/DoBalanceEnquiryByAccountNo'),
  ('get-accounts-internal-account', 'GET', '/Accounts/internal/account', '/Accounts/internal/account'),
  ('get-accounts-getopeningclosingbalances', 'GET', '/Accounts/GetOpeningClosingBalances', '/Accounts/GetOpeningClosingBalances'),
  ('get-accounts-getopeningclosingbalancebydaterange', 'GET', '/Accounts/GetOpeningClosingBalanceByDateRange', '/Accounts/GetOpeningClosingBalanceByDateRange'),
  ('get-accounts-getaccounts', 'GET', '/Accounts/GetAccounts', '/Accounts/GetAccounts')
) AS data(endpoint_name, http_method, relative_path, upstream_path_template)
ON CONFLICT (service_id, endpoint_name) DO UPDATE SET
  http_method = EXCLUDED.http_method,
  relative_path = EXCLUDED.relative_path,
  upstream_path_template = EXCLUDED.upstream_path_template,
  is_enabled = true;

WITH product AS (
  SELECT id FROM products WHERE name = 'SeaBaaS SmartAdapter' LIMIT 1
), upsert_service AS (
  INSERT INTO services (
    id, product_id, service_name, base_path, version, description, owner_team,
    is_enabled, environment, cluster_id, destinations, load_balancing_policy,
    health_check_enabled, health_check_path, health_check_interval_seconds,
    enable_tracing, enable_metrics, log_sampling,
    requires_jwt, required_scopes,
    cache_enabled, cache_ttl_seconds,
    emit_events, topic_prefix, event_schema_version,
    default_crypto_algorithm, default_key_source, default_iv_source,
    default_encoding, default_require_iv
  )
  SELECT
    gen_random_uuid(),
    product.id,
    'AccountFundManagement',
    '/gateway/seabaas-accountfundsmanagement-smartadapter',
    'v1',
    'SeaBaas.SmartAdapter.AccountFundManagement Middleware',
    'Seabaas',
    true,
    'dev',
    'accountfundmanagement-cluster',
    '["https://test-gateway.seabaas.co/gateway/seabaas-accountfundsmanagement-smartadapter"]'::jsonb,
    'RoundRobin',
    false, NULL, 30,
    true, true, 1.0,
    true, NULL,
    false, 60,
    false, NULL, NULL,
    'AES_256_GCM', 'UserProfileKey', 'UserProfileIv',
    'Base64', true
  FROM product
  ON CONFLICT (product_id, service_name, version) DO UPDATE SET
    base_path = EXCLUDED.base_path,
    description = EXCLUDED.description,
    owner_team = EXCLUDED.owner_team,
    environment = EXCLUDED.environment,
    cluster_id = EXCLUDED.cluster_id,
    destinations = EXCLUDED.destinations
  RETURNING id
)
INSERT INTO endpoints (
  id, service_id, endpoint_name, http_method, relative_path, upstream_path_template, is_enabled
)
SELECT
  gen_random_uuid(),
  upsert_service.id,
  data.endpoint_name,
  data.http_method,
  data.relative_path,
  data.upstream_path_template,
  true
FROM upsert_service
CROSS JOIN (VALUES
  ('placelien', 'POST', '/AccountFundManager/PlaceLien', '/AccountFundManager/PlaceLien'),
  ('removelien', 'POST', '/AccountFundManager/RemoveLien', '/AccountFundManager/RemoveLien'),
  ('setoverdraftlimit', 'POST', '/AccountFundManager/SetOverdraftLimit', '/AccountFundManager/SetOverdraftLimit'),
  ('bulkplacelien', 'POST', '/AccountFundManager/BulkPlaceLien', '/AccountFundManager/BulkPlaceLien'),
  ('bulkremovelien', 'POST', '/AccountFundManager/BulkRemoveLien', '/AccountFundManager/BulkRemoveLien'),
  ('get-accountfundmanager-getliensbyaccountno', 'GET', '/AccountFundManager/GetLiensByAccountNo', '/AccountFundManager/GetLiensByAccountNo'),
  ('get-accountfundmanager-getlienbylienrequestid', 'GET', '/AccountFundManager/GetLienByLienRequestId', '/AccountFundManager/GetLienByLienRequestId')
) AS data(endpoint_name, http_method, relative_path, upstream_path_template)
ON CONFLICT (service_id, endpoint_name) DO UPDATE SET
  http_method = EXCLUDED.http_method,
  relative_path = EXCLUDED.relative_path,
  upstream_path_template = EXCLUDED.upstream_path_template,
  is_enabled = true;

WITH product AS (
  SELECT id FROM products WHERE name = 'SeaBaaS SmartAdapter' LIMIT 1
), upsert_service AS (
  INSERT INTO services (
    id, product_id, service_name, base_path, version, description, owner_team,
    is_enabled, environment, cluster_id, destinations, load_balancing_policy,
    health_check_enabled, health_check_path, health_check_interval_seconds,
    enable_tracing, enable_metrics, log_sampling,
    requires_jwt, required_scopes,
    cache_enabled, cache_ttl_seconds,
    emit_events, topic_prefix, event_schema_version,
    default_crypto_algorithm, default_key_source, default_iv_source,
    default_encoding, default_require_iv
  )
  SELECT
    gen_random_uuid(),
    product.id,
    'AccountManagement',
    '/gateway/seabaas-accountmanagement-smartadapter',
    'v1',
    'SeaBaas.SmartAdapter.AccountManagement Middleware',
    'Seabaas',
    true,
    'dev',
    'accountmanagement-cluster',
    '["https://test-gateway.seabaas.co/gateway/seabaas-accountmanagement-smartadapter"]'::jsonb,
    'RoundRobin',
    false, NULL, 30,
    true, true, 1.0,
    true, NULL,
    false, 60,
    false, NULL, NULL,
    'AES_256_GCM', 'UserProfileKey', 'UserProfileIv',
    'Base64', true
  FROM product
  ON CONFLICT (product_id, service_name, version) DO UPDATE SET
    base_path = EXCLUDED.base_path,
    description = EXCLUDED.description,
    owner_team = EXCLUDED.owner_team,
    environment = EXCLUDED.environment,
    cluster_id = EXCLUDED.cluster_id,
    destinations = EXCLUDED.destinations
  RETURNING id
)
INSERT INTO endpoints (
  id, service_id, endpoint_name, http_method, relative_path, upstream_path_template, is_enabled
)
SELECT
  gen_random_uuid(),
  upsert_service.id,
  data.endpoint_name,
  data.http_method,
  data.relative_path,
  data.upstream_path_template,
  true
FROM upsert_service
CROSS JOIN (VALUES
  ('freezeaccount', 'PUT', '/accountManager/FreezeAccount', '/accountManager/FreezeAccount'),
  ('changecustomerbranchcode', 'PUT', '/accountManager/ChangeCustomerBranchCode', '/accountManager/ChangeCustomerBranchCode'),
  ('enablesmsalert', 'PUT', '/accountManager/EnableSmsAlert', '/accountManager/EnableSmsAlert'),
  ('disablesmsalert', 'PUT', '/accountManager/DisableSmsAlert', '/accountManager/DisableSmsAlert'),
  ('deactivateaccount', 'PUT', '/accountManager/DeactivateAccount', '/accountManager/DeactivateAccount'),
  ('changeaccountname', 'PUT', '/accountManager/ChangeAccountName', '/accountManager/ChangeAccountName'),
  ('enableemailalert', 'PUT', '/accountManager/EnableEmailAlert', '/accountManager/EnableEmailAlert'),
  ('upgradeaccount', 'POST', '/accountManager/UpgradeAccount', '/accountManager/UpgradeAccount'),
  ('updaterelationshipaccountmanager', 'PUT', '/accountManager/UpdateRelationshipAccountManager', '/accountManager/UpdateRelationshipAccountManager'),
  ('activateaccount', 'PUT', '/accountManager/ActivateAccount', '/accountManager/ActivateAccount'),
  ('update-account-details', 'PUT', '/accountManager/UpdateAccountDetails', '/accountManager/UpdateAccountDetails'),
  ('add-account-mandate', 'POST', '/accountManager/AddAccountMandate', '/accountManager/AddAccountMandate'),
  ('deletes-account-mandate', 'DELETE', '/accountManager/DeleteAccountMandate', '/accountManager/DeleteAccountMandate'),
  ('get-mandate-by-account-number', 'GET', '/accountManager/GetMandateByAccountNo', '/accountManager/GetMandateByAccountNo'),
  ('liftrestriction', 'PUT', '/accountManager/LiftRestriction', '/accountManager/LiftRestriction'),
  ('freezedaccountentries', 'GET', '/accountManager/FreezedAccountEntries', '/accountManager/FreezedAccountEntries'),
  ('accountrestriction', 'GET', '/accountManager/AccountRestriction', '/accountManager/AccountRestriction'),
  ('freezemutipleaccounts', 'PUT', '/accountManager/FreezeMultipleAccounts', '/accountManager/FreezeMultipleAccounts'),
  ('changeaccountphonenumber', 'PUT', '/accountManager/ChangeAccountphoneNumber', '/accountManager/ChangeAccountphoneNumber'),
  ('updatebvnornin', 'PUT', '/accountManager/UpdateBvnOrNin', '/accountManager/UpdateBvnOrNin'),
  ('getamfrate', 'GET', '/accountManager/GetAmfRate', '/accountManager/GetAmfRate'),
  ('createconcession', 'POST', '/concessionManager/CreateConcession', '/concessionManager/CreateConcession'),
  ('updateconcession', 'PUT', '/concessionManager/UpdateConcession', '/concessionManager/UpdateConcession'),
  ('getconcessionbyaccountno', 'GET', '/concessionManager/GetConcessionByAccountNo', '/concessionManager/GetConcessionByAccountNo'),
  ('deleteconcession', 'PUT', '/concessionManager/DeleteConcession', '/concessionManager/DeleteConcession')
) AS data(endpoint_name, http_method, relative_path, upstream_path_template)
ON CONFLICT (service_id, endpoint_name) DO UPDATE SET
  http_method = EXCLUDED.http_method,
  relative_path = EXCLUDED.relative_path,
  upstream_path_template = EXCLUDED.upstream_path_template,
  is_enabled = true;

WITH product AS (
  SELECT id FROM products WHERE name = 'SeaBaaS SmartAdapter' LIMIT 1
), upsert_service AS (
  INSERT INTO services (
    id, product_id, service_name, base_path, version, description, owner_team,
    is_enabled, environment, cluster_id, destinations, load_balancing_policy,
    health_check_enabled, health_check_path, health_check_interval_seconds,
    enable_tracing, enable_metrics, log_sampling,
    requires_jwt, required_scopes,
    cache_enabled, cache_ttl_seconds,
    emit_events, topic_prefix, event_schema_version,
    default_crypto_algorithm, default_key_source, default_iv_source,
    default_encoding, default_require_iv
  )
  SELECT
    gen_random_uuid(),
    product.id,
    'AccountOpening',
    '/gateway/seabaas-accountopening-smartadapter',
    'v1',
    'SeaBaas.SmartAdapter.AccountOpening Middleware',
    'Seabaas',
    true,
    'dev',
    'accountopening-cluster',
    '["https://test-gateway.seabaas.co/gateway/seabaas-accountopening-smartadapter"]'::jsonb,
    'RoundRobin',
    false, NULL, 30,
    true, true, 1.0,
    true, NULL,
    false, 60,
    false, NULL, NULL,
    'AES_256_GCM', 'UserProfileKey', 'UserProfileIv',
    'Base64', true
  FROM product
  ON CONFLICT (product_id, service_name, version) DO UPDATE SET
    base_path = EXCLUDED.base_path,
    description = EXCLUDED.description,
    owner_team = EXCLUDED.owner_team,
    environment = EXCLUDED.environment,
    cluster_id = EXCLUDED.cluster_id,
    destinations = EXCLUDED.destinations
  RETURNING id
)
INSERT INTO endpoints (
  id, service_id, endpoint_name, http_method, relative_path, upstream_path_template, is_enabled
)
SELECT
  gen_random_uuid(),
  upsert_service.id,
  data.endpoint_name,
  data.http_method,
  data.relative_path,
  data.upstream_path_template,
  true
FROM upsert_service
CROSS JOIN (VALUES
  ('opencustomeraccount', 'POST', '/accountopening/opencustomeraccount', '/accountopening/opencustomeraccount'),
  ('openinternalaccount', 'POST', '/accountopening/openinternalAccount', '/accountopening/openinternalAccount'),
  ('opencustomeraccountwithaccountnumber', 'POST', '/accountopening/opencustomeraccountWithaccountnumber', '/accountopening/opencustomeraccountWithaccountnumber'),
  ('openbulkinternalaccounts', 'POST', '/accountopening/openBulkInternalAccounts', '/accountopening/openBulkInternalAccounts')
) AS data(endpoint_name, http_method, relative_path, upstream_path_template)
ON CONFLICT (service_id, endpoint_name) DO UPDATE SET
  http_method = EXCLUDED.http_method,
  relative_path = EXCLUDED.relative_path,
  upstream_path_template = EXCLUDED.upstream_path_template,
  is_enabled = true;

WITH product AS (
  SELECT id FROM products WHERE name = 'SeaBaaS SmartAdapter' LIMIT 1
), upsert_service AS (
  INSERT INTO services (
    id, product_id, service_name, base_path, version, description, owner_team,
    is_enabled, environment, cluster_id, destinations, load_balancing_policy,
    health_check_enabled, health_check_path, health_check_interval_seconds,
    enable_tracing, enable_metrics, log_sampling,
    requires_jwt, required_scopes,
    cache_enabled, cache_ttl_seconds,
    emit_events, topic_prefix, event_schema_version,
    default_crypto_algorithm, default_key_source, default_iv_source,
    default_encoding, default_require_iv
  )
  SELECT
    gen_random_uuid(),
    product.id,
    'CentralJournalPosting',
    '/gateway/seabaas-centraljournalposting-smartadapter',
    'v1',
    'SeaBaas.SmartAdapter.CentralJournalPosting',
    'Seabaas',
    true,
    'dev',
    'centraljournalposting-cluster',
    '["https://test-gateway.seabaas.co/gateway/seabaas-centraljournalposting-smartadapter"]'::jsonb,
    'RoundRobin',
    false, NULL, 30,
    true, true, 1.0,
    true, NULL,
    false, 60,
    false, NULL, NULL,
    'AES_256_GCM', 'UserProfileKey', 'UserProfileIv',
    'Base64', true
  FROM product
  ON CONFLICT (product_id, service_name, version) DO UPDATE SET
    base_path = EXCLUDED.base_path,
    description = EXCLUDED.description,
    owner_team = EXCLUDED.owner_team,
    environment = EXCLUDED.environment,
    cluster_id = EXCLUDED.cluster_id,
    destinations = EXCLUDED.destinations
  RETURNING id
)
INSERT INTO endpoints (
  id, service_id, endpoint_name, http_method, relative_path, upstream_path_template, is_enabled
)
SELECT
  gen_random_uuid(),
  upsert_service.id,
  data.endpoint_name,
  data.http_method,
  data.relative_path,
  data.upstream_path_template,
  true
FROM upsert_service
CROSS JOIN (VALUES
  ('createpostjournalinternalv1', 'POST', '/postjournal/internal', '/postjournal/internal'),
  ('createpostjournalinternal', 'POST', '/postjournal', '/postjournal'),
  ('createpostjournalreversal', 'POST', '/postjournal/reversal', '/postjournal/reversal'),
  ('reversetransaction', 'POST', '/postjournal/reversal-transaction', '/postjournal/reversal-transaction')
) AS data(endpoint_name, http_method, relative_path, upstream_path_template)
ON CONFLICT (service_id, endpoint_name) DO UPDATE SET
  http_method = EXCLUDED.http_method,
  relative_path = EXCLUDED.relative_path,
  upstream_path_template = EXCLUDED.upstream_path_template,
  is_enabled = true;

WITH product AS (
  SELECT id FROM products WHERE name = 'SeaBaaS SmartAdapter' LIMIT 1
), upsert_service AS (
  INSERT INTO services (
    id, product_id, service_name, base_path, version, description, owner_team,
    is_enabled, environment, cluster_id, destinations, load_balancing_policy,
    health_check_enabled, health_check_path, health_check_interval_seconds,
    enable_tracing, enable_metrics, log_sampling,
    requires_jwt, required_scopes,
    cache_enabled, cache_ttl_seconds,
    emit_events, topic_prefix, event_schema_version,
    default_crypto_algorithm, default_key_source, default_iv_source,
    default_encoding, default_require_iv
  )
  SELECT
    gen_random_uuid(),
    product.id,
    'TransactionEnquiries',
    '/gateway/seabaas-transactionenquiries-smartadapter',
    'v1',
    'SeaBaas.SmartAdapter.TransactionEnquiries Middleware',
    'Seabaas',
    true,
    'dev',
    'transactionenquiries-cluster',
    '["https://test-gateway.seabaas.co/gateway/seabaas-transactionenquiries-smartadapter"]'::jsonb,
    'RoundRobin',
    false, NULL, 30,
    true, true, 1.0,
    true, NULL,
    false, 60,
    false, NULL, NULL,
    'AES_256_GCM', 'UserProfileKey', 'UserProfileIv',
    'Base64', true
  FROM product
  ON CONFLICT (product_id, service_name, version) DO UPDATE SET
    base_path = EXCLUDED.base_path,
    description = EXCLUDED.description,
    owner_team = EXCLUDED.owner_team,
    environment = EXCLUDED.environment,
    cluster_id = EXCLUDED.cluster_id,
    destinations = EXCLUDED.destinations
  RETURNING id
)
INSERT INTO endpoints (
  id, service_id, endpoint_name, http_method, relative_path, upstream_path_template, is_enabled
)
SELECT
  gen_random_uuid(),
  upsert_service.id,
  data.endpoint_name,
  data.http_method,
  data.relative_path,
  data.upstream_path_template,
  true
FROM upsert_service
CROSS JOIN (VALUES
  ('get-transactions-gettransactionsbydate', 'GET', '/Transactions/GetTransactionsByDate', '/Transactions/GetTransactionsByDate'),
  ('get-transactions-getpaginatedtransactionsbydate', 'GET', '/Transactions/GetPaginatedTransactionsByDate', '/Transactions/GetPaginatedTransactionsByDate'),
  ('get-transactions-getlastntransactions', 'GET', '/Transactions/GetLastNTransactions', '/Transactions/GetLastNTransactions'),
  ('get-transactions-gettransactionsbyid', 'GET', '/Transactions/GetTransactionsById', '/Transactions/GetTransactionsById'),
  ('get-transactions-gettransactions', 'GET', '/Transactions/GetTransactions', '/Transactions/GetTransactions'),
  ('get-transactions-gettransactionsbyreconciliationremark', 'GET', '/Transactions/GetTransactionsByReconciliationRemark', '/Transactions/GetTransactionsByReconciliationRemark'),
  ('get-transactions-gettransactionsbyrequestid', 'GET', '/Transactions/GetTransactionsByRequestId', '/Transactions/GetTransactionsByRequestId')
) AS data(endpoint_name, http_method, relative_path, upstream_path_template)
ON CONFLICT (service_id, endpoint_name) DO UPDATE SET
  http_method = EXCLUDED.http_method,
  relative_path = EXCLUDED.relative_path,
  upstream_path_template = EXCLUDED.upstream_path_template,
  is_enabled = true;
