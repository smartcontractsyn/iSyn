pragma solidity 0.5.16;

contract OracleTest {
    uint currentTime;
    uint256 currentPrice;
    bool conditionState;

    constructor() public payable {
        currentTime = 0;
        currentPrice = 0;
        conditionState = false;
    }

    function setTime(uint time) public {
        currentTime = time;
    }

    function setPrice(uint256 price) public {
        currentPrice = price;
    }

    function setConditionState(bool cons) public {
        conditionState = cons;
    }

    function getTime() public view returns(uint) {
        return currentTime;
    }

    function getPrice() public view returns(uint256) {
        return currentPrice;
    }

    function getConditionState() public view returns(bool) {
        return conditionState;
    }
}