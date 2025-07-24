// ✅ CHC Staking app.js with Web3Modal and full logic

const CHC_TOKEN_ADDRESS = "0xc50e66bca472da61d0184121e491609b774e2c37";
const STAKING_CONTRACT_ADDRESS = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3";

let web3;
let provider;
let selectedAccount;
let chcToken;
let stakingContract;
let web3Modal;

const tokenABI = [ /* FULL CHC TOKEN ABI - START */ 
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
  }
]; /* FULL CHC TOKEN ABI - END */

const stakingABI = [ /* FULL STAKING CONTRACT ABI - START */
  {
    "inputs": [
      { "internalType": "address", "name": "_tokenAddress", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
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
      { "internalType": "uint256", "name": "startTime", "type": "uint256" },
      { "internalType": "uint8", "name": "tier", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStakeInfo",
    "outputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "startTime", "type": "uint256" },
      { "internalType": "uint8", "name": "tier", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint8", "name": "_tier", "type": "uint8" }],
    "name": "selectTier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]; /* FULL STAKING CONTRACT ABI - END */

// 🧊 Web3Modal config
web3Modal = new Web3Modal.default({
  cacheProvider: true,
  providerOptions: {
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: {
        rpc: { 56: "https://bsc-dataseed.binance.org/" }
      }
    }
  }
});

// ✅ Connect wallet
async function connectWallet() {
  try {
    provider = await web3Modal.connect();
    web3 = new Web3(provider);

    const chainId = await web3.eth.getChainId();
    if (chainId !== 56) {
      alert("Please switch to BNB Chain (Chain ID 56)");
      return;
    }

    const accounts = await web3.eth.getAccounts();
    selectedAccount = accounts[0];
    document.getElementById("walletAddress").innerText = selectedAccount;

    chcToken = new web3.eth.Contract(tokenABI, CHC_TOKEN_ADDRESS);
    stakingContract = new web3.eth.Contract(stakingABI, STAKING_CONTRACT_ADDRESS);

    updateCHCBalance();

    provider.on("accountsChanged", (accounts) => {
      selectedAccount = accounts[0];
      document.getElementById("walletAddress").innerText = selectedAccount;
      updateCHCBalance();
    });

  } catch (err) {
    console.error("Wallet connection failed:", err);
  }
}

// ✅ Update CHC Balance
async function updateCHCBalance() {
  if (!chcToken || !selectedAccount) return;
  const balance = await chcToken.methods.balanceOf(selectedAccount).call();
  const formatted = web3.utils.fromWei(balance, 'ether');
  document.getElementById("chcBalance").innerText = parseFloat(formatted).toLocaleString();
}

// ✅ Approve CHC
async function approveCHC() {
  try {
    if (!chcToken || !selectedAccount) {
      showStatus("Connect wallet first.");
      return;
    }

    const amountInput = document.getElementById("stakeAmount").value;
    if (!amountInput || isNaN(amountInput) || Number(amountInput) <= 0) {
      showStatus("Enter valid amount.");
      return;
    }

    const amount = web3.utils.toWei(amountInput, 'ether');
    showStatus("Sending approval...");

    await chcToken.methods.approve(STAKING_CONTRACT_ADDRESS, amount)
      .send({ from: selectedAccount });

    showStatus("Approval successful.");
  } catch (error) {
    console.error(error);
    showStatus("Approval failed.");
  }
}

// ✅ Stake CHC
async function stakeCHC() {
  try {
    const amountInput = document.getElementById("stakeAmount").value;
    if (!amountInput || isNaN(amountInput) || Number(amountInput) <= 0) {
      showStatus("Enter valid amount.");
      return;
    }

    const tier = document.getElementById("chillStake").checked ? 1 :
                 document.getElementById("deepChill").checked ? 2 : null;
    if (!tier) {
      showStatus("Select staking tier.");
      return;
    }

    showStatus("Selecting tier...");
    await stakingContract.methods.selectTier(tier).send({ from: selectedAccount });

    showStatus("Staking...");
    await stakingContract.methods.stake().send({ from: selectedAccount });

    showStatus("Stake successful!");
    updateCHCBalance();
  } catch (err) {
    console.error(err);
    showStatus("Stake failed.");
  }
}

// ✅ Helper to show status messages
function showStatus(msg) {
  document.getElementById("status").innerText = msg;
}

// ✅ Attach UI events
document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("approveCHC").addEventListener("click", approveCHC);
document.getElementById("stakeButton").addEventListener("click", stakeCHC);

// ✅ Auto reconnect if cached
if (web3Modal.cachedProvider) {
  connectWallet();
}
