// ==== CHC Token ABI ====
const tokenABI = [
  { "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "type": "function" },
  { "constant": false, "inputs": [{ "name": "spender", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "type": "function" },
  { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "type": "function" },
  { "constant": true, "inputs": [{ "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" }
];

// ==== Staking Contract ABI ====
const stakingABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_token", "type": "address" },
      { "internalType": "uint256", "name": "_maxStake", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint8", "name": "lockDays", "type": "uint8" }
    ],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getStakeInfo",
    "outputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "startTime", "type": "uint256" },
      { "internalType": "uint8", "name": "lockDays", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const CHC_TOKEN_ADDRESS = "0xc50e66bca472da61d0184121e491609b774e2c37";
const STAKING_CONTRACT_ADDRESS = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3";

let web3, provider, selectedAccount, tokenContract, stakingContract;

const web3Modal = new window.Web3Modal.default({
  cacheProvider: true,
  providerOptions: {
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: {
        rpc: {
          56: "https://bsc-dataseed.binance.org"
        },
        chainId: 56
      }
    }
  }
});

document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("approveCHC").addEventListener("click", approveCHC);
document.getElementById("stakeButton").addEventListener("click", stakeCHC);

if (web3Modal.cachedProvider) {
  connectWallet();
}

async function connectWallet() {
  try {
    provider = await web3Modal.connect();
    web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    selectedAccount = accounts[0];
    document.getElementById("walletAddress").innerText = selectedAccount;

    tokenContract = new web3.eth.Contract(tokenABI, CHC_TOKEN_ADDRESS);
    stakingContract = new web3.eth.Contract(stakingABI, STAKING_CONTRACT_ADDRESS);

    const balance = await tokenContract.methods.balanceOf(selectedAccount).call();
    document.getElementById("chcBalance").innerText = (balance / 1e18).toLocaleString();

    const chainId = await web3.eth.getChainId();
    if (chainId !== 56) {
      alert("Please switch to Binance Smart Chain (BSC)");
    }
  } catch (error) {
    console.error("Wallet connect error:", error);
    document.getElementById("statusMessage").innerText = "❌ Wallet connection failed.";
  }
}

async function approveCHC() {
  try {
    const amount = document.getElementById("stakeAmount").value;
    if (!amount || isNaN(amount) || amount <= 0) {
      return alert("Enter a valid CHC amount.");
    }

    const weiAmount = web3.utils.toWei(amount, "ether");

    const tx = await tokenContract.methods
      .approve(STAKING_CONTRACT_ADDRESS, weiAmount)
      .send({ from: selectedAccount });

    if (tx.status) {
      document.getElementById("statusMessage").innerText = "✅ CHC Approved Successfully!";
    } else {
      document.getElementById("statusMessage").innerText = "❌ Approval failed.";
    }
  } catch (error) {
    console.error("Approval error:", error);
    document.getElementById("statusMessage").innerText = "❌ Approval transaction failed.";
  }
}

async function stakeCHC() {
  try {
    const amount = document.getElementById("stakeAmount").value;
    const selectedTier = document.querySelector('input[name="stakeOption"]:checked');
    if (!selectedTier) return alert("Choose a staking tier.");
    if (!amount || isNaN(amount) || amount <= 0) return alert("Enter a valid stake amount.");

    const days = parseInt(selectedTier.value);
    const weiAmount = web3.utils.toWei(amount, "ether");

    const tx = await stakingContract.methods
      .stake(weiAmount, days)
      .send({ from: selectedAccount });

    if (tx.status) {
      document.getElementById("statusMessage").innerText = "✅ Stake successful!";
    } else {
      document.getElementById("statusMessage").innerText = "❌ Stake failed.";
    }
  } catch (error) {
    console.error("Stake error:", error);
    document.getElementById("statusMessage").innerText = "❌ Staking transaction failed.";
  }
}
