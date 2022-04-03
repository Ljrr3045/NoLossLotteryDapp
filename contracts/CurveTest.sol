//SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IPeripheryPayments.sol";
import "./Interfaces/IRamdomNumber.sol";
import "./Interfaces/IProvider.sol";
import "./Interfaces/ISwap.sol";
import "./Interfaces/IcErc20.sol";

contract CurveTest {
    address internal dai;
    address internal usdc;
    address internal usdt;
    address internal weth;
    address internal pool3;
    address internal tryCryptoPool;
    uint retur;

    IProvider internal provider;
    ISwap internal exchange;
    ISwapRouter internal swapRouter;
    IPeripheryPayments internal peripheryPayments;
    IcErc20 internal cToken;

    constructor(){

        provider = IProvider(0x0000000022D53366457F9d5E68Ec105046FC4383);
        exchange = ISwap(provider.get_address(2));
        cToken = IcErc20(0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643);

        swapRouter = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
        peripheryPayments = IPeripheryPayments(0xE592427A0AEce92De3Edee1F18E0157C05861564);

        pool3 = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7;
        tryCryptoPool = 0x80466c64868E1ab14a1Ddf27A676C3fcBE638Fe5;

        dai = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
        usdt = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
        weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    }

    function swappDai() public returns (uint){
        _transferToken(dai, (10 ** 18));
        uint swap = _swapper(pool3, dai, usdt, (10 ** 18));
        return swap;
    }

    function swappWth() public payable{

        _swapEthForToken(weth, dai, msg.value);
    }

    function _swapper(address _pool, address _tokenFrom, address _tokenTo, uint _amount) internal returns(uint){

        //uint _expected = exchange.get_exchange_amount(_pool, _tokenFrom, _tokenTo, _amount);
        uint _exchage = exchange.exchange(_pool, _tokenFrom, _tokenTo, _amount, 1, address(this));
        return _exchage;
    }

    function _transferToken(address _token, uint _amount) internal {

        IERC20Upgradeable(_token).transferFrom(msg.sender, address(this), _amount);

        if(_token != usdt){
            IERC20Upgradeable(_token).approve(address(exchange), _amount);
        }
    }

    function _swapEthForToken(address _tokenIn, address _tokenOut, uint amountIn) private {

        uint24 poolFee = 3000;

        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: _tokenIn,
                tokenOut: _tokenOut,
                fee: poolFee,
                recipient: address(this),
                deadline: block.timestamp + 10,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            }
        );

        swapRouter.exactInputSingle{ value: amountIn }(params);
        peripheryPayments.refundETH();
    }

    function _componeMint(uint _amount) public {
        IERC20Upgradeable(dai).approve(address(cToken), _amount);
        require(cToken.mint(_amount) == 0, "mint failed");
    }

    function _getCTokenBalance() public view returns (uint) {
        return cToken.balanceOf(address(this));
    }

    function _componeRedeem(uint _amount) public {
        require(cToken.redeem(_amount) == 0, "redeem failed");
    }

    function _balanceOfUnderlying() public returns (uint256) {
        return cToken.balanceOfUnderlying(address(this));
    }
}