const tokenAddress = "0xc50e66bca472da61d0184121e491609b774e2c37";
const stakingAddress = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3";

const tokenABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const stakingABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint8", "name": "lockPeriod", "type": "uint8" }
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
      { "internalType": "uint256", "name": "lockPeriod", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

let web3;
let provider;
let selectedAccount;
let tokenContract;
let stakingContract;

const web3Modal = new window.Web3Modal.default({
  cacheProvider: true,
  providerOptions: {
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: {
        rpc: {
          56: "https://bsc-dataseed.binance.org/"
        },
        chainId: 56
      }
    }
  }
});

async function connectWallet() {
  try {
    provider = await web3Modal.connect();
    web3 = new Web3(provider);

    const chainId = await web3.eth.getChainId();
    if (chainId !== 56) {
      document.getElementById("statusMessage").innerText = "Please switch to BNB Chain.";
      return;
    }

    const accounts = await web3.eth.getAccounts();
    selectedAccount = accounts[0];
    document.getElementById("walletAddress").innerText = selectedAccount;

    tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
    stakingContract = new web3.eth.Contract(stakingABI, stakingAddress);

    const balance = await tokenContract.methods.balanceOf(selectedAccount).call();
    const decimals = await tokenContract.methods.decimals().call();
    const formattedBalance = (balance / (10 ** decimals)).toLocaleString();
    document.getElementById("chcBalance").innerText = formattedBalance;
  } catch (error) {
    console.error("Connection error:", error);
    document.getElementById("statusMessage").innerText = "Failed to connect wallet.";
  }
}

async function approveCHC() {
  try {
    const amount = document.getElementById("stakeAmount").value;
    if (!amount || isNaN(amount) || amount <= 0) {
      document.getElementById("statusMessage").innerText = "Enter a valid CHC amount.";
      return;
    }

    const decimals = await tokenContract.methods.decimals().call();
    const amountInWei = web3.utils.toBN(amount * (10 ** decimals));

    const allowance = await tokenContract.methods.allowance(selectedAccount, stakingAddress).call();
    if (web3.utils.toBN(allowance).gte(amountInWei)) {
      document.getElementById("statusMessage").innerText = "Already approved.";
      return;
    }

    await tokenContract.methods.approve(stakingAddress, amountInWei).send({ from: selectedAccount });
    document.getElementById("statusMessage").innerText = "Approved successfully.";
  } catch (error) {
    console.error("Approval error:", error);
    document.getElementById("statusMessage").innerText = "Approval failed.";
  }
}

async function stakeCHC() {
  try {
    const amount = document.getElementById("stakeAmount").value;
    const tier = document.querySelector('input[name="stakeOption"]:checked');
    if (!amount || !tier) {
      document.getElementById("statusMessage").innerText = "Enter amount and select tier.";
      return;
    }

    const decimals = await tokenContract.methods.decimals().call();
    const amountInWei = web3.utils.toBN(amount * (10 ** decimals));
    const lockPeriod = parseInt(tier.value);

    await stakingContract.methods.stake(amountInWei, lockPeriod).send({ from: selectedAccount });
    document.getElementById("statusMessage").innerText = `Staked ${amount} CHC for ${lockPeriod} days.`;
  } catch (error) {
    console.error("Staking error:", error);
    document.getElementById("statusMessage").innerText = "Staking failed.";
  }
}

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
        console.log("Approval TX hash:", hash);
        statusMessage.innerText = "🕒 Approval pending... TX: " + hash;
      })
      .on("receipt", (receipt) => {
        console.log("Approval success:", receipt);
        statusMessage.innerText = "✅ CHC Approved!";
      })
      .on("error", (error) => {
        console.error("Approval failed:", error);
        statusMessage.innerText = "❌ Approval failed. See console.";
      });
  } catch (err) {
    console.error("General approval error:", err);
    statusMessage.innerText = "❌ Approval error.";
  }
}
