pragma solidity 0.5.16;

// https://www.lawinsider.com/contracts/gqMefydFFWn
// sheet line 21

// TODO

contract StockPurchaseAgreement {

    address payable[] public seller;
    address payable[] public buyer;

    string[] public sellerName;
    string[] public buyerName;

    uint public EffectiveTime;
    uint public CloseTime;
    uint public OutSideClosingDate;

    // uint[1] public price;
    uint[1] public pricePayedByBuyer; // Temporarily stored on contract account

    bool[1] public purchaseSellerConfirmed;
    bool[1] public purchaseBuyerConfirmed;

    mapping(string => uint32) fileHashMap;

    bool[1] public terminateSellerConfirmed;
    bool[1] public terminateBuyerConfirmed;

    enum State { Created, Locked, Release, Transfered, Inactive }
    // The state variable has a default value of the first member, `State.created`
    State[1] public state;

    bool transferReceiveConfirm; 

    event Payed_0();
    event Released_0();
    event Closed();
    event Terminated(
        uint buyerIndex
    );
    event Terminated_OutOfDate();

    constructor() public payable {
        EffectiveTime = 0;
        CloseTime = 0;
        OutSideClosingDate = 0;

        sellerName = ["China Hospitals"];
        seller = [address(0)];

        buyerName = ["1847 Cabinets Inc."];
        buyer = [address(0)];

        // price = [5000000];
    }

    function pay_0()
        public     
        payable
    {
        require(state[0] == State.Created || state[0] == State.Locked);
        require(msg.sender == buyer[0]);

        require(now <= CloseTime);

        uint256 price = 0;
        require(msg.value == price);

        emit Payed_0();

        pricePayedByBuyer[0] = price; 

        state[0] = State.Locked;
    }

    function purchaseConfirmMultiSeller(uint32 sellerIndex) 
        public
    {
        require(sellerIndex < seller.length);

        if (msg.sender == seller[0]) {
            purchaseBuyerConfirmed[sellerIndex] = true;
            return;
        }

        uint sellerNum = sellerName.length;
        for (uint i=0; i<sellerNum; i++) {
            if (msg.sender == seller[i]) {
                purchaseSellerConfirmed[i] = true;
                return;
            }
        }        
    }

    /// Release pay by the buyer
    /// This will release the locked ether.
    function payRelease_0()
        public
    {
        require(msg.sender == buyer[0]);

        require(now <= CloseTime);

        require(purchaseBuyerConfirmed[0]);
        require(purchaseSellerConfirmed[0]);

        emit Released_0();

        state[0] = State.Release;

        seller[0].transfer(pricePayedByBuyer[0]);

        // clean the contract account
        pricePayedByBuyer[0] = 0;
    }


    function uploadFileHash(string memory fileName, uint32 hashCode)
        public
    {
        bool validSender = false;
        if (msg.sender == seller[0]) {
            validSender = true;
        } else {
            uint buyerNum = buyerName.length;
            for (uint i=0; i<buyerNum; i++) {
                if (msg.sender == buyer[i]) {
                    validSender = true;
                    break;
                }
            }
        }
        require(validSender);

        fileHashMap[fileName] = hashCode;
    }

    function terminateConfirm(uint32 sellerIndex)
        public
    {
        require(sellerIndex < seller.length);

        if (msg.sender == seller[0]) {
            terminateBuyerConfirmed[sellerIndex] = true;
            return;
        }

        uint sellerNum = sellerName.length;
        for (uint i=0; i<sellerNum; i++) {
            if (msg.sender == seller[i]) {
                terminateSellerConfirmed[i] = true;
                return;
            }
        }  
    }

    function terminateByTransfer(uint buyerIndex)
        public
    {
        bool validSender = false;

        uint sellerNum = sellerName.length;
        for (uint i=0; i<sellerNum; i++) {
            if (msg.sender == seller[i]) {
                validSender = true;
                buyerIndex = i;
                break;
            }
        }

        uint buyerNum = buyerName.length;
        for (uint i=0; i<buyerNum; i++) {
            if (msg.sender == buyer[i]) {
                validSender = true;
                buyerIndex = i;
                break;
            }
        }

        require(validSender);

        require(now < CloseTime);

        require(terminateSellerConfirmed[buyerIndex]);
        require(terminateBuyerConfirmed[buyerIndex]);

        emit Terminated(buyerIndex);

        state[buyerIndex] = State.Inactive;

        // refund
        buyer[buyerIndex].transfer(pricePayedByBuyer[buyerIndex]);

        // selfdestruct(seller);
    }

    function terminateByOutOfDate()
        public
    {
        require(now >= OutSideClosingDate);

        emit Terminated_OutOfDate();

        uint buyerNum = buyerName.length;

        for (uint i=0; i<buyerNum; i++) {
            state[i] = State.Inactive;
            // refund
            buyer[i].transfer(pricePayedByBuyer[i]);
        }
        // selfdestruct(seller);
    }

    // function terminateByOther_0()
    //     public
    // {
    //     require(OracleInput);

    //     emit Terminated_0();

    //     state[0] = State.Inactive;

    //     // refund
    //     buyer[0].transfer(pricePayedByBuyer[0]);
    // }

    function close()
        public
    {
        require(now >= CloseTime);
        emit Closed();

        uint buyerNum = buyerName.length;

        for (uint i=0; i<buyerNum; i++) {
            state[i] = State.Inactive;
        }

        // selfdestruct(seller);
    }
}