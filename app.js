console.log("CHC staking dApp loaded");
document.getElementById("connectButton").addEventListener("click", async () => {
  if (window.ethereum) {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    alert("Connected: " + accounts[0]);
  } else {
    alert("Please install MetaMask!");
  }
});
