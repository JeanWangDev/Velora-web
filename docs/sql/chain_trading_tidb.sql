-- TiDB Cloud / MySQL-compatible schema for BSC Testnet mock trading.
-- Use utf8mb4. All token amounts are stored as integer strings to avoid float errors.

CREATE TABLE IF NOT EXISTS user_wallets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  chain VARCHAR(32) NOT NULL,
  wallet_address VARCHAR(64) NOT NULL,
  wallet_label VARCHAR(64) NULL,
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_chain_wallet (user_id, chain, wallet_address),
  KEY idx_wallet_address (wallet_address)
);

CREATE TABLE IF NOT EXISTS chain_trade_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NULL,
  wallet_address VARCHAR(64) NOT NULL,
  chain VARCHAR(32) NOT NULL,
  chain_id INT NOT NULL,
  environment VARCHAR(32) NOT NULL,
  adapter VARCHAR(64) NOT NULL,
  contract_address VARCHAR(64) NOT NULL,
  tx_hash VARCHAR(80) NOT NULL,
  symbol VARCHAR(32) NOT NULL,
  contract_pair VARCHAR(64) NOT NULL,
  side VARCHAR(16) NOT NULL,
  order_type VARCHAR(16) NOT NULL,
  margin_usdc_raw VARCHAR(80) NOT NULL,
  margin_usdc_display VARCHAR(40) NOT NULL,
  leverage_x100 INT NOT NULL,
  slippage_percent VARCHAR(20) NOT NULL,
  status VARCHAR(24) NOT NULL,
  block_number BIGINT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_tx_hash (tx_hash),
  KEY idx_user_status (user_id, status),
  KEY idx_wallet_status (wallet_address, status),
  KEY idx_symbol_created (symbol, created_at)
);

CREATE TABLE IF NOT EXISTS chain_trade_positions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NULL,
  wallet_address VARCHAR(64) NOT NULL,
  chain VARCHAR(32) NOT NULL,
  chain_id INT NOT NULL,
  environment VARCHAR(32) NOT NULL,
  adapter VARCHAR(64) NOT NULL,
  contract_position_id VARCHAR(80) NOT NULL,
  open_tx_hash VARCHAR(80) NOT NULL,
  close_tx_hash VARCHAR(80) NULL,
  symbol VARCHAR(32) NOT NULL,
  side VARCHAR(16) NOT NULL,
  margin_usdc_raw VARCHAR(80) NOT NULL,
  leverage_x100 INT NOT NULL,
  entry_price_e8 VARCHAR(80) NOT NULL,
  exit_price_e8 VARCHAR(80) NULL,
  status VARCHAR(24) NOT NULL,
  opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_contract_position (chain, environment, adapter, contract_position_id),
  KEY idx_user_status (user_id, status),
  KEY idx_wallet_status (wallet_address, status),
  KEY idx_symbol_status (symbol, status)
);

CREATE TABLE IF NOT EXISTS chain_event_checkpoints (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  chain VARCHAR(32) NOT NULL,
  chain_id INT NOT NULL,
  environment VARCHAR(32) NOT NULL,
  adapter VARCHAR(64) NOT NULL,
  contract_address VARCHAR(64) NOT NULL,
  event_name VARCHAR(64) NOT NULL,
  last_block_number BIGINT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_event_checkpoint (
    chain,
    chain_id,
    environment,
    adapter,
    contract_address,
    event_name
  )
);

CREATE TABLE IF NOT EXISTS chain_event_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  chain VARCHAR(32) NOT NULL,
  chain_id INT NOT NULL,
  environment VARCHAR(32) NOT NULL,
  adapter VARCHAR(64) NOT NULL,
  contract_address VARCHAR(64) NOT NULL,
  tx_hash VARCHAR(80) NOT NULL,
  log_index INT NOT NULL,
  block_number BIGINT NOT NULL,
  event_name VARCHAR(64) NOT NULL,
  event_payload JSON NOT NULL,
  processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_chain_log (chain, chain_id, tx_hash, log_index),
  KEY idx_block_event (block_number, event_name)
);
