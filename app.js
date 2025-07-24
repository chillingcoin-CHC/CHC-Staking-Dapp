// Connect wallet with Web3Modal + WalletConnect
let web3;
let userAccount;
let tokenContract;
let stakingContract;

const tokenAddress = "0xc50e66bca472da61d0184121e491609b774e2c37";
const stakingAddress = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3";

const tokenABI = [ /* FULL TOKEN ABI START */  
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{ "name": "", "type": "string" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_spender", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "name": "", "type": "string" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
]; /* FULL TOKEN ABI END */

const stakingABI = [  
  {
    "inputs": [{ "internalType": "address", "name": "token_", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint8", "name": "tier", "type": "uint8" }
    ],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "stakes",
    "outputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "unlockTime", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getStakeInfo",
    "outputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "unlockTime", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Connect wallet
async function connectWallet() {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      userAccount = accounts[0];
      tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
      stakingContract = new web3.eth.Contract(stakingABI, stakingAddress);

      document.getElementById("walletAddress").innerText = `${userAccount.substring(0, 6)}...${userAccount.slice(-4)}`;
      getCHCBalance();
      getStakeInfo();
    } catch (error) {
      alert("Wallet connection failed.");
    }
  } else {
    alert("MetaMask not found.");
  }
}

// Get CHC Balance
async function getCHCBalance() {
  const balance = await tokenContract.methods.balanceOf(userAccount).call();
  const decimals = await tokenContract.methods.decimals().call();
  const formatted = (balance / 10 ** decimals).toLocaleString();
  document.getElementById("chcBalance").innerText = `${formatted} CHC`;
}

// Get Stake Info
async function getStakeInfo() {
  try {
    const result = await stakingContract.methods.getStakeInfo(userAccount).call();
    const amount = result.amount / 1e18;
    const unlockTime = parseInt(result.unlockTime);
    const unlockDate = new Date(unlockTime * 1000).toLocaleString();

    document.getElementById("stakedAmount").innerText = `${amount} CHC`;
    document.getElementById("unlockDate").innerText = unlockTime > 0 ? unlockDate : "No active stake";
  } catch (err) {
    console.error("Stake info error:", err);
  }
}

// Approve Tokens
async function approveCHC(amount) {
  try {
    const amountWei = web3.utils.toWei(amount.toString(), "ether");
    await tokenContract.methods.approve(stakingAddress, amountWei).send({ from: userAccount });
    alert("Approved successfully!");
  } catch (err) {
    console.error(err);
    alert("Approval failed.");
  }
}

// Stake Tokens
async function stakeCHC() {
  const amount = document.getElementById("stakeInput").value;
  const tier = parseInt(document.querySelector('input[name="stakeTier"]:checked').value);
  const amountWei = web3.utils.toWei(amount.toString(), "ether");

  try {
    await stakingContract.methods.stake(amountWei, tier).send({ from: userAccount });
    alert("Staked successfully!");
    getStakeInfo();
  } catch (err) {
    console.error("Staking error:", err);
    alert("Staking failed.");
  }
}

document.getElementById("connectBtn").addEventListener("click", connectWallet);
document.getElementById("approveBtn").addEventListener("click", () => {
  const amount = document.getElementById("stakeInput").value;
  approveCHC(amount);
});
document.getElementById("stakeBtn").addEventListener("click", stakeCHC);
