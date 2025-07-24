let web3;
let provider;
let selectedAccount;
let tokenContract;
let stakingContract;

const tokenAddress = "0xc50e66bca472da61d0184121e491609b774e2c37"; // CHC Token
const stakingAddress = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3"; // CHC Staking

const tokenABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{ "name": "", "type": "string" }],
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
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
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
    "constant": false,
    "inputs": [
      { "name": "_spender", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
];

const stakingABI = [
  {
    "inputs": [{ "internalType": "uint8", "name": "_tier", "type": "uint8" }],
    "name": "selectTier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
    "name": "getStakeInfo",
    "outputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "startTime", "type": "uint256" },
      { "internalType": "uint8", "name": "tier", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Web3Modal Setup
const providerOptions = {
  walletconnect: {
    package: window.WalletConnectProvider.default,
    options: {
      rpc: {
        56: "https://bsc-dataseed.binance.org/"
      },
      chainId: 56
    }
  }
};
const web3Modal = new window.Web3Modal.default({
  cacheProvider: true,
  providerOptions
});

// Status Display
function showStatus(message) {
  const status = document.getElementById("status");
  if (status) status.innerText = message;
}

// Connect Wallet
async function connectWallet() {
  try {
    provider = await web3Modal.connect();
    provider.on("accountsChanged", connectWallet);
    provider.on("chainChanged", () => window.location.reload());

    web3 = new Web3(provider);
    const chainId = await web3.eth.getChainId();
    if (chainId !== 56) {
      showStatus("Please switch to Binance Smart Chain (BSC Mainnet)");
      return;
    }

    const accounts = await web3.eth.getAccounts();
    selectedAccount = accounts[0];
    document.getElementById("walletAddress").innerText = selectedAccount;

    tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
    stakingContract = new web3.eth.Contract(stakingABI, stakingAddress);

    fetchCHCBalance();
    fetchStakeInfo();
    showStatus("Wallet Connected");
  } catch (error) {
    showStatus("Wallet connection failed");
    console.error(error);
  }
}

// Fetch CHC Balance
async function fetchCHCBalance() {
  try {
    const balance = await tokenContract.methods.balanceOf(selectedAccount).call();
    const formatted = web3.utils.fromWei(balance, 'ether');
    document.getElementById("chcBalance").innerText = Number(formatted).toLocaleString();
  } catch (error) {
    console.error("Balance fetch failed:", error);
  }
}

// Approve CHC
async function approveCHC() {
  try {
    const amount = document.getElementById("stakeAmount").value;
    if (!amount || isNaN(amount)) return showStatus("Enter a valid amount");

    const weiAmount = web3.utils.toWei(amount, 'ether');
    await tokenContract.methods.approve(stakingAddress, weiAmount).send({ from: selectedAccount });
    showStatus("CHC Approved for Staking");
  } catch (error) {
    console.error("Approval error:", error);
    showStatus("Approval failed");
  }
}

// Stake CHC
async function stakeCHC() {
  try {
    const amount = document.getElementById("stakeAmount").value;
    if (!amount || isNaN(amount)) return showStatus("Enter a valid amount");

    const tier = document.getElementById("chillStake").checked ? 1 : document.getElementById("deepChill").checked ? 2 : 0;
    if (tier === 0) return showStatus("Select a staking tier");

    const weiAmount = web3.utils.toWei(amount, 'ether');

    await stakingContract.methods.selectTier(tier).send({ from: selectedAccount });
    await stakingContract.methods.stake(weiAmount).send({ from: selectedAccount });

    showStatus("Staked Successfully!");
    fetchCHCBalance();
    fetchStakeInfo();
  } catch (error) {
    console.error("Staking error:", error);
    showStatus("Staking failed");
  }
}

// Fetch Stake Info
async function fetchStakeInfo() {
  try {
    const info = await stakingContract.methods.getStakeInfo(selectedAccount).call();
    console.log("Staked Info:", info);
  } catch (error) {
    console.error("Stake info error:", error);
  }
}

// Auto-reconnect
if (web3Modal.cachedProvider) {
  connectWallet();
}

// Button Listeners
document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("approveCHC").addEventListener("click", approveCHC);
document.getElementById("stakeButton").addEventListener("click", stakeCHC);
