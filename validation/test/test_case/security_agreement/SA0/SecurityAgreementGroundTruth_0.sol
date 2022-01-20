pragma solidity 0.5.16;

// https://www.lawinsider.com/contracts/535AKHzv5nhwZyxG4PQGUI/adial-pharmaceuticals-inc/security-agreement/2018-06-11
// sheet line 13

contract StockAgreement_0 {

    address payable public seller;
    address payable[] public buyer;

    string public sellerName;
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

    event Payed(uint paymentIndex);
    event Released(uint paymentIndex);
    event Terminated(
        uint buyerIndex
    );
    event Terminated_OutOfDate();
    event Closed();

    constructor() public payable {
        EffectiveTime = 1528214400; // June 6, 2018
        CloseTime = 0;
        OutSideClosingDate = 0;

        sellerName = "Adial Pharmaceuticals, Inc.";
        seller = address(0);

        buyerName = ["the secured party signatory hereto and its respective endorsees, transferees and assigns"];
        buyer = [address(0)];
    }

    function pay_0()
        public     
        payable
    {
        require(state[0] == State.Created || state[0] == State.Locked);
        require(msg.sender == buyer[0]);

        require(now <= CloseTime);

        uint256 price = 32500; // 32500 USD
        require(msg.value == price);

        emit Payed(0);

        pricePayedByBuyer[0] += price; 

        state[0] = State.Locked;
    }

    /// Release pay by the buyer
    /// This will release the locked ether.
    function payRelease_0()
        public
    {
        require(msg.sender == buyer[0]);

        require(now <= CloseTime);

        emit Released(0);

        state[0] = State.Release;

        seller.transfer(pricePayedByBuyer[0]);

        // clean the contract account
        pricePayedByBuyer[0] = 0;
    }


    function uploadFileHash(string memory fileName, uint32 hashCode)
        public
    {
        bool validSender = false;
        if (msg.sender == seller) {
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