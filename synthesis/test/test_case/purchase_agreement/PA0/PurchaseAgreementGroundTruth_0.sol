pragma solidity 0.5.16;

// https://www.lawinsider.com/contracts/5dTCyhsdBl1BTi6SqvrQ8b/ford-credit-auto-owner-trust-2015-b/purchase-agreement/2015-05-26
// sheet line 49

contract PurchaseAgreement_0 {

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
        EffectiveTime = 1430409600; // May 1, 2015
        CloseTime = 0;
        OutSideClosingDate = 0;

        // Depositor pay to sponsor
        sellerName = "FORD MOTOR CREDIT COMPANY LLC";
        seller = address(0);

        buyerName = ["FORD CREDIT AUTO RECEIVABLES TWO LLC"];
        buyer = [address(0)];
    }

    function pay_0()
        public     
        payable
    {
        require(state[0] == State.Created || state[0] == State.Locked);
        require(msg.sender == buyer[0]);

        require(now <= CloseTime);

        uint256 price = 1829526188; // 1,829,526,188 USD
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