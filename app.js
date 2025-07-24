const tokenAddress = "0xc50e66bca472da61d0184121e491609b774e2c37"; // CHC token
const stakingAddress = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3"; // CHC Staking

// Web3 + Contracts
let web3, provider, web3Modal, selectedAccount;
let tokenContract, stakingContract;

// Token ABI (CHC)
const tokenABI = [
  { "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "type": "function" },
  { "constant": false, "inputs": [{ "name": "spender", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "type": "function" },
  { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "type": "function" },
  { "constant": true, "inputs": [{ "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
];

// Staking Contract ABI
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

// Web3Modal Setup
async function initWeb3Modal() {
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

  web3Modal = new window.Web3Modal.default({
    cacheProvider: true,
    providerOptions
  });
}

// Connect Wallet
async function connectWallet() {
  try {
    provider = await web3Modal.connect();
    web3 = new Web3(provider);

    const accounts = await web3.eth.getAccounts();
    selectedAccount = accounts[0];

    document.getElementById("walletAddress").innerText = selectedAccount;

    tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
    stakingContract = new web3.eth.Contract(stakingABI, stakingAddress);

    checkCHCBalance();

    provider.on("accountsChanged", (accounts) => {
      selectedAccount = accounts[0];
      document.getElementById("walletAddress").innerText = selectedAccount;
      checkCHCBalance();
    });

    provider.on("chainChanged", (chainId) => {
      if (parseInt(chainId, 16) !== 56) {
        alert("Please switch to Binance Smart Chain");
      }
    });
  } catch (error) {
    console.error("Wallet connection failed:", error);
  }
}

// Check CHC Balance
async function checkCHCBalance() {
  try {
    const balance = await tokenContract.methods.balanceOf(selectedAccount).call();
    const decimals = await tokenContract.methods.decimals().call();
    const formatted = parseFloat(balance / (10 ** decimals)).toLocaleString();
    document.getElementById("chcBalance").innerText = formatted;
  } catch (error) {
    console.error("Balance error:", error);
  }
}

// Approve CHC for staking
async function approveCHC() {
  const amount = document.getElementById("stakeAmount").value;
  const statusMessage = document.getElementById("statusMessage");

  if (!amount || isNaN(amount) || amount <= 0) {
    statusMessage.innerText = "❌ Please enter a valid CHC amount.";
    return;
  }

  const decimals = await tokenContract.methods.decimals().call();
  const amountInWei = web3.utils.toBN(amount * (10 ** decimals));

  try {
    statusMessage.innerText = "⏳ Approving CHC...";

    await tokenContract.methods
      .approve(stakingAddress, amountInWei)
      .send({ from: selectedAccount })
      .on("transactionHash", (hash) => {
        console.log("Approval TX:", hash);
        statusMessage.innerText = "🕒 Approval pending... TX: " + hash;
      })
      .on("receipt", (receipt) => {
        statusMessage.innerText = "✅ CHC Approved!";
      })
      .on("error", (error) => {
        statusMessage.innerText = "❌ Approval failed. Check console.";
        console.error("Approval failed:", error);
      });
  } catch (err) {
    statusMessage.innerText = "❌ Approval error.";
    console.error("Approval error:", err);
  }
}

// Stake CHC
async function stakeCHC() {
  const amount = document.getElementById("stakeAmount").value;
  const selectedTier = document.querySelector('input[name="stakeOption"]:checked');
  const statusMessage = document.getElementById("statusMessage");

  if (!amount || isNaN(amount) || amount <= 0 || !selectedTier) {
    statusMessage.innerText = "❌ Enter valid CHC amount and choose tier.";
    return;
  }

  const lockDays = parseInt(selectedTier.value);
  const decimals = await tokenContract.methods.decimals().call();
  const amountInWei = web3.utils.toBN(amount * (10 ** decimals));

  try {
    statusMessage.innerText = "⏳ Sending stake transaction...";

    await stakingContract.methods
      .stake(amountInWei, lockDays)
      .send({ from: selectedAccount })
      .on("transactionHash", (hash) => {
        console.log("Stake TX:", hash);
        statusMessage.innerText = "🕒 Stake pending... TX: " + hash;
      })
      .on("receipt", (receipt) => {
        statusMessage.innerText = "✅ CHC Staked successfully!";
        checkCHCBalance();
      })
      .on("error", (error) => {
        statusMessage.innerText = "❌ Stake failed. Check console.";
        console.error("Stake failed:", error);
      });
  } catch (err) {
    statusMessage.innerText = "❌ Stake error.";
    console.error("Stake error:", err);
  }
}

// Initialize app
window.addEventListener("load", async () => {
  await initWeb3Modal();

  document.getElementById("connectWallet").addEventListener("click", connectWallet);
  document.getElementById("approveCHC").addEventListener("click", approveCHC);
  document.getElementById("stakeButton").addEventListener("click", stakeCHC);

  if (web3Modal.cachedProvider) {
    connectWallet();
  }
});
