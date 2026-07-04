// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockPerpTrading {
    enum Side {
        None,
        Long,
        Short
    }

    struct Position {
        uint256 id;
        address user;
        bytes32 symbol;
        Side side;
        uint256 marginUsdc;
        uint256 leverageX100;
        uint256 entryPriceE8;
        uint256 stopLossPriceE8;
        uint256 takeProfitPriceE8;
        uint256 openedAt;
        bool closed;
    }

    address public owner;
    uint256 public nextPositionId = 1;

    mapping(bytes32 => uint256) public priceE8BySymbol;
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public positionIdsByUser;

    event PriceUpdated(bytes32 indexed symbol, uint256 priceE8);

    event PositionOpened(
        uint256 indexed positionId,
        address indexed user,
        bytes32 indexed symbol,
        uint8 side,
        uint256 marginUsdc,
        uint256 leverageX100,
        uint256 entryPriceE8,
        uint256 stopLossPriceE8,
        uint256 takeProfitPriceE8
    );

    event PositionClosed(
        uint256 indexed positionId,
        address indexed user,
        bytes32 indexed symbol,
        uint256 exitPriceE8
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
        priceE8BySymbol[bytes32("BTCUSDT")] = 65000e8;
        priceE8BySymbol[bytes32("BNBUSDT")] = 650e8;
        priceE8BySymbol[bytes32("CAKEUSDT")] = 3e8;
    }

    function setPrice(bytes32 symbol, uint256 priceE8) external onlyOwner {
        require(priceE8 > 0, "INVALID_PRICE");
        priceE8BySymbol[symbol] = priceE8;
        emit PriceUpdated(symbol, priceE8);
    }

    function openPosition(
        bytes32 symbol,
        uint8 side,
        uint256 marginUsdc,
        uint256 leverageX100,
        uint256 stopLossPriceE8,
        uint256 takeProfitPriceE8
    ) external returns (uint256 positionId) {
        require(side == uint8(Side.Long) || side == uint8(Side.Short), "INVALID_SIDE");
        require(marginUsdc > 0, "INVALID_MARGIN");
        require(leverageX100 >= 100 && leverageX100 <= 5000, "INVALID_LEVERAGE");

        uint256 entryPriceE8 = priceE8BySymbol[symbol];
        require(entryPriceE8 > 0, "SYMBOL_NOT_SUPPORTED");

        positionId = nextPositionId++;
        positions[positionId] = Position({
            id: positionId,
            user: msg.sender,
            symbol: symbol,
            side: Side(side),
            marginUsdc: marginUsdc,
            leverageX100: leverageX100,
            entryPriceE8: entryPriceE8,
            stopLossPriceE8: stopLossPriceE8,
            takeProfitPriceE8: takeProfitPriceE8,
            openedAt: block.timestamp,
            closed: false
        });
        positionIdsByUser[msg.sender].push(positionId);

        emit PositionOpened(
            positionId,
            msg.sender,
            symbol,
            side,
            marginUsdc,
            leverageX100,
            entryPriceE8,
            stopLossPriceE8,
            takeProfitPriceE8
        );
    }

    function closePosition(uint256 positionId) external {
        Position storage position = positions[positionId];
        require(position.user == msg.sender, "NOT_POSITION_OWNER");
        require(!position.closed, "POSITION_CLOSED");

        uint256 exitPriceE8 = priceE8BySymbol[position.symbol];
        require(exitPriceE8 > 0, "SYMBOL_NOT_SUPPORTED");

        position.closed = true;
        emit PositionClosed(positionId, msg.sender, position.symbol, exitPriceE8);
    }

    function getUserPositionIds(address user) external view returns (uint256[] memory) {
        return positionIdsByUser[user];
    }
}
