import "./../../../OracleTest.sol";
pragma solidity 0.5.16;
contract StockPurchaseAgreement_1 {
    address payable public seller;
    address payable[] public buyer;
    OracleTest internal oracle;
    string public sellerName;
    string[] public buyerName;
    uint public EffectiveTime;
    uint public CloseTime;
    uint public OutSideClosingDate;
    uint[1] public pricePayedByBuyer;
    bool[1] public purchaseSellerConfirmed;
    bool[1] public purchaseBuyerConfirmed;
    mapping(string => uint32) fileHashMap;
    bool[1] public terminateSellerConfirmed;
    bool[1] public terminateBuyerConfirmed;
    enum State {
        Created, Locked, Release, Transfered, Inactive }
    State[1] public state;
    event Payed(uint paymentIndex);
    event Released(uint paymentIndex);
    event Terminated(uint buyerIndex);
    event TerminatedByOutOfDate();
    event TerminatedByOthers();
    event Closed();
    constructor() public payable {
        EffectiveTime = 1427644800;
        CloseTime = 1000;
        OutSideClosingDate = 1000;
        sellerName = "Centrue Financial Corporation";
        seller = address(0);
        buyerName =["Investor"];
        buyer =[address(0)];
    }
    function pay_0() public payable {
        require(state[0] == State.Created || state[0] == State.Locked);
        require(msg.sender == buyer[0]);
        uint currentTime = oracle.getTime();
        require(currentTime <= CloseTime, "Time later than Close time");
        uint256 currentPrice = oracle.getPrice();
        uint256 price = 460000000;
        price = price / currentPrice;
        require(msg.value == price);
        emit Payed(0);
        pricePayedByBuyer[0] += price;
        state[0] = State.Locked;
    }
    function payRelease_0() public {
        require(msg.sender == buyer[0]);
        uint currentTime = oracle.getTime();
        require(currentTime <= CloseTime, "Time later than Close time");
        emit Released(0);
        state[0] = State.Release;
        seller.transfer(pricePayedByBuyer[0]);
        pricePayedByBuyer[0] = 0;
    }
    function uploadFileHash(string memory fileName, uint32 hashCode) public {
        bool validSender = false;
        if(msg.sender == seller) {
            validSender = true;
        }
        else {
            uint buyerNum = buyerName.length;
            for(uint i = 0;
            i < buyerNum;
            i ++) {
                if(msg.sender == buyer[i]) {
                    validSender = true;
                    break;
                }
            }
        }
        require(validSender);
        fileHashMap[fileName] = hashCode;
    }
    function terminateConfirm(uint32 buyerIndex) public {
        require(buyerIndex < buyer.length);
        if(msg.sender == seller) {
            terminateSellerConfirmed[buyerIndex] = true;
            return;
        }
        uint buyerNum = buyerName.length;
        for(uint i = 0;
        i < buyerNum;
        i ++) {
            if(msg.sender == buyer[i]) {
                terminateBuyerConfirmed[i] = true;
                return;
            }
        }
    }
    function terminateByTransfer(uint buyerIndex) public {
        bool validSender = false;
        if(msg.sender == seller) {
            validSender = true;
        }
        else {
            uint buyerNum = buyerName.length;
            for(uint i = 0;
            i < buyerNum;
            i ++) {
                if(msg.sender == buyer[i]) {
                    validSender = true;
                    buyerIndex = i;
                    break;
                }
            }
        }
        require(validSender);
        uint currentTime = oracle.getTime();
        require(currentTime <= CloseTime);
        require(terminateSellerConfirmed[buyerIndex]);
        require(terminateBuyerConfirmed[buyerIndex]);
        emit Terminated(buyerIndex);
        state[buyerIndex] = State.Inactive;
        buyer[buyerIndex].transfer(pricePayedByBuyer[buyerIndex]);
    }
    function terminateByOutOfDate() public {
        uint currentTime = oracle.getTime();
        require(currentTime >= OutSideClosingDate);
        emit TerminatedByOutOfDate();
        uint buyerNum = buyerName.length;
        for(uint i = 0;
        i < buyerNum;
        i ++) {
            state[i] = State.Inactive;
            buyer[i].transfer(pricePayedByBuyer[i]);
        }
    }
    function terminateByOthers() public {
        uint currentTime = oracle.getTime();
        require(currentTime <= CloseTime);
        bool conditionState = oracle.getConditionState();
        require(conditionState);
        emit TerminatedByOthers();
        uint buyerNum = buyerName.length;
        for(uint i = 0;
        i < buyerNum;
        i ++) {
            state[i] = State.Inactive;
            buyer[i].transfer(pricePayedByBuyer[i]);
        }
    }
    function close() public {
        uint currentTime = oracle.getTime();
        require(currentTime <= CloseTime);
        emit Closed();
        uint buyerNum = buyerName.length;
        for(uint i = 0;
        i < buyerNum;
        i ++) {
            state[i] = State.Inactive;
        }
    }
    function setOracleAddress(address payable addr) public {
        oracle = OracleTest(addr);
    }
    function setSellerAddress(address payable addr) public {
        seller = addr;
    }
    function setBuyerAddress(address payable[] memory addrs) public {
        buyer = addrs;
    }
    function setAllState(State s) public {
        uint buyerNum = buyerName.length;
        for(uint i = 0;
        i < buyerNum;
        i ++) {
            state[i] = s;
        }
    }
    function getFileHash(string memory fileName) public returns(uint32) {
        return fileHashMap[fileName];
    }
}
