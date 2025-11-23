// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MiniTokenBank {
    mapping(address => uint256) public balances;
    address public owner;

    constructor() {
        owner = msg.sender; 
    }

    
    function deposit(uint256 amount) public {
        balances[msg.sender] += amount;
    }

    
    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Not enough balance!");
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }

    function getBalance(address user) public view returns (uint256) {
        return balances[user];
    }
}
