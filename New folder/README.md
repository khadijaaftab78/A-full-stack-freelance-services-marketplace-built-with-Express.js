# Mini Token Bank

This is a simple dApp I built for my blockchain assignment. It lets you deposit, send, and check token balances using MetaMask.

## What It Does
- Connect your MetaMask wallet
- Deposit tokens into the bank
- Send tokens to other people
- Check how many tokens any address has

## Contract Info
**Address:** 0x133C8f9C035570afF3d6e27748785A0D6f205A5c

The contract has these functions:
- deposit(amount) - put tokens in the bank
- transfer(to, amount) - send tokens to someone
- getBalance(user) - check someone's balance

## How to Use It

1. Download all the files
2. Open index.html in your browser
3. Click "Connect MetaMask" 
4. Approve the connection in MetaMask
5. Use the buttons to deposit, transfer, or check balances

You'll need:
- MetaMask installed
- Connected to Sepolia testnet
- Some Sepolia ETH for gas (get from sepoliafaucet.com)

## Files Included
- SmartContract.sol - the blockchain code
- index.html - the website interface  
- README.md - this file
- Screenshots - pictures showing it works

## For My Assignment
This was for MG3012 Blockchain Technology class. I built a working dApp that connects to MetaMask and can do transactions on the Sepolia testnet.

My screenshots show:
- The contract deployed on Remix
- MetaMask connected to my dApp
- A successful transaction going through

By: [Your Name]
MG3012 - Fall 2025