//SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Interfaces/IRamdomNumber.sol";
import "./Interfaces/IProvider.sol";
import "./Interfaces/ISwap.sol";
import "./Interfaces/IcErc20.sol";

contract Lottery is OwnableUpgradeable{

    bool internal init;
    address internal admin;
    address internal dai;
    address internal usdc;
    address internal usdt;
    address internal weth;
    address internal pool3;
    address internal tryCryptoPool;
    uint public tikectPriceInToken;
    uint public tikectPriceInEth;
    uint internal time;
    uint public lotteryRound;
    IProvider internal provider;
    ISwap internal exchange;
    IRamdomNumber internal ramdomNumber;
    IcErc20 internal cToken;

//Enums

    enum Token {DAI, USDC, USDT, WETH}

//Mappins

    mapping(uint => mapping(address => uint)) public userTicketBalanceWithToken;
    mapping(uint => mapping(address => uint)) public userTicketBalanceWithEth;
    mapping(uint => mapping(uint => address)) public ticketOwner;
    mapping(uint => uint) public ticketCount;
    mapping(uint => uint) public lotteryWinner;
    mapping(uint => uint) public amountPool;
    mapping(uint => bool) public setCompone;
    mapping(uint => uint) public winnerAmount;


//Events

//Modifiers

modifier upDateData() {

    if(block.timestamp > (time + 7 days)){
        lotteryWinner[lotteryRound] = _getRamdomNumber(ticketCount[lotteryRound]);
        winnerAmount[lotteryRound] = _balanceOfUnderlying();
        _componeRedeem(_getCTokenBalance());
        time = block.timestamp;
        lotteryRound++;
        ticketCount[lotteryRound + 1] = 1;
    }
    _;
}

modifier investCompone() {
    if(block.timestamp > (time + 2 days)){
        if(setCompone[lotteryRound] == false){
            _componeMint(amountPool[lotteryRound]);
            setCompone[lotteryRound] = true;
        }
    }
    _;
}

//Public Functions

    function initContract(address _ramdomNumber) public{
        require(init == false, "Contract are init");
        __Ownable_init();
        admin = msg.sender;

        cToken = IcErc20(0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9);
        ramdomNumber = IRamdomNumber(_ramdomNumber);
        provider = IProvider(0x0000000022D53366457F9d5E68Ec105046FC4383);
        exchange = ISwap(provider.get_address(2));

        pool3 = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7;
        tryCryptoPool = 0x80466c64868E1ab14a1Ddf27A676C3fcBE638Fe5;

        dai = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
        usdc = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
        usdt = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
        weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

        tikectPriceInToken = 10;
        tikectPriceInEth = 3000000000000000;

        lotteryRound = 1;
        ticketCount[1] = lotteryRound;
        ticketCount[2] = lotteryRound;
        time = block.timestamp;
        init = true;
    }

    function buyTicketWithToken(uint _amount, Token _token) public investCompone upDateData{
        require( _token != Token.WETH);
        require(_amount > tikectPriceInToken);
        require((_amount % tikectPriceInToken) == 0);

        uint _amountPool;
        uint amountTikects = _amount / tikectPriceInToken;

        if(_token == Token.DAI){

            _transferToken(dai,_amount);
            _amountPool = _swapper(pool3, dai, usdt, _amount);

        } else if(_token == Token.USDC){

            _transferToken(usdc,_amount);
            _amountPool = _swapper(pool3, usdc, usdt, _amount);

        }else{

            _transferToken(usdt,_amount);
            _amountPool = _amount;
        }

        if(block.timestamp <= (time + 2 days)){
            userTicketBalanceWithToken[lotteryRound][msg.sender] += amountTikects;
            amountPool[lotteryRound] += _amountPool;
            for(uint i=0; i<amountTikects; i++){
                _ticketAsing(lotteryRound);
            } 
        }else{
            userTicketBalanceWithToken[lotteryRound + 1][msg.sender] += amountTikects; 
            amountPool[lotteryRound + 1] += _amountPool;
            for(uint i=0; i<amountTikects; i++){
                _ticketAsing(lotteryRound + 1);
            }
        }
    }

    function buyTicketWithEth() public payable investCompone upDateData{
        require(msg.value > tikectPriceInEth);
        require((msg.value % tikectPriceInEth) == 0);

        uint _amountPool;
        uint amountTikects = msg.value / tikectPriceInEth;
        uint _expected = exchange.get_exchange_amount(tryCryptoPool, weth, usdt, msg.value);
        _amountPool = exchange.exchange{ value: msg.value }(tryCryptoPool, weth, usdt, msg.value, _expected, address(this));

        if(block.timestamp <= (time + 2 days)){
            userTicketBalanceWithEth[lotteryRound][msg.sender] += amountTikects;
            amountPool[lotteryRound] += _amountPool;
            for(uint i=0; i<amountTikects; i++){
                _ticketAsing(lotteryRound);
            } 
        }else{
            userTicketBalanceWithEth[lotteryRound + 1][msg.sender] += amountTikects; 
            amountPool[lotteryRound + 1] += _amountPool;
            for(uint i=0; i<amountTikects; i++){
                _ticketAsing(lotteryRound + 1);
            }
        }
    }

    function iWinWantToWithdraw(uint _round) public investCompone upDateData{
        require(_round > 0 && _round < lotteryRound);
        require(ticketOwner[_round][lotteryWinner[_round]] == msg.sender);
        require(winnerAmount[_round] > 0);

        uint payAdmin = (winnerAmount[_round] * 5) / 100;
        uint payWinner = winnerAmount[_round] - payAdmin;

        _transferTokenOut(usdt, payAdmin, admin);
        _transferTokenOut(usdt, payWinner, msg.sender);

        winnerAmount[_round] = 0;
    }

    function getMyMoneyBackInToken(Token _token, uint _round) public investCompone upDateData{
        require( _token != Token.WETH);
        require(_round > 0 && _round < lotteryRound);
        require(userTicketBalanceWithToken[_round][msg.sender] > 0);

        uint _exchange;
        uint _amount;

        if(_token == Token.DAI){
            _amount = userTicketBalanceWithToken[_round][msg.sender] * tikectPriceInToken;
           _exchange = _swapper(pool3, usdt, dai, _amount);
           _transferTokenOut(dai, _exchange, msg.sender);
           userTicketBalanceWithToken[_round][msg.sender] = 0;

        }else if(_token == Token.USDC){
            _amount = userTicketBalanceWithToken[_round][msg.sender] * tikectPriceInToken;
            _exchange = _swapper(pool3, usdt, usdc, _amount);
            _transferTokenOut(usdc, _exchange, msg.sender);
            userTicketBalanceWithToken[_round][msg.sender] = 0;

        }else{
            _amount = userTicketBalanceWithToken[_round][msg.sender] * tikectPriceInToken;
            _transferTokenOut(usdt, _amount, msg.sender);
            userTicketBalanceWithToken[_round][msg.sender] = 0;
        }
    }

    function getMyMoneyBackInEth(uint _round) public investCompone upDateData{
        require(_round > 0 && _round < lotteryRound);
        require(userTicketBalanceWithEth[_round][msg.sender] > 0);

        uint _exchange;
        uint _amount;

        _amount = userTicketBalanceWithEth[_round][msg.sender] * tikectPriceInEth;
        _exchange = _swapper(tryCryptoPool, usdt, weth, _amount);
        _transferTokenOut(weth, _exchange, msg.sender);
        userTicketBalanceWithEth[_round][msg.sender] = 0;
    }

//Internal Functions

    function _ticketAsing(uint _round) internal {
        require(_round == 1 || _round == 2);
        ticketOwner[_round][ticketCount[_round]] = msg.sender;
        ticketCount[_round]++;
    }

    function _swapper(address _pool, address _tokenFrom, address _tokenTo, uint _amount) internal returns(uint){

        uint _expected = exchange.get_exchange_amount(_pool, _tokenFrom, _tokenTo, _amount);
        uint _exchage = exchange.exchange(_pool, _tokenFrom, _tokenTo, _amount, _expected, address(this));
        return _exchage;
    }

    function _transferToken(address _token, uint _amount) internal {

        IERC20(_token).transferFrom(msg.sender, address(this), _amount);

        if(_token != usdt){
            IERC20(_token).approve(address(exchange), _amount);
        }
    }

    function _transferTokenOut(address _token, uint _amount, address _to) internal {
        IERC20(_token).transfer(_to, _amount);
    }

    function _componeMint(uint _amount) internal {
        require(cToken.mint(_amount) == 0, "mint failed");
    }

    function _getCTokenBalance() internal view returns (uint) {
        return cToken.balanceOf(address(this));
    }

    function _componeRedeem(uint _amount) internal {
        require(cToken.redeem(_amount) == 0, "redeem failed");
    }

    function _balanceOfUnderlying() internal returns (uint) {
        return cToken.balanceOfUnderlying(address(this));
    }

    function _getRamdomNumber(uint _until) internal returns(uint){
        ramdomNumber.setUntil(_until);
        ramdomNumber.getRandomNumber();
        return ramdomNumber.randomResult();
    }
}
