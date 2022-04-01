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
    address internal dai;
    address internal usdc;
    address internal usdt;
    address internal weth;
    address internal pool3;
    address internal tryCryptoPool;
    uint public tikectPriceInToken;
    uint public tikectPriceInEth;
    IProvider internal provider;
    ISwap internal exchange;
    IRamdomNumber internal ramdomNumber;
    IcErc20 internal cErc20;

//Enums

    enum Token {DAI, USDC, USDT, WETH}

//Mappins & Arrays

//Events

//Modifiers

//Public Functions

    function initContract(address _ramdomNumber) public{
        require(init == false, "Contract are init");
        __Ownable_init();

        cErc20 = IcErc20(0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9);
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
        tikectPriceInEth= 3000000000000000;

        init = true;
    }

    function buyTicketWithToken(uint _amount, Token _token) public{

        require( _token != Token.WETH);

        if(_token == Token.DAI){

            _transferToken(dai,_amount);
            _swapper(pool3, dai, usdt, _amount);

        } else if(_token == Token.USDC){

            _transferToken(usdc,_amount);
            _swapper(pool3, usdc, usdt, _amount);

        }else{

            _transferToken(usdt,_amount);
        }
    }

    function buyTicketWithEth() public payable{

        uint _expected = exchange.get_exchange_amount(tryCryptoPool, weth, usdt, msg.value);
        exchange.exchange{ value: msg.value }(tryCryptoPool, weth, usdt, msg.value, _expected, address(this));
    }

    function iWinWantToWithdraw() public{}

    function getMyMoneyBack(Token _token) public{

        uint _exchange;

        if(_token == Token.DAI){

           _exchange = _swapper(pool3, usdt, dai, 10);
           _transferTokenOut(dai, _exchange, msg.sender);

        }else if(_token == Token.USDC){

            _exchange = _swapper(pool3, usdt, usdc, 10);
            _transferTokenOut(usdc, _exchange, msg.sender);

        }else if(_token == Token.WETH){
        
            _exchange = _swapper(tryCryptoPool, usdt, weth, 10);
            _transferTokenOut(weth, _exchange, msg.sender);
        }else{

            _transferTokenOut(usdt, _exchange, msg.sender);
        }   
    }

//Internal Functions

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

    function _compone() internal {}
}
